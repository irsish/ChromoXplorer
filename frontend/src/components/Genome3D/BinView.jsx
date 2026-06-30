import { useMemo, useEffect, useRef } from "react"
import * as THREE from "three"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"
import { useExplorer } from "../../context/ExplorerContext"
import GeneMarker from "./GeneMarker"
import { useGenomicFeatures } from "../../utils/useGenomicFeatures"
import {
    parseIntervalTrack,
    getTrackIntervalsForChromosome,
} from "../../utils/parsing/parseIntervalTrack"
import { getOverlappingAtomIndices } from "../../utils/featureOverlap"

const BIN_SIZE_5KB = 5_000

const RAINBOW_RADIAL = 20
const CONTEXT_RADIAL = 12
const SEGMENTS_PER_POINT = 2

const TUBE_RADIUS_HI = 0.22
const TUBE_RADIUS_LO = 0.09

const HIT_SPHERE_RADIUS = 1.5
const hitSphereGeo = new THREE.SphereGeometry(HIT_SPHERE_RADIUS, 8, 8)
const hitSphereMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
})

const markerGeo = new THREE.SphereGeometry(0.06, 8, 8)
const markerMaterials = {
    exons: new THREE.MeshStandardMaterial({
        color: "#FF69B4",
        emissive: "#FF69B4",
        emissiveIntensity: 1.4,
        roughness: 0.3,
        metalness: 0.1,
    }),
    introns: new THREE.MeshStandardMaterial({
        color: "#C084FC",
        emissive: "#C084FC",
        emissiveIntensity: 1.4,
        roughness: 0.3,
        metalness: 0.1,
    }),
    regulatory: new THREE.MeshStandardMaterial({
        color: "#7CFC8A",
        emissive: "#7CFC8A",
        emissiveIntensity: 1.4,
        roughness: 0.3,
        metalness: 0.1,
    }),
    tads: new THREE.MeshStandardMaterial({
        color: "#FF8C42",
        emissive: "#FF8C42",
        emissiveIntensity: 1.4,
        roughness: 0.3,
        metalness: 0.1,
    }),
}

const GREY_COLOR = new THREE.Color("#909090")
const WHITE_EMISSIVE = new THREE.Color("#ffffff")

function rainbowColor(t) {
    return new THREE.Color().setHSL(t * 0.75, 0.9, 0.55)
}

function parsePDB(text) {
    const atoms = []
    for (const line of text.split("\n")) {
        if (!line.startsWith("ATOM")) continue
        atoms.push(new THREE.Vector3(
            parseFloat(line.substring(30, 38)),
            parseFloat(line.substring(38, 46)),
            parseFloat(line.substring(46, 54))
        ))
    }
    return atoms
}

function buildTube(points, radius, radialSegments, colorMode) {
    if (points.length < 2) return null

    const tubularSegments = points.length * SEGMENTS_PER_POINT
    const curve = new THREE.CatmullRomCurve3(points, false, "centripetal")
    const geo = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false)

    const count = geo.getAttribute("position").count
    const colors = new Float32Array(count * 3)
    const vertsPerRing = radialSegments + 1

    for (let seg = 0; seg <= tubularSegments; seg++) {
        const col = colorMode === "rainbow" ? rainbowColor(seg / tubularSegments) : GREY_COLOR
        const ringStart = seg * vertsPerRing
        for (let r = 0; r < vertsPerRing; r++) {
            const vi = (ringStart + r) * 3
            colors[vi] = col.r
            colors[vi + 1] = col.g
            colors[vi + 2] = col.b
        }
    }

    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3))
    return geo
}

const mergedMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.35,
    metalness: 0.2,
    emissive: WHITE_EMISSIVE,
    emissiveIntensity: 0.07,
})

