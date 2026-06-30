import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import styles from "./ProfileCompletion.module.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const STEPS = [
  { number: 1, label: "Location" },
  { number: 2, label: "Purpose" },
];

export default function ProfileCompletion() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState("forward");

  // Redirect unauthenticated users away from this page
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      navigate("/");
    }
  }, [auth.isLoading, auth.isAuthenticated]);

  const [formData, setFormData] = useState({
    city: "",
    region: "",
    country: "",
    reason: "",
    optOut: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const goNext = () => {
    setDirection("forward");
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setDirection("back");
    setStep((s) => s - 1);
  };

  const sub = auth.user?.profile?.sub;

  const handleSubmit = async () => {
    try {
      const token = auth.user?.access_token;
      await fetch(`${API_BASE_URL}/users/${sub}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          city: formData.city,
          region: formData.region,
          country: formData.country,
          reason: formData.reason,
          optOut: formData.optOut,
        }),
      });
      navigate("/explorer");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSkip = async () => {
    try {
      const token = auth.user?.access_token;
      await fetch(`${API_BASE_URL}/users/${sub}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ optOut: true }),
      });
      navigate("/explorer");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.page}>
      {/* CENTERED CONTAINER */}
      <div className={styles.container}>

        {/* HEADER */}
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome to ChromoXplorer</h1>
          <p className={styles.subtitle}>
            Help us personalize your experience — just a few quick questions.
          </p>
        </div>

        {/* STEP INDICATOR */}
        <div className={styles.stepIndicator}>
          {STEPS.map((s, i) => (
            <div key={s.number} className={styles.stepItem}>
              <div
                className={`${styles.stepDot} ${
                  step === s.number
                    ? styles.stepDotActive
                    : step > s.number
                    ? styles.stepDotDone
                    : ""
                }`}
              >
                {step > s.number ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  s.number
                )}
              </div>
              <span
                className={`${styles.stepLabel} ${
                  step === s.number ? styles.stepLabelActive : ""
                }`}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={`${styles.stepConnector} ${
                    step > s.number ? styles.stepConnectorDone : ""
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* CARD */}
        <div className={`${styles.card} ${styles[`step${step}`]}`}>

          {/* STEP 1 — LOCATION */}
          {step === 1 && (
            <div className={`${styles.stepContent} ${direction === "forward" ? styles.slideIn : styles.slideInBack}`}>
              <div className={styles.stepHeader}>
                <span className={styles.stepTag}>Step 1 of 2</span>
                <h2 className={styles.stepTitle}>Where are you based?</h2>
                <p className={styles.stepDescription}>
                  This helps us understand our user community around the world.
                </p>
              </div>

              <div className={styles.fields}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>City</label>
                  <input
                    className={styles.input}
                    name="city"
                    placeholder="e.g. Philadelphia"
                    value={formData.city}
                    onChange={handleChange}
                    disabled={formData.optOut}
                  />
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>State / Region</label>
                    <input
                      className={styles.input}
                      name="region"
                      placeholder="e.g. Pennsylvania"
                      value={formData.region}
                      onChange={handleChange}
                      disabled={formData.optOut}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Country</label>
                    <input
                      className={styles.input}
                      name="country"
                      placeholder="e.g. United States"
                      value={formData.country}
                      onChange={handleChange}
                      disabled={formData.optOut}
                    />
                  </div>
                </div>

                <label className={styles.checkboxContainer}>
                  <input
                    type="checkbox"
                    name="optOut"
                    checked={formData.optOut}
                    onChange={handleChange}
                  />
                  <span>I prefer not to share my location</span>
                </label>
              </div>

              <div className={styles.actions}>
                <button className={styles.skipButton} onClick={handleSkip}>
                  Skip for now
                </button>
                <button className={styles.primaryButton} onClick={goNext}>
                  Next
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 — PURPOSE */}
          {step === 2 && (
            <div className={`${styles.stepContent} ${direction === "forward" ? styles.slideIn : styles.slideInBack}`}>
              <div className={styles.stepHeader}>
                <span className={styles.stepTag}>Step 2 of 2</span>
                <h2 className={styles.stepTitle}>What brings you here?</h2>
                <p className={styles.stepDescription}>
                  Tell us how you plan to use ChromoXplorer — research, education, or something else entirely.
                </p>
              </div>

              <div className={styles.fields}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Reason for use</label>
                  <textarea
                    className={styles.textarea}
                    name="reason"
                    placeholder="e.g. I'm a graduate student researching chromatin accessibility..."
                    value={formData.reason}
                    onChange={handleChange}
                    disabled={formData.optOut}
                    rows={4}
                  />
                </div>

                <label className={styles.checkboxContainer}>
                  <input
                    type="checkbox"
                    name="optOut"
                    checked={formData.optOut}
                    onChange={handleChange}
                  />
                  <span>I prefer not to share this information</span>
                </label>
              </div>

              <div className={styles.actions}>
                <button className={styles.backButton} onClick={goBack}>
                  Back
                </button>
                <button
                  className={styles.primaryButton}
                  onClick={formData.optOut ? handleSkip : handleSubmit}
                >
                  Get Started
                </button>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER NOTE */}
        <p className={styles.footerNote}>
          Your information is kept private and used only to improve ChromoXplorer.
        </p>

      </div>
    </div>
  );
}
