import styles from "./CreditsPage.module.css";
import { Container, Row, Col } from "reactstrap";

const developers = [
    {
        name: "David Loder",
        role: "Project Manager",
        capstone: "Capstones 1 & 2",
        image: "/images/developer_headshots/David_loder.jpg",
        linkedin: "https://www.linkedin.com/in/daveloder/",
    },
    {
        name: "Y Kien Mai",
        role: "Full Stack Developer",
        capstone: "Capstones 1 & 2",
        image: "/images/developer_headshots/ykien_mai.jpg",
        linkedin: "https://www.linkedin.com/in/y-kien-mai/"
    },
    {
        name: "Charlie Toothaker",
        role: "Frontend Developer",
        capstone: "Capstones 1 & 2",
        image: "/images/developer_headshots/Charles_Toothaker.jpg",
        linkedin: "https://www.linkedin.com/in/ctoothaker/"
    },
    {
        name: "Michael Balogun",
        role: "Backend Developer",
        capstone: "Capstones 1 & 2",
        image: "/images/developer_headshots/Michael_Balogun.jpg",
        linkedin: "https://www.linkedin.com/in/mike-balogun/",
    },
    {
        name: "Danny Huang",
        role: "QA Tester",
        capstone: "Capstones 1 & 2",
        image: "/images/developer_headshots/Danny_Huang.jpg",
        linkedin: "https://www.linkedin.com/in/danny-huang-515a12407/"
    },
    {
        name: "Jans Tarriela",
        role: "UX/UI Developer",
        capstone: "Capstones 1 & 2",
        image: "/images/developer_headshots/Jans_Tarriela.jpg",
        linkedin: "https://www.linkedin.com/in/ron-janssen-tarriela-476840266/",
    },
    {
        name: "Nour Ayyash",
        role: "Data Model Documentation",
        capstone: "Capstone 1",
        image: "/images/developer_headshots/Nour_Ayyash.jpg",
        linkedin: "https://www.linkedin.com/in/nour-ayyash-25b8aa1b3",
    },
    {
        name: "Noah Memon",
        role: "Git Repository Admin",
        capstone: "Capstones 1 & 2",
        image: "/images/developer_headshots/Noah_Memon.JPG",
        linkedin: "https://www.linkedin.com/in/noahmemon/",
    },
    {
        name: "Blake Weitzel",
        role: "Database Developer",
        capstone: "Capstones 1 & 2",
        image: "/images/developer_headshots/Blake_Weitzel.jpg",
        linkedin: "https://www.linkedin.com/in/blakeweitzel/",
    },
    {
        name: "Violet Nguyen",
        role: "Stakeholder Documentation",
        capstone: "Capstone 1",
        image: "/images/developer_headshots/Violet_Nguyen.jpg",
        linkedin: "https://www.linkedin.com/in/violet-n-97571a265/",
    },
];

export default function CreditsPage() {
    return (
        <>
            {/* HERO */}
            <div className={styles.hero}>
                <Container className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>Credits</h1>
                    <p className={styles.heroSubtitle}>
                        The people who built ChromoXplorer.
                    </p>
                </Container>
            </div>

            {/* INTRO */}
            <div className={styles.introSection}>
                <Container>
                    <p className={styles.sectionLabel}>The Team</p>
                    <h2 className={styles.sectionHeading}>
                        Built by the{" "}
                        <span className={styles.accent}>Chromonauts</span>
                    </h2>
                    <p className={styles.introBody}>
                        ChromoXplorer was designed and developed by a student team at
                        Temple University as part of the CIS 4396 Senior Capstone course,
                        in partnership with Dr. Rob Kulathinal. The following individuals
                        contributed across both semesters of the project.
                    </p>
                </Container>
            </div>

            {/* DEVELOPER CARDS */}
            <div className={styles.teamSection}>
                <Container>
                    <Row className="gy-4">
                        {developers.map((dev) => (
                            <Col xs={12} sm={6} lg={4} key={dev.name}>
                                <div className={styles.devCard}>
                                    {dev.image ? (
                                        <img
                                            src={dev.image}
                                            alt={dev.name}
                                            className={styles.devPhoto}
                                            width={120}
                                            height={120}
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className={styles.devInitials}>
                                            {dev.name
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("")}
                                        </div>
                                    )}
                                    <h3 className={styles.devName}>{dev.name}</h3>
                                    <p className={styles.devRole}>{dev.role}</p>
                                    <span className={styles.devCapstone}>{dev.capstone}</span>
                                    {dev.linkedin && (
                                        <a
                                            href={dev.linkedin}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={styles.devLinkedIn}
                                        >
                                            LinkedIn
                                        </a>
                                    )}
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </div>

            {/* CLIENT */}
            <div className={styles.clientSection}>
                <Container className={styles.clientContent}>
                    <p className={styles.sectionLabel}>Faculty & Client</p>
                    <h2 className={styles.sectionHeading}>Built for science.</h2>
                    <p className={styles.clientBody}>
                        ChromoXplorer was developed for{" "}
                        <span className={styles.accent}>Dr. Rob Kulathinal</span> of the
                        Temple University Department of Biology, whose research into genome
                        architecture and chromatin organization inspired the project.
                    </p>
                </Container>
            </div>
        </>
    );
}
