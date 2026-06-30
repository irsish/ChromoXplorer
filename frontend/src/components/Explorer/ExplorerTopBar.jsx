import { useState, useEffect } from "react"
import { Navbar, NavbarBrand, Button, Input } from "reactstrap"
import { useNavigate } from "react-router-dom"
import styles from "../../pages/ExplorerPage.module.css"
import localStyles from "./ExplorerTopBar.module.css"
import GeneSearch from "./GeneSearch"
import logo from "../../assets/images/logo.png"
import { useAuth } from "react-oidc-context"
import { login, logout, isAuthenticated, isLoading } from "../../utils/authentication/authHelper"
import { useExplorer } from "../../context/ExplorerContext"
import LocalUploadModal from "./LocalUploadModal"

const COOKIE_KEY         = "explorerViewPrefs"
const COOKIE_EXPIRY_DAYS = 30

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ""

function getPrefs() {
    const match = document.cookie.split("; ").find(r => r.startsWith(COOKIE_KEY + "="))
    if (!match) return null
    try {
        return JSON.parse(decodeURIComponent(match.split("=")[1]))
    } catch {
        return null
    }
}

function savePrefs(prefs) {
    const expires = new Date()
    expires.setDate(expires.getDate() + COOKIE_EXPIRY_DAYS)
    document.cookie = `${COOKIE_KEY}=${encodeURIComponent(JSON.stringify(prefs))}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
}

export function UploadCellIcon() {
    return (
        <svg
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
            style={{ width: "14px", height: "14px", flexShrink: 0 }}
        >
            <path
                d="M10 3v9m0-9L7 6m3-3l3 3"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M4 14v1.5A1.5 1.5 0 0 0 5.5 17h9a1.5 1.5 0 0 0 1.5-1.5V14"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

export default function ExplorerTopBar({
    showStarfield,
    setShowStarfield,
    showSphere,
    setShowSphere,
}) {
    const navigate = useNavigate()
    const auth     = useAuth()
    const [viewControlsOpen,  setViewControlsOpen]  = useState(false)
    const [uploadModalOpen,   setUploadModalOpen]   = useState(false)

    const {
        lightMode,
        setLightMode,
        selectedCell,
        setSelectedCell,
        levelLocked,
        setLevelLocked,
        isLocalMode,
        localCellName,
        setLocalCell,
        clearLocalCell,
    } = useExplorer()

    const [cells, setCells]               = useState([])
    const [cellsLoading, setCellsLoading] = useState(true)
    const [cellsError, setCellsError]     = useState(null)

    const handleLogin   = () => login(auth)
    const handleLogout  = () => logout(auth)
    const handleAccount = () => navigate("/account")

    useEffect(() => {
        let cancelled = false

        async function fetchCells() {
            setCellsLoading(true)
            setCellsError(null)
            try {
                const res = await fetch(`${API_BASE}/cells`)
                if (!res.ok) throw new Error(`Server returned ${res.status}`)
                const data = await res.json()
                if (!cancelled) setCells(data.cells ?? [])
            } catch (err) {
                console.error("Failed to fetch cells:", err)
                if (!cancelled) setCellsError("Could not load cell list.")
            } finally {
                if (!cancelled) setCellsLoading(false)
            }
        }

        fetchCells()
        return () => { cancelled = true }
    }, [])

    // Default to the first cell when the list loads, but only when not in local mode.
    useEffect(() => {
        if (cells.length > 0 && !selectedCell && !isLocalMode) {
            setSelectedCell(cells[0].cellName)
        }
    }, [cells])

    // Restore view preferences from cookie on login.
    useEffect(() => {
        if (!isAuthenticated(auth)) return
        const prefs = getPrefs()
        if (!prefs) return
        if (typeof prefs.showStarfield === "boolean") setShowStarfield(prefs.showStarfield)
        if (typeof prefs.showSphere    === "boolean") setShowSphere(prefs.showSphere)
        if (typeof prefs.lightMode     === "boolean") setLightMode(prefs.lightMode)
    }, [isAuthenticated(auth)])

    const handleStarfieldToggle = (e) => {
        const val = e.target.checked
        setShowStarfield(val)
        savePrefs({ showStarfield: val, showSphere, lightMode })
    }

    const handleSphereToggle = (e) => {
        const val = e.target.checked
        setShowSphere(val)
        savePrefs({ showStarfield, showSphere: val, lightMode })
    }

    const handleLightModeToggle = (e) => {
        const val = e.target.checked
        setLightMode(val)
        savePrefs({ showStarfield, showSphere, lightMode: val })
    }

    const handleLevelLockToggle = (e) => {
        setLevelLocked(e.target.checked)
    }

    // Called by LocalUploadModal once the zip passes validation.
    function handleLocalLoad(zip, cellName) {
        setLocalCell(zip, cellName)
        setUploadModalOpen(false)
    }

    function renderDropdownContent() {
        if (cellsLoading) return <option disabled>Loading cells...</option>
        if (cellsError)   return <option disabled>{cellsError}</option>
        return (
            <>
                <option value="">-- Select Cell Type --</option>
                {cells.map((cell) => (
                    <option key={cell._id ?? cell.cellName} value={cell.cellName}>
                        {cell.displayName ?? cell.cellName}
                    </option>
                ))}
            </>
        )
    }

    return (
        <>
            <Navbar className={styles.explorerTopBar} expand="md">
                <NavbarBrand
                    onClick={() => navigate("/")}
                    style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                    title="ChromoXplorer Home"
                >
                    <img src={logo} alt="logo" className={styles.topbarLogo} />
                </NavbarBrand>

                {/* ── Centre: upload button + cell selector + gene search ── */}
                <div className={styles.dropdownCenter}>
                    {isAuthenticated(auth) && (
                        <Button
                            className={`${styles.topbarButton} ${localStyles.uploadCellButton}`}
                            onClick={() => setUploadModalOpen(true)}
                            title="Upload your own data for preview"
                        >
                            <UploadCellIcon />
                            Upload
                        </Button>
                    )}

                    {isLocalMode ? (
                        <div className={localStyles.localModePill}>
                            <span className={localStyles.localModeLabel}>
                                {localCellName}
                            </span>
                            <button
                                type="button"
                                className={localStyles.clearLocalButton}
                                onClick={clearLocalCell}
                                title="Clear local cell and return to database cells"
                                aria-label="Clear local cell"
                            >
                                X
                            </button>
                        </div>
                    ) : (
                        <Input
                            type="select"
                            className={styles.topbarDropdown}
                            value={selectedCell}
                            onChange={(e) => setSelectedCell(e.target.value)}
                            disabled={cellsLoading || !!cellsError}
                        >
                            {renderDropdownContent()}
                        </Input>
                    )}

                    {isAuthenticated(auth) && <GeneSearch />}
                </div>

                {/* ── Right: view controls + auth ──────────────────────────── */}
            <div className={styles.topbarRight}>
                {isAuthenticated(auth) && (
                    <div style={{ position: "relative" }}>
                        <Button
                            className={styles.topbarButton}
                            onClick={() => setViewControlsOpen(o => !o)}
                            title="View controls for toggling display options"
                        >
                            View Controls ▾
                        </Button>

                        {viewControlsOpen && (
                            <div className={styles.viewControlsMenu}>
                                <div className={styles.viewControlsRow}>
                                    <span className={styles.viewControlsLabel}>Light Mode</span>
                                    <label className={styles.toggleSwitch}>
                                        <input type="checkbox" checked={lightMode} onChange={handleLightModeToggle} />
                                        <span className={styles.toggleSlider} />
                                    </label>
                                </div>
                                <div className={styles.viewControlsDivider} />
                                <div className={styles.viewControlsRow}>
                                    <span className={styles.viewControlsLabel}>Show Starfield</span>
                                    <label className={styles.toggleSwitch}>
                                        <input type="checkbox" checked={showStarfield} onChange={handleStarfieldToggle} />
                                        <span className={styles.toggleSlider} />
                                    </label>
                                </div>
                                <div className={styles.viewControlsDivider} />
                                <div className={styles.viewControlsRow}>
                                    <span className={styles.viewControlsLabel}>Show Sphere</span>
                                    <label className={styles.toggleSwitch}>
                                        <input type="checkbox" checked={showSphere} onChange={handleSphereToggle} />
                                        <span className={styles.toggleSlider} />
                                    </label>
                                </div>
                                <div className={styles.viewControlsDivider} />
                                <div className={styles.viewControlsRow}>
                                    <span className={styles.viewControlsLabel}>Lock Level</span>
                                    <label className={styles.toggleSwitch}>
                                        <input type="checkbox" checked={levelLocked} onChange={handleLevelLockToggle} />
                                        <span className={styles.toggleSlider} />
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/*this clutters the nav */}
                {/* <Button className={styles.topbarButton} onClick={() => navigate(-1)}>
                    Go Back
                </Button> */}

                {isLoading(auth) ? (
                    <Button className={styles.topbarButton} disabled>Loading...</Button>
                ) : isAuthenticated(auth) ? (
                    <>
                        <Button className={styles.topbarButton} onClick={handleAccount}>Account</Button>
                        <Button className={styles.topbarButton} onClick={handleLogout}>Logout</Button>
                    </>
                ) : (
                    <Button className={styles.topbarButton} onClick={handleLogin}>Login</Button>
                )}
            </div>
            </Navbar>

            {uploadModalOpen && (
                <LocalUploadModal
                    onLoad={handleLocalLoad}
                    onClose={() => setUploadModalOpen(false)}
                />
            )}
        </>
    )
}
