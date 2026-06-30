import { useNavigate } from "react-router-dom";
import styles from "./NotFoundPage.module.css";

export default function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className={styles.wrapper}>
            <div className={styles.card}>
                <div className={styles.code}>404</div>
                <h1 className={styles.title}>Page Not Found</h1>
                <p className={styles.message}>
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <div className={styles.actions}>
                    <button className={styles.primaryBtn} onClick={() => navigate("/")}>
                        Go Home
                    </button>
                    <button className={styles.secondaryBtn} onClick={() => navigate(-1)}>
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
}
