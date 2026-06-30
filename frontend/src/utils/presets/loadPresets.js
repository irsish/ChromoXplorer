import presets from "../../data/genomePresets.json";

export function loadPresets() {
    const saved = localStorage.getItem("genome-presets");
    return saved ? JSON.parse(saved) : presets;
}
