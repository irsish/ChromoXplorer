import { Button } from "reactstrap";
import styles from "./AccountForms.module.css";
import { authConfig } from "../../utils/authentication/authHelper";

export default function SecurityView() {
    const handleChangePassword = () => {
        // Redirect to Cognito's hosted UI for password change
        const callbackUri = `${window.location.origin}/auth/callback`
        const changePasswordUrl = `${authConfig.cognitoDomain}/forgotPassword?client_id=${authConfig.clientId}&response_type=code&redirect_uri=${encodeURIComponent(callbackUri)}`;
        window.location.href = changePasswordUrl;
    };

    return (
        <div className={styles.form}>
            <h2 className={styles.sectionTitle}>Security Settings</h2>

            <div className={styles.securitySection}>
                <h3>Password</h3>
                <p className={styles.infoText}>
                    Your password is managed securely by AWS.
                    Click the button below to change your password through the secure authentication portal.
                </p>
                <Button
                    className={styles.purpleButton}
                    onClick={handleChangePassword}
                >
                    Change Password
                </Button>
            </div>

            <div className={styles.securitySection} style={{ marginTop: "2rem" }}>
                <h3>Multi-Factor Authentication</h3>
                <p className={styles.infoText}>
                    Multi-factor authentication settings are managed in AWS.
                    Contact your administrator to arrange MFA modifications.
                </p>
            </div>
        </div>
    );
}