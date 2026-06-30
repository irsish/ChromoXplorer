export function parseGenomeFile(text) {
    const lines = text.trim().split(/\r?\n/);
    const bins = [];

    for (const line of lines) {
        const [chr, start, end, x, y, z] = line.split(/\s+/);

        bins.push({
            id: bins.length,
            chr,
            start: Number(start),
            end: Number(end),
            x: Number(x),
            y: Number(y),
            z: Number(z)
        });
    }

    return { bins };
}
