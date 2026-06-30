import styles from "./AccountSidebar.module.css";
import { useAuth } from "react-oidc-context";
import { logout, isAdminUser } from "../../utils/authentication/authHelper";

export default function AccountSidebar({ activeTab, setActiveTab }) {
    const auth = useAuth();
    const user = auth.user?.profile;
    const isAdmin = isAdminUser(user);
    const handleLogout = () => {
        logout(auth);
    };

//loop to see all user properties

// console.log("Cognito user profile properties (auth.user?.profile):");
// for (const key in user) {
//     if (Object.hasOwnProperty.call(user, key)) {
//         console.log(`key: ${key}: value: ${user[key]}`);
//     }
// }

    return (
        <div className={styles.sidebar}>
            <div className={styles.userBox}>
                {/* <div className={styles.avatar}>{user.name[0]}</div>
                <div className={styles.userName}>{user.name}</div> */}
                <div className={styles.userEmail}>{user.email}</div>
            </div>

            <div
                className={`${styles.item} ${activeTab === "profile" ? styles.active : ""}`}
                onClick={() => setActiveTab("profile")}
            >
                Profile
            </div>

            <div
                className={`${styles.item} ${activeTab === "security" ? styles.active : ""}`}
                onClick={() => setActiveTab("security")}
            >
                Security
            </div>

            {isAdmin && (
                <div
                    className={`${styles.item} ${activeTab === "admin" ? styles.active : ""}`}
                    onClick={() => setActiveTab("admin")}
                >
                    Admin Settings
                </div>
            )}

            <div className={styles.itemLogout} onClick={handleLogout}>
                Logout
            </div>
        </div>
    );
}
