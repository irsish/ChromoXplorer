import styles from "./AccountPage.module.css";
import { useAuth } from "react-oidc-context";
import { useState } from "react";
import { isAuthenticated, isLoading } from "../utils/authentication/authHelper";
import AccountSidebar from "../components/Account/AccountSidebar";
import ProfileView from "../components/Account/ProfileView";
import SecurityView from "../components/Account/SecurityView";
import AdminView from "../components/Account/AdminView";

export default function AccountPage() {
    const auth = useAuth();
    const [activeTab, setActiveTab] = useState("profile");

    console.log("ACCOUNT PAGE LOADED");

    if (isLoading(auth)) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.loading}>Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated(auth)) {
        return (
            <div className={styles.notLoggedIn}>
                You must be logged in to view this page.
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            {/* LEFT SIDEBAR */}
            <AccountSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* MAIN CONTENT */}
            <div className={styles.content}>
                <h1 className={styles.header}>My Account</h1>
                {activeTab === "profile" && <ProfileView />}
                {activeTab === "security" && <SecurityView />}
                {activeTab === "admin" && <AdminView />}
            </div>
        </div>
    );
}
