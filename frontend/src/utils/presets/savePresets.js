export function savePresets(updatedList) {
    localStorage.setItem("genome-presets", JSON.stringify(updatedList));
}
