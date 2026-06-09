import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

// Fix nécessaire avec Vite : les icônes Leaflet ne chargent pas sans ça
delete (L.Icon.Default.prototype as any)._getIconUrl;
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
  const navigate = useNavigate();

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

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Barre du haut */}
      <div
        style={{
          padding: "10px 16px",
          background: "#fff",
          borderBottom: "0.5px solid #EAEAE8",
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
          zIndex: 1000,
        }}
      >
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            fontSize: 12,
            color: "#888",
            border: "none",
            background: "none",
            cursor: "pointer",
          }}
        >
          ← Retour
        </button>
        <span style={{ fontSize: 13, fontWeight: 500 }}>
          Carte des étudiants
        </span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            fontSize: 12,
            padding: "4px 8px",
            border: "0.5px solid #ddd",
            borderRadius: 6,
            background: "#fff",
          }}
        >
          <option value="">Tous les territoires</option>
          {TERRITORIES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <span style={{ fontSize: 12, color: "#aaa" }}>
          {loading ? "Chargement..." : `${filtered.length} étudiant(s)`}
        </span>
      </div>

      {/* Carte */}
      <div style={{ flex: 1 }}>
        <MapContainer
          center={[46.8, 2.3]}
          zoom={6}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
          />
          {filtered.map((user) => (
            <Marker key={user.id} position={[user.latitude, user.longitude]}>
              <Popup minWidth={180}>
                <div style={{ padding: "4px 0" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "#E1F5EE",
                        color: "#085041",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        fontWeight: 500,
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
                        user.username[0].toUpperCase()
                      )}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 500, fontSize: 13 }}>
                        {user.username}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "#888" }}>
                        {user.originTerritory}
                      </p>
                    </div>
                  </div>
                  {user.currentCity && (
                    <p
                      style={{ margin: "0 0 8px", fontSize: 12, color: "#666" }}
                    >
                      📍 {user.currentCity}
                    </p>
                  )}
                  <button
                    onClick={() => navigate(`/profile/${user.id}`)}
                    style={{
                      width: "100%",
                      padding: "7px 0",
                      background: "#1D9E75",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 12,
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    Voir le profil
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};
