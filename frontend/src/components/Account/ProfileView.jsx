import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Button, Form, FormGroup, Input, Label } from "reactstrap";
import styles from "./AccountForms.module.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export default function ProfileView() {
    const auth = useAuth();
    const user = auth.user?.profile;
    const sub = user?.sub;
    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState({
        city: "",
        region: "",
        country: "",
        reason: "",
        optOut: false,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // cognito profile fields
    const email = user?.email || "N/A";

    useEffect(() => {
        if (!sub) {
            setLoading(false);
            setProfile(null);
            return;
        }

        let ignore = false;

        async function loadProfile() {
            setLoading(true);
            setError("");

            try {
                const token = auth.user?.access_token;
                const response = await fetch(`${API_BASE_URL}/users/${sub}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!response.ok) {
                    throw new Error(`Failed to load profile (${response.status})`);
                }

                const data = await response.json();
                if (ignore) return;

                setProfile(data);
                setFormData({
                    city: data.location?.city || "",
                    region: data.location?.region || "",
                    country: data.location?.country || "",
                    reason: data.useCaseReason || "",
                    optOut: Boolean(data.optionalDataOptOut),
                });
            } catch (fetchError) {
                if (ignore) return;
                console.error("Failed to load profile:", fetchError);
                setError("We couldn't load your saved profile details.");
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        loadProfile();

        return () => {
            ignore = true;
        };
    }, [sub]);

    function handleChange(event) {
        const { name, value, type, checked } = event.target;

        setFormData((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value,
        }));

        setSuccessMessage("");
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (!sub) {
            setError("You must be logged in to update your profile.");
            return;
        }

        setSaving(true);
        setError("");
        setSuccessMessage("");

        try {
            const token = auth.user?.access_token;
            const response = await fetch(`${API_BASE_URL}/users/${sub}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error(`Failed to save profile (${response.status})`);
            }

            const updatedProfile = await response.json();
            setProfile(updatedProfile);
            setFormData({
                city: updatedProfile.location?.city || "",
                region: updatedProfile.location?.region || "",
                country: updatedProfile.location?.country || "",
                reason: updatedProfile.useCaseReason || "",
                optOut: Boolean(updatedProfile.optionalDataOptOut),
            });
            setSuccessMessage("Your profile details were updated.");
        } catch (saveError) {
            console.error("Failed to save profile:", saveError);
            setError("We couldn't save your changes. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className={styles.form}>
            <h2 className={styles.sectionTitle}>Profile Information</h2>
            <p className={styles.infoText}>
                Your sign-in details stay in AWS, but you can manage your saved ChromoXplorer profile details here.
            </p>

            <FormGroup>
                <Label className={styles.label}>Email</Label>
                <div className={styles.displayField}>{email}</div>
            </FormGroup>

            <div className={styles.profileCard}>
                <div className={styles.profileCardHeader}>
                    <h3 className={styles.profileCardTitle}>Saved ChromoXplorer Profile</h3>
                    <p className={styles.infoText}>
                        Update the optional details your team uses for onboarding and account context.
                    </p>
                </div>

                {loading ? (
                    <div className={styles.displayField}>Loading your saved profile...</div>
                ) : (
                    <Form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formRow}>
                            <FormGroup className={styles.fieldGroup}>
                                <Label className={styles.label} for="city">City</Label>
                                <Input
                                    id="city"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className={styles.input}
                                    placeholder="e.g. Philadelphia"
                                    disabled={saving || formData.optOut}
                                />
                            </FormGroup>

                            <FormGroup className={styles.fieldGroup}>
                                <Label className={styles.label} for="region">State / Region</Label>
                                <Input
                                    id="region"
                                    name="region"
                                    value={formData.region}
                                    onChange={handleChange}
                                    className={styles.input}
                                    placeholder="e.g. Pennsylvania"
                                    disabled={saving || formData.optOut}
                                />
                            </FormGroup>
                        </div>

                        <FormGroup>
                            <Label className={styles.label} for="country">Country</Label>
                            <Input
                                id="country"
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                className={styles.input}
                                placeholder="e.g. United States"
                                disabled={saving || formData.optOut}
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label className={styles.label} for="reason">Use Case / Reason</Label>
                            <Input
                                id="reason"
                                type="textarea"
                                name="reason"
                                value={formData.reason}
                                onChange={handleChange}
                                className={`${styles.input} ${styles.textarea}`}
                                placeholder="Tell us how you use ChromoXplorer."
                                disabled={saving || formData.optOut}
                            />
                        </FormGroup>

                        <label className={styles.checkboxRow}>
                            <input
                                type="checkbox"
                                name="optOut"
                                checked={formData.optOut}
                                onChange={handleChange}
                                disabled={saving}
                            />
                            <span>I prefer not to share my location or use-case information</span>
                        </label>

                        {error &&<div className={styles.errorMessage}>{error}</div>}
                        {successMessage && <div className={styles.successMessage}>{successMessage}</div>}

                        <div className={styles.actionRow}>
                            <Button className={styles.purpleButton} disabled={saving}>
                                {saving ? "Saving..." : "Save Profile Changes"}
                            </Button>
                        </div>
                    </Form>
                )}
            </div>
        </div>
    );
}
