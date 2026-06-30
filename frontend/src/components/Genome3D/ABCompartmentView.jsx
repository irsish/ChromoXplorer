/**
 * ABCompartmentView.jsx  -  Level 2 rendering
 *
 * Renders a single chromosome at 5 kb resolution with A/B compartment
 * colouring. Everything is derived from the 5 kb PDB and the .bed file.
 * No 1 mb data is used anywhere in this component.
 *
 * Bin markers
 * -----------
 * One small visible orb is rendered per 1 mb bin, placed at the 5 kb atom
 * nearest the bin's midpoint.
 *
 * Each orb is coloured by its A/B label (red = A active, blue = B inactive).
 *
 * Performance fixes (zoom lag)
 * ----------------------------
 * BEFORE: Each BinOrb was its own component with its own useFrame subscriber
 * doing a Math.sin + scale.set every frame. With ~250 orbs per chromosome
 * that was 250 useFrame callbacks firing on every render tick — compounding
 * directly with zoom render pressure to blow the 16ms frame budget.
 *
 * AFTER:
 *   1. BinOrb no longer exists as a component. All orbs are rendered directly
 *      in ABCompartmentView using stable pre-built geometries and materials.
 *
 *   2. A single useFrame in ABCompartmentView handles the selected-orb pulse
 *      animation by writing to one ref. One subscriber total, regardless of
 *      bin count.
 *
 *   3. Orb geometry is no longer recreated on selection change. Two shared
 *      geometries (resting + selected) are built once and reused. The visible
 *      mesh swaps between them by toggling visibility, not by remounting.
 *
 *   4. All orb materials are module-level singletons — no per-orb or per-
 *      frame material allocation.
 */

import { useMemo, useEffect, useRef } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { useExplorer } from "../../context/ExplorerContext"
import GeneMarker from "./GeneMarker"
import {
    parseABCompartments,
    labelAtomsForChromosome,
    componentIdToBedKey,
} from "../../utils/parsing/parseABcompartments"
import {
    parseIntervalTrack,
    getTrackIntervalsForChromosome,
} from "../../utils/parsing/parseIntervalTrack"
import { useGenomicFeatures } from "../../utils/useGenomicFeatures"
import { getOverlappingBinIndices } from "../../utils/featureOverlap"

/* ------------------------------------------------------------------ */
/* CONSTANTS                                                           */
/* ------------------------------------------------------------------ */

const COLOR_A       = new THREE.Color("#e63946")
const COLOR_B       = new THREE.Color("#4361ee")
const COLOR_UNKNOWN = new THREE.Color("#888888")

const RADIAL_SEGMENTS   = 14
const TUBE_RADIUS       = 0.22
const BIN_SIZE_BP       = 1_000_000
const ATOMS_PER_1MB_BIN = 200

const ORB_RADIUS            = 0.18
const ORB_SELECTED_RADIUS   = 0.38
const ORB_HIT_RADIUS        = 0.55
const TUBE_RADIUS_HIGHLIGHT = 0.34  // slightly larger than TUBE_RADIUS so it sits on top

const DOWNSAMPLE_FACTOR = 4

/* ------------------------------------------------------------------ */
/* SHARED GEOMETRIES — built once, never recreated                     */
/* ------------------------------------------------------------------ */

const orbGeoResting  = new THREE.SphereGeometry(ORB_RADIUS,          12, 12)
const orbGeoSelected = new THREE.SphereGeometry(ORB_SELECTED_RADIUS, 12, 12)
const orbGeoHit      = new THREE.SphereGeometry(ORB_HIT_RADIUS,       8,  8)

/* ------------------------------------------------------------------ */
/* SHARED MATERIALS — module-level singletons                          */
/* ------------------------------------------------------------------ */

const sharedTubeMaterial = new THREE.MeshStandardMaterial({
    vertexColors:      true,
    roughness:         0.5,
    metalness:         0.15,
    emissive:          new THREE.Color("#ffffff"),
    emissiveIntensity: 0.08,
})

const hitTestMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity:     0,
    depthWrite:  false,
})

/* ------------------------------------------------------------------ */
/* GENOMIC FEATURE OVERLAY — shared geometry + materials              */
/* ------------------------------------------------------------------ */

const featureOrbGeo = new THREE.SphereGeometry(0.12, 8, 8)

const featureMaterials = {
    genes: new THREE.MeshStandardMaterial({
        color:             "#FFD700",
        emissive:          "#FFD700",
        emissiveIntensity: 1.2,
        roughness:         0.3,
        metalness:         0.1,
    }),
    promoters: new THREE.MeshStandardMaterial({
        color:             "#00E5FF",
        emissive:          "#00E5FF",
        emissiveIntensity: 1.2,
        roughness:         0.3,
        metalness:         0.1,
    }),
    exons: new THREE.MeshStandardMaterial({
        color:             "#FF69B4",
        emissive:          "#FF69B4",
        emissiveIntensity: 1.2,
        roughness:         0.3,
        metalness:         0.1,
    }),
    introns: new THREE.MeshStandardMaterial({
        color:             "#C084FC",
        emissive:          "#C084FC",
        emissiveIntensity: 1.2,
        roughness:         0.3,
        metalness:         0.1,
    }),
    regulatory: new THREE.MeshStandardMaterial({
        color:             "#7CFC8A",
        emissive:          "#7CFC8A",
        emissiveIntensity: 1.2,
        roughness:         0.3,
        metalness:         0.1,
    }),
    tads: new THREE.MeshStandardMaterial({
        color:             "#FF8C42",
        emissive:          "#FF8C42",
        emissiveIntensity: 1.2,
        roughness:         0.3,
        metalness:         0.1,
    }),
}

// Per-label highlight tube materials — applied to the selected bin's tube overlay.
const highlightTubeMaterials = {
    A: new THREE.MeshStandardMaterial({
        color:             "#e63946",
        emissive:          "#ff6b75",
        emissiveIntensity: 2.5,
        roughness:         0.2,
        metalness:         0.1,
    }),
    B: new THREE.MeshStandardMaterial({
        color:             "#4361ee",
        emissive:          "#7b8fff",
        emissiveIntensity: 2.5,
        roughness:         0.2,
        metalness:         0.1,
    }),
    unknown: new THREE.MeshStandardMaterial({
        color:             "#888888",
        emissive:          "#aaaaaa",
        emissiveIntensity: 2.5,
        roughness:         0.2,
        metalness:         0.1,
    }),
}

// Per-label orb materials — resting and selected variants.
// Created once; emissiveIntensity is mutated on the selected one each frame
// via the single useFrame pulse, but only on the one selected material.
const orbMaterials = {
    A: {
        resting: new THREE.MeshStandardMaterial({
            color:            "#e63946",
            emissive:         "#ff6b75",
            emissiveIntensity: 0.5,
            roughness:        0.25,
            metalness:        0.1,
        }),
        selected: new THREE.MeshStandardMaterial({
            color:            "#e63946",
            emissive:         "#ff6b75",
            emissiveIntensity: 1.4,
            roughness:        0.25,
            metalness:        0.1,
        }),
    },
    B: {
        resting: new THREE.MeshStandardMaterial({
            color:            "#4361ee",
            emissive:         "#7b8fff",
            emissiveIntensity: 0.5,
            roughness:        0.25,
            metalness:        0.1,
        }),
        selected: new THREE.MeshStandardMaterial({
            color:            "#4361ee",
            emissive:         "#7b8fff",
            emissiveIntensity: 1.4,
            roughness:        0.25,
            metalness:        0.1,
        }),
    },
    unknown: {
        resting: new THREE.MeshStandardMaterial({
            color:            "#888888",
            emissive:         "#aaaaaa",
            emissiveIntensity: 0.5,
            roughness:        0.25,
            metalness:        0.1,
        }),
        selected: new THREE.MeshStandardMaterial({
            color:            "#888888",
            emissive:         "#aaaaaa",
            emissiveIntensity: 1.4,
            roughness:        0.25,
            metalness:        0.1,
        }),
    },
}

