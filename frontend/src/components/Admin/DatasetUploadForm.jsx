import { useState } from "react";
import styles from "./DatasetUploadForm.module.css";

export default function DatasetUploadForm({ onAdd }) {
    const [name, setName] = useState("");
    const [file, setFile] = useState("");
    const [description, setDescription] = useState("");

    function handleSubmit(e) {
        e.preventDefault();

        const dataset = {
            id: name.toLowerCase().replace(/[^a-z0-9]/g, "_"),
            name,
            file,
            description,
            active: false
        };

        onAdd(dataset);

        setName("");
        setFile("");
        setDescription("");
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <h2 className={styles.formTitle}>Add New Dataset</h2>

            <div className={styles.formGroup}>
                <label className={styles.label}>Dataset Name</label>
                <input
                    className={styles.input}
                    placeholder="Dataset Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                />
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label}>Filename (must exist in /data)</label>
                <input
                    className={styles.input}
                    placeholder="mockGenomeFile.txt"
                    value={file}
                    onChange={e => setFile(e.target.value)}
                    required
                />
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label}>Description</label>
                <textarea
                    className={styles.input}
                    placeholder="Short description of this dataset…"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                />
            </div>

            <button className={styles.uploadButton} type="submit">
                Add Dataset
            </button>
        </form>

    );
}
