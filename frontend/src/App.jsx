import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Layout/NavBar.jsx";
import Footer from "./components/Layout/Footer.jsx";
import SplashPage from "./pages/SplashPage.jsx";
import ExplorerPage from "./pages/ExplorerPage.jsx";
import AccountPage from "./pages/AccountPage.jsx";
import ManageCellsPage from "./pages/ManageCellsPage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import ResourcesPage from "./pages/ResourcesPage.jsx";
import PricingPage from "./pages/PricingPage.jsx";
import FAQPage from "./pages/FAQPage.jsx";
import SupportPage from "./pages/SupportPage.jsx";
import TOSPage from "./pages/TOSPage.jsx";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage.jsx";
import AuthCallback from "./components/Authentication/AuthCallback.jsx";
import AppStarfield from "./components/Background/AppStarfield.jsx";
import RouteMetadata from "./components/SEO/RouteMetadata.jsx";
import CreditsPage from "./pages/CreditsPage.jsx";
import styles from "./App.module.css";

// Added on it on March 26, 2026 by YKIEN
import ProfileCompletion from "./pages/ProfileCompletion.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";



export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const location = useLocation();
  const isExplorerRoute = location.pathname.startsWith("/explorer");

  const shouldShowNavbar = !isExplorerRoute && location.pathname !== "/auth/callback";
  const shouldShowFooter = !isExplorerRoute && location.pathname !== "/auth/callback";

  console.log("CURRENT ROUTE:", location.pathname);

  return (
    <div className={styles.appWrapper}>
      {/* Full-page background image layers — fixed so they cover
          the entire viewport regardless of page height */}
      {!isExplorerRoute && <AppStarfield />}

      {/* All real content sits above the background */}
      <div className={styles.appContent}>
        <RouteMetadata />
        {shouldShowNavbar && <Navbar />}

        <div className={styles.routeContainer}>
          <Routes>

            <Route path="/" element={<SplashPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/terms" element={<TOSPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/explorer" element={<ExplorerPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/account/admin/cells" element={<ManageCellsPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/complete-profile" element={<ProfileCompletion />} />
            <Route path="/credits" element={<CreditsPage />} />
            <Route path="*" element={<NotFoundPage />} />

          </Routes>
        </div>

        {shouldShowFooter && <Footer />}
      </div>
    </div>
  );
}
