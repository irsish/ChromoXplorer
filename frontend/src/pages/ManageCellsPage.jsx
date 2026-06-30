import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import JSZip from "jszip";
import styles from "./ManageCellsPage.module.css";
import {
  isAdminPreviewEnabled,
  isAdminUser,
} from "../utils/authentication/authHelper";
import { fetchCells, uploadCell, deleteCell } from "../utils/api/adminApi";

// README bundled into the template zip so admins know the expected folder structure.
const README_CONTENT = `# ChromoXplorer - Cell Folder Template

## Folder Structure

Rename the root folder \`cellName\` to your actual cell name, then zip that
folder and upload it when adding a new cell.

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
5. On the Manage Cells page, click "Add New Cell", enter the scientific cell name, and upload the zip.
`;

// Builds and triggers a download of the blank cell folder template as a zip.
async function downloadTemplateZip() {
  const zip = new JSZip();
  const root = zip.folder("cellName");

  root.file("ab_compartments.bed", "# Required A/B compartment BED file\n# Replace with your data\n");
  root.folder("tracks").file("tads.bed", "# Optional TAD intervals BED file\n");
  root.folder("tracks").file("regulatory.bed", "# Optional regulatory intervals BED file\n");
  root.folder("1mb").file("chr1.pdb", "# 1 MB resolution PDB file\n# Replace with your data\n");
  root.folder("5kb").file("chr1.pdb", "# 5 KB resolution PDB file\n# Replace with your data\n");
  root.file("README.md", README_CONTENT);

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "chromoxplorer-cell-template.zip";
  a.click();
  URL.revokeObjectURL(url);
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
      <path
        d="M4 7h16m-11 4v6m6-6v6M9 4h6l1 2h4l-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h4l1-2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.uploadGraphic}>
      <path
        d="M12 15V5m0 0L8 9m4-4 4 4M4 19h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ManageCellsPage() {
  const auth = useAuth();
  const user = auth.user?.profile;
  const token = auth.user?.access_token;
  const canViewPage = isAdminPreviewEnabled() || isAdminUser(user);
  const navigate = useNavigate();
  const fileInputId = useId();

  const [cells, setCells] = useState([]);
  const [loadingCells, setLoadingCells] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftFile, setDraftFile] = useState(null);
  const [zipError, setZipError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const zipValidationRunRef = useRef(0);

  useEffect(() => {
    document.title = "Manage Cells | ChromoXplorer";
  }, []);

  // Load all cells from the database on mount.
  useEffect(() => {
    fetchCells()
      .then((data) => setCells(data.cells ?? []))
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoadingCells(false));
  }, []);

  if (!canViewPage) {
    return <div className={styles.denied}>Access Denied</div>;
  }

  function closePopup() {
    zipValidationRunRef.current += 1;
    setIsPopupOpen(false);
    setDraftName("");
    setDraftDescription("");
    setDraftFile(null);
    setZipError(null);
    setUploadError(null);
  }

  async function validateZip(file) {
    let zip;
    try {
      zip = await JSZip.loadAsync(file);
    } catch {
      return "Could not read the zip file. Make sure it is a valid .zip archive.";
    }

    const filePaths = Object.keys(zip.files)
      .map((p) => p.replace(/\\/g, "/").replace(/^\/+|\/+$/g, ""))
      .filter(Boolean)
      .filter((p) => !zip.files[p]?.dir && !p.endsWith("/"));

    if (filePaths.length === 0) {
      return "The zip must contain files inside a root folder (e.g. cellName/). Check the template for the required structure.";
    }

    const rootName = filePaths[0].split("/")[0];
    if (!rootName || !filePaths.every((p) => p === rootName || p.startsWith(rootName + "/"))) {
      return "The zip must contain a single root folder (e.g. cellName/). Check the template for the required structure.";
    }

    const rootSegments = filePaths[0].split("/");
    const candidateRoots = [];
    for (let i = 1; i <= rootSegments.length - 1; i += 1) {
      const prefix = rootSegments.slice(0, i).join("/");
      if (filePaths.every((p) => p === prefix || p.startsWith(prefix + "/"))) {
        candidateRoots.push(prefix);
      }
    }

    function stripPrefix(filePath, prefix) {
      return filePath === prefix ? "" : filePath.slice(prefix.length + 1);
    }

    const contentRoot =
      candidateRoots.find((prefix) => {
        const relPaths = filePaths.map((p) => stripPrefix(p, prefix)).filter(Boolean);
        const hasRootBed = relPaths.some((p) => p.endsWith(".bed") && !p.includes("/"));
        const has1mb = relPaths.some((p) => p.startsWith("1mb/") && p.endsWith(".pdb"));
        const has5kb = relPaths.some((p) => p.startsWith("5kb/") && p.endsWith(".pdb"));
        return hasRootBed && has1mb && has5kb;
      }) ?? rootName;

    const relPaths = filePaths.map((p) => stripPrefix(p, contentRoot)).filter(Boolean);

    // Require at least one .bed file directly in the root folder
    const bedFiles = relPaths.filter((p) => p.endsWith(".bed") && !p.includes("/"));
    if (bedFiles.length === 0) {
      return `Missing a .bed file in the root folder ("${contentRoot}/"). Check the template for the required structure.`;
    }

    // Require at least one .pdb file in 1mb/
    const oneMbPdbs = relPaths.filter((p) => p.startsWith("1mb/") && p.endsWith(".pdb"));
    if (oneMbPdbs.length === 0) {
      return `Missing .pdb files in the "${contentRoot}/1mb/" folder. Check the template for the required structure.`;
    }

    // Require at least one .pdb file in 5kb/
    const fiveKbPdbs = relPaths.filter((p) => p.startsWith("5kb/") && p.endsWith(".pdb"));
    if (fiveKbPdbs.length === 0) {
      return `Missing .pdb files in the "${contentRoot}/5kb/" folder. Check the template for the required structure.`;
    }

    // Detect unedited template placeholder content
    const TEMPLATE_MARKER = "# Replace with your data";
    for (const filePath of [...bedFiles, ...oneMbPdbs, ...fiveKbPdbs]) {
      const content = await zip.files[`${contentRoot}/${filePath}`].async("string");
      if (content.includes(TEMPLATE_MARKER)) {
        const name = filePath.split("/").pop();
        return `"${name}" still contains template placeholder data. Replace all sample files with your real data before uploading.`;
      }
    }

    return null;
  }

  // POST the zip to the backend, then refresh the cell list on success.
  async function handleAddCell(event) {
    event.preventDefault();
    const trimmedName = draftName.trim();
    if (!trimmedName || !draftFile || zipError) return;

    setUploading(true);
    setUploadError(null);

    try {
      await uploadCell(trimmedName, draftDescription.trim(), draftFile, token);
      const data = await fetchCells();
      setCells(data.cells ?? []);
      closePopup();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }

  // DELETE the cell from S3 and the database, then remove it from local state.
  async function handleDeleteCell(cellName) {
    if (!window.confirm(`Delete "${cellName}"? This will permanently remove all S3 data and cannot be undone.`)) return;

    try {
      await deleteCell(cellName, token);
      setCells((current) => current.filter((c) => c.cellName !== cellName));
    } catch (err) {
      alert(`Failed to delete "${cellName}": ${err.message}`);
    }
  }

  return (
    <div className={styles.page}>

      {/* Page header */}
      <div className={styles.pageHeader}>
        <button type="button" className={styles.backButton} onClick={() => navigate(-1)}>
          <svg viewBox="0 0 24 24" className={styles.backIcon} aria-hidden="true">
            <path d="M19 12H5m0 0 7 7m-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          Back
        </button>
        <div>
          <p className={styles.eyebrow}>Admin</p>
          <h1 className={styles.pageTitle}>Manage Cells</h1>
        </div>
      </div>

      <main className={styles.content}>
        <div className={styles.panel}>

          {/* Toolbar */}
          <div className={styles.toolbar}>
            <button type="button" className={styles.addButton} onClick={() => setIsPopupOpen(true)}>
              + Add New Cell
            </button>
            <button type="button" className={styles.templateLink} onClick={downloadTemplateZip}>
              Download Folder Template
            </button>
          </div>

          {/* Cell list */}
          {loadingCells ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>Loading cells&hellip;</p>
            </div>
          ) : loadError ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>Failed to load cells</p>
              <p className={styles.emptyHint}>{loadError}</p>
            </div>
          ) : cells.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>No cells added yet</p>
              <p className={styles.emptyHint}>Click "Add New Cell" to upload your first cell.</p>
            </div>
          ) : (
            <div className={styles.cellGrid}>
              {cells.map((cell) => (
                <div key={cell.cellName} className={styles.cellCard}>
                  <div className={styles.cellInfo}>
                    <span className={styles.cellName}>{cell.displayName || cell.cellName}</span>
                    {cell.description ? (
                      <span className={styles.cellDesc}>{cell.description}</span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => handleDeleteCell(cell.cellName)}
                    aria-label={`Delete ${cell.cellName}`}
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className={styles.instructions}>
          <p className={styles.instructionsEyebrow}>How to add a new cell</p>
          <ol className={styles.instructionsList}>
            <li>
              <strong>Download the folder template</strong> using the link above. It contains the required folder structure with sample files.
            </li>
            <li>
              <strong>Replace the sample files</strong> with your real data - a root-level A/B compartment <code className={styles.code}>.bed</code> file, chromosome <code className={styles.code}>.pdb</code> files in the <code className={styles.code}>1mb/</code> and <code className={styles.code}>5kb/</code> folders, and optionally <code className={styles.code}>tracks/tads.bed</code> and <code className={styles.code}>tracks/regulatory.bed</code>.
            </li>
            <li>
              <strong>Zip the folder</strong> — the zip file name does not need to match the cell name.
            </li>
            <li>
              <strong>Click "Add New Cell"</strong>, enter the scientific name of the cell (e.g. <code className={styles.code}>H1-hESC</code>), add a description, then upload the zip.
            </li>
          </ol>
        </div>
      </main>

      {/* Upload modal */}
      {isPopupOpen ? (
        <div className={styles.modalOverlay} role="presentation" onClick={closePopup}>
          <div
            className={styles.modalCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-cell-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className={styles.closeButton} onClick={closePopup} aria-label="Close">
              ×
            </button>

            <p className={styles.modalEyebrow}>Admin · Cells</p>
            <h2 id="add-cell-title" className={styles.modalTitle}>Add New Cell</h2>
            <p className={styles.modalSubtitle}>
              Upload a zipped cell folder. Need the format?{" "}
              <button type="button" className={styles.modalTemplateLink} onClick={downloadTemplateZip}>
                Download template
              </button>
            </p>

            <form className={styles.form} onSubmit={handleAddCell}>
              <label className={styles.fieldCard}>
                <span className={styles.fieldLabel}>Cell Name</span>
                <span className={styles.fieldHelp}>Scientific name of the cell (e.g. H1-hESC, GM12878)</span>
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className={styles.textInput}
                  placeholder="e.g. H1-hESC"
                  required
                />
              </label>

              <label className={styles.fieldCard}>
                <span className={styles.fieldLabel}>Description</span>
                <span className={styles.fieldHelp}>A short description of this cell type</span>
                <input
                  type="text"
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                  className={styles.textInput}
                  placeholder="e.g. Human embryonic stem cell line H1"
                />
              </label>

              <label className={styles.uploadCard} htmlFor={fileInputId}>
                <input
                  id={fileInputId}
                  type="file"
                  accept=".zip"
                  className={styles.fileInput}
                  onChange={async (e) => {
                    const file = e.target.files?.[0] ?? null;
                    const runId = zipValidationRunRef.current + 1;
                    zipValidationRunRef.current = runId;
                    setDraftFile(file);
                    setZipError(null);
                    if (file) {
                      const err = await validateZip(file);
                      if (zipValidationRunRef.current === runId) {
                        setZipError(err);
                      }
                    }
                  }}
                />
                <UploadIcon />
                <span className={styles.uploadText}>Upload Cell Folder (.zip)</span>
                <span className={styles.uploadHint}>
                  {draftFile ? draftFile.name : "Click to choose a .zip file"}
                </span>
              </label>

              {zipError ? (
                <p className={styles.uploadError}>
                  <strong>Invalid zip:</strong> {zipError}
                </p>
              ) : null}

              {uploadError ? (
                <p className={styles.uploadError}>{uploadError}</p>
              ) : null}

              <button type="submit" className={styles.modalSaveButton} disabled={uploading || !!zipError}>
                {uploading ? "Uploading…" : "Add Cell"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
