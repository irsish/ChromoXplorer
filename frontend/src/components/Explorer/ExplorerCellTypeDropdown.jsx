import { loadPresets } from "../../utils/presets/loadPresets";

export default function ExplorerCellTypeDropdown({ selectedCell, setSelectedCell }) {
    const presets = loadPresets().filter(p => p.active);

    return (
        <select value={selectedCell} onChange={(e) => setSelectedCell(e.target.value)}>
            <option>-- Select Dataset --</option>
            {presets.map(p => (
                <option key={p.id} value={p.id}>
                    {p.name}
                </option>
            ))}
        </select>
    );
}
