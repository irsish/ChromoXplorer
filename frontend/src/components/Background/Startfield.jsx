import { useMemo } from "react";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useExplorer } from "../../context/ExplorerContext";

export default function Starfield() {
    const { lightMode } = useExplorer();

    const points = useMemo(() => {
        const starCount = 2000;
        const positions = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 600;
        }
        return positions;
    }, []);

    return (
        <group>
            <Points positions={points} stride={3} frustumCulled>
                <PointMaterial
                    color={lightMode ? "#c8c8c8" : "#A0A0A0"}
                    size={1.5}
                    sizeAttenuation={true}
                    opacity={lightMode ? 0.5 : 1}
                    transparent
                    side={THREE.BackSide}
                    depthWrite={false}
                />
            </Points>
        </group>
    );
}