import styles from "./SupportPage.module.css";
import { Container, Row, Col } from "reactstrap";
import { useState } from "react";
import { SUPPORT_EMAIL } from "../utils/config/supportEmail.js";

export default function SupportPage() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const body = `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`;
        const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoUrl;
        setSubmitted(true);
    };

    const isValid = form.name.trim() && form.email.trim() && form.subject.trim() && form.message.trim();

    return (
        <>
            {/* HERO */}
            <div className={styles.hero}>
                <Container className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>Support</h1>
                    <p className={styles.heroSubtitle}>
                        We aim to respond to all inquiries within 48 hours.
                    </p>
                </Container>
            </div>

            {/* CONTACT FORM */}
            <div className={styles.formSection}>
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={7}>
                            <p className={styles.sectionLabel}>Get in Touch</p>
                            <h2 className={styles.sectionHeading}>Send us a message</h2>
                            <p className={styles.sectionIntro}>
                                Fill out the form below and your default email client will open
                                with everything pre-filled, ready to send.
                            </p>

                            {submitted ? (
                                <div className={styles.successBox}>
                                    <p className={styles.successText}>
                                        Your email client should have opened. If it didn't,
                                        email us directly at{" "}
                                        <a href={`mailto:${SUPPORT_EMAIL}`} className={styles.emailLink}>
                                            {SUPPORT_EMAIL}
                                        </a>.
                                    </p>
                                    <button
                                        className={styles.resetButton}
                                        onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                                    >
                                        Send another message
                                    </button>
                                </div>
                            ) : (
                                <form className={styles.form} onSubmit={handleSubmit} noValidate>
                                    <Row className="gy-3">
                                        <Col xs={12} md={6}>
                                            <label className={styles.label} htmlFor="name">Your Name</label>
                                            <input
                                                id="name"
                                                name="name"
                                                type="text"
                                                className={styles.input}
                                                placeholder="Jane Smith"
                                                value={form.name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Col>
                                        <Col xs={12} md={6}>
                                            <label className={styles.label} htmlFor="email">Your Email</label>
                                            <input
                                                id="email"
                                                name="email"
                                                type="email"
                                                className={styles.input}
                                                placeholder="jane@university.edu"
                                                value={form.email}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Col>
                                        <Col xs={12}>
                                            <label className={styles.label} htmlFor="subject">Subject</label>
                                            <select
                                                id="subject"
                                                name="subject"
                                                className={styles.input}
                                                value={form.subject}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="" disabled>Select a topic…</option>
                                                <option value="General Inquiry">General Inquiry</option>
                                                <option value="Bug Report">Bug Report</option>
                                                <option value="Researcher Account Request">Researcher Account Request</option>
                                                <option value="Data / File Format Question">Data / File Format Question</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </Col>
                                        <Col xs={12}>
                                            <label className={styles.label} htmlFor="message">Message</label>
                                            <textarea
                                                id="message"
                                                name="message"
                                                className={styles.textarea}
                                                placeholder="Describe your issue or question in as much detail as possible…"
                                                rows={6}
                                                value={form.message}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Col>
                                        <Col xs={12}>
                                            <button
                                                type="submit"
                                                className={styles.submitButton}
                                                disabled={!isValid}
                                            >
                                                Open Email Client →
                                            </button>
                                        </Col>
                                    </Row>
                                </form>
                            )}
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* FALLBACK EMAIL */}
            <div className={styles.fallbackSection}>
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={7}>
                            <div className={styles.fallbackCard}>
                                <p className={styles.fallbackLabel}>Prefer to email directly?</p>
                                <p className={styles.fallbackText}>
                                    If the form above doesn't work or your email client isn't set up,
                                    you can reach us directly at:
                                </p>
                                <a href={`mailto:${SUPPORT_EMAIL}`} className={styles.fallbackEmail}>
                                    {SUPPORT_EMAIL}
                                </a>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}
