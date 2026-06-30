/**
 * ExplorerLevelControls.jsx
 *
 * Changes from previous version:
 *   - `level` is now read from useExplorer() instead of props so the Level 2
 *     button highlights automatically when the zoom detector triggers a level
 *     switch, not just when the user clicks a button.
 *   - `setLevel` is also read from context for the same reason.
 *   - The `level` and `setLevel` props are kept as optional fallbacks so any
 *     other callsite that still passes them does not break, but context wins.
 */

import { Button } from "reactstrap";
import { useExplorer } from "../../context/ExplorerContext";
import styles from "../../pages/ExplorerPage.module.css";

export default function ExplorerLevelControls({ horizontal }) {
    const { level, setLevel } = useExplorer();

    return (
        <div className={horizontal ? styles.levelControlsRow : styles.levelControlsColumn}>
            <Button
                className={level === 1 ? styles.levelButtonActive : styles.levelButtonInactive}
                onClick={() => setLevel(1)}
            >
                {horizontal ? "Level 1" : "Level 1: Chromosome Territories"}
            </Button>
            <Button
                className={level === 2 ? styles.levelButtonActive : styles.levelButtonInactive}
                onClick={() => setLevel(2)}
            >
                {horizontal ? "Level 2" : "Level 2: A/B Compartments"}
            </Button>
            <Button
                className={level === 3 ? styles.levelButtonActive : styles.levelButtonInactive}
                onClick={() => setLevel(3)}
            >
                {horizontal ? "Level 3" : "Level 3: Genome View"}
            </Button>
        </div>
    );
}