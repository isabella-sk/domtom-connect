import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FileText,
  Lightbulb,
  AlertTriangle,
  MessageCircle,
  Map,
  User,
  Settings,
  Shield,
  X,
  Menu,
  Home,
  Info,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useMobile } from "../../hooks/useMobile";
import logoPng from "../../assets/logo.png";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/");
  };

  // Fermer le menu au changement de route - via setTimeout pour éviter setState synchrone dans effect
  useEffect(() => {
    const id = setTimeout(() => setMenuOpen(false), 0);
    return () => clearTimeout(id);
  }, [location.pathname]);

  // Fermer avec Échap
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Bloquer le scroll quand menu ouvert
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const linkStyle = {
    color: "rgba(255,255,255,0.85)",
    textDecoration: "none",
    fontSize: 16,
  };

  const SIDEBAR_LINKS = user
    ? [
        { label: "Tableau de bord", path: "/dashboard", icon: Home },
        { label: "Guides démarches", path: "/guides", icon: FileText },
        { label: "Tips & Témoignages", path: "/tips", icon: Lightbulb },
        { label: "Alertes arnaques", path: "/scams", icon: AlertTriangle },
        { label: "Chat", path: "/chat", icon: MessageCircle },
        { label: "Carte étudiants", path: "/map", icon: Map },
        { label: "Mon profil", path: `/profile/${user.id}`, icon: User },
        { label: "Paramètres", path: "/settings", icon: Settings },
        ...(user.isAdmin
          ? [{ label: "Administration", path: "/admin", icon: Shield }]
          : []),
      ]
    : [
        { label: "Accueil", path: "/", icon: Home },
        { label: "À propos", path: "/about", icon: Info },
      ];

  return (
    <>
      {/* Skip link RGAA */}
      <a
        href="#main-content"
        style={{
          position: "absolute",
          top: -100,
          left: 8,
          zIndex: 9999,
          background: "#fff",
          color: "#0a1d52",
          padding: "8px 16px",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
          transition: "top 0.2s",
        }}
        onFocus={(e) => {
          e.currentTarget.style.top = "8px";
        }}
        onBlur={(e) => {
          e.currentTarget.style.top = "-100px";
        }}
      >
        Aller au contenu principal
      </a>

      <nav
        role="navigation"
        aria-label="Navigation principale"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "0 16px" : "0 48px",
          height: 64,
          flexShrink: 0,
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          aria-label="DOM-TOM Connect  Retour à l'accueil"
          style={{ display: "flex", alignItems: "center", gap: 10 }}
        >
          <img
            src={logoPng}
            alt="DOM-TOM Connect"
            style={{ height: 36, width: "auto" }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </Link>

        {/* Desktop nav links */}
        {!isMobile && (
          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            <Link to="/" style={linkStyle}>
              Accueil
            </Link>
            <Link to="/about" style={linkStyle}>
              À propos
            </Link>
            {user && (
              <Link to="/dashboard" style={linkStyle}>
                Tableau de bord
              </Link>
            )}
            {user?.isAdmin && (
              <Link to="/admin" style={linkStyle}>
                Administration
              </Link>
            )}
          </div>
        )}

        {/* Desktop auth buttons */}
        {!isMobile && (
          <div style={{ display: "flex", gap: 12 }}>
            {user ? (
              <button
                onClick={handleLogout}
                style={{
                  padding: "8px 22px",
                  background: "transparent",
                  border: "1.5px solid rgba(255,255,255,0.65)",
                  color: "#fff",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 16,
                  fontWeight: 400,
                }}
              >
                Se déconnecter
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate("/register")}
                  style={{
                    padding: "8px 22px",
                    background: "transparent",
                    border: "1.5px solid rgba(255,255,255,0.65)",
                    color: "#fff",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 16,
                    fontWeight: 400,
                  }}
                >
                  S'inscrire
                </button>
                <button
                  onClick={() => navigate("/login")}
                  style={{
                    padding: "8px 22px",
                    background: "#0a1d52",
                    border: "1.5px solid #0a1d52",
                    color: "#fff",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 16,
                    fontWeight: 500,
                  }}
                >
                  Se connecter
                </button>
              </>
            )}
          </div>
        )}

        {/* Mobile burger button */}
        {isMobile && (
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Ouvrir le menu de navigation"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1.5px solid rgba(255,255,255,0.3)",
              borderRadius: 10,
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
            }}
          >
            <Menu size={22} aria-hidden="true" />
          </button>
        )}
      </nav>

      {/* Mobile overlay drawer */}
      {isMobile && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              zIndex: 998,
              opacity: menuOpen ? 1 : 0,
              pointerEvents: menuOpen ? "auto" : "none",
              transition: "opacity 0.25s",
            }}
          />

          {/* Drawer */}
          <div
            id="mobile-menu"
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navigation"
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "82vw",
              maxWidth: 320,
              background:
                "linear-gradient(160deg, #14539E 0%, #0a1d52 60%, #040e2e 100%)",
              zIndex: 999,
              transform: menuOpen ? "translateX(0)" : "translateX(100%)",
              transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              boxShadow: "-8px 0 32px rgba(0,0,0,0.35)",
            }}
          >
            {/* Header drawer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.12)",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 16,
                  letterSpacing: "-0.3px",
                }}
              >
                DOM-TOM Connect
              </span>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Fermer le menu"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  borderRadius: 8,
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#fff",
                }}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Nav links */}
            <nav
              aria-label="Navigation mobile"
              style={{ flex: 1, padding: "12px 12px 0" }}
            >
              {SIDEBAR_LINKS.map((link) => {
                const active = location.pathname.startsWith(
                  link.path.split("/").slice(0, 2).join("/"),
                );
                const Icon = link.icon;
                return (
                  <button
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    aria-current={active ? "page" : undefined}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: "none",
                      background: active
                        ? "rgba(255,255,255,0.15)"
                        : "transparent",
                      color: active ? "#fff" : "rgba(255,255,255,0.75)",
                      fontSize: 15,
                      fontWeight: active ? 600 : 400,
                      textAlign: "left",
                      cursor: "pointer",
                      marginBottom: 2,
                      minHeight: 48,
                    }}
                  >
                    <Icon size={19} aria-hidden="true" />
                    {link.label}
                  </button>
                );
              })}
            </nav>

            {/* Auth section */}
            <div
              style={{
                padding: "16px 20px 32px",
                borderTop: "1px solid rgba(255,255,255,0.12)",
                marginTop: 8,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {user ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 4,
                    }}
                  >
                    <div
                      aria-hidden="true"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 14,
                        fontWeight: 700,
                        flexShrink: 0,
                        overflow: "hidden",
                      }}
                    >
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        user.username?.[0]?.toUpperCase()
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          color: "#fff",
                          fontSize: 13,
                          fontWeight: 600,
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {user.username}
                      </p>
                      <p
                        style={{
                          color: "rgba(255,255,255,0.5)",
                          fontSize: 11,
                          margin: 0,
                        }}
                      >
                        {user.originTerritory}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: "100%",
                      padding: "11px 0",
                      background: "rgba(255,255,255,0.08)",
                      border: "1.5px solid rgba(255,255,255,0.25)",
                      borderRadius: 10,
                      color: "rgba(255,255,255,0.85)",
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Se déconnecter
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate("/register")}
                    style={{
                      width: "100%",
                      padding: "12px 0",
                      background: "#fff",
                      border: "none",
                      borderRadius: 10,
                      color: "#0a1d52",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    S'inscrire
                  </button>
                  <button
                    onClick={() => navigate("/login")}
                    style={{
                      width: "100%",
                      padding: "12px 0",
                      background: "rgba(255,255,255,0.1)",
                      border: "1.5px solid rgba(255,255,255,0.3)",
                      borderRadius: 10,
                      color: "#fff",
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Se connecter
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};
