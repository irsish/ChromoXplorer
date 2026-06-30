import styles from "./ResourcesPage.module.css";
import { Container, Row, Col } from "reactstrap";

const categories = [
    {
        heading: "Genome Browsers & Databases",
        resources: [
            {
                name: "UCSC Genome Browser",
                tag: "Browser",
                description:
                    "View all 23 human chromosomes at any scale, from full chromosomes down to individual nucleotides, with integrated data from hundreds of research groups worldwide.",
                url: "https://genome.ucsc.edu/",
            },
            {
                name: "Ensembl",
                tag: "Database",
                description:
                    "A genome browser and annotation database maintained by EMBL-EBI and the Wellcome Sanger Institute, covering hundreds of species with gene, variant, and regulatory data.",
                url: "https://www.ensembl.org/",
            },
            {
                name: "NCBI Genome Data Viewer",
                tag: "Browser",
                description:
                    "The National Center for Biotechnology Information's interactive genome browser with reference assemblies, gene annotations, and sequence data across thousands of organisms.",
                url: "https://www.ncbi.nlm.nih.gov/genome/gdv/",
            },
            {
                name: "ENCODE Project",
                tag: "Database",
                description:
                    "The Encyclopedia of DNA Elements — a comprehensive catalogue of functional genomic elements including gene expression, chromatin accessibility, and transcription factor binding data.",
                url: "https://www.encodeproject.org/",
            },
        ],
    },
    {
        heading: "3D Genome & Hi-C Resources",
        resources: [
            {
                name: "3D Genome Browser",
                tag: "Browser",
                description:
                    "An interactive browser for exploring three-dimensional chromatin organization, including TADs, loops, and compartments derived from Hi-C experiments.",
                url: "http://3dgenome.fsm.northwestern.edu/",
            },
            {
                name: "HiGlass",
                tag: "Visualization",
                description:
                    "A web-based viewer for exploring large Hi-C contact matrices and genomic datasets as linked, synchronized 2D views — built for scalable exploration of cooler files.",
                url: "https://higlass.io/",
            },
            {
                name: "Juicebox",
                tag: "Visualization",
                description:
                    "Developed by the Aiden Lab, Juicebox visualizes Hi-C data as 2D contact maps with support for loop and domain annotations, available as both a desktop and web tool.",
                url: "https://aidenlab.org/juicebox/",
            },
        ],
    },
    {
        heading: "Learning & Education",
        resources: [
            {
                name: "NIH National Human Genome Research Institute",
                tag: "Education",
                description:
                    "The primary US federal agency for genomics research, with accessible explainers on genome structure, sequencing technologies, and the broader implications of genomic science.",
                url: "https://www.genome.gov/",
            },
            {
                name: "Khan Academy — Gene Expression & Regulation",
                tag: "Education",
                description:
                    "Free lessons covering chromatin structure, gene regulation, and epigenetics — a good starting point for understanding how genome organization relates to gene expression.",
                url: "https://www.khanacademy.org/science/ap-biology/gene-expression-and-regulation",
            },
            {
                name: "4D Nucleome Project",
                tag: "Research",
                description:
                    "A large-scale NIH initiative studying how the genome is organized in three and four dimensions and how that organization relates to cell function and disease.",
                url: "https://www.4dnucleome.org/",
            },
        ],
    },
];

export default function ResourcesPage() {
    return (
        <>
            {/* HERO */}
            <div className={styles.hero}>
                <Container className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>Resources</h1>
                    <p className={styles.heroSubtitle}>
                        Tools, databases, and reading material to deepen your understanding of genome organization.
                    </p>
                </Container>
            </div>

            {/* FEATURED VIDEO */}
            <div className={styles.videoSection}>
                <Container>
                    <p className={styles.sectionLabel}>Featured</p>
                    <h2 className={styles.sectionHeading}>Imaging the 3D Genome</h2>
                    <p className={styles.sectionIntro}>
                        A primer on how modern imaging and sequencing techniques are used to study
                        the three-dimensional organization of chromosomes inside the nucleus.
                    </p>
                    <div className={styles.videoWrapper}>
                        <iframe
                            src="https://www.youtube.com/embed/1bZ5T-J1dqU"
                            title="Imaging 3D Genome"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                            className={styles.video}
                        />
                    </div>
                </Container>
            </div>

            {/* RESOURCE CATEGORIES */}
            {categories.map((category, ci) => (
                <div key={ci} className={styles.categorySection}>
                    <Container>
                        <h3 className={styles.categoryHeading}>{category.heading}</h3>
                        <Row className="gy-4">
                            {category.resources.map((resource, ri) => (
                                <Col key={ri} xs="12" md="6" lg="4">
                                    <div className={styles.resourceCard}>
                                        <span className={styles.resourceTag}>{resource.tag}</span>
                                        <h4 className={styles.resourceName}>{resource.name}</h4>
                                        <p className={styles.resourceDescription}>{resource.description}</p>
                                        <a
                                            href={resource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.resourceLink}
                                        >
                                            Visit &rarr;
                                        </a>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </Container>
                </div>
            ))}
        </>
    );
}
