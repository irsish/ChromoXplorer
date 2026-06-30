/**
 * GenomeScene.jsx
 *
 * Routes the active level to the correct 3-D component.
 *
 * Level 1 — ChromosomeTerritories3D   (all chromosomes, 1 mb)
 * Level 2 — ABCompartmentView         (one chromosome, A/B coloured, 5 kb tube + 1 mb hit spheres)
 * Level 3 — BinView                   (one chromosome, 5 kb, selected bin highlighted)
 *
 * pdb5kbText and pdb5kbLoading are owned by ExplorerPage so the hook's cache
 * persists across level changes. They are passed to both ABCompartmentView
 * (L2) and BinView (L3).
 */
import ChromosomeTerritories3D from "./ChromosomeTerritories3D"
import ABCompartmentView       from "./ABCompartmentView"
import BinView                 from "./BinView"

export default function GenomeScene({
    level,
    genome,
    onSelect,
    showSphere,
    controlsRef,
    isMouseDownRef,
    isOverMeshRef,
    chromosomeMap,
    abCompartmentsText,
    annotationTracks,
    pdb5kbText,
    pdb5kbLoading,
    pdb5kbError,
}) {
    return (
        <>
            {level === 1 && (
                <ChromosomeTerritories3D
                    chromosomeMap={chromosomeMap}
                    onSelect={onSelect}
                    showSphere={showSphere}
                    isMouseDownRef={isMouseDownRef}
                    isOverMeshRef={isOverMeshRef}
                />
            )}
            {level === 2 && (
                <ABCompartmentView
                    chromosomeMap={chromosomeMap}
                    abCompartmentsText={abCompartmentsText}
                    annotationTracks={annotationTracks}
                    onSelect={onSelect}
                    showSphere={showSphere}
                    isMouseDownRef={isMouseDownRef}
                    isOverMeshRef={isOverMeshRef}
                    pdb5kbText={pdb5kbText}
                    pdb5kbLoading={pdb5kbLoading}
                />
            )}
            {level === 3 && (
                <BinView
                    pdbText={pdb5kbLoading ? null : pdb5kbText}
                    loading={pdb5kbLoading}
                    error={pdb5kbError}
                    onSelect={onSelect}
                    annotationTracks={annotationTracks}
                />
            )}
        </>
    )
}
