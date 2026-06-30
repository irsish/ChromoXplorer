/**
 * ExplorerPage.jsx
 */

import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import * as THREE from "three"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { useAuth } from "react-oidc-context"
import styles from "./ExplorerPage.module.css"
import ExplorerTopBar        from "../components/Explorer/ExplorerTopBar"
import ExplorerLevelControls from "../components/Explorer/ExplorerLevelControls"
import AnnotationPanel          from "../components/Explorer/AnnotationPanel"
import GenomicFeaturesPanel     from "../components/Explorer/GenomicFeaturesPanel"
import GenomeScene           from "../components/Genome3D/GenomeScene"
import Starfield             from "../components/Background/Startfield"
import { parseGenomeFile }   from "../utils/parsing/parseGenomeFile"
import { ExplorerProvider, useExplorer } from "../context/ExplorerContext"
import { NUCLEUS_RADIUS }    from "../components/Genome3D/ChromosomeTerritories3D"
import { useCellData }       from "../utils/useCellData"
import { useChromosomeAt5kb } from "../utils/useChromosomeAt5kb"
import { parseLocalZip, getLocal5kbText } from "../utils/useLocalCellData"
import { useAnnotations }    from "../utils/useAnnotations"
import { isAuthenticated }   from "../utils/authentication/authHelper"
import genomeText from "../data/mockGenomeFile.txt?raw"
import { ZOOM_OUT_THRESHOLD } from "../context/ExplorerContext"

export default function ExplorerPage() {
    return (
        <ExplorerProvider initialNucleusRadius={NUCLEUS_RADIUS}>
            <ExplorerPageContent />
        </ExplorerProvider>
    )
}

/* ------------------------------------------------------------------ */
/* LOADING MODALS                                                      */
/* ------------------------------------------------------------------ */

function CellLoadingModal() {
    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 100,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)",
            color: "white", gap: "1.5rem",
        }}>
            <Spinner />
            <div style={{ textAlign: "center", lineHeight: 1.6 }}>
                <div style={{ fontSize: "1.1rem", fontWeight: 500, letterSpacing: "0.04em" }}>
                    Loading cell data
                </div>
                <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", marginTop: "0.35rem" }}>
                    Fetching chromosome data from the Cosmos
                </div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}

