/**
 * parseABCompartments.js
 *
 * Parses a BED-format A/B compartment file into a per-chromosome lookup
 * structure that can be used to label PDB ATOM records.
 *
 * Expected BED column layout (tab or space delimited, no header):
 *   col 0  chr number (1-based integer, or "X", "Y")
 *   col 1  start position (bp, 1-based)
 *   col 2  end position (bp, inclusive)
 *   col 3  compartment label ("A" or "B")
 *   col 4  score (float, unused for rendering but preserved)
 *   col 5  strand placeholder (".")
 *
 * Output shape:
 *   {
 *     "1":  [ { start, end, compartment, score }, ... ],
 *     "2":  [ ... ],
 *     ...
 *     "X":  [ ... ],
 *   }
 *
 */

/**
 * Parse the raw text of a BED A/B compartment file.
 *
 * @param {string} rawText - The full file contents as a string.
 * @returns {Object} compartmentMap - Keys are chromosome strings ("1".."22", "X", "Y").
 *                                    Values are sorted arrays of interval objects.
 */
export function parseABCompartments(rawText) {
    const compartmentMap = {};

    const lines = rawText.split("\n");

    for (const line of lines) {
        const trimmed = line.trim();

        // Skip empty lines and comment lines
        if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("track") || trimmed.startsWith("browser")) {
            continue;
        }

        const cols = trimmed.split(/\s+/);

        // Need at least 4 columns: chr, start, end, compartment
        if (cols.length < 4) {
            continue;
        }

        const chrRaw = cols[0];
        const start = parseInt(cols[1], 10);
        const end = parseInt(cols[2], 10);
        const compartment = cols[3].toUpperCase(); // normalize to "A" or "B"
        const score = cols[4] !== undefined ? parseFloat(cols[4]) : 0;

        // Validate compartment label
        if (compartment !== "A" && compartment !== "B") {
            continue;
        }

        // Validate numeric fields
        if (isNaN(start) || isNaN(end) || start < 0 || end < start) {
            continue;
        }

        // Normalize chromosome key: strip leading "chr" (case-insensitive)
        const chrKey = chrRaw.replace(/^chr/i, "");

        if (!compartmentMap[chrKey]) {
            compartmentMap[chrKey] = [];
        }

        compartmentMap[chrKey].push({ start, end, compartment, score });
    }

    // Sort each chromosome's intervals by start position for binary search
    for (const key of Object.keys(compartmentMap)) {
        compartmentMap[key].sort((a, b) => a.start - b.start);
    }

    return compartmentMap;
}

export function getCompartmentForBin(compartmentMap, chrKey, binStart, binEnd) {
    const intervals = compartmentMap[chrKey];
    if (!intervals || intervals.length === 0) return null;

    const midpoint = Math.floor((binStart + binEnd) / 2);

    // Binary search for the interval containing midpoint
    let lo = 0;
    let hi = intervals.length - 1;

    while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        const interval = intervals[mid];

        if (midpoint < interval.start) {
            hi = mid - 1;
        } else if (midpoint > interval.end) {
            lo = mid + 1;
        } else {
            // midpoint is within [interval.start, interval.end]
            return interval.compartment;
        }
    }

    // No interval contained the midpoint — return null, caller shows fallback
    return null;
}

export function labelAtomsForChromosome(compartmentMap, chrKey, atomCount) {
    const BIN_SIZE = 1_000_000; // 1 MB resolution matches your PDB files

    const labels = new Array(atomCount);

    for (let i = 0; i < atomCount; i++) {
        const binStart = i * BIN_SIZE + 1;
        const binEnd = (i + 1) * BIN_SIZE;
        labels[i] = getCompartmentForBin(compartmentMap, chrKey, binStart, binEnd);
    }

    return labels;
}

/**
 * Maps component's chromosome ID format ("Chr1", "Chr23") to the BED
 * file's chromosome key format ("1", "X").
 *
 * 23rd PDB file is chrX. The BED file uses "X" as the key for chrX.
 *
 * @param {string} componentChrId - e.g. "Chr1", "Chr23"
 * @returns {string} - e.g. "1", "X"
 */
export function componentIdToBedKey(componentChrId) {
    // Strip the "Chr" prefix (case-insensitive)
    const stripped = componentChrId.replace(/^Chr/i, "");

    // 23rd chromosome is chrX
    if (stripped === "23") return "X";

    return stripped;
}