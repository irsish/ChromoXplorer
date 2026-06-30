/**
 * GeneMarker.jsx
 *
 * Map-pin style marker: green spike with the Chromonaut helmet sitting on top.
 * The helmet is auto-centred in X/Z and its bottom is placed exactly at the
 * tip of the spike by measuring the GLB bounding box after scale+rotation.
 * The helmet rotates each frame to face the camera on the Y axis only.
 *
 * Props
 * -----
 * gene              – { symbol, chromosome, start, end }
 * centeredPoints    – THREE.Vector3[] — one entry per atom in the PDB
 * markerScale       – uniform scale applied to the whole pin  (default 1)
 * atomResolutionBp  – base-pairs per atom  (1_000_000 for 1 mb; 5_000 for 5 kb)
 * yOffset           – world-space Y lift applied to the whole marker (default 0)
 */

import { useMemo, useRef } from "react"
import * as THREE from "three"
import { Html, useGLTF } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"

const PIN_COLOR    = "#44dd00"
const PIN_EMISSIVE = "#22aa00"

const SPIKE_TOP_Y  = 1.0   // local-space y where spike ends and helmet begins
const HELMET_SCALE = 0.008

function HelmetModel() {
    const { scene }  = useGLTF("/chromonaut-helmet.glb")
    const { camera } = useThree()
    const groupRef   = useRef()

    // Clone the scene, apply scale, then shift its position so that its
    // bounding-box centre lands exactly at the group's local origin.
    // This means the rotation axis (group Y) passes through the helmet's
    // visual centre — no orbiting when the group rotates.
    const { centeredScene, groupY } = useMemo(() => {
        const clone = scene.clone()
        clone.scale.set(HELMET_SCALE, HELMET_SCALE, HELMET_SCALE)
        clone.position.set(0, 0, 0)
        clone.updateMatrixWorld(true)

        const box    = new THREE.Box3().setFromObject(clone)
        const center = new THREE.Vector3()
        box.getCenter(center)

        // Shift the clone so bbox centre == group origin (no orbiting)
        clone.position.sub(center)
        clone.updateMatrixWorld(true)

        // Re-measure to find the new bottom edge, then lift the group so
        // the helmet base sits exactly on top of the spike
        const newBox = new THREE.Box3().setFromObject(clone)
        return { centeredScene: clone, groupY: SPIKE_TOP_Y - newBox.min.y }
    }, [scene])

    // Each frame: rotate the group around Y only to face the camera.
    useFrame(() => {
        if (!groupRef.current) return
        const worldPos = new THREE.Vector3()
        groupRef.current.getWorldPosition(worldPos)
        groupRef.current.rotation.y = Math.atan2(
            camera.position.x - worldPos.x,
            camera.position.z - worldPos.z
        ) + Math.PI / 2
    })

    return (
        <group ref={groupRef} position={[0, groupY, 0]}>
            <primitive object={centeredScene} />
        </group>
    )
}

export default function GeneMarker({
    gene,
    centeredPoints,
    markerScale      = 1,
    atomResolutionBp = 1_000_000,
    yOffset          = 0,
}) {
    const position = useMemo(() => {
        if (!centeredPoints || centeredPoints.length === 0) return null

        const midBp   = (gene.start + gene.end) / 2
        const atomIdx = Math.min(
            Math.floor(midBp / atomResolutionBp),
            centeredPoints.length - 1
        )

        const pt = centeredPoints[atomIdx]
        return [pt.x, pt.y + yOffset, pt.z]
    }, [gene, centeredPoints, atomResolutionBp, yOffset])

    if (!position) return null

    return (
        <group position={position}>
            {/* All 3-D geometry inside the scaled sub-group */}
            <group scale={[markerScale, markerScale, markerScale]}>
                {/* Spike — cone tip at origin, base at y = SPIKE_TOP_Y */}
                <mesh position={[0, SPIKE_TOP_Y / 2, 0]} rotation={[Math.PI, 0, 0]}>
                    <coneGeometry args={[0.2, SPIKE_TOP_Y, 8]} />
                    <meshStandardMaterial
                        color={PIN_COLOR}
                        emissive={PIN_EMISSIVE}
                        emissiveIntensity={0.4}
                        roughness={0.3}
                        metalness={0.1}
                    />
                </mesh>

                {/* Helmet — faces camera horizontally via useFrame */}
                <HelmetModel />
            </group>

            {/* Label — floats above the marker in world space */}
            <Html
                position={[0, 2.5 * markerScale, 0]}
                distanceFactor={18 * markerScale}
                center
                style={{
                    pointerEvents: "none",
                    userSelect:    "none",
                    whiteSpace:    "nowrap",
                    background:    "rgba(20,20,30,0.85)",
                    color:         PIN_COLOR,
                    border:        "1px solid rgba(68,221,0,0.4)",
                    borderRadius:  "6px",
                    padding:       "3px 8px",
                    fontSize:      "12px",
                    fontWeight:    "600",
                    transform:     "translateY(-50%)",
                }}
            >
                {gene.symbol}
            </Html>
        </group>
    )
}

useGLTF.preload("/chromonaut-helmet.glb")