function ResolutionLoadingOverlay() {
    return (
        <div style={{
            position: "absolute", inset: 0, zIndex: 60,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
            color: "white", gap: "1rem", pointerEvents: "none",
        }}>
            <Spinner />
            <div style={{ fontSize: "0.95rem", letterSpacing: "0.03em" }}>
                   Loading 5KB resolution data...
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}

function Spinner() {
    return (
        <div style={{
            width: "40px", height: "40px",
            border: "3px solid rgba(255,255,255,0.15)",
            borderTop: "3px solid white",
            borderRadius: "50%",
            animation: "spin 0.9s linear infinite",
        }} />
    )
}

function SelectCellPrompt() {
    return (
        <div style={{
            position: "absolute", inset: 0, zIndex: 50,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            pointerEvents: "none", gap: "0.75rem",
        }}>
            <div style={{
                background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px",
                padding: "1.25rem 2rem", color: "rgba(255,255,255,0.75)",
                fontSize: "0.95rem", textAlign: "center", letterSpacing: "0.02em",
            }}>
                Select a cell type above to begin
            </div>
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* CANVAS BACKGROUND                                                   */
/* ------------------------------------------------------------------ */

function CanvasBackground() {
    const { gl } = useThree()
    const { lightMode } = useExplorer()
    useEffect(() => {
        gl.setClearColor(lightMode ? "#ffffff" : "#000000", 1)
    }, [lightMode, gl])
    return null
}

/* ------------------------------------------------------------------ */
/* SCENE CAMERA CONTROLLER                                             */
/* ------------------------------------------------------------------ */

function SceneCameraController({ controlsRef }) {
    const { camera } = useThree()
    const {
        level,
        nucleusRadius,
        chrBoundingRadius,
        binBoundingRadius,
        selectedChrCentroid,
        binCentroid,
        selectedBin,
    } = useExplorer()
 
    const targetDist           = useRef(null)
    const targetOrigin         = useRef(new THREE.Vector3(0, 0, 0))
    const transitioning        = useRef(false)
    const prevLevelRef         = useRef(level)
    const chrBoundingRadiusRef = useRef(chrBoundingRadius)
 
    useEffect(() => {
        chrBoundingRadiusRef.current = chrBoundingRadius
    }, [chrBoundingRadius])
 
    const beginTransition = useCallback((dist, origin) => {
        targetDist.current    = dist
        transitioning.current = true
        targetOrigin.current.copy(origin)
    }, [])
 
    const safeL2Distance = useCallback((cbr) => {
        return Math.min(cbr * 2.2, ZOOM_OUT_THRESHOLD * 0.72)
    }, [])
 
    useEffect(() => {
        if (level === prevLevelRef.current) return
        prevLevelRef.current = level
        if (level === 1 && nucleusRadius) {
            beginTransition(nucleusRadius * 3, new THREE.Vector3(0, 0, 0))
        }
    }, [level, nucleusRadius, beginTransition])
 
    useEffect(() => {
        if (level === 2 && chrBoundingRadius) {
            beginTransition(safeL2Distance(chrBoundingRadius), new THREE.Vector3(0, 0, 0))
        }
    }, [level, chrBoundingRadius, beginTransition, safeL2Distance])
 
    useEffect(() => {
        if (level === 3 && binBoundingRadius && binCentroid) {
            beginTransition(binBoundingRadius * 2.2, binCentroid)
        }
    }, [level, binBoundingRadius, binCentroid, beginTransition])
 
    useEffect(() => {
        if (level === 1 && selectedChrCentroid) {
            transitioning.current = true
            targetDist.current    = null
            targetOrigin.current.copy(selectedChrCentroid)
        }
    }, [level, selectedChrCentroid])
 
    useEffect(() => {
        if (level !== 2) return
        transitioning.current = true
        targetDist.current    = null
        if (selectedBin?.position) {
            targetOrigin.current.copy(selectedBin.position)
        } else {
            targetOrigin.current.set(0, 0, 0)
        }
    }, [level, selectedBin])
 
    useFrame(() => {
        if (!controlsRef?.current) return
        const controls = controlsRef.current

        if (transitioning.current) {
            const currentDist = camera.position.distanceTo(controls.target)
            const targetDelta = controls.target.distanceTo(targetOrigin.current)

            controls.target.lerp(targetOrigin.current, 0.08)

            if (targetDist.current !== null) {
                const distDelta = Math.abs(currentDist - targetDist.current)
                if (distDelta > 0.05) {
                    const dir     = camera.position.clone().sub(controls.target).normalize()
                    const desired = controls.target.clone().addScaledVector(dir, targetDist.current)
                    camera.position.lerp(desired, 0.08)
                }
            }

            const distDelta = targetDist.current !== null
                ? Math.abs(currentDist - targetDist.current)
                : 0
            if (distDelta < 0.5 && targetDelta < 0.1) {
                transitioning.current = false
                targetDist.current    = null
            }
        }

        controls.update()
    })
    return null
}
 
/* ------------------------------------------------------------------ */
/* UNIFIED ZOOM DETECTOR                                               */
/* ------------------------------------------------------------------ */

const ZOOM_DETECT_COOLDOWN_MS = 1500
 
function UnifiedZoomDetector({ controlsRef }) {
    const {
        level,
        levelLocked,
        handleZoomChange,
        handleZoomChangeLevel2,
        setLevel,
        binBoundingRadius,
    } = useExplorer()
 
    const frameCount           = useRef(0)
    const levelRef             = useRef(level)
    const levelLockedRef       = useRef(levelLocked)
    const levelChangedAt       = useRef(0)
    const binBoundingRadiusRef = useRef(binBoundingRadius)
 
    useEffect(() => {
        levelRef.current       = level
        levelChangedAt.current = Date.now()
    }, [level])
 
    useEffect(() => {
        levelLockedRef.current = levelLocked
    }, [levelLocked])
 
    useEffect(() => {
        binBoundingRadiusRef.current = binBoundingRadius
        if (levelRef.current === 3 && binBoundingRadius) {
            levelChangedAt.current = Date.now()
        }
    }, [binBoundingRadius])
 
    useFrame(({ camera }) => {
        frameCount.current += 1
        if (frameCount.current % 10 !== 0) return
 
        if (levelLockedRef.current) return
 
        if (Date.now() - levelChangedAt.current < ZOOM_DETECT_COOLDOWN_MS) return
 
        const distance = controlsRef?.current
            ? camera.position.distanceTo(controlsRef.current.target)
            : camera.position.length()
 
        if (levelRef.current === 1) {
            handleZoomChange(distance)
        } else if (levelRef.current === 2) {
            handleZoomChangeLevel2(distance)
        } else if (levelRef.current === 3) {
            const bbr = binBoundingRadiusRef.current
            if (bbr && distance > bbr * 9) {
                setLevel(2)
            }
        }
    })
 
    return null
}

/* ------------------------------------------------------------------ */
/* INFO OVERLAY                                                        */
/* ------------------------------------------------------------------ */

function InfoOverlay({ message }) {
    return (
        <div style={{
            position: "absolute", bottom: "80px", left: "50%",
            transform: "translateX(-50%)", zIndex: 40,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px",
            padding: "0.75rem 1.25rem", color: "white", fontSize: "0.9rem",
            textAlign: "center", pointerEvents: "none", whiteSpace: "nowrap",
        }}>
            {message}
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* LOCAL 5KB HOOK                                                      */
/* ------------------------------------------------------------------ */

/**
 * Reads the 5kb PDB text for the selected chromosome directly from the
 * in-memory JSZip object. Mirrors the { pdbText, loading, error } shape
 * returned by useChromosomeAt5kb so the rest of the page is unaffected.
 */
function useLocal5kb({ zip, chromosomeId, enabled }) {
    const [pdbText, setPdbText] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error,   setError]   = useState(null)

    useEffect(() => {
        if (!enabled || !zip || !chromosomeId) {
            setPdbText(null)
            setLoading(false)
            setError(null)
            return
        }

        let cancelled = false
        setLoading(true)
        setError(null)
        setPdbText(null)

        getLocal5kbText(zip, chromosomeId)
            .then((text) => {
                if (cancelled) return
                if (!text) {
                    setError(`No 5kb file found for ${chromosomeId} in the uploaded zip.`)
                } else {
                    setPdbText(text)
                }
            })
            .catch((err) => {
                if (!cancelled) setError(err.message)
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => { cancelled = true }
    }, [zip, chromosomeId, enabled])

    return { pdbText, loading, error }
}

/* ------------------------------------------------------------------ */
/* LOCAL CELL DATA HOOK                                                */
/* ------------------------------------------------------------------ */

/**
 * Parses the 1mb chromosome map from the in-memory zip on first call
 * (or whenever the zip reference changes). Returns the same shape as
 * useCellData so ExplorerPageContent needs no branching.
 */
function useLocalCellDataFromZip(zip) {
    const [chromosomeMap,      setChromosomeMap]      = useState(null)
    const [abCompartmentsText, setAbCompartmentsText] = useState(null)
    const [annotationTracks,   setAnnotationTracks]   = useState({})
    const [loading,            setLoading]            = useState(false)
    const [error,              setError]              = useState(null)

    useEffect(() => {
        if (!zip) {
            setChromosomeMap(null)
            setAbCompartmentsText(null)
            setAnnotationTracks({})
            setLoading(false)
            setError(null)
            return
        }

        let cancelled = false
        setLoading(true)
        setError(null)
        setChromosomeMap(null)
        setAbCompartmentsText(null)
        setAnnotationTracks({})

        parseLocalZip(zip)
            .then(({ chromosomeMap: map, abCompartmentsText: bed, annotationTracks: tracks }) => {
                if (cancelled) return
                setChromosomeMap(map)
                setAbCompartmentsText(bed)
                setAnnotationTracks(tracks ?? {})
            })
            .catch((err) => {
                if (!cancelled) setError(err.message)
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => { cancelled = true }
    }, [zip])

    return { chromosomeMap, abCompartmentsText, annotationTracks, loading, error }
}

/* ------------------------------------------------------------------ */
/* PAGE CONTENT                                                        */
/* ------------------------------------------------------------------ */

function ExplorerPageContent() {
    const auth = useAuth()

    const {
        level,
        abDataMissing,
        selectedChromosome,
        selectChromosome,
        selectedBin,
        selectBin,
        highlightedGene,
        lightMode,
        setLightMode,
        selectedCell,
        isLocalMode,
        localZip,
        setChromosomeMap: setContextChromosomeMap,
    } = useExplorer()

    // Annotation hook â€” fetch annotations for the gene's chromosome whenever a gene is highlighted.
    // Scoped by cellName + chromosome so all genes on the same chromosome share one fetch.
    const { annotations, addAnnotation, deleteAnnotation } = useAnnotations({
        auth,
        cellName:   isAuthenticated(auth) ? selectedCell              : null,
        chromosome: isAuthenticated(auth) ? highlightedGene?.chromosome : null,
    })

    const [selectedObject, setSelectedObject]         = useState(null)
    const [genome, setGenome]                         = useState(null)
    const [showStarfield, setShowStarfield]           = useState(true)
    const [showSphere, setShowSphere]                 = useState(true)
    const [bottomInfoExpanded, setBottomInfoExpanded] = useState(false)

    const controlsRef    = useRef()
    const isMouseDownRef = useRef(false)

    const selectionStateRef = useRef({ level, selectedBin, selectedChromosome })
    useEffect(() => {
        selectionStateRef.current = { level, selectedBin, selectedChromosome }
    }, [level, selectedBin, selectedChromosome])
    const isOverMeshRef = useRef(false)

    // â”€â”€ Remote data (existing path) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const {
        chromosomeMap:      remoteChromosomeMap,
        abCompartmentsText: remoteAbCompartmentsText,
        annotationTracks:   remoteAnnotationTracks,
        loading:            remoteCellLoading,
    } = useCellData(isLocalMode ? null : selectedCell)

    // â”€â”€ Local data (in-memory zip path) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const {
        chromosomeMap:      localChromosomeMap,
        abCompartmentsText: localAbCompartmentsText,
        annotationTracks:   localAnnotationTracks,
        loading:            localCellLoading,
    } = useLocalCellDataFromZip(isLocalMode ? localZip : null)

    // â”€â”€ Unified â€” pick whichever source is active â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const chromosomeMap      = isLocalMode ? localChromosomeMap      : remoteChromosomeMap
    const abCompartmentsText = isLocalMode ? localAbCompartmentsText : remoteAbCompartmentsText
    const annotationTracks   = isLocalMode ? localAnnotationTracks   : remoteAnnotationTracks
    const cellLoading        = isLocalMode ? localCellLoading        : remoteCellLoading

    const availableFeatureTypes = useMemo(() => {
        const types = new Set(["genes", "promoters", "regulatory", "exons", "introns"])
        if (annotationTracks?.tads) types.add("tads")
        return types
    }, [annotationTracks])

    // â”€â”€ Remote 5kb (existing path) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const {
        pdbText:  remotePdb5kbText,
        loading:  remotePdb5kbLoading,
        error:    remotePdb5kbError,
    } = useChromosomeAt5kb({
        cellName:     isLocalMode ? null : selectedCell,
        chromosomeId: selectedChromosome,
        enabled:      !isLocalMode && (level === 2 || level === 3) && !!selectedChromosome,
    })

    // â”€â”€ Local 5kb (in-memory zip path) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const {
        pdbText:  localPdb5kbText,
        loading:  localPdb5kbLoading,
        error:    localPdb5kbError,
    } = useLocal5kb({
        zip:          localZip,
        chromosomeId: selectedChromosome,
        enabled:      isLocalMode && (level === 2 || level === 3) && !!selectedChromosome,
    })

    // â”€â”€ Unified 5kb â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const pdb5kbText    = isLocalMode ? localPdb5kbText    : remotePdb5kbText
    const pdb5kbLoading = isLocalMode ? localPdb5kbLoading : remotePdb5kbLoading
    const pdb5kbError   = isLocalMode ? localPdb5kbError   : remotePdb5kbError

    useEffect(() => {
        setGenome(parseGenomeFile(genomeText))
    }, [])

    // Keep context chromosomeMap in sync so GeneSearch can validate chromosomes.
    useEffect(() => {
        setContextChromosomeMap(chromosomeMap)
    }, [chromosomeMap, setContextChromosomeMap])

    const handleSelect = useCallback((obj) => setSelectedObject(obj), [])

    const showNoChromosomeOverlay  = level === 2 && !selectedChromosome
    const showAbDataMissingOverlay = level === 2 && !showNoChromosomeOverlay && abDataMissing
    const showNoBinOverlay         = level === 2 && selectedChromosome && !selectedBin
    const show5kbLoading           = (level === 2 || level === 3) && pdb5kbLoading
    const show5kbError             = (level === 2 || level === 3) && pdb5kbError && !pdb5kbLoading
    const showLevel3NoBinOverlay = level === 3 && !selectedBin

    const blockCanvas = (!!selectedCell || isLocalMode) && cellLoading
    const noCell      = !selectedCell && !isLocalMode

    return (
        <div
            className={styles.explorerWrapper}
            data-theme={lightMode ? "light" : undefined}
        >
            {blockCanvas && <CellLoadingModal />}

            <ExplorerTopBar
                showStarfield={showStarfield}
                setShowStarfield={setShowStarfield}
                showSphere={showSphere}
                setShowSphere={setShowSphere}
                lightMode={lightMode}
                setLightMode={setLightMode}
            />

            <div
                className={styles.canvasBackground}
                onPointerDown={() => {
                    isMouseDownRef.current = true
                    if (!isOverMeshRef.current) document.body.style.cursor = "grabbing"
                }}
                onPointerUp={() => {
                    isMouseDownRef.current = false
                    document.body.style.cursor = isOverMeshRef.current ? "pointer" : "default"
                }}
                onPointerLeave={() => {
                    isMouseDownRef.current = false
                    isOverMeshRef.current  = false
                    document.body.style.cursor = "default"
                }}
            >
                {noCell && <SelectCellPrompt />}
                {show5kbLoading && <ResolutionLoadingOverlay />}
                {show5kbError && (
                    <InfoOverlay message={`Failed to load 5 kb data: ${pdb5kbError}`} />
                )}

                <Canvas
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                    camera={{ position: [0, 0, NUCLEUS_RADIUS * 1.5], fov: 50 }}
                    performance={{ min: 0.5 }}
                    onPointerMissed={() => {
                        const { level: l, selectedBin: bin, selectedChromosome: chr } = selectionStateRef.current
                        if (l === 3) return // lock levl 3 selection so it never disappears on click
                        if (bin) { selectBin(null); return }
                        if (l === 1 && chr) selectChromosome(null)
                    }}
                >
                    <ambientLight intensity={0.4} />
                    <directionalLight position={[10, 10, 5]} intensity={0.8} />

                    <OrbitControls
                        ref={controlsRef}
                        enablePan
                        enableRotate
                        enableZoom
                        regress
                    />

                    <CanvasBackground />
                    <SceneCameraController controlsRef={controlsRef} />
                    <UnifiedZoomDetector  controlsRef={controlsRef} />

                    {showStarfield && <Starfield />}

                    <GenomeScene
                        level={level}
                        genome={genome}
                        onSelect={handleSelect}
                        showSphere={showSphere}
                        controlsRef={controlsRef}
                        isMouseDownRef={isMouseDownRef}
                        isOverMeshRef={isOverMeshRef}
                        chromosomeMap={chromosomeMap}
                        abCompartmentsText={abCompartmentsText}
                        annotationTracks={annotationTracks}
                        pdb5kbText={pdb5kbText}
                        pdb5kbLoading={pdb5kbLoading}
                        pdb5kbError={pdb5kbError}
                    />
                </Canvas>

                {showNoChromosomeOverlay && (
                    <InfoOverlay message="Select a chromosome in Level 1 first, then zoom in or use the level controls." />
                )}
                {showAbDataMissingOverlay && (
                    <InfoOverlay message="A/B compartment data not available for this chromosome." />
                )}
                {showNoBinOverlay && (
                    <InfoOverlay message="Click a point on the chromosome to select a bin, then zoom in for Level 3." />
                )}
                {showLevel3NoBinOverlay && (
                    <InfoOverlay message="No bin selected. Go back to Level 2 and click a bin to continue." />
                )}
            </div>

            <div className={styles.leftRail}>
                <div className={styles.uiContainer}>
                    <ExplorerLevelControls />
                </div>

                {/* Genomic features panel â€” visible at L2 when a chromosome is selected */}
                {level === 2 && selectedChromosome && (
                    <GenomicFeaturesPanel availableTypes={availableFeatureTypes} docked />
                )}

                {selectedObject ? (
                    <div className={styles.infoPanel}>
                        <div className={styles.infoTitle}>Selection Details</div>
                        <div className={styles.infoRow}><strong>ID:</strong> {selectedObject.id}</div>
                        <div className={styles.infoRow}><strong>Type:</strong> {selectedObject.type}</div>
                        <div className={styles.infoRow}><strong>Description:</strong> {selectedObject.description}</div>
                    </div>
                ) : (
                    <div className={styles.infoPanel}>
                        <div className={styles.infoTitle}>Selection Details</div>
                        <div className={styles.infoEmpty}>Click any element in the 3D view to inspect it.</div>
                    </div>
                )}
            </div>

            {/* Annotation panel â€” visible at L3 when a gene is searched and the user is logged in */}
            {level === 3 && highlightedGene && isAuthenticated(auth) && (
                <AnnotationPanel
                    gene={highlightedGene}
                    cellName={selectedCell}
                    annotations={annotations}
                    addAnnotation={addAnnotation}
                    deleteAnnotation={deleteAnnotation}
                />
            )}

            <div className={styles.bottomBar}>
                <ExplorerLevelControls horizontal />
                <div
                    className={styles.bottomInfoPanel}
                    onClick={() => selectedObject && setBottomInfoExpanded((o) => !o)}
                >
                    {selectedObject ? (
                        <>
                            <span><strong>{selectedObject.id}</strong> Info</span>
                            {bottomInfoExpanded && (
                                <div className={styles.bottomInfoExpanded}>
                                    <div className={styles.infoRow}><strong>ID:</strong> {selectedObject.id}</div>
                                    <div className={styles.infoRow}><strong>Type:</strong> {selectedObject.type}</div>
                                    <div className={styles.infoRow}><strong>Description:</strong> {selectedObject.description}</div>
                                </div>
                            )}
                        </>
                    ) : (
                        <span>Click any element to inspect it.</span>
                    )}
                </div>
            </div>
        </div>
    )
}
