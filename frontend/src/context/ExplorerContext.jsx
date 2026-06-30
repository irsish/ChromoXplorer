import { createContext, useContext, useState, useCallback, useRef } from "react";

const ExplorerContext = createContext(null);

export const ZOOM_THRESHOLD           = 45;
export const ZOOM_OUT_THRESHOLD       = 200;
export const ZOOM_L2_TO_L3_THRESHOLD  = 12;

const SELECTION_COOLDOWN_MS = 1400;

export function ExplorerProvider({ children, initialNucleusRadius = null }) {
    const [level, setLevel]                           = useState(1);
    const [selectedChromosome, setSelectedChromosome] = useState(null);
    const [abDataMissing, setAbDataMissing]           = useState(false);
    const [lightMode, setLightMode]                   = useState(false);

    const [levelLocked, setLevelLocked] = useState(false);

    const [selectedCell, setSelectedCell] = useState("");

    // Local (in-browser) cell mode.
    const [localZip,      setLocalZip]      = useState(null);
    const [localCellName, setLocalCellName] = useState(null);

    const isLocalMode = localZip !== null;

    const setLocalCell = useCallback((zip, cellName) => {
        setLocalZip(zip);
        setLocalCellName(cellName);
        setSelectedCell("");
        setSelectedChromosome(null);
        setSelectedBin(null);
        setLevel(1);
    }, []);

    const clearLocalCell = useCallback(() => {
        setLocalZip(null);
        setLocalCellName(null);
        setSelectedCell("");
        setSelectedChromosome(null);
        setSelectedBin(null);
        setLevel(1);
    }, []);

    // Gene annotation. Shape: { symbol, chromosome, start, end, ensemblId } | null
    const [highlightedGene, setHighlightedGene] = useState(null);

    // Which genomic feature types are toggled on in the overlay panel.
    // Values: "genes" | "promoters" | "exons"
    const [activeFeatureTypes, setActiveFeatureTypes] = useState(new Set());

    // Written by ExplorerPageContent once useCellData resolves so GeneSearch
    // can validate that a gene's chromosome exists in the loaded dataset.
    const [chromosomeMap, setChromosomeMap] = useState(null);

    const [nucleusRadius, setNucleusRadius]             = useState(initialNucleusRadius);
    const [chrBoundingRadius, setChrBoundingRadius]     = useState(null);
    const [binBoundingRadius, setBinBoundingRadius]     = useState(null);
    const [selectedChrCentroid, setSelectedChrCentroid] = useState(null);
    const [binCentroid, setBinCentroid]                 = useState(null);
    const [selectedBin, setSelectedBin]                 = useState(null);

    const lastSelectionTime     = useRef(0);
    const levelRef              = useRef(level);
    const selectedChromosomeRef = useRef(selectedChromosome);
    const chrBoundingRadiusRef  = useRef(chrBoundingRadius);
    const binBoundingRadiusRef  = useRef(binBoundingRadius);
    const selectedBinRef        = useRef(selectedBin);

    const pendingLevelTimeout = useRef(null);

    // Set by programmatic navigation (e.g. gene search) to suppress the
    // zoom-out snap-back while the camera is still animating to Level 2.
    const programmaticNavAt = useRef(0);
    const PROGRAMMATIC_NAV_GRACE_MS = 6000;

    const selectChromosome = useCallback((chrId) => {
        setSelectedChromosome((prev) => {
            if (levelRef.current === 2 && prev === chrId) return prev;
            const next = prev === chrId ? null : chrId;
            selectedChromosomeRef.current = next;
            lastSelectionTime.current = Date.now();
            return next;
        });
        setAbDataMissing(false);
        setSelectedBin(null);
        selectedBinRef.current = null;
    }, []);

    const selectBin = useCallback((binData) => {
        setSelectedBin(binData);
        selectedBinRef.current = binData;
        if (binData) {
            lastSelectionTime.current = Date.now();
        }
    }, []);

    const syncLevel = useCallback((newLevel) => {
        if (levelRef.current === newLevel) return;
        levelRef.current = newLevel;

        if (pendingLevelTimeout.current !== null) {
            clearTimeout(pendingLevelTimeout.current);
        }
        pendingLevelTimeout.current = setTimeout(() => {
            pendingLevelTimeout.current = null;
            setLevel(newLevel);
        }, 0);
    }, []);

    const setChrBoundingRadiusWrapped = useCallback((r) => {
        chrBoundingRadiusRef.current = r;
        setChrBoundingRadius(r);
    }, []);

    const setBinBoundingRadiusWrapped = useCallback((r) => {
        binBoundingRadiusRef.current = r;
        setBinBoundingRadius(r);
    }, []);

    // Programmatically navigate to a chromosome at Level 2 (e.g. from gene search).
    const navigateToChromosome = useCallback((chrId) => {
        programmaticNavAt.current = Date.now();
        setSelectedChromosome(chrId);
        selectedChromosomeRef.current = chrId;
        lastSelectionTime.current = Date.now();
        setAbDataMissing(false);
        syncLevel(2);
    }, [syncLevel]);

    const handleZoomChange = useCallback((cameraDistance) => {
        if (levelRef.current !== 1) return;
        if (!selectedChromosomeRef.current) return;
        const msSinceSelection = Date.now() - lastSelectionTime.current;
        if (msSinceSelection < SELECTION_COOLDOWN_MS) return;
        if (cameraDistance < ZOOM_THRESHOLD) syncLevel(2);
    }, [syncLevel]);

    const handleZoomChangeLevel2 = useCallback((cameraDistance) => {
        if (levelRef.current !== 2) return;
        // Don't snap back while a programmatic navigation is still animating.
        if (Date.now() - programmaticNavAt.current < PROGRAMMATIC_NAV_GRACE_MS) return;
        if (cameraDistance > ZOOM_OUT_THRESHOLD) {
            syncLevel(1);
            return;
        }
        if (selectedBinRef.current) {
            if (cameraDistance < ZOOM_L2_TO_L3_THRESHOLD) {
                const msSinceSelection = Date.now() - lastSelectionTime.current;
                if (msSinceSelection < SELECTION_COOLDOWN_MS) return;
                syncLevel(3);
            }
        }
    }, [syncLevel]);

    const value = {
        level,
        setLevel: syncLevel,

        levelLocked,
        setLevelLocked,

        selectedChromosome,
        selectChromosome,
        navigateToChromosome,

        selectedBin,
        selectBin,

        handleZoomChange,
        handleZoomChangeLevel2,

        abDataMissing,
        setAbDataMissing,

        nucleusRadius,
        setNucleusRadius,

        chrBoundingRadius,
        setChrBoundingRadius: setChrBoundingRadiusWrapped,

        binBoundingRadius,
        setBinBoundingRadius: setBinBoundingRadiusWrapped,

        selectedChrCentroid,
        setSelectedChrCentroid,

        binCentroid,
        setBinCentroid,

        lightMode,
        setLightMode,

        selectedCell,
        setSelectedCell,

        // Local mode
        localZip,
        localCellName,
        isLocalMode,
        setLocalCell,
        clearLocalCell,

        // Gene annotation
        highlightedGene,
        setHighlightedGene,
        chromosomeMap,
        setChromosomeMap,
        activeFeatureTypes,
        setActiveFeatureTypes,
    };

    return (
        <ExplorerContext.Provider value={value}>
            {children}
        </ExplorerContext.Provider>
    );
}

export function useExplorer() {
    const ctx = useContext(ExplorerContext);
    if (!ctx) throw new Error("useExplorer must be used inside <ExplorerProvider>");
    return ctx;
}