/* ------------------------------------------------------------------ */
/* UTILITIES                                                           */
/* ------------------------------------------------------------------ */

function parsePDB(text) {
    return text
        .split("\n")
        .filter((l) => l.startsWith("ATOM"))
        .map((line) => new THREE.Vector3(
            parseFloat(line.substring(30, 38)),
            parseFloat(line.substring(38, 46)),
            parseFloat(line.substring(46, 54))
        ))
}

function computeCentroid(points) {
    const c = new THREE.Vector3()
    points.forEach((p) => c.add(p))
    c.divideScalar(points.length)
    return c
}

function buildVertexColoredTube(points, labelFn) {
    if (points.length < 2) return null

    const tubularSegments = points.length
    const vertsPerRing    = RADIAL_SEGMENTS + 1
    const curve           = new THREE.CatmullRomCurve3(points)
    const tube            = new THREE.TubeGeometry(
        curve, tubularSegments, TUBE_RADIUS, RADIAL_SEGMENTS, false
    )
    const vertexCount = tube.getAttribute("position").count
    const colors      = new Float32Array(vertexCount * 3)

    for (let seg = 0; seg <= tubularSegments; seg++) {
        const pointIdx  = Math.min(
            Math.floor((seg / tubularSegments) * points.length),
            points.length - 1
        )
        const label     = labelFn(pointIdx)
        const c         = label === "A" ? COLOR_A : label === "B" ? COLOR_B : COLOR_UNKNOWN
        const ringStart = seg * vertsPerRing
        for (let r = 0; r < vertsPerRing; r++) {
            const vi       = (ringStart + r) * 3
            colors[vi]     = c.r
            colors[vi + 1] = c.g
            colors[vi + 2] = c.b
        }
    }

    tube.setAttribute("color", new THREE.BufferAttribute(colors, 3))
    return tube
}

function labelKey(label) {
    return label === "A" ? "A" : label === "B" ? "B" : "unknown"
}

/* ------------------------------------------------------------------ */
/* MAIN COMPONENT                                                      */
/* ------------------------------------------------------------------ */

