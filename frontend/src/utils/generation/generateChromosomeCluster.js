import * as THREE from "three";

// Generate a random squiggle path inside a spherical region
export function generateChromosomeCluster({
    points = 300,   // how “dense” the territory is
    radius = 4,     // overall nucleus radius
    sectorRotation, // unique rotation for chromosome
    sectorSpread = 0.6 // how confined each cluster is
}) {
    const path = [];

    // Start somewhere inside the sector
    let pos = new THREE.Vector3(
        (Math.random() - 0.5) * radius * sectorSpread,
        (Math.random() - 0.5) * radius * sectorSpread,
        (Math.random() - 0.5) * radius * sectorSpread
    );

    // Apply rotation to move cluster into its own region
    pos.applyEuler(sectorRotation);

    for (let i = 0; i < points; i++) {

        // Random walk small steps
        const step = new THREE.Vector3(
            (Math.random() - 0.5) * 0.6,
            (Math.random() - 0.5) * 0.6,
            (Math.random() - 0.5) * 0.6
        );

        pos = pos.clone().add(step);

        // Keep inside nucleus sphere
        if (pos.length() > radius * 0.9) {
            pos.multiplyScalar(0.8);
        }

        path.push(pos.clone());
    }

    return path;
}
