import styles from "./PricingPage.module.css";
import { Container, Row, Col } from "reactstrap";
import { useNavigate } from "react-router-dom";

export default function PricingPage() {
    const navigate = useNavigate();

    const tiers = [
        {
            name: "Free",
            price: "Free",
            description:
                "Full access to the ChromoXplorer 3D genome explorer using our curated collection of publicly available chromosome datasets.",
            features: [
                "Interactive 3D chromosome viewer",
                "All 23 human chromosome pairs",
                "A/B compartment visualization",
                "TAD and gene-level navigation",
                "Access to all public datasets",
            ],
            cta: "Start Exploring",
            onClick: () => navigate("/explorer"),
            highlighted: false,
        },
        {
            name: "Researcher",
            price: "Contact Us",
            description:
                "Everything in Free, plus the ability to load your own PDB files directly into the explorer for on-demand visualization.",
            features: [
                "Everything in Free",
                "Upload your own PDB files",
                "Render custom chromosome structures",
                "Private session — data is never stored",
                "Full explorer capabilities on your data",
            ],
            cta: "Get in Touch",
            onClick: () => navigate("/support"),
            highlighted: true,
        },
    ];

    return (
        <>
            {/* HERO */}
            <div className={styles.hero}>
                <Container className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>Pricing</h1>
                    <p className={styles.heroSubtitle}>
                        Simple, transparent access to 3D genome visualization.
                    </p>
                </Container>
            </div>

            {/* TIERS */}
            <div className={styles.pricingSection}>
                <Container>
                    <Row className="gy-4 justify-content-center">
                        {tiers.map((tier, index) => (
                            <Col key={index} xs="12" md="5">
                                <div className={`${styles.card} ${tier.highlighted ? styles.cardHighlighted : ""}`}>
                                    {tier.highlighted && (
                                        <span className={styles.badge}>For Researchers</span>
                                    )}
                                    <div className={styles.cardHeader}>
                                        <h3 className={styles.tierName}>{tier.name}</h3>
                                        <p className={styles.tierPrice}>{tier.price}</p>
                                        <p className={styles.tierDescription}>{tier.description}</p>
                                    </div>
                                    <ul className={styles.featureList}>
                                        {tier.features.map((feature, i) => (
                                            <li key={i} className={styles.featureItem}>
                                                <span className={styles.featureCheck}>✓</span>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    <div className={styles.cardFooter}>
                                        <button
                                            className={`${styles.cardButton} ${tier.highlighted ? styles.cardButtonHighlighted : ""}`}
                                            onClick={tier.onClick}
                                        >
                                            {tier.cta}
                                        </button>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>

                    <p className={styles.note}>
                        Uploaded PDB files are processed entirely within your session and are never saved to our servers.
                    </p>
                </Container>
            </div>
        </>
    );
}
