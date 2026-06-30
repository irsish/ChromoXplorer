import { useMemo } from "react";
import * as THREE from "three";

export default function ChromosomeTerritories({ onSelect }) {

    // Mock chromosomes — you can add/remove as needed
    const chromosomes = useMemo(() => [
        { id: "Chr1", size: 1.6, color: "#9A6FAE" },
        { id: "Chr2", size: 1.5, color: "#6A4FBF" },
        { id: "Chr3", size: 1.4, color: "#C17CEB" },
        { id: "Chr4", size: 1.2, color: "#B794F4" },
        { id: "Chr5", size: 1.3, color: "#7E57C2" },
        { id: "ChrX", size: 1.7, color: "#DDB6F2" }
    ], []);

    // Randomized territory positions in a sphere shell
    const positions = useMemo(() => {
        return chromosomes.map(() => {
            const radius = 4; // distance from center of nucleus
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI;

            return {
                x: radius * Math.sin(theta) * Math.cos(phi),
                y: radius * Math.sin(theta) * Math.sin(phi),
                z: radius * Math.cos(theta)
            };
        });
    }, [chromosomes.length]);

    return (
        <group>

            {/* The nucleus */}
            <mesh>
                <sphereGeometry args={[5, 32, 32]} />
                <meshStandardMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.07}
                    wireframe={true}
                />
            </mesh>

            {/* Chromosome bubbles */}
            {chromosomes.map((chr, i) => (
                <mesh
                    key={chr.id}
                    position={[positions[i].x, positions[i].y, positions[i].z]}
                    onClick={() =>
                        onSelect({
                            id: chr.id,
                            type: "Chromosome Territory",
                            description: `Mock territory for ${chr.id}.`,
                        })
                    }
                >
                    <sphereGeometry args={[chr.size, 32, 32]} />
                    <meshStandardMaterial
                        color={chr.color}
                        transparent
                        opacity={0.45}
                        emissive={chr.color}
                        emissiveIntensity={0.1}
                    />
                </mesh>
            ))}

        </group>
    );
}
