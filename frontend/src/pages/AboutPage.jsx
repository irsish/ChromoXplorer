import styles from "./AboutPage.module.css";
import { Container, Row, Col } from "reactstrap";

export default function AboutPage() {
    const pillars = [
        {
            label: "Chromosome Territories",
            description:
                "Visualize all 46 human chromosomes simultaneously as they occupy distinct regions within the nucleus — a view no 2D contact map can convey.",
        },
        {
            label: "A/B Compartments",
            description:
                "Distinguish active (euchromatin) and inactive (heterochromatin) compartments derived directly from Hi-C contact matrices.",
        },
        {
            label: "TADs & Genes",
            description:
                "Drill down into topologically associating domains and individual gene loci to connect spatial structure with regulatory function.",
        },
    ];

    return (
        <>
            {/* HERO */}
            <div className={styles.hero}>
                <Container className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>About ChromoXplorer</h1>
                    <p className={styles.heroSubtitle}>
                        Exploring genomic data through intuitive visualization.
                    </p>
                </Container>
            </div>

            {/* MISSION */}
            <div className={styles.missionSection}>
                <Container>
                    <p className={styles.missionLabel}>Our Mission</p>
                    <h2 className={styles.missionStatement}>
                        The genome is three-dimensional.{" "}
                        <span className={styles.missionAccent}>
                            Your tools should be too.
                        </span>
                    </h2>
                    <p className={styles.missionBody}>
                        ChromoXplorer was built to close the gap between computationally modeled
                        chromosome structures and genuine spatial understanding of the genome.
                        By reading PDB files of individual chromosomes and rendering them all
                        together, we give researchers a view that has never been easy to achieve:
                        the entire genome, folded and co-localized, exactly as it exists within
                        a single cell.
                    </p>
                </Container>
            </div>

            {/* THE CHALLENGE */}
            <div className={styles.challengeSection}>
                <Container>
                    <Row className="gy-5 align-items-center">
                        <Col md={5}>
                            <p className={styles.sectionLabel}>The Challenge</p>
                            <h2 className={styles.sectionHeading}>
                                Current tools leave the third dimension on the table.
                            </h2>
                        </Col>
                        <Col md={7}>
                            <div className={styles.challengeBody}>
                                <p>
                                    Hi-C sequencing has transformed our ability to measure how
                                    chromosomes fold inside the nucleus. The resulting contact
                                    matrices — stored as{" "}
                                    <strong className={styles.highlight}>cooler files</strong> —
                                    are then modeled into three-dimensional structures and
                                    exported as{" "}
                                    <strong className={styles.highlight}>PDB files</strong>.
                                    PDB (Protein Data Bank) format encodes the spatial coordinates
                                    of each genomic locus, making it the natural bridge between
                                    raw contact data and actual 3D visualization.
                                </p>
                                <p>
                                    Molecular visualization libraries like{" "}
                                    <strong className={styles.highlight}>3Dmol.js</strong> can
                                    render PDB files, but they were designed for proteins and
                                    small molecules. They have no concept of chromosome-scale
                                    structure, compartment organization, or the simultaneous
                                    spatial arrangement of all chromosomes within a single cell.
                                    Loading a whole-genome PDB into these tools produces an
                                    unnavigable tangle with no biological context.
                                </p>
                                <p>
                                    No existing open tool reads whole-chromosome PDB files and
                                    renders{" "}
                                    <strong className={styles.highlight}>
                                        all chromosomes of a single cell
                                    </strong>{" "}
                                    together in one coherent, interactive 3D view.
                                </p>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* OUR APPROACH */}
            <div className={styles.approachSection}>
                <Container>
                    <div className={styles.approachHeader}>
                        <p className={styles.sectionLabel}>Our Approach</p>
                        <h2 className={styles.sectionHeading}>
                            One view. Every chromosome. True 3D.
                        </h2>
                        <p className={styles.approachIntro}>
                            ChromoXplorer reads PDB files of modeled chromosome structures and
                            renders all of them together as a single, interactive three-dimensional
                            scene. Instead of an isolated molecule or a flattened contact matrix,
                            you see the entire genome — spatially organized, hierarchically
                            navigable, and scientifically grounded.
                        </p>
                    </div>

                    <Row className="gy-4">
                        {pillars.map((pillar, i) => (
                            <Col md={4} key={i}>
                                <div className={styles.pillarCard}>
                                    <span className={styles.pillarNumber}>
                                        0{i + 1}
                                    </span>
                                    <h4 className={styles.pillarLabel}>{pillar.label}</h4>
                                    <p className={styles.pillarDescription}>
                                        {pillar.description}
                                    </p>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </div>

            {/* CLOSING CTA */}
            <div className={styles.closingSection}>
                <Container className={styles.closingContent}>
                    <h2 className={styles.closingHeading}>
                        Ready to explore the genome in 3D?
                    </h2>
                    <p className={styles.closingBody}>
                        ChromoXplorer is designed for researchers, educators, and anyone
                        curious about how the genome is organized in space. Load your data
                        and start exploring.
                    </p>
                    <a href="/explorer" className={styles.closingButton}>
                        Open the Explorer
                    </a>
                </Container>
            </div>
        </>
    );
}
