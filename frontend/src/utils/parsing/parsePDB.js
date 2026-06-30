export function parsePDB(text) {
    const atoms = [];
    const bonds = [];

    const atomRegex = /^ATOM\s+(\d+)\s+\S+\s+\S+\s+\S+\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)/;
    const bondRegex = /^CONECT\s+(\d+)\s+(.*)/;

    const lines = text.split(/\r?\n/);

    for (const line of lines) {
        // Parse ATOM lines
        let match = atomRegex.exec(line);
        if (match) {
            const id = Number(match[1]);
            const x = Number(match[2]);
            const y = Number(match[3]);
            const z = Number(match[4]);

            atoms.push({ id, x, y, z });
            continue;
        }

        // Parse CONECT lines
        match = bondRegex.exec(line);
        if (match) {
            const from = Number(match[1]);
            const rest = match[2].trim().split(/\s+/);

            rest.forEach(toStr => {
                const to = Number(toStr);
                if (Number.isFinite(to)) {
                    bonds.push({ from, to });
                }
            });
        }
    }

    return { atoms, bonds };
}
