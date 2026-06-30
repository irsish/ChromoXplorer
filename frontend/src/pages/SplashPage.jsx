import styles from "./SplashPage.module.css";
import { Container, Row, Col } from "reactstrap";
import { useNavigate } from "react-router-dom";

export default function SplashPage() {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Explore the 3D Genome",
      body: "Navigate chromosome territories, A/B compartments, and TAD structures in a browser-based 3D genome visualization workflow built for research and teaching.",
      buttonLabel: "Learn More",
      onClick: () => navigate("/about"),
      image: "/images/splash_cards/card1_3d_genome.jpg",
      imageAlt: "3D rendered DNA double helix — photo by Shubham Dhage on Unsplash",
    },
    {
      title: "Study Chromatin Structure",
      body: "Move from high-level genome architecture to compartments, TADs, and gene-level detail to understand how chromatin structure shapes regulation.",
      buttonLabel: "Browse Resources",
      onClick: () => navigate("/resources"),
      image: "/images/splash_cards/card2_chromatin_structure.jpg",
      imageAlt: "Colorful embroidery threads arranged by color code — photo by Nowbelov on Unsplash",
    },
    {
      title: "Launch the 3D Genome Viewer",
      body: "Open the interactive genome viewer to inspect modeled chromosome structures, explore public datasets, and test the browser-based visualization workflow.",
      buttonLabel: "Get Started",
      onClick: () => navigate("/explorer"),
      image: "/images/splash_cards/chromonaut_takeoff.png",
      imageAlt: "AI-generated illustration of a Chromonaut riding a rocket through space surrounded by DNA helices and chromosomes — created with Google Gemini",
    },
  ];

  return (
    <>
      <div className={styles.hero}>
        <Container className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Chromo<wbr />Xplorer
          </h1>
          <h3 className={styles.heroSubtitle}>
            3D genome visualization for chromosome territories, chromatin
            structure, and Hi-C-driven genome architecture.
          </h3>
          <p className={styles.heroDescription}>
            ChromoXplorer is a browser-based 3D genome viewer for exploring
            chromosome territories, A/B compartments, topologically associating
            domains, and gene loci from modeled genomic structure data.
          </p>
          <div className={styles.heroActions}>
            <button
              className={styles.heroButtonPrimary}
              onClick={() => navigate("/explorer")}
            >
              Open Explorer
            </button>
            <button
              className={styles.heroButtonSecondary}
              onClick={() => navigate("/about")}
            >
              How It Works
            </button>
          </div>
        </Container>
      </div>

      <div className={styles.cardSection}>
        <Container>
          <Row className="justify-content-center mb-5">
            <Col lg="9">
              <div className={styles.introBlock}>
                <h2 className={styles.introHeading}>
                  Explore genome architecture in a real 3D web app
                </h2>
                <p className={styles.introText}>
                  Traditional genome browsers and Hi-C contact maps are
                  powerful, but they flatten three-dimensional biology into
                  two-dimensional views. ChromoXplorer helps researchers and
                  students inspect chromatin organization directly in 3D,
                  connecting whole-genome structure to compartments, TADs, and
                  individual genes.
                </p>
              </div>
            </Col>
          </Row>
          <Row className="gy-4 justify-content-center align-items-stretch">
            {cards.map((card, index) => (
              <Col key={index} xs="12" sm="6" md="4">
                <div className={styles.card}>
                  <img
                    src={card.image}
                    alt={card.imageAlt}
                    className={styles.cardImage}
                  />
                  <div className={styles.cardBody}>
                    <h4 className={styles.cardTitle}>{card.title}</h4>
                    <p className={styles.cardText}>{card.body}</p>
                  </div>
                  <div className={styles.cardFooter}>
                    <button
                      className={styles.cardButton}
                      onClick={card.onClick}
                    >
                      {card.buttonLabel}
                    </button>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </div>
    </>
  );
}
