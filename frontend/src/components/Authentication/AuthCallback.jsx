// this component controls database actions after user returns from aws authentication
import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
    console.log("AuthCallback route reached");
    const auth = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const API_BASE_URI = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

    useEffect(() => {
        const handleAuthCallback = async () => {
            if (isProcessing) return;

            if (auth.isAuthenticated && auth.user) {
                setIsProcessing(true);
                console.log("AuthCallback: User is authenticated.");

                try {
                    const userData = {
                        sub: auth.user.profile.sub,
                        "cognito:groups": auth.user.profile["cognito:groups"] || [],
                        email: auth.user.profile.email
                    };

                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);

                    const response = await fetch(`${API_BASE_URI}/users`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${auth.user.access_token}`,
                        },
                        body: JSON.stringify(userData),
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    if (response.ok || response.status === 409) {
                        console.log("User synced successfully");

                        // 🔥 NEW: Fetch user profile
                        const profileResponse = await fetch(`${API_BASE_URI}/users/${userData.sub}`, {
                            headers: { 'Authorization': `Bearer ${auth.user.access_token}` },
                        });

                        if (profileResponse.ok) {
                            const userProfile = await profileResponse.json();

                            console.log("User profile:", userProfile);

                            const groups = userData["cognito:groups"] || [];
                            const isAdmin = groups.map(g => g.toLowerCase()).includes("admin");

                            if (isAdmin || userProfile.profileCompleted) {
                                console.log("➡ Admin or returning user → go to explorer");
                                navigate("/explorer");
                            } else {
                                console.log("➡ First-time user → go to profile completion");
                                navigate("/complete-profile");
                            }
                        } else {
                            console.error("Failed to fetch user profile");
                            navigate("/explorer"); // fallback
                        }

                    } else {
                        console.error('Failed to sync user data:', response.status);
                        setError('Failed to connect to server. Please try again later.');
                        await auth.signoutSilent();
                    }

                } catch (error) {
                    if (error.name === 'AbortError') {
                        console.error('Request timed out');
                        setError('Server connection timed out.');
                    } else {
                        console.error('Error syncing user:', error);
                        setError('Unable to connect to server.');
                    }

                    try {
                        await auth.signoutSilent();
                    } catch (signoutError) {
                        console.error('Error signing out:', signoutError);
                    }

                } finally {
                    setIsProcessing(false);
                }
            }
        };

        handleAuthCallback();
    }, [auth.isAuthenticated, auth.user]);

    return (
        <>
            <div style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                gap: "20px"
            }}>
                {error ? (
                    <>
                        <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>
                        <button onClick={() => navigate('/')}>
                            Return to Home
                        </button>
                    </>
                ) : (
                    <p>Completing sign in...</p>
                )}
            </div>
        </>
    );
}
