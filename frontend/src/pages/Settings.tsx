import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  MapPin,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  Users,
  UserCheck,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import api from "../services/api";
import { Navbar } from "../components/layout/Navbar";
import { Sidebar } from "../components/layout/Sidebar";
import { Footer } from "../components/layout/Footer";
import { useMobile } from "../hooks/useMobile";
import friseSide from "../assets/frise_side.png";
import { getApiErrorMessage } from "../utils/apiError";

type Tab = "profil" | "confidentialite" | "compte";
type MapVisibility = "everyone" | "followers" | "none";

const MAP_VISIBILITY_OPTIONS: {
  value: MapVisibility;
  label: string;
  desc: string;
  icon: React.ElementType;
}[] = [
  {
    value: "everyone",
    label: "Tout le monde",
    desc: "Tous les utilisateurs connectés peuvent te voir.",
    icon: Globe,
  },
  {
    value: "followers",
    label: "Mes abonnés uniquement",
    desc: "Seules les personnes qui te suivent peuvent te voir.",
    icon: UserCheck,
  },
  {
    value: "none",
    label: "Personne",
    desc: "Tu n'apparais pas sur la carte.",
    icon: Users,
  },
];

export const Settings = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();
  const isMobile = useMobile();
  const [tab, setTab] = useState<Tab>("profil");
  const [saving, setSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [profileForm, setProfileForm] = useState({
    bio: user?.bio ?? "",
    currentCity: user?.currentCity ?? "",
  });

  const [mapForm, setMapForm] = useState({
    showOnMap: user?.showOnMap ?? false,
    mapVisibility: (user?.mapVisibility ?? "everyone") as MapVisibility,
  });

  const [pwdForm, setPwdForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPwd, setShowPwd] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const flash = (msg: string, type: "success" | "error" = "success") => {
    if (type === "success") {
      setSuccess(msg);
      setError(null);
    } else {
      setError(msg);
      setSuccess(null);
    }
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 4000);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const r = await api.patch("/users/me", { ...profileForm });
      updateUser(r.data);
      flash("Profil mis à jour !");
    } catch (err) {
      flash(getApiErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMap = async () => {
    setSaving(true);
    try {
      const r = await api.patch("/users/me", {
        showOnMap: mapForm.showOnMap,
        mapVisibility: mapForm.mapVisibility,
      });
      updateUser(r.data);
      flash("Préférences de carte mises à jour !");
    } catch (err) {
      flash(getApiErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const r = await api.post("/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      updateUser({ avatarUrl: r.data.avatarUrl });
      flash("Photo de profil mise à jour !");
    } catch (err) {
      flash(getApiErrorMessage(err), "error");
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleChangePwd = async () => {
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      flash("Les mots de passe ne correspondent pas.", "error");
      return;
    }
    if (pwdForm.newPassword.length < 8) {
      flash("Le mot de passe doit faire au moins 8 caractères.", "error");
      return;
    }
    setSaving(true);
    try {
      await api.patch("/users/me/password", {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
      });
      setPwdForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      flash("Mot de passe modifié !");
    } catch (err) {
      flash(getApiErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user?.username) {
      flash("Le nom d'utilisateur ne correspond pas.", "error");
      return;
    }
    try {
      await api.delete("/users/me");
      await logout();
      navigate("/");
    } catch {
      flash("Erreur lors de la suppression.", "error");
    }
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "profil", label: "Mon profil" },
    { key: "confidentialite", label: "Confidentialité" },
    { key: "compte", label: "Compte" },
  ];

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
              padding: isMobile ? "20px 16px 60px" : "32px 48px 80px",
              minWidth: 0,
            }}
          >
            <div style={{ maxWidth: 680 }}>
              <div style={{ marginBottom: 28 }}>
                <p
                  style={{
                    color: "rgba(255,255,255,0.75)",
                    fontSize: 14,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: 8,
                  }}
                >
                  Compte
                </p>
                <h1
                  style={{
                    color: "#fff",
                    fontSize: isMobile ? 28 : "clamp(26px, 4vw, 36px)",
                    fontWeight: 800,
                    margin: 0,
                    letterSpacing: "-1px",
                  }}
                >
                  Paramètres
                </h1>
                <p
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 15,
                    marginTop: 8,
                  }}
                >
                  Gère ton profil et tes préférences.
                </p>
              </div>

              {/* Onglets */}
              <div
                role="tablist"
                aria-label="Sections des paramètres"
                style={{
                  display: "flex",
                  gap: 4,
                  marginBottom: 24,
                  flexWrap: "wrap",
                }}
              >
                {TABS.map(({ key, label }) => {
                  const active = tab === key;
                  return (
                    <button
                      key={key}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setTab(key)}
                      style={{
                        padding: "8px 18px",
                        borderRadius: 50,
                        fontSize: 13,
                        border: active
                          ? "1.5px solid #fff"
                          : "1.5px solid rgba(255,255,255,0.25)",
                        background: active ? "#fff" : "transparent",
                        color: active ? "#0a1d52" : "rgba(255,255,255,0.8)",
                        fontWeight: active ? 600 : 400,
                        cursor: "pointer",
                        minHeight: 36,
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Notifications */}
              {success && (
                <div
                  role="status"
                  aria-live="polite"
                  style={{
                    background: "rgba(29,158,117,0.15)",
                    border: "0.5px solid rgba(29,158,117,0.5)",
                    borderRadius: 10,
                    padding: "10px 16px",
                    fontSize: 13,
                    color: "#4ADE80",
                    marginBottom: 16,
                  }}
                >
                  ✓ {success}
                </div>
              )}
              {error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  style={{
                    background: "rgba(220,38,38,0.15)",
                    border: "0.5px solid rgba(220,38,38,0.5)",
                    borderRadius: 10,
                    padding: "10px 16px",
                    fontSize: 13,
                    color: "#FCA5A5",
                    marginBottom: 16,
                  }}
                >
                  ✗ {error}
                </div>
              )}

              {/* ── Profil ── */}
              {tab === "profil" && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 14,
                      padding: "22px 24px",
                      display: "flex",
                      alignItems: "center",
                      gap: 18,
                      flexWrap: isMobile ? "wrap" : "nowrap",
                    }}
                  >
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <div
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, #3ab5e6, #14539E)",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 26,
                          fontWeight: 800,
                          overflow: "hidden",
                        }}
                        aria-hidden="true"
                      >
                        {user?.avatarUrl ? (
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
                          user?.username?.[0]?.toUpperCase()
                        )}
                      </div>
                      <button
                        onClick={() => fileRef.current?.click()}
                        disabled={avatarLoading}
                        aria-label="Changer la photo de profil"
                        style={{
                          position: "absolute",
                          bottom: 0,
                          right: 0,
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          background: "#0a1d52",
                          border: "2px solid #fff",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Camera size={12} color="#fff" aria-hidden="true" />
                      </button>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleAvatarChange}
                        aria-hidden="true"
                        tabIndex={-1}
                      />
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#0a1d52",
                          margin: "0 0 2px",
                        }}
                      >
                        {user?.username}
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          color: "#aaa",
                          margin: "0 0 8px",
                        }}
                      >
                        {user?.email}
                      </p>
                      <button
                        onClick={() => fileRef.current?.click()}
                        disabled={avatarLoading}
                        style={{
                          padding: "5px 14px",
                          fontSize: 12,
                          border: "1.5px solid #e5e7eb",
                          background: "#f9fafb",
                          borderRadius: 8,
                          cursor: "pointer",
                          color: "#555",
                          fontWeight: 500,
                          minHeight: 36,
                        }}
                      >
                        {avatarLoading ? "Upload..." : "Changer la photo"}
                      </button>
                    </div>
                  </div>

                  {/* Formulaire profil */}
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 14,
                      padding: "22px 24px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                    }}
                  >
                    <div>
                      <label htmlFor="bio" style={settingsLabelStyle}>
                        Biographie
                      </label>
                      <textarea
                        id="bio"
                        value={profileForm.bio}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            bio: e.target.value,
                          })
                        }
                        rows={3}
                        maxLength={300}
                        placeholder="Présente-toi en quelques mots..."
                        aria-describedby="bio-count"
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1.5px solid #e5e7eb",
                          borderRadius: 8,
                          fontSize: 13,
                          resize: "none",
                          fontFamily: "inherit",
                          outline: "none",
                          color: "#0a1d52",
                          boxSizing: "border-box",
                        }}
                      />
                      <p
                        id="bio-count"
                        style={{
                          fontSize: 11,
                          color: "#bbb",
                          margin: "4px 0 0",
                          textAlign: "right",
                        }}
                      >
                        {profileForm.bio.length}/300
                      </p>
                    </div>
                    <div>
                      <label htmlFor="currentCity" style={settingsLabelStyle}>
                        <MapPin
                          size={12}
                          aria-hidden="true"
                          style={{ display: "inline", marginRight: 4 }}
                        />
                        Ville actuelle
                      </label>
                      <input
                        id="currentCity"
                        type="text"
                        value={profileForm.currentCity}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            currentCity: e.target.value,
                          })
                        }
                        placeholder="Paris, Lyon, Bordeaux..."
                        style={settingsInputStyle}
                      />
                    </div>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      aria-busy={saving}
                      style={{
                        padding: "11px 0",
                        background: "#1D9E75",
                        color: "#fff",
                        border: "none",
                        borderRadius: 10,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        opacity: saving ? 0.7 : 1,
                        minHeight: 48,
                      }}
                    >
                      {saving
                        ? "Enregistrement..."
                        : "Enregistrer les modifications"}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Confidentialité ── */}
              {tab === "confidentialite" && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 14,
                      padding: "22px 24px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 20,
                        gap: 12,
                      }}
                    >
                      <div>
                        <p
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: "#0a1d52",
                            margin: "0 0 3px",
                          }}
                        >
                          Apparaître sur la carte étudiants
                        </p>
                        <p style={{ fontSize: 12, color: "#888", margin: 0 }}>
                          Active cette option pour être visible par d'autres
                          étudiants.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={mapForm.showOnMap}
                        aria-label="Apparaître sur la carte"
                        onClick={() =>
                          setMapForm({
                            ...mapForm,
                            showOnMap: !mapForm.showOnMap,
                          })
                        }
                        style={{
                          width: 48,
                          height: 26,
                          borderRadius: 13,
                          border: "none",
                          cursor: "pointer",
                          background: mapForm.showOnMap ? "#1D9E75" : "#ddd",
                          position: "relative",
                          transition: "background .2s",
                          flexShrink: 0,
                        }}
                      >
                        <div
                          aria-hidden="true"
                          style={{
                            width: 20,
                            height: 20,
                            background: "#fff",
                            borderRadius: "50%",
                            position: "absolute",
                            top: 3,
                            left: mapForm.showOnMap ? 25 : 3,
                            transition: "left .2s",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                          }}
                        />
                      </button>
                    </div>

                    {mapForm.showOnMap && (
                      <fieldset
                        style={{ border: "none", padding: 0, margin: 0 }}
                      >
                        <legend style={settingsLabelStyle}>
                          Qui peut me voir sur la carte ?
                        </legend>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            marginTop: 8,
                          }}
                        >
                          {MAP_VISIBILITY_OPTIONS.map((opt) => {
                            const Icon = opt.icon;
                            const active = mapForm.mapVisibility === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                onClick={() =>
                                  setMapForm({
                                    ...mapForm,
                                    mapVisibility: opt.value,
                                  })
                                }
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                  padding: "12px 14px",
                                  borderRadius: 10,
                                  border: active
                                    ? "2px solid #1D9E75"
                                    : "1.5px solid #e5e7eb",
                                  background: active ? "#E1F5EE" : "#f9fafb",
                                  cursor: "pointer",
                                  textAlign: "left",
                                  transition: "all 0.15s",
                                  minHeight: 60,
                                }}
                              >
                                <div
                                  style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 8,
                                    background: active ? "#1D9E75" : "#e5e7eb",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                  }}
                                  aria-hidden="true"
                                >
                                  <Icon
                                    size={18}
                                    color={active ? "#fff" : "#6B7280"}
                                  />
                                </div>
                                <div style={{ flex: 1 }}>
                                  <p
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 600,
                                      color: active ? "#085041" : "#0a1d52",
                                      margin: "0 0 2px",
                                    }}
                                  >
                                    {opt.label}
                                  </p>
                                  <p
                                    style={{
                                      fontSize: 12,
                                      color: active ? "#1D9E75" : "#888",
                                      margin: 0,
                                    }}
                                  >
                                    {opt.desc}
                                  </p>
                                </div>
                                <div
                                  aria-hidden="true"
                                  style={{
                                    width: 18,
                                    height: 18,
                                    borderRadius: "50%",
                                    border: active
                                      ? "5px solid #1D9E75"
                                      : "2px solid #ddd",
                                    background: "#fff",
                                    flexShrink: 0,
                                  }}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </fieldset>
                    )}

                    <button
                      onClick={handleSaveMap}
                      disabled={saving}
                      aria-busy={saving}
                      style={{
                        marginTop: 20,
                        padding: "10px 20px",
                        background: "#1D9E75",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        opacity: saving ? 0.7 : 1,
                        minHeight: 44,
                      }}
                    >
                      {saving
                        ? "Enregistrement..."
                        : "Sauvegarder les préférences"}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Compte ── */}
              {tab === "compte" && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  {/* Changer mot de passe */}
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 14,
                      padding: "22px 24px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        marginBottom: 18,
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: "#EDE9FE",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        aria-hidden="true"
                      >
                        <Lock size={20} color="#5B21B6" />
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#0a1d52",
                            margin: 0,
                          }}
                        >
                          Changer le mot de passe
                        </p>
                        <p style={{ fontSize: 12, color: "#888", margin: 0 }}>
                          Minimum 8 caractères.
                        </p>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      {(
                        [
                          {
                            key: "current" as const,
                            label: "Mot de passe actuel",
                            field: "currentPassword" as const,
                            autocomplete: "current-password",
                          },
                          {
                            key: "new" as const,
                            label: "Nouveau mot de passe",
                            field: "newPassword" as const,
                            autocomplete: "new-password",
                          },
                          {
                            key: "confirm" as const,
                            label: "Confirmer le nouveau",
                            field: "confirmPassword" as const,
                            autocomplete: "new-password",
                          },
                        ] as const
                      ).map(({ key, label, field, autocomplete }) => (
                        <div key={key} style={{ position: "relative" }}>
                          <label
                            htmlFor={`pwd-${key}`}
                            style={settingsLabelStyle}
                          >
                            {label}
                          </label>
                          <input
                            id={`pwd-${key}`}
                            type={showPwd[key] ? "text" : "password"}
                            value={pwdForm[field]}
                            autoComplete={autocomplete}
                            onChange={(e) =>
                              setPwdForm({
                                ...pwdForm,
                                [field]: e.target.value,
                              })
                            }
                            style={{
                              ...settingsInputStyle,
                              paddingRight: 40,
                            }}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPwd({ ...showPwd, [key]: !showPwd[key] })
                            }
                            aria-label={
                              showPwd[key]
                                ? `Masquer ${label}`
                                : `Afficher ${label}`
                            }
                            style={{
                              position: "absolute",
                              right: 10,
                              top: 34,
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "#aaa",
                            }}
                          >
                            {showPwd[key] ? (
                              <EyeOff size={15} aria-hidden="true" />
                            ) : (
                              <Eye size={15} aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={handleChangePwd}
                        disabled={
                          saving ||
                          !pwdForm.currentPassword ||
                          !pwdForm.newPassword
                        }
                        aria-busy={saving}
                        style={{
                          padding: "10px 20px",
                          background: "#5B21B6",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          opacity:
                            saving ||
                            !pwdForm.currentPassword ||
                            !pwdForm.newPassword
                              ? 0.6
                              : 1,
                          minHeight: 44,
                        }}
                      >
                        {saving
                          ? "Modification..."
                          : "Modifier le mot de passe"}
                      </button>
                    </div>
                  </div>

                  {/* Supprimer compte */}
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 14,
                      padding: "22px 24px",
                      border: "1.5px solid #FEE2E2",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        marginBottom: 14,
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: "#FEE2E2",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        aria-hidden="true"
                      >
                        <Trash2 size={20} color="#DC2626" />
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#DC2626",
                            margin: 0,
                          }}
                        >
                          Supprimer mon compte
                        </p>
                        <p style={{ fontSize: 12, color: "#888", margin: 0 }}>
                          Action irréversible. Toutes tes données seront
                          supprimées.
                        </p>
                      </div>
                    </div>
                    <div
                      style={{
                        background: "#FFF5F5",
                        borderRadius: 8,
                        padding: "10px 14px",
                        marginBottom: 14,
                        display: "flex",
                        gap: 8,
                        alignItems: "flex-start",
                      }}
                    >
                      <AlertTriangle
                        size={14}
                        aria-hidden="true"
                        style={{
                          color: "#DC2626",
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                      />
                      <p
                        style={{
                          fontSize: 12,
                          color: "#7F1D1D",
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        Pour confirmer, tape ton nom d'utilisateur :{" "}
                        <strong>{user?.username}</strong>
                      </p>
                    </div>
                    <label htmlFor="delete-confirm" style={{ display: "none" }}>
                      Confirme ton nom d'utilisateur pour supprimer le compte
                    </label>
                    <input
                      id="delete-confirm"
                      type="text"
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      placeholder={`Tape "${user?.username}" pour confirmer`}
                      aria-describedby="delete-hint"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1.5px solid #FECACA",
                        borderRadius: 8,
                        fontSize: 13,
                        outline: "none",
                        marginBottom: 12,
                        color: "#DC2626",
                        boxSizing: "border-box",
                        background: "#FFF5F5",
                      }}
                    />
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirm !== user?.username}
                      style={{
                        padding: "10px 20px",
                        background: "#DC2626",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor:
                          deleteConfirm !== user?.username
                            ? "not-allowed"
                            : "pointer",
                        opacity: deleteConfirm !== user?.username ? 0.5 : 1,
                        minHeight: 44,
                      }}
                    >
                      Supprimer définitivement mon compte
                    </button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
};

const settingsLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#555",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const settingsInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1.5px solid #e5e7eb",
  borderRadius: 8,
  fontSize: 13,
  outline: "none",
  color: "#0a1d52",
  boxSizing: "border-box",
};
