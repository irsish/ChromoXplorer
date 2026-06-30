import styles from "./PrivacyPolicyPage.module.css";
import { Container, Row, Col } from "reactstrap";
import { SUPPORT_EMAIL as CONTACT_EMAIL } from "../utils/config/supportEmail.js";

const EFFECTIVE_DATE = "March 15, 2026";

const sections = [
    {
        title: "1. Overview",
        content: `This Privacy Policy describes how ChromoXplorer ("we," "us," or "our") collects, uses, and handles information about you when you use the ChromoXplorer platform (the "Service"). ChromoXplorer is an academic research tool developed by the Chromonauts team at Temple University. We are committed to being transparent about our data practices and to collecting only what is necessary to operate the Service.`,
    },
    {
        title: "2. Information We Collect",
        content: `We collect information in the following ways:

Account Information: When you create a Researcher account, we collect your name, email address, and a hashed password. This information is used solely to authenticate you and manage your account.

Usage Data: We may collect anonymized, aggregated data about how the Service is used — such as which pre-loaded datasets are viewed most frequently — to help us improve the platform. This data is not linked to individual users.

Uploaded Files: Researcher account holders may upload PDB files for visualization. These files are processed entirely within your browser session using client-side rendering and are never transmitted to or stored on our servers.`,
    },
    {
        title: "3. Researcher Account Profile Data",
        content: `Upon their first login, Researcher account holders will be presented with an optional profile survey asking for: (a) their general location (country or institution), and (b) the primary purpose for which they are using ChromoXplorer (e.g., academic research, teaching, exploratory learning).

This information helps us understand our user base, report usage to funding and academic stakeholders, and prioritize platform improvements. Participation is opt-out: you will be prompted to provide this information by default, but you may decline at any time by dismissing the prompt. You may also update or remove this profile information at any time from your account settings.

This data, when provided, is stored in association with your account and is not shared with third parties. It is used only for internal reporting and product development purposes.`,
    },
    {
        title: "4. Cookies and Local Storage",
        content: `ChromoXplorer uses browser session storage and local storage to maintain your login state and preserve your visualization settings across page loads within a session. We do not use third-party tracking cookies or advertising cookies. Any data stored in your browser is limited to functional session data and is cleared when you log out or close your browser session.`,
    },
    {
        title: "5. How We Use Your Information",
        content: `We use the information we collect to: (a) provide, maintain, and improve the Service; (b) authenticate you and manage your account; (c) respond to your support inquiries; (d) understand aggregate usage patterns to guide platform development; and (e) fulfill our obligations to academic and institutional stakeholders through anonymized reporting. We do not sell, rent, or share your personal information with third parties for marketing purposes.`,
    },
    {
        title: "6. Data Retention",
        content: `We retain your account information for as long as your account is active. If you request deletion of your account, we will remove your personal data within 30 days, except where retention is required by law or legitimate academic record-keeping obligations. Anonymized usage data may be retained indefinitely as it cannot be linked back to any individual user.`,
    },
    {
        title: "7. Data Security",
        content: `We implement reasonable technical and organizational measures to protect your information against unauthorized access, alteration, disclosure, or destruction. Account passwords are stored using industry-standard hashing algorithms and are never stored in plain text. However, no method of transmission over the internet or electronic storage is completely secure, and we cannot guarantee absolute security.`,
    },
    {
        title: "8. Children's Privacy",
        content: `ChromoXplorer is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13 without parental consent, we will take steps to remove that information promptly.`,
    },
    {
        title: "9. Third-Party Links and Resources",
        content: `The Service may contain links to third-party websites, databases, or tools (such as UCSC Genome Browser or NCBI). This Privacy Policy does not apply to those external sites. We encourage you to review the privacy policies of any third-party services you visit through links on our platform.`,
    },
    {
        title: "10. Your Rights and Choices",
        content: `You have the right to access, correct, or delete the personal information we hold about you. To exercise these rights, contact us at the email address below. You may also opt out of Researcher profile data collection at any time through your account settings. If you are located in a jurisdiction with applicable data protection laws (such as the EU/EEA), you may have additional rights including the right to data portability and the right to lodge a complaint with a supervisory authority.`,
    },
    {
        title: "11. Changes to This Policy",
        content: `We may update this Privacy Policy from time to time. When we make changes, we will update the effective date at the top of this page. Your continued use of the Service after any changes constitutes your acceptance of the revised policy. We encourage you to review this policy periodically.`,
    },
    {
        title: "12. Contact",
        content: `If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us at ${CONTACT_EMAIL}.`,
    },
];

export default function PrivacyPolicyPage() {
    return (
        <>
            {/* HERO */}
            <div className={styles.hero}>
                <Container className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>Privacy Policy</h1>
                    <p className={styles.heroSubtitle}>
                        How your information is collected, used, and protected.
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
                                This Privacy Policy explains what information ChromoXplorer collects
                                about you, how we use it, and the choices you have. ChromoXplorer is
                                an academic research platform developed by the Chromonauts team at
                                Temple University.
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
                                <div key={i} className={styles.policySection}>
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
