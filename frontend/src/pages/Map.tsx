import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import { MapPin, Users } from "lucide-react";
import api from "../services/api";
import { Navbar } from "../components/layout/Navbar";
import { Sidebar } from "../components/layout/Sidebar";
import { Footer } from "../components/layout/Footer";
import { useMobile } from "../hooks/useMobile";
import friseSide from "../assets/frise_side.png";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapUser {
  id: string;
  username: string;
  avatarUrl?: string;
  originTerritory: string;
  currentCity?: string;
  latitude: number;
  longitude: number;
}

const TERRITORIES = [
  "Nouvelle-Calédonie",
  "Wallis-et-Futuna",
  "Polynésie française",
  "Martinique",
  "Guadeloupe",
  "Guyane",
  "La Réunion",
  "Mayotte",
];

export const Map = () => {
  const [users, setUsers] = useState<MapUser[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showList, setShowList] = useState(false);
  const navigate = useNavigate();
  const isMobile = useMobile();

  useEffect(() => {
    api
      .get("/users/map")
      .then((r) => setUsers(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter
    ? users.filter((u) => u.originTerritory === filter)
    : users;
  const countByTerritory = TERRITORIES.reduce<Record<string, number>>(
    (acc, t) => {
      acc[t] = users.filter((u) => u.originTerritory === t).length;
      return acc;
    },
    {},
  );

  return (
    <div className="font-sans min-h-screen flex flex-col">
      <div
        style={{
          flex: 1,
          background:
            "radial-gradient(ellipse 140% 120% at 50% 35%, #3ab5e6 0%, #14539E 40%, #0a1d52 80%)",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <img
          src={friseSide}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "30%",
            opacity: 0.2,
            pointerEvents: "none",
          }}
        />
        <Navbar />
        <div
          style={{ flex: 1, display: "flex", position: "relative", zIndex: 1 }}
        >
          <Sidebar />
          <main
            id="main-content"
            tabIndex={-1}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              padding: isMobile ? "16px 12px 20px" : "24px 32px 32px",
              gap: 16,
              minHeight: 0,
              minWidth: 0,
            }}
          >
            {/* En-tête */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <p
                  style={{
                    color: "rgba(255,255,255,0.75)",
                    fontSize: 14,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: 6,
                  }}
                >
                  Communauté
                </p>
                <h1
                  style={{
                    color: "#fff",
                    fontSize: isMobile ? 24 : "clamp(22px, 3vw, 32px)",
                    fontWeight: 800,
                    margin: 0,
                    letterSpacing: "-0.5px",
                  }}
                >
                  Carte des étudiants
                </h1>
                <p
                  style={{
                    color: "rgba(255,255,255,0.65)",
                    fontSize: 14,
                    marginTop: 6,
                  }}
                  aria-live="polite"
                >
                  {loading
                    ? "Chargement..."
                    : `${filtered.length} étudiant${filtered.length !== 1 ? "s" : ""} visible${filtered.length !== 1 ? "s" : ""} sur la carte`}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Users
                  size={16}
                  color="rgba(255,255,255,0.6)"
                  aria-hidden="true"
                />
                <label htmlFor="territory-filter" style={{ display: "none" }}>
                  Filtrer par territoire
                </label>
                <select
                  id="territory-filter"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  style={{
                    padding: "9px 14px",
                    borderRadius: 10,
                    border: "1.5px solid rgba(255,255,255,0.25)",
                    background: "rgba(255,255,255,0.1)",
                    color: "#fff",
                    fontSize: 13,
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option
                    value=""
                    style={{ color: "#0a1d52", background: "#fff" }}
                  >
                    Tous les territoires
                  </option>
                  {TERRITORIES.map((t) => (
                    <option
                      key={t}
                      value={t}
                      style={{ color: "#0a1d52", background: "#fff" }}
                    >
                      {t} ({countByTerritory[t] ?? 0})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filtres badges */}
            <div
              role="group"
              aria-label="Filtrer par territoire"
              style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
            >
              <button
                onClick={() => setFilter("")}
                aria-pressed={filter === ""}
                style={{
                  padding: "5px 14px",
                  borderRadius: 50,
                  fontSize: 12,
                  border:
                    filter === ""
                      ? "1.5px solid #fff"
                      : "1.5px solid rgba(255,255,255,0.2)",
                  background: filter === "" ? "#fff" : "transparent",
                  color: filter === "" ? "#0a1d52" : "rgba(255,255,255,0.75)",
                  fontWeight: filter === "" ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  minHeight: 32,
                }}
              >
                Tous ({users.length})
              </button>
              {TERRITORIES.filter((t) => (countByTerritory[t] ?? 0) > 0).map(
                (t) => (
                  <button
                    key={t}
                    onClick={() => setFilter(filter === t ? "" : t)}
                    aria-pressed={filter === t}
                    style={{
                      padding: "5px 14px",
                      borderRadius: 50,
                      fontSize: 12,
                      border:
                        filter === t
                          ? "1.5px solid #fff"
                          : "1.5px solid rgba(255,255,255,0.2)",
                      background: filter === t ? "#fff" : "transparent",
                      color:
                        filter === t ? "#0a1d52" : "rgba(255,255,255,0.75)",
                      fontWeight: filter === t ? 600 : 400,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      minHeight: 32,
                    }}
                  >
                    {t} ({countByTerritory[t]})
                  </button>
                ),
              )}
            </div>

            {/* Carte + panneau */}
            <div
              style={{
                flex: 1,
                display: "flex",
                gap: 16,
                minHeight: 0,
                minWidth: 0,
                flexDirection: isMobile ? "column" : "row",
              }}
            >
              {/* Carte */}
              <div
                style={{
                  flex: 1,
                  borderRadius: 16,
                  overflow: "hidden",
                  border: "1.5px solid rgba(255,255,255,0.15)",
                  boxShadow: "0 8px 32px rgba(10,29,82,0.25)",
                  minHeight: isMobile ? 320 : 480,
                }}
              >
                <MapContainer
                  center={[46.8, 2.3]}
                  zoom={isMobile ? 5 : 6}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="© OpenStreetMap contributors"
                  />
                  {filtered.map((user) => (
                    <Marker
                      key={user.id}
                      position={[user.latitude, user.longitude]}
                    >
                      <Popup minWidth={190}>
                        <div
                          style={{ padding: "6px 2px", fontFamily: "inherit" }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              marginBottom: 10,
                            }}
                          >
                            <div
                              style={{
                                width: 38,
                                height: 38,
                                borderRadius: "50%",
                                background:
                                  "linear-gradient(135deg, #3ab5e6, #14539E)",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 15,
                                fontWeight: 700,
                                flexShrink: 0,
                                overflow: "hidden",
                              }}
                              aria-hidden="true"
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
                                user.username[0].toUpperCase()
                              )}
                            </div>
                            <div>
                              <p
                                style={{
                                  margin: 0,
                                  fontWeight: 700,
                                  fontSize: 13,
                                  color: "#0a1d52",
                                }}
                              >
                                {user.username}
                              </p>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 11,
                                  color: "#888",
                                }}
                              >
                                🌏 {user.originTerritory}
                              </p>
                            </div>
                          </div>
                          {user.currentCity && (
                            <p
                              style={{
                                margin: "0 0 10px",
                                fontSize: 12,
                                color: "#666",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <MapPin size={12} aria-hidden="true" />{" "}
                              {user.currentCity}
                            </p>
                          )}
                          <button
                            onClick={() => navigate(`/profile/${user.id}`)}
                            style={{
                              width: "100%",
                              padding: "8px 0",
                              background:
                                "linear-gradient(135deg, #14539E, #0a1d52)",
                              color: "#fff",
                              border: "none",
                              borderRadius: 8,
                              fontSize: 12,
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            Voir le profil →
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>

              {/* Panneau liste — masqué sur mobile sauf si toggle */}
              {!isMobile && (
                <div
                  style={{
                    width: 240,
                    flexShrink: 0,
                    background: "rgba(255,255,255,0.07)",
                    backdropFilter: "blur(10px)",
                    borderRadius: 16,
                    border: "1.5px solid rgba(255,255,255,0.12)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "14px 16px",
                      borderBottom: "1px solid rgba(255,255,255,0.1)",
                      flexShrink: 0,
                    }}
                  >
                    <p
                      style={{
                        color: "#fff",
                        fontSize: 13,
                        fontWeight: 700,
                        margin: 0,
                      }}
                    >
                      {filter || "Tous les étudiants"}
                    </p>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.5)",
                        fontSize: 11,
                        margin: "2px 0 0",
                      }}
                    >
                      {filtered.length} visible
                      {filtered.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div style={{ flex: 1, overflowY: "auto" }}>
                    {loading ? (
                      <p
                        style={{
                          textAlign: "center",
                          color: "rgba(255,255,255,0.5)",
                          padding: 20,
                          fontSize: 13,
                        }}
                      >
                        Chargement...
                      </p>
                    ) : filtered.length === 0 ? (
                      <p
                        style={{
                          textAlign: "center",
                          color: "rgba(255,255,255,0.4)",
                          padding: 20,
                          fontSize: 13,
                        }}
                      >
                        Aucun étudiant visible.
                      </p>
                    ) : (
                      filtered.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => navigate(`/profile/${user.id}`)}
                          style={{
                            width: "100%",
                            padding: "11px 14px",
                            textAlign: "left",
                            border: "none",
                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                            background: "transparent",
                            cursor: "pointer",
                            transition: "background 0.15s",
                            minHeight: 52,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "rgba(255,255,255,0.08)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                background:
                                  "linear-gradient(135deg, #3ab5e6, #14539E)",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                                fontWeight: 700,
                                flexShrink: 0,
                                overflow: "hidden",
                              }}
                              aria-hidden="true"
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
                                user.username[0].toUpperCase()
                              )}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <p
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  margin: 0,
                                  color: "#fff",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {user.username}
                              </p>
                              <p
                                style={{
                                  fontSize: 10,
                                  color: "rgba(255,255,255,0.5)",
                                  margin: "2px 0 0",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {user.currentCity
                                  ? `📍 ${user.currentCity}`
                                  : `🌏 ${user.originTerritory}`}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Mobile : bouton toggle liste */}
              {isMobile && (
                <button
                  onClick={() => setShowList(!showList)}
                  style={{
                    padding: "10px 20px",
                    background: "rgba(255,255,255,0.1)",
                    border: "1.5px solid rgba(255,255,255,0.25)",
                    borderRadius: 10,
                    color: "#fff",
                    fontSize: 13,
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  {showList
                    ? "Masquer la liste"
                    : `Voir les ${filtered.length} étudiant${filtered.length !== 1 ? "s" : ""}`}
                </button>
              )}

              {/* Mobile : liste dépliable */}
              {isMobile && showList && (
                <div
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    borderRadius: 14,
                    border: "1.5px solid rgba(255,255,255,0.12)",
                    overflow: "hidden",
                    maxHeight: 300,
                    overflowY: "auto",
                  }}
                >
                  {filtered.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => navigate(`/profile/${user.id}`)}
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        textAlign: "left",
                        border: "none",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        background: "transparent",
                        cursor: "pointer",
                        minHeight: 52,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg, #3ab5e6, #14539E)",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 700,
                            flexShrink: 0,
                            overflow: "hidden",
                          }}
                          aria-hidden="true"
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
                            user.username[0].toUpperCase()
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              margin: 0,
                              color: "#fff",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {user.username}
                          </p>
                          <p
                            style={{
                              fontSize: 10,
                              color: "rgba(255,255,255,0.5)",
                              margin: "2px 0 0",
                            }}
                          >
                            {user.originTerritory}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
      <Footer />
      <style>{`.leaflet-popup-content-wrapper { border-radius: 12px !important; box-shadow: 0 8px 24px rgba(10,29,82,0.15) !important; } .leaflet-popup-content { margin: 12px 14px !important; }`}</style>
    </div>
  );
};
