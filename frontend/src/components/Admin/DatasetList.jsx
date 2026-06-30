import styles from "./DatasetList.module.css";

export default function DatasetList({ datasets, onActivate, onDelete }) {
    if (!datasets.length) {
        return <div className={styles.empty}>No datasets available.</div>;
    }

    return (
        <div className={styles.listWrapper}>
            {datasets.map(dataset => (
                <div
                    key={dataset.id}
                    className={`${styles.card} ${dataset.active ? styles.activeCard : ""}`}
                >
                    {/* Top Row */}
                    <div className={styles.headerRow}>
                        <div>
                            <h3 className={styles.name}>{dataset.name}</h3>
                            <p className={styles.filename}>{dataset.file}</p>
                        </div>

                        <div className={styles.buttonRow}>
                            {!dataset.active ? (
                                <button
                                    className={styles.activateButton}
                                    onClick={() => onActivate(dataset.id)}
                                >
                                    Activate
                                </button>
                            ) : (
                                <span className={styles.activeTag}>Active</span>
                            )}

                            <button
                                className={styles.deleteButton}
                                onClick={() => onDelete(dataset.id)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>

                    {/* Description */}
                    {dataset.description && (
                        <p className={styles.description}>{dataset.description}</p>
                    )}
                </div>
            ))}
        </div>
    );
}