export default function BinView({ pdbText, onSelect, annotationTracks = {} }) {
    const {
        selectedBin,
        selectedChromosome,
        setBinBoundingRadius,
        setBinCentroid,
        highlightedGene,
        activeFeatureTypes,
    } = useExplorer()

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
    const { features: regulatoryFeaturesFromApi } = useGenomicFeatures({
        chromosome: selectedChromosome,
        type:       "regulatory",
        enabled:    activeFeatureTypes.has("regulatory") && !annotationTracks.regulatory,
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

    const selectedAtomIndex = selectedBin?.atomIndex ?? null
    const binStart = selectedBin?.binStart ?? null
    const binEnd = selectedBin?.binEnd ?? null

    const prevMergedGeoRef = useRef(null)

    const sceneData = useMemo(() => {
        if (!pdbText || selectedAtomIndex === null || binStart === null) return null

        const atoms = parsePDB(pdbText)
        if (atoms.length < 2) return null

        const centroid = new THREE.Vector3()
        atoms.forEach((p) => centroid.add(p))
        centroid.divideScalar(atoms.length)

        const centered = atoms.map(
            (p) => new THREE.Vector3(p.x - centroid.x, p.y - centroid.y, p.z - centroid.z)
        )

        const startIdx = Math.max(0, Math.floor((binStart - 1) / BIN_SIZE_5KB))
        const endIdx = Math.min(centered.length - 1, Math.floor(binEnd / BIN_SIZE_5KB))

        const beforePoints = centered.slice(0, startIdx + 1)
        const selectedPoints = centered.slice(startIdx, endIdx + 1)
        const afterPoints = centered.slice(endIdx, centered.length)

        const beforeGeo = buildTube(beforePoints, TUBE_RADIUS_LO, CONTEXT_RADIAL, "grey")
        const rainbowGeo = buildTube(selectedPoints, TUBE_RADIUS_HI, RAINBOW_RADIAL, "rainbow")
        const afterGeo = buildTube(afterPoints, TUBE_RADIUS_LO, CONTEXT_RADIAL, "grey")

        const geos = [beforeGeo, rainbowGeo, afterGeo].filter(Boolean)
        const mergedGeo = geos.length > 0 ? mergeGeometries(geos, false) : null
        geos.forEach((g) => g.dispose())

        const bbox = new THREE.Box3()
        selectedPoints.forEach((p) => bbox.expandByPoint(p))

        const size = new THREE.Vector3()
        bbox.getSize(size)
        const binBoundingRadius = Math.max(size.x, size.y, size.z) / 2

        const binCentroid = new THREE.Vector3()
        bbox.getCenter(binCentroid)

        return { mergedGeo, binBoundingRadius, binCentroid, centeredPoints: centered }
    }, [pdbText, selectedAtomIndex, binStart, binEnd])

    const markerPositions = useMemo(() => {
        if (!sceneData || !selectedBin) return {}
        const { centeredPoints } = sceneData
        const startIdx = Math.max(0, Math.floor((selectedBin.binStart - 1) / BIN_SIZE_5KB))
        const endIdx   = Math.min(centeredPoints.length - 1, Math.floor(selectedBin.binEnd / BIN_SIZE_5KB))

        const featureMap = {
            exons: exonFeatures,
            introns: intronFeatures,
            regulatory: regulatoryFeatures,
            tads: tadFeatures,
        }

        return Object.fromEntries(
            Object.entries(featureMap).map(([type, features]) => {
                const positions = Array.from(getOverlappingAtomIndices(features))
                    .filter((a) => a >= startIdx && a <= endIdx && centeredPoints[a])
                    .map((a) => centeredPoints[a])
                return [type, positions]
            })
        )
    }, [sceneData, selectedBin, exonFeatures, intronFeatures, regulatoryFeatures, tadFeatures])

    useEffect(() => {
        const prev = prevMergedGeoRef.current
        const next = sceneData?.mergedGeo ?? null
        if (prev && prev !== next) prev.dispose()
        prevMergedGeoRef.current = next
    }, [sceneData])

    useEffect(() => {
        if (sceneData) {
            setBinBoundingRadius(sceneData.binBoundingRadius)
            setBinCentroid(sceneData.binCentroid.clone())
        } else {
            setBinBoundingRadius(null)
            setBinCentroid(null)
        }
    }, [sceneData, setBinBoundingRadius, setBinCentroid])

    if (!sceneData || !sceneData.mergedGeo) return null

    const { mergedGeo, binCentroid, centeredPoints } = sceneData

    return (
        <group>
            <mesh geometry={mergedGeo} material={mergedMaterial} />

            {highlightedGene && highlightedGene.chromosome === selectedChromosome && (
                <GeneMarker
                    gene={highlightedGene}
                    centeredPoints={centeredPoints}
                    markerScale={0.5}
                    atomResolutionBp={5_000}
                    yOffset={0.5}
                />
            )}

            {Object.entries(markerPositions).map(([type, positions]) =>
                positions.map((pos, i) => (
                    <mesh
                        key={`${type}-${i}`}
                        geometry={markerGeo}
                        material={markerMaterials[type]}
                        position={[pos.x, pos.y + 0.12, pos.z]}
                    />
                ))
            )}

            <mesh
                geometry={hitSphereGeo}
                material={hitSphereMat}
                position={binCentroid.toArray()}
                onClick={(e) => {
                    e.stopPropagation()
                    onSelect({
                        id: `${selectedChromosome}-bin-${selectedBin.atomIndex}-5kb`,
                        type: "Selected Genomic Bin (5 kb resolution)",
                        description:
                            `Chromosome ${selectedChromosome}, ` +
                            `${(selectedBin.binStart / 1e6).toFixed(1)}-` +
                            `${(selectedBin.binEnd / 1e6).toFixed(1)} Mb.`,
                    })
                }}
            />
        </group>
    )
}
