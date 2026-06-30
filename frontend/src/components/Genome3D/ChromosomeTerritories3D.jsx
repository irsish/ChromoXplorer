/**
 * ChromosomeTerritories3D.jsx  —  Level 1 rendering
 *
 * Receives chromosome data via the `chromosomeMap` prop (populated by the
 * useCellData hook in ExplorerPage) instead of importing files statically.
 * The component renders nothing and returns early when the map is not yet
 * available — the loading modal in ExplorerPage blocks the canvas until data
 * is ready, so this case should never be visible to the user.
 */

import { useMemo, useEffect, useRef } from "react"
import * as THREE from "three"
import { useExplorer } from "../../context/ExplorerContext"
import GeneMarker from "./GeneMarker"

/* ------------------------------------------------------------------ */
/* NUCLEUS RADIUS — module-level constant                              */
/* ------------------------------------------------------------------ */

// This value is used by ExplorerPage to position the initial camera before
// any chromosome data has loaded.  It is kept as a fixed estimate matching
// the average radius observed from the human sample data; it will be
// overwritten in context once real geometry is computed.
export const NUCLEUS_RADIUS = 120

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
        .filter((v) => !isNaN(v.x) && !isNaN(v.y) && !isNaN(v.z))
}

// Canonical chromosome ID order — used to assign consistent X offsets so
// chromosomes are spread across the nucleus the same way regardless of which
// cell is loaded.
const CHROMOSOME_ID_ORDER = [
    "Chr1",  "Chr2",  "Chr3",  "Chr4",  "Chr5",  "Chr6",  "Chr7",  "Chr8",
    "Chr9",  "Chr10", "Chr11", "Chr12", "Chr13", "Chr14", "Chr15", "Chr16",
    "Chr17", "Chr18", "Chr19", "Chr20", "Chr21", "Chr22", "Chr23",
]

/* ------------------------------------------------------------------ */
/* MAIN COMPONENT                                                      */
/* ------------------------------------------------------------------ */

export default function ChromosomeTerritories3D({
    chromosomeMap,
    onSelect,
    showSphere = true,
    isMouseDownRef,
    isOverMeshRef,
}) {
    const { selectedChromosome, selectChromosome, setNucleusRadius, setSelectedChrCentroid, highlightedGene } = useExplorer()

    // Build geometry from the provided chromosomeMap.  Re-runs whenever the
    // map reference changes (i.e. when a new cell is selected and loaded).
    const { chromosomes, nucleusRadius, centroids, shiftedPointsMap } = useMemo(() => {
        if (!chromosomeMap) return { chromosomes: [], nucleusRadius: NUCLEUS_RADIUS, centroids: {}, shiftedPointsMap: {} }

        const allPoints = []
        const centroids = {}

        const chromosomes = CHROMOSOME_ID_ORDER
            .filter((id) => chromosomeMap[id])
            .map((id, index) => {
                const { data, color } = chromosomeMap[id]
                const points  = parsePDB(data)
                if (points.length < 2) return null

                const offsetX = (index - 11) * 2.5
                const shifted = points.map(
                    (p) => new THREE.Vector3(p.x + offsetX, p.y, p.z)
                )

                allPoints.push(...shifted)

                const centroid = new THREE.Vector3()
                shifted.forEach((p) => centroid.add(p))
                centroid.divideScalar(shifted.length)
                centroids[id] = centroid

                const curve    = new THREE.CatmullRomCurve3(shifted)
                const geometry = new THREE.TubeGeometry(curve, shifted.length, 0.2, 12, false)

                return { id, geometry, color, shiftedPoints: shifted }
            })
            .filter(Boolean)

        const bbox = new THREE.Box3()
        allPoints.forEach((p) => bbox.expandByPoint(p))
        const size = new THREE.Vector3()
        bbox.getSize(size)
        const radius = (Math.max(size.x, size.y, size.z) / 2) * 1.2

        // Build a map of chrId → shifted atom positions for GeneMarker lookup.
        const shiftedPointsMap = {}
        chromosomes.forEach((chr) => { shiftedPointsMap[chr.id] = chr.shiftedPoints })

        return { chromosomes, nucleusRadius: radius, centroids, shiftedPointsMap }
    }, [chromosomeMap])

    useEffect(() => {
        setNucleusRadius(nucleusRadius)
    }, [nucleusRadius, setNucleusRadius])

    useEffect(() => {
        if (selectedChromosome && centroids[selectedChromosome]) {
            setSelectedChrCentroid(centroids[selectedChromosome].clone())
        } else {
            setSelectedChrCentroid(null)
        }
    }, [selectedChromosome, centroids, setSelectedChrCentroid])

    // Nothing to render until data is available.
    if (!chromosomeMap) return null

    return (
        <group>
            {showSphere && (
                <mesh>
                    <sphereGeometry args={[nucleusRadius, 32, 32]} />
                    <meshStandardMaterial
                        transparent
                        opacity={0.05}
                        color="#ffffff"
                        depthWrite={false}
                    />
                </mesh>
            )}

            {highlightedGene && shiftedPointsMap[highlightedGene.chromosome] && (
                <GeneMarker
                    gene={highlightedGene}
                    centeredPoints={shiftedPointsMap[highlightedGene.chromosome]}
                    markerScale={5}
                    atomResolutionBp={1_000_000}
                />
            )}

            {chromosomes.map((chr) => {
                const isSelected = selectedChromosome === chr.id
                return (
                    <mesh
                        key={chr.id}
                        geometry={chr.geometry}
                        onClick={(e) => {
                            e.stopPropagation()
                            selectChromosome(chr.id)
                            onSelect({
                                id:          chr.id,
                                type:        "Chromosome Territory",
                                description: "1MB resolution chromosome fiber model.",
                            })
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
                    >
                        <meshStandardMaterial
                            color={chr.color}
                            emissive={isSelected ? "white" : "black"}
                            emissiveIntensity={isSelected ? 0.5 : 0}
                        />
                    </mesh>
                )
            })}
        </group>
    )
}