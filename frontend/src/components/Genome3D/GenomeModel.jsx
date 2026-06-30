import { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { Outlines } from "@react-three/drei";
import { parsePDB } from "../../utils/parsing/parsePDB";

function colorFromIndex(i, total) {
  const t = i / total;
  return new THREE.Color().setHSL(t, 0.7, 0.5);
}

function getLOD(count) {
  if (count < 500) return { segments: 16, radius: 0.22, bondStep: 1, useInstancing: false };
  if (count < 3000) return { segments: 12, radius: 0.22, bondStep: 1, useInstancing: false };
  if (count < 10000) return { segments: 10, radius: 0.2, bondStep: 2, useInstancing: true };
  return { segments: 8, radius: 0.18, bondStep: 3, useInstancing: true };
}

// Component-based rendering for small files (<3000 atoms)
function AtomSphere({ position, color, index, isSelected, onClick }) {
  return (
    <mesh
      position={position}
      userData={{ index }}
      onClick={onClick}
      scale={isSelected ? [1.4, 1.4, 1.4] : [1, 1, 1]}
    >
      <sphereGeometry args={[0.22, 12, 12]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={isSelected ? 0.5 : 0.1}
        roughness={0.4}
        metalness={0.3}
      />
      <Outlines
        thickness={0.015}
        color={isSelected ? "#ffff00" : "#000000"}
        opacity={isSelected ? 1.0 : 0.3}
        transparent
      />
    </mesh>
  );
}














// Instanced rendering for large files (3000+ atoms)
// function InstancedAtoms({ atoms, scale, selectedId, onSelect }) {
//   const meshRef = useRef();

//   const lod = useMemo(() => getLOD(atoms.length), [atoms.length]);

//   const geometry = useMemo(() => 
//     new THREE.SphereGeometry(lod.radius, lod.segments, lod.segments),
//     [lod]
//   );

//   // Initial setup - runs once

//     const material = useMemo(
//     () =>
//         new THREE.MeshStandardMaterial({
//         vertexColors: true, // REQUIRED for setColorAt() to work
//         roughness: 0.4,
//         metalness: 0.3,
//         }),
//     []
//     );

//   useEffect(() => {
//     if (!meshRef.current) return;

//     const mesh = meshRef.current;
//     const tempObject = new THREE.Object3D();
//     const tempColor = new THREE.Color();

//     atoms.forEach((atom, i) => {
//       tempObject.position.set(atom.x * scale, atom.y * scale, atom.z * scale);
//       tempObject.scale.set(1, 1, 1);
//       tempObject.updateMatrix();
//       mesh.setMatrixAt(i, tempObject.matrix);

//       tempColor.copy(colorFromIndex(i, atoms.length));
//       mesh.setColorAt(i, tempColor);
//     });

//     mesh.instanceMatrix.needsUpdate = true;
//     if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
//   }, [atoms, scale]);

// useEffect(() => {
//   if (!meshRef.current) return;
//   console.log('Current material:', meshRef.current.material);
//   console.log('Material type:', meshRef.current.material?.type);
//   console.log('Vertex colors enabled:', meshRef.current.material?.vertexColors);
// }, [atoms]);

//   // Update selection scale
//   useEffect(() => {
//     if (!meshRef.current || selectedId === null) return;

//     const mesh = meshRef.current;
//     const tempObject = new THREE.Object3D();

//     atoms.forEach((atom, i) => {
//       tempObject.position.set(atom.x * scale, atom.y * scale, atom.z * scale);
//       tempObject.scale.set(i === selectedId ? 1.4 : 1, i === selectedId ? 1.4 : 1, i === selectedId ? 1.4 : 1);
//       tempObject.updateMatrix();
//       mesh.setMatrixAt(i, tempObject.matrix);
//     });

//     mesh.instanceMatrix.needsUpdate = true;
//   }, [selectedId, atoms, scale]);

//   const handleClick = (e) => {
//     if (e.instanceId === undefined) return;
//     e.stopPropagation();

//     const atom = atoms[e.instanceId];
//     onSelect({
//       id: atom.id,
//       type: "Genome Bin",
//       description: `Position: (${atom.x.toFixed(2)}, ${atom.y.toFixed(2)}, ${atom.z.toFixed(2)})`,
//     }, e.instanceId);
//   };

//   return (
//     <instancedMesh
//       ref={meshRef}
//       args={[geometry, undefined, atoms.length]}
//       onClick={handleClick}
//       onPointerOver={(e) => {
//         e.stopPropagation();
//         document.body.style.cursor = 'pointer';
//       }}
//       onPointerOut={() => {
//         document.body.style.cursor = 'default';
//       }}
//     >
//       {/* <meshStandardMaterial 
//         vertexColors
//         roughness={0.4}
//         metalness={0.3}
//       /> */}
//     </instancedMesh>
//   );
// }




// doesn't lag anymore. 
//basically added a check to use a different threeJS object for when there are a ton of atoms. 
// InstancedMesh. Less color/texture customization but much faster

function InstancedAtoms({ atoms, scale, selectedId, onSelect }) {
  const meshRef = useRef();
  const isInitialized = useRef(false);

  const lod = useMemo(() => getLOD(atoms.length), [atoms.length]);

  const geometry = useMemo(() =>
    new THREE.SphereGeometry(lod.radius * 0.6, lod.segments, lod.segments),
    [lod]
  );

  useEffect(() => {
    if (!meshRef.current || isInitialized.current) return;

    const mesh = meshRef.current;
    const tempObject = new THREE.Object3D();
    const tempColor = new THREE.Color();

    const spacingMultiplier = atoms.length >= 10000 ? 1.3 : 1;


    atoms.forEach((atom, i) => {
      // Increased spacing by 1.3x
      tempObject.position.set(atom.x * scale * spacingMultiplier, atom.y * scale * spacingMultiplier, atom.z * scale * spacingMultiplier); tempObject.scale.set(1, 1, 1);
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);

      // 10 color groups with alternating light and dark
      const group = Math.min(9, Math.floor(i / (atoms.length / 10)));
      const hue = group / 10;
      const lightness = (i % 2 === 0) ? 0.3 : 0.7;

      tempColor.setHSL(hue, 0.8, lightness);
      mesh.setColorAt(i, tempColor);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    isInitialized.current = true;

  }, [atoms, scale]);

  useEffect(() => {
    if (!meshRef.current || selectedId === null) return;

    const mesh = meshRef.current;
    const tempObject = new THREE.Object3D();


    const spacingMultiplier = atoms.length >= 10000 ? 1.3 : 1;

    atoms.forEach((atom, i) => {

      tempObject.position.set(atom.x * scale * spacingMultiplier, atom.y * scale * spacingMultiplier, atom.z * scale * spacingMultiplier);
      tempObject.scale.set(i === selectedId ? 1.4 : 1, i === selectedId ? 1.4 : 1, i === selectedId ? 1.4 : 1);
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  }, [selectedId, atoms, scale]);

  const handleClick = (e) => {
    if (e.instanceId === undefined) return;
    e.stopPropagation();

    const atom = atoms[e.instanceId];
    onSelect({
      id: atom.id,
      type: "Genome Bin",
      description: `Position: (${atom.x.toFixed(2)}, ${atom.y.toFixed(2)}, ${atom.z.toFixed(2)})`,
    }, e.instanceId);
  };

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, atoms.length]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    />
  );
}






export default function GenomeModel({ pdbText, onSelect }) {
  const [atoms, setAtoms] = useState([]);
  const [bonds, setBonds] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const scale = 0.3;

  const lod = useMemo(() => atoms.length > 0 ? getLOD(atoms.length) : null, [atoms.length]);

  useEffect(() => {
    if (!pdbText) return;

    const data = parsePDB(pdbText);
    const validAtoms = data.atoms.filter(
      a => a && Number.isFinite(a.x) && Number.isFinite(a.y) && Number.isFinite(a.z)
    );

    setAtoms(validAtoms);

    const step = getLOD(validAtoms.length).bondStep;
    const positions = [];
    //only for use when we have a large file
    const spacingMultiplier = validAtoms.length >= 10000 ? 1.3 : 1;

    data.bonds.forEach((bond, i) => {
      if (i % step !== 0) return;
      const A = validAtoms.find(a => a.id === bond.from);
      const B = validAtoms.find(a => a.id === bond.to);
      if (!A || !B) return;
      positions.push(
        A.x * scale * spacingMultiplier, A.y * scale * spacingMultiplier, A.z * scale * spacingMultiplier,
        B.x * scale * spacingMultiplier, B.y * scale * spacingMultiplier, B.z * scale * spacingMultiplier
      );
    });

    setBonds(positions);
  }, [pdbText, scale]);

  const handleSelect = (data, index) => {
    setSelectedId(index);
    onSelect(data);
  };

  if (!lod) return null;


  return (
    <group>
      {lod.useInstancing ? (
        <InstancedAtoms
          atoms={atoms}
          scale={scale}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      ) : (
        atoms.map((atom, i) => (
          <AtomSphere
            key={i}
            position={[atom.x * scale, atom.y * scale, atom.z * scale]}
            color={colorFromIndex(i, atoms.length)}
            index={i}
            isSelected={selectedId === i}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedId(i);
              onSelect({
                id: atom.id,
                type: "Genome Bin",
                description: `Position: (${atom.x.toFixed(2)}, ${atom.y.toFixed(2)}, ${atom.z.toFixed(2)})`,
              });
            }}
          />
        ))
      )}

      {bonds.length > 0 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={new Float32Array(bonds)}
              itemSize={3}
              count={bonds.length / 3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#666666" opacity={0.4} transparent />
        </lineSegments>
      )}
    </group>
  );
}