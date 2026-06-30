import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/theme.css";
import App from './App.jsx'
import { AuthProvider } from "react-oidc-context";
import { HelmetProvider } from "react-helmet-async";


const cognitoAuthConfig = {
  authority: import.meta.env.VITE_COGNITO_AUTHORITY,
  client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
  redirect_uri: `${window.location.origin}/auth/callback`,
  post_logout_redirect_uri: window.location.origin,
  response_type: "code",
  scope: "email openid phone",
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <AuthProvider {...cognitoAuthConfig}>
        <App />
      </AuthProvider>
    </HelmetProvider>

  </StrictMode>,
)
