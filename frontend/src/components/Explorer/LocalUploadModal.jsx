/**
 * LocalUploadModal.jsx
 *
 * A self-contained modal that lets a logged-in user upload a cell zip for
 * temporary in-browser rendering. Adapted from the ManageCellsPage admin
 * modal ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â no backend calls are made. The zip is parsed client-side via
 * JSZip and the result is handed back to the caller via onLoad().
 *
 * Props:
 *   onLoad(zip, cellName)  ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â called with the loaded JSZip instance and the
 *                            user-supplied display name once parsing succeeds.
 *   onClose()              ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â called when the modal should be dismissed.
 */

import { useId, useState } from "react"
import JSZip from "jszip"
import styles from "./LocalUploadModal.module.css"
import { UploadCellIcon } from "./ExplorerTopBar"

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Template zip download (same structure as the admin template) ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

const README_CONTENT = `# ChromoXplorer - Cell Folder Template

## Folder Structure

Rename the root folder \`cellName\` to your actual cell name, then zip that
folder and upload it on the Explorer page.

\`\`\`
cellName/
|   ab_compartments.bed
|   README.md
|
+---1mb/
|       chr1.pdb
|
+---5kb/
|       chr1.pdb
|
+---tracks/
        tads.bed
        regulatory.bed
\`\`\`

## Required Files

| File | Description |
|------|-------------|
| ab_compartments.bed | Required root-level BED file for A/B compartment intervals |
| 1mb/chr1.pdb | Required 1 MB resolution chromosome structure file(s) |
| 5kb/chr1.pdb | Required 5 KB resolution chromosome structure file(s) |

## Optional Files

| File | Description |
|------|-------------|
| tracks/tads.bed | Optional TAD or boundary interval BED file for this cell |
| tracks/regulatory.bed | Optional cell-specific regulatory interval BED file |

## Notes

- The root of the cell folder must contain exactly one A/B compartment BED file.
- The \`tracks/\` folder is optional. If you do not have TAD or regulatory BEDs yet, you can remove those files or the folder entirely.
- Add additional chromosome PDB files to both \`1mb/\` and \`5kb/\` as needed, for example \`chr2.pdb\`, \`chr3.pdb\`, and \`chrX.pdb\`.

## Upload Steps

1. Replace \`ab_compartments.bed\` with your real A/B compartment BED file.
2. Replace the sample \`.pdb\` files in \`1mb/\` and \`5kb/\` with your real chromosome structure files.
3. Optionally replace \`tracks/tads.bed\` and \`tracks/regulatory.bed\` with real interval BED files for this cell.
4. Zip the renamed cell folder. The zip filename itself does not need to match the cell name.
5. On the Explorer page click "Upload My Cell", enter a display name, and upload the zip. Your data stays local and is never sent to the server.
`

async function downloadTemplateZip() {
    const zip  = new JSZip()
    const root = zip.folder("cellName")
    root.file("ab_compartments.bed", "# Required A/B compartment BED file\n# Replace with your data\n")
    root.folder("tracks").file("tads.bed", "# Optional TAD intervals BED file\n")
    root.folder("tracks").file("regulatory.bed", "# Optional regulatory intervals BED file\n")
    root.folder("1mb").file("chr1.pdb", "# 1 MB resolution PDB file\n# Replace with your data\n")
    root.folder("5kb").file("chr1.pdb", "# 5 KB resolution PDB file\n# Replace with your data\n")
    root.file("README.md", README_CONTENT)

    const blob = await zip.generateAsync({ type: "blob" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href     = url
    a.download = "chromoxplorer-cell-template.zip"
    a.click()
    URL.revokeObjectURL(url)
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Modal ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

export default function LocalUploadModal({ onLoad, onClose }) {
    const fileInputId = useId()

    const [draftName, setDraftName]   = useState("")
    const [draftFile, setDraftFile]   = useState(null)
    const [parsing,   setParsing]     = useState(false)
    const [parseError, setParseError] = useState(null)

    async function handleSubmit(e) {
        e.preventDefault()

        const trimmedName = draftName.trim()
        if (!trimmedName || !draftFile) return

        setParsing(true)
        setParseError(null)

        try {
            const zip = await JSZip.loadAsync(draftFile)

            // Validate that the zip contains at least one 1mb .pdb file so the
            // user gets a clear error rather than a blank explorer.
            const has1mbPdb = Object.values(zip.files).some(
                (f) =>
                    !f.dir &&
                    f.name.toLowerCase().endsWith(".pdb") &&
                    /[/\\]1mb[/\\]/i.test(f.name)
            )

            if (!has1mbPdb) {
                throw new Error(
                    "No .pdb files found inside a 1mb/ folder. " +
                    "Check the folder structure matches the template."
                )
            }

            onLoad(zip, trimmedName)
        } catch (err) {
            setParseError(err.message)
        } finally {
            setParsing(false)
        }
    }

    return (
        <div
            className={styles.modalOverlay}
            role="presentation"
            onClick={onClose}
        >
            <div
                className={styles.modalCard}
                role="dialog"
                aria-modal="true"
                aria-labelledby="local-upload-title"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    className={styles.closeButton}
                    onClick={onClose}
                    aria-label="Close"
                >
                    ×
                </button>

                <p className={styles.modalEyebrow}>Explorer · Local Preview</p>
                <h2 id="local-upload-title" className={styles.modalTitle}>
                    Upload Cell
                </h2>
                <p className={styles.modalSubtitle}>
                    Use this form to upload a zip file containing your cell data for temporary in-browser preview. Once the page is refreshed, the uploaded cell will be cleared. Make sure your zip file follows the required folder structure outlined in the readme file and includes at least one 1 MB resolution .pdb file. 
                    {" "}
                    <br />
                    <button
                        type="button"
                        className={styles.modalTemplateLink}
                        onClick={downloadTemplateZip}
                    >
                        Download template
                    </button>
                </p>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <label className={styles.fieldCard}>
                        <span className={styles.fieldLabel}>Display Name</span>
                        <span className={styles.fieldHelp}>
                            A label for your cell, shown in place of the cell dropdown
                        </span>
                        <input
                            type="text"
                            value={draftName}
                            onChange={(e) => setDraftName(e.target.value)}
                            className={styles.textInput}
                            placeholder="e.g. My Custom Cell"
                            required
                        />
                    </label>

                    <label className={styles.uploadCard} htmlFor={fileInputId}>
                        <input
                            id={fileInputId}
                            type="file"
                            accept=".zip"
                            className={styles.fileInput}
                            onChange={(e) => {
                                setDraftFile(e.target.files?.[0] ?? null)
                                setParseError(null)
                            }}
                        />
                        <UploadCellIcon />
                        <span className={styles.uploadText}>Upload Cell Folder (.zip)</span>
                        <span className={styles.uploadHint}>
                            {draftFile ? draftFile.name : "Click to choose a .zip file"}
                        </span>
                    </label>

                    {parseError && (
                        <p className={styles.uploadError}>{parseError}</p>
                    )}

                    <button
                        type="submit"
                        className={styles.modalSaveButton}
                        disabled={parsing || !draftName.trim() || !draftFile}
                    >
                        {parsing ? "Reading zip…" : "Load Cell"}
                    </button>
                </form>
            </div>
        </div>
    )
}
