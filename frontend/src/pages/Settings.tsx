import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import api from "../services/api";

export const Settings = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({
    bio: user?.bio ?? "",
    currentCity: user?.currentCity ?? "",
    showOnMap: user?.showOnMap ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      const r = await api.patch("/users/me", form);
      updateUser(r.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
    } finally {
      setAvatarLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: "20px 16px" }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          fontSize: 12,
          color: "#888",
          border: "none",
          background: "none",
          cursor: "pointer",
          marginBottom: 16,
        }}
      >
        ← Retour
      </button>
      <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: 20 }}>
        Modifier le profil
      </h1>

      {/* Avatar */}
      <div
        style={{
          background: "#fff",
          border: "0.5px solid #EAEAE8",
          borderRadius: 14,
          padding: 20,
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#E1F5EE",
            color: "#085041",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            fontWeight: 500,
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            user?.username?.[0]?.toUpperCase()
          )}
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 6px" }}>
            Photo de profil
          </p>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={avatarLoading}
            style={{
              padding: "6px 14px",
              fontSize: 12,
              border: "0.5px solid #ddd",
              background: "#fff",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            {avatarLoading ? "Upload en cours..." : "Changer la photo"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleAvatarChange}
          />
          <p style={{ fontSize: 11, color: "#aaa", margin: "4px 0 0" }}>
            JPG, PNG, WEBP · Max 5 MB
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <div
        style={{
          background: "#fff",
          border: "0.5px solid #EAEAE8",
          borderRadius: 14,
          padding: 20,
        }}
      >
        {success && (
          <div
            style={{
              background: "#E1F5EE",
              border: "0.5px solid #5DCAA5",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 13,
              color: "#085041",
              marginBottom: 14,
            }}
          >
            Profil mis à jour !
          </div>
        )}
        <form
          onSubmit={handleSave}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "#666",
                marginBottom: 5,
              }}
            >
              Biographie
            </label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3}
              maxLength={300}
              placeholder="Présente-toi..."
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "0.5px solid #ddd",
                borderRadius: 8,
                fontSize: 13,
                resize: "none",
                fontFamily: "inherit",
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "#666",
                marginBottom: 5,
              }}
            >
              Ville actuelle
            </label>
            <input
              type="text"
              value={form.currentCity}
              onChange={(e) =>
                setForm({ ...form, currentCity: e.target.value })
              }
              placeholder="Paris, Lyon, Bordeaux..."
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "0.5px solid #ddd",
                borderRadius: 8,
                fontSize: 13,
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              background: "#F9F9F7",
              borderRadius: 8,
            }}
          >
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>
                Apparaître sur la carte
              </p>
              <p style={{ fontSize: 12, color: "#888", margin: "2px 0 0" }}>
                Ta ville sera visible par les autres étudiants
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, showOnMap: !form.showOnMap })}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                background: form.showOnMap ? "#1D9E75" : "#ddd",
                position: "relative",
                transition: "background .2s",
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  background: "#fff",
                  borderRadius: "50%",
                  position: "absolute",
                  top: 3,
                  left: form.showOnMap ? 23 : 3,
                  transition: "left .2s",
                }}
              />
            </button>
          </div>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "11px 0",
              background: "#1D9E75",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      </div>
    </div>
  );
};