export default function ABCompartmentView({
    abCompartmentsText,
    annotationTracks = {},
    onSelect,
    isMouseDownRef,
    isOverMeshRef,
    pdb5kbText    = null,
    pdb5kbLoading = false,
}) {
    const {
        selectedChromosome,
        selectChromosome,
        setAbDataMissing,
        setChrBoundingRadius,
        selectedBin,
        selectBin,
        highlightedGene,
        activeFeatureTypes,
    } = useExplorer()

    // Ref to the selected orb's visible mesh — used by the single useFrame
    // pulse animation below. Null when nothing is selected.
    const selectedOrbRef = useRef(null)

    // --- Genomic feature overlay hooks (each fetches when its type is active) ---
    const { features: geneFeatures } = useGenomicFeatures({
        chromosome: selectedChromosome,
        type:       "genes",
        enabled:    activeFeatureTypes.has("genes"),
    })
    const { features: promoterFeatures } = useGenomicFeatures({
        chromosome: selectedChromosome,
        type:       "promoters",
        enabled:    activeFeatureTypes.has("promoters"),
    })
    const { features: regulatoryFeaturesFromApi } = useGenomicFeatures({
        chromosome: selectedChromosome,
        type:       "regulatory",
        enabled:    activeFeatureTypes.has("regulatory") && !annotationTracks.regulatory,
    })
    const { features: exonFeatures } = useGenomicFeatures({
        chromosome: selectedChromosome,
        type:       "exons",
        geneId:     highlightedGene?.ensemblId ?? null,
        enabled:    activeFeatureTypes.has("exons") && !!highlightedGene?.ensemblId,
    })
    const { features: intronFeatures } = useGenomicFeatures({
        chromosome: selectedChromosome,
        type:       "introns",
        geneId:     highlightedGene?.ensemblId ?? null,
        enabled:    activeFeatureTypes.has("introns") && !!highlightedGene?.ensemblId,
    })

    const tadTrackMap = useMemo(
        () => parseIntervalTrack(annotationTracks.tads, "tad"),
        [annotationTracks.tads]
    )
    const regulatoryTrackMap = useMemo(
        () => parseIntervalTrack(annotationTracks.regulatory, "regulatory"),
        [annotationTracks.regulatory]
    )

    const tadFeatures = useMemo(
        () => getTrackIntervalsForChromosome(tadTrackMap, selectedChromosome),
        [tadTrackMap, selectedChromosome]
    )
    const regulatoryTrackFeatures = useMemo(
        () => getTrackIntervalsForChromosome(regulatoryTrackMap, selectedChromosome),
        [regulatoryTrackMap, selectedChromosome]
    )
    const regulatoryFeatures = annotationTracks.regulatory
        ? regulatoryTrackFeatures
        : regulatoryFeaturesFromApi

    // Map each active feature type to the set of 1 MB bin indices it overlaps.
    const featureOverlayBins = useMemo(() => ({
        genes:     activeFeatureTypes.has("genes")     ? getOverlappingBinIndices(geneFeatures)     : new Set(),
        promoters: activeFeatureTypes.has("promoters") ? getOverlappingBinIndices(promoterFeatures) : new Set(),
        regulatory: activeFeatureTypes.has("regulatory") ? getOverlappingBinIndices(regulatoryFeatures) : new Set(),
        tads:      activeFeatureTypes.has("tads")      ? getOverlappingBinIndices(tadFeatures)      : new Set(),
        exons:     activeFeatureTypes.has("exons")     ? getOverlappingBinIndices(exonFeatures)     : new Set(),
        introns:   activeFeatureTypes.has("introns")   ? getOverlappingBinIndices(intronFeatures)   : new Set(),
    }), [
        activeFeatureTypes,
        geneFeatures,
        promoterFeatures,
        regulatoryFeatures,
        tadFeatures,
        exonFeatures,
        intronFeatures,
    ])

    const compartmentMap = useMemo(() => {
        if (!abCompartmentsText) return {}
        return parseABCompartments(abCompartmentsText)
    }, [abCompartmentsText])

    const chrData = useMemo(() => {
        if (!pdb5kbText || pdb5kbLoading || !selectedChromosome) return null

        const raw = parsePDB(pdb5kbText)
        if (raw.length === 0) return null

        const centroid = computeCentroid(raw)
        const centered = raw.map(
            (p) => new THREE.Vector3(p.x - centroid.x, p.y - centroid.y, p.z - centroid.z)
        )

        const bedKey    = componentIdToBedKey(selectedChromosome)
        const binCount  = Math.ceil(centered.length / ATOMS_PER_1MB_BIN)
        const binLabels = labelAtomsForChromosome(compartmentMap, bedKey, binCount)

        const atomLabels = centered.map((_, i) => {
            const parentBin = Math.min(
                Math.floor(i / ATOMS_PER_1MB_BIN),
                binLabels.length - 1
            )
            return binLabels[parentBin] ?? null
        })

        const bbox = new THREE.Box3()
        centered.forEach((p) => bbox.expandByPoint(p))
        const size = new THREE.Vector3()
        bbox.getSize(size)
        const boundingRadius = Math.max(size.x, size.y, size.z) / 2

        const sampled      = []
        const sampledLabel = []
        for (let i = 0; i < centered.length; i += DOWNSAMPLE_FACTOR) {
            sampled.push(centered[i])
            sampledLabel.push(atomLabels[i])
        }
        const tubeGeo = buildVertexColoredTube(sampled, (i) => sampledLabel[i])

        const orbPositions = binLabels.map((_, binIdx) => {
            const midAtom = Math.min(
                binIdx * ATOMS_PER_1MB_BIN + Math.floor(ATOMS_PER_1MB_BIN / 2),
                centered.length - 1
            )
            return centered[midAtom].clone()
        })

        return { tubeGeo, sampledPoints: sampled, orbPositions, binLabels, boundingRadius, centeredPoints: centered }
    }, [pdb5kbText, pdb5kbLoading, compartmentMap, selectedChromosome])

    useEffect(() => {
        setChrBoundingRadius(chrData ? chrData.boundingRadius : null)
    }, [chrData, setChrBoundingRadius])

    useEffect(() => {
        if (!chrData) { setAbDataMissing(false); return }
        setAbDataMissing(chrData.binLabels.every((l) => l === null))
    }, [chrData, setAbDataMissing])

    useEffect(() => () => setAbDataMissing(false), [setAbDataMissing])

    useEffect(() => {
        selectBin(null)
    }, [selectedChromosome, selectBin])

    // Build a highlight tube overlay for the selected bin's tube segment.
    // Recomputed only on bin selection change — not per frame.
    const highlightTubeGeo = useMemo(() => {
        if (!selectedBin || !chrData?.sampledPoints) return null

        const { sampledPoints } = chrData
        const binIdx     = selectedBin.atomIndex
        const sampleStart = Math.floor(binIdx * ATOMS_PER_1MB_BIN / DOWNSAMPLE_FACTOR)
        const sampleEnd   = Math.min(
            Math.floor((binIdx + 1) * ATOMS_PER_1MB_BIN / DOWNSAMPLE_FACTOR),
            sampledPoints.length - 1
        )

        // Include one extra point on each side for smooth tube capping into neighbours.
        const sliceStart = Math.max(0, sampleStart - 1)
        const sliceEnd   = Math.min(sampledPoints.length - 1, sampleEnd + 1)
        const binPoints  = sampledPoints.slice(sliceStart, sliceEnd + 1)
        if (binPoints.length < 2) return null

        const curve = new THREE.CatmullRomCurve3(binPoints)
        return new THREE.TubeGeometry(curve, binPoints.length, TUBE_RADIUS_HIGHLIGHT, RADIAL_SEGMENTS, false)
    }, [selectedBin, chrData])

    // Dispose highlight geometry when it changes to avoid GPU memory leaks.
    useEffect(() => {
        return () => { highlightTubeGeo?.dispose() }
    }, [highlightTubeGeo])

    // Single useFrame for the selected-orb pulse — replaces 250 per-orb
    // useFrame subscribers. Writes scale directly to the ref'd mesh object.
    // When nothing is selected, selectedOrbRef.current is null and this
    // returns immediately with zero work done.
    useFrame(({ clock }) => {
        if (!selectedOrbRef.current) return
        const s = 1 + Math.sin(clock.elapsedTime * 2.5) * 0.12
        selectedOrbRef.current.scale.set(s, s, s)
    })

    const handleBinClick = (binIndex, worldPosition, label) => {
        if (selectedBin?.atomIndex === binIndex) {
            selectBin(null)
            return
        }

        const binStart = binIndex * BIN_SIZE_BP + 1
        const binEnd   = (binIndex + 1) * BIN_SIZE_BP

        selectBin({
            atomIndex:   binIndex,
            position:    worldPosition.clone(),
            binStart,
            binEnd,
            compartment: label ?? null,
        })

        onSelect({
            id:          `${selectedChromosome}-bin-${binIndex}`,
            type:        `Genomic Bin (${label ?? "unknown"} compartment)`,
            description: `1 MB bin ${binIndex + 1} of chromosome ${selectedChromosome}. `
                       + `Genomic range: ${(binStart / 1e6).toFixed(0)}–${(binEnd / 1e6).toFixed(0)} Mb. `
                       + `Zoom in to enter Level 3 view for this region.`,
        })
    }

    if (!chrData) return null

    return (
        <group>
            {/* Main tube — clicking finds the nearest bin to the hit point and selects it */}
            {chrData.tubeGeo && (
                <mesh
                    geometry={chrData.tubeGeo}
                    material={sharedTubeMaterial}
                    onClick={(e) => {
                        e.stopPropagation()
                        if (!chrData.orbPositions.length) return

                        // Find the bin whose orb is closest to where the tube was clicked.
                        const hit = e.point
                        let nearestBin  = 0
                        let nearestDist = Infinity
                        chrData.orbPositions.forEach((pos, i) => {
                            const d = hit.distanceToSquared(pos)
                            if (d < nearestDist) { nearestDist = d; nearestBin = i }
                        })

                        handleBinClick(nearestBin, chrData.orbPositions[nearestBin], chrData.binLabels[nearestBin])
                    }}
                    onPointerOver={(e) => {
                        e.stopPropagation()
                        if (isMouseDownRef?.current) return
                        if (isOverMeshRef) isOverMeshRef.current = true
                        document.body.style.cursor = "pointer"
                    }}
                    onPointerOut={() => {
                        if (isMouseDownRef?.current) return
                        if (isOverMeshRef) isOverMeshRef.current = false
                        document.body.style.cursor = "default"
                    }}
                />
            )}

            {highlightedGene && highlightedGene.chromosome === selectedChromosome && (
                <GeneMarker
                    gene={highlightedGene}
                    centeredPoints={chrData.centeredPoints}
                    markerScale={3}
                    atomResolutionBp={5_000}
                />
            )}

            {/* Feature overlay — small coloured orbs at each overlapping 1 MB bin */}
            {Object.entries(featureOverlayBins).map(([type, binSet]) =>
                Array.from(binSet).map((binIdx) => {
                    const pos = chrData.orbPositions[binIdx]
                    if (!pos) return null
                    return (
                        <mesh
                            key={`${type}-${binIdx}`}
                            geometry={featureOrbGeo}
                            material={featureMaterials[type]}
                            position={[pos.x, pos.y + 0.28, pos.z]}
                        />
                    )
                })
            )}

            {/* Highlight tube — overlays the selected bin's segment with a bright glow */}
            {highlightTubeGeo && selectedBin && (
                <mesh
                    geometry={highlightTubeGeo}
                    material={highlightTubeMaterials[labelKey(selectedBin.compartment)]}
                />
            )}

            {/* One orb group per 1 mb bin — no useFrame, no geometry recreation */}
            {chrData.orbPositions.map((pos, i) => {
                const isSelected = selectedBin?.atomIndex === i
                const lk         = labelKey(chrData.binLabels[i])
                const mat        = isSelected ? orbMaterials[lk].selected : orbMaterials[lk].resting
                const geo        = isSelected ? orbGeoSelected : orbGeoResting
                const posArr     = pos.toArray()

                return (
                    <group key={i} position={posArr}>
                        {/* Visible orb — stable geometry reference, stable material reference.
                            ref is set to the selected orb's mesh so the single parent
                            useFrame can drive the pulse animation without a per-orb subscriber. */}
                        <mesh
                            ref={isSelected ? selectedOrbRef : null}
                            geometry={geo}
                            material={mat}
                        />

                        {/* Invisible hit target */}
                        <mesh
                            geometry={orbGeoHit}
                            material={hitTestMaterial}
                            onClick={(e) => {
                                e.stopPropagation()
                                handleBinClick(i, new THREE.Vector3(...posArr), chrData.binLabels[i])
                            }}
                            onPointerOver={(e) => {
                                e.stopPropagation()
                                if (isMouseDownRef?.current) return
                                if (isOverMeshRef) isOverMeshRef.current = true
                                document.body.style.cursor = "pointer"
                            }}
                            onPointerOut={() => {
                                if (isMouseDownRef?.current) return
                                if (isOverMeshRef) isOverMeshRef.current = false
                                document.body.style.cursor = "default"
                            }}
                        />
                    </group>
                )
            })}
        </group>
    )
}
