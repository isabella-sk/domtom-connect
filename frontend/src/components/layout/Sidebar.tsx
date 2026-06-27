import { useNavigate, useLocation } from "react-router-dom";
import {
  FileText,
  Lightbulb,
  AlertTriangle,
  MessageCircle,
  Map,
  User,
  Settings,
  Shield,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useMobile } from "../../hooks/useMobile";

interface SidebarLink {
  label: string;
  path: string;
  icon: LucideIcon;
}

export const Sidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMobile();

  // Sur mobile la sidebar est intégrée dans le menu burger de la Navbar
  if (isMobile) return null;

  const LINKS: SidebarLink[] = [
    { label: "Guides démarches", path: "/guides", icon: FileText },
    { label: "Tips & Témoignages", path: "/tips", icon: Lightbulb },
    { label: "Alertes arnaques", path: "/scams", icon: AlertTriangle },
    { label: "Chat", path: "/chat", icon: MessageCircle },
    { label: "Carte étudiants", path: "/map", icon: Map },
    { label: "Mon profil", path: `/profile/${user?.id}`, icon: User },
    { label: "Paramètres", path: "/settings", icon: Settings },
    ...(user?.isAdmin
      ? [{ label: "Administration", path: "/admin", icon: Shield }]
      : []),
  ];

  return (
    <aside
      aria-label="Navigation latérale"
      style={{
        width: 240,
        flexShrink: 0,
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      {LINKS.map((link) => {
        const active = location.pathname.startsWith(
          link.path.split("/").slice(0, 2).join("/"),
        );
        return (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            aria-current={active ? "page" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              borderRadius: 10,
              border: "none",
              background: active ? "rgba(255,255,255,0.15)" : "transparent",
              color: active ? "#fff" : "rgba(255,255,255,0.75)",
              fontSize: 14,
              fontWeight: active ? 600 : 400,
              textAlign: "left",
              cursor: "pointer",
              transition: "background 0.15s, color 0.15s",
              minHeight: 44,
            }}
            onMouseEnter={(e) => {
              if (!active)
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.background = "transparent";
            }}
          >
            <link.icon size={18} aria-hidden="true" />
            {link.label}
          </button>
        );
      })}
    </aside>
  );
};
