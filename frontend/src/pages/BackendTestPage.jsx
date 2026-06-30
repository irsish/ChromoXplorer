import { useState } from "react";

export default function BackendTestPage() {
    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const testAPI = async () => {
        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            console.log("Testing API...");

            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/db-test`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await res.json();
            setResponse(data);

            if (!res.ok) {
                setError(`API returned status ${res.status}`);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
            <h1>Backend API Test</h1>

            <button
                onClick={testAPI}
                disabled={loading}
                style={{
                    padding: "10px 20px",
                    fontSize: "16px",
                    cursor: loading ? "wait" : "pointer"
                }}
            >
                {loading ? "Testing..." : "Test API Call"}
            </button>

            {error && (
                <div style={{
                    marginTop: "20px",
                    padding: "10px",
                    background: "#ffebee",
                    color: "#c62828",
                    borderRadius: "5px"
                }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {response && (
                <div style={{ marginTop: "20px" }}>
                    <h2>API Response:</h2>
                    <pre style={{
                        background: "#e8f5e9",
                        padding: "10px",
                        borderRadius: "5px",
                        overflow: "auto"
                    }}>
                        {JSON.stringify(response, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}