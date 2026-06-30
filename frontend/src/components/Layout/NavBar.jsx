import { Navbar, NavbarBrand, Nav, NavItem, NavLink, NavbarToggler, Collapse, Button } from "reactstrap";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import logo from "../../assets/images/logo.png";
import styles from "./NavBar.module.css";
import LoginToggleButton from "./components/LoginToggleButton.jsx";

export default function AppNavbar() {
    const navigate = useNavigate();
    const location = useLocation();

    const auth = useAuth();

    const [isOpen, setIsOpen] = useState(false);

    const navItems = [
        { label: "Home", path: "/" },
        { label: "About Us", path: "/about" },
        { label: "Resources", path: "/resources" },
        { label: "Pricing", path: "/pricing" },
    ];

    return (
        <Navbar expand="lg" className={styles.navbarContainer}>

            {/* BRAND / LOGO */}
            <NavbarBrand onClick={() => navigate("/")} className={styles.brand}>
                <img src={logo} alt="ChroMonauts Logo" className={styles.logo} />
                <span className={styles.brandName}>ChromoXplorer</span>
            </NavbarBrand>

            <NavbarToggler onClick={() => setIsOpen(!isOpen)} className={styles.toggler} />

            <Collapse isOpen={isOpen} navbar>

                {/* NAV LINKS — centered */}
                <Nav className={styles.navCenter} navbar>
                    {navItems.map((item) => (
                        <NavItem key={item.path}>
                            <NavLink
                                onClick={() => navigate(item.path)}
                                className={`${styles.navLink} ${
                                    location.pathname === item.path
                                        ? styles.activeNavLink
                                        : ""
                                }`}
                            >
                                {item.label}
                            </NavLink>
                        </NavItem>
                    ))}
                </Nav>

                {/* RIGHT SIDE BUTTONS */}
                <div className={styles.navActions}>
                    <Button
                        className={styles.actionButton}
                        onClick={() => navigate("/explorer")}
                    >
                        Go to Explorer
                    </Button>

                    <Button
                        className={styles.actionButton}
                        onClick={() => navigate("/account")}
                    >
                        Account
                    </Button>

                    <LoginToggleButton />
                </div>

            </Collapse>
            
        </Navbar>
    );
}
