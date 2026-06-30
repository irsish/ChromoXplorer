import { Container, Row, Col } from "reactstrap";
import styles from "./Footer.module.css";
import logo from "../../assets/images/logo.png";
import { useNavigate } from "react-router-dom";

export default function Footer() {
    const navigate = useNavigate();

    return (
        <footer className={styles.footer}>
            <Container>
                <Row className="gy-4 align-items-start">

                    {/* Logo Section */}
                    <Col xs="12" md="3" className="text-center text-md-start">
                        <img src={logo} alt="ChromoXplorer Logo" className={styles.footerLogo} />
                    </Col>

                    {/* Product */}
                    <Col xs="12" sm="4" md="3" className={styles.footerCol}>
                        <div className={styles.footerTitle}>Product</div>
                        <div className={styles.footerLink} onClick={() => navigate("/explorer")}>Explorer</div>
                        <div className={styles.footerLink} onClick={() => navigate("/pricing")}>Pricing</div>
                        <div className={styles.footerLink} onClick={() => navigate("/resources")}>Resources</div>
                    </Col>

                    {/* Company */}
                    <Col xs="12" sm="4" md="3" className={styles.footerCol}>
                        <div className={styles.footerTitle}>Company</div>
                        <div className={styles.footerLink} onClick={() => navigate("/about")}>About Us</div>
                        <div className={styles.footerLink} onClick={() => navigate("/credits")}>Credits</div>
                    </Col>

                    {/* Support */}
                    <Col xs="12" sm="4" md="3" className={styles.footerCol}>
                        <div className={styles.footerTitle}>Support</div>
                        <div className={styles.footerLink} onClick={() => navigate("/faq")}>FAQ</div>
                        <div className={styles.footerLink} onClick={() => navigate("/support")}>Contact Support</div>
                        <div className={styles.footerLink} onClick={() => navigate("/terms")}>Terms of Service</div>
                        <div className={styles.footerLink} onClick={() => navigate("/privacy")}>Privacy Policy</div>
                    </Col>

                </Row>

                {/* Bottom Bar */}
                <div className={styles.bottomBar}>
                    © {new Date().getFullYear()} Chromonauts — All Rights Reserved.
                </div>
            </Container>
        </footer>
    );
}
