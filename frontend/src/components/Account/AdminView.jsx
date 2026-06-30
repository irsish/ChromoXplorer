import { useNavigate } from "react-router-dom";
import styles from "./AdminView.module.css";

const ADMIN_CARDS = [
  {
    title: "Manage Cells",
    description: "Add and remove cells within the dataset. Updating existing cells is not currently supported.",
    actionLabel: "Manage Cells",
    actionPath: "/account/admin/cells",
  },
  {
    title: "Manage Users",
    description: "User administration tools are being connected in the next step.",
    actionLabel: "Coming Soon",
    disabled: true,
  },
  {
    title: "More To Come Soon...",
    description: "This dashboard is ready for more administrative tools as the backend grows.",
  },
];

export default function AdminView() {
  const navigate = useNavigate();

  return (
    <div>
      <p className={styles.eyebrow}>Administrative Settings</p>
      <h2 className={styles.header}>Admin Dashboard</h2>
      <p className={styles.subtext}>
        Manage core admin actions from one place while we continue connecting
        backend tools and operational workflows.
      </p>

      <div className={styles.cardList}>
        {ADMIN_CARDS.map((card) => (
          <section key={card.title} className={styles.featureCard}>
            <div className={styles.cardCopy}>
              <h3 className={styles.cardTitle}>{card.title}</h3>
              <p className={styles.cardText}>{card.description}</p>
            </div>

            {card.actionLabel ? (
              <button
                type="button"
                className={styles.actionButton}
                onClick={() => card.actionPath && navigate(card.actionPath)}
                disabled={card.disabled}
              >
                {card.actionLabel}
              </button>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}
