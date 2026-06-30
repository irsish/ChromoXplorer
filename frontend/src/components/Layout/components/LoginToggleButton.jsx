import React from "react";
import { Button } from "reactstrap";
import styles from "./LoginToggleButton.module.css";
import { useAuth } from "react-oidc-context";
import { login, logout } from "../../../utils/authentication/authHelper";

export default function LoginToggleButton() {
  
  const auth = useAuth();
  
  const handleLogout = () => {
    logout(auth);
  };

  const handleLogin = () => {
    login(auth);
  };
  
  if (auth.isLoading) {
    return (
      <Button
        className={styles.purpleButton}
        disabled
      >
        Loading...
      </Button>
    );
  }
  
  if (auth.isAuthenticated) {
    return (
      <Button
        className={styles.purpleButton}
        onClick={handleLogout}
      >
        Logout
      </Button>
    );
  }

  return (
    <Button
      className={styles.purpleButton}
      onClick={handleLogin}
    >
      Login
    </Button>
  );
}