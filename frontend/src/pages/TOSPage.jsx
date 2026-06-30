import styles from "./TOSPage.module.css";
import { Container, Row, Col } from "reactstrap";
import { SUPPORT_EMAIL as CONTACT_EMAIL } from "../utils/config/supportEmail.js";

const EFFECTIVE_DATE = "March 15, 2026";

const sections = [
    {
        title: "1. Acceptance of Terms",
        content: `By accessing or using ChromoXplorer (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service. These Terms apply to all visitors, users, and Researcher account holders.`,
    },
    {
        title: "2. Description of the Service",
        content: `ChromoXplorer is a web-based platform for the three-dimensional visualization of chromosome structures. The Service allows users to explore pre-loaded genomic datasets and, for Researcher account holders, to upload and render their own PDB files within a browser session. ChromoXplorer is developed and maintained by the Chromonauts team at Temple University as an academic research project.`,
    },
    {
        title: "3. User Accounts",
        content: `Some features of the Service require a Researcher account. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to provide accurate information when creating an account and to notify us promptly of any unauthorized use. We reserve the right to suspend or terminate accounts that violate these Terms.`,
    },
    {
        title: "4. Acceptable Use",
        content: `You agree to use the Service only for lawful purposes and in accordance with these Terms. You may not: (a) use the Service for any commercial purpose without prior written consent; (b) attempt to gain unauthorized access to any part of the Service or its underlying systems; (c) introduce malicious code, scripts, or files; (d) use the Service in any way that could damage, disable, or impair its availability; or (e) misrepresent your identity or affiliation when using the Service.`,
    },
    {
        title: "5. Uploaded Data",
        content: `Researcher account holders may upload PDB files to the Service for visualization. Uploaded files are processed entirely within your browser session and are never transmitted to or stored on our servers. You retain full ownership of any data you upload. By uploading data, you represent that you have the legal right to use and share that data and that doing so does not infringe any third-party rights. We are not responsible for the accuracy, completeness, or legality of any data you upload.`,
    },
    {
        title: "6. Intellectual Property",
        content: `All content, software, and materials provided as part of the Service — including but not limited to the ChromoXplorer interface, pre-loaded datasets, and documentation — are owned by or licensed to the Chromonauts team and are protected by applicable intellectual property laws. You may not copy, reproduce, distribute, or create derivative works from any part of the Service without our express written permission. Public datasets available through the Service remain subject to their original licenses and terms of use.`,
    },
    {
        title: "7. Privacy",
        content: `Your use of the Service is also governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review the Privacy Policy to understand our practices regarding the collection and use of information.`,
    },
    {
        title: "8. Disclaimer of Warranties",
        content: `The Service is provided on an "as is" and "as available" basis without warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the Service will be uninterrupted, error-free, or free of harmful components. Genomic visualizations are generated from third-party and user-provided data; we make no representation as to their scientific accuracy or completeness.`,
    },
    {
        title: "9. Limitation of Liability",
        content: `To the fullest extent permitted by law, the Chromonauts team and Temple University shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of or inability to use the Service, even if we have been advised of the possibility of such damages. Our total liability for any claim arising from these Terms or the Service shall not exceed the amount you paid, if any, for access to the Service in the twelve months preceding the claim.`,
    },
    {
        title: "10. Changes to These Terms",
        content: `We reserve the right to modify these Terms at any time. When we make changes, we will update the effective date at the top of this page. Your continued use of the Service after any changes constitutes your acceptance of the revised Terms. We encourage you to review these Terms periodically.`,
    },
    {
        title: "11. Governing Law",
        content: `These Terms are governed by and construed in accordance with the laws of the Commonwealth of Pennsylvania, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in Philadelphia, Pennsylvania.`,
    },
    {
        title: "12. Contact",
        content: `If you have questions or concerns about these Terms, please contact us at ${CONTACT_EMAIL}.`,
    },
];

export default function TOSPage() {
    return (
        <>
            {/* HERO */}
            <div className={styles.hero}>
                <Container className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>Terms of Service</h1>
                    <p className={styles.heroSubtitle}>
                        Please review the terms governing the use of this platform.
                    </p>
                </Container>
            </div>

            {/* EFFECTIVE DATE */}
            <div className={styles.metaSection}>
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <p className={styles.effectiveDate}>
                                Effective date: <strong>{EFFECTIVE_DATE}</strong>
                            </p>
                            <p className={styles.intro}>
                                These Terms of Service govern your access to and use of ChromoXplorer,
                                a 3D genome visualization platform developed by the Chromonauts team
                                at Temple University. By using the Service you agree to these terms in full.
                            </p>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* SECTIONS */}
            <div className={styles.contentSection}>
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            {sections.map((section, i) => (
                                <div key={i} className={styles.tosSection}>
                                    <h2 className={styles.sectionTitle}>{section.title}</h2>
                                    <p className={styles.sectionText}>{section.content}</p>
                                </div>
                            ))}
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}
