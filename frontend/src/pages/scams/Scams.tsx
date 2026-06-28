import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Plus,
  Send,
  X,
  ExternalLink,
  FileText,
  Search,
  Paperclip,
  Link as LinkIcon,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { MarkdownLegend } from "../../components/layout/MarkdownLegend";
import { Navbar } from "../../components/layout/Navbar";
import { Sidebar } from "../../components/layout/Sidebar";
import { Footer } from "../../components/layout/Footer";
import { useMobile } from "../../hooks/useMobile";
import friseSide from "../../assets/frise_side.png";

interface Attachment {
  id: string;
  type: "image" | "document" | "link";
  url: string;
  name?: string;
}
interface ScamReport {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  createdAt: string;
  reporter?: {
    id: string;
    username: string;
    avatarUrl?: string;
    originTerritory?: string;
  };
  attachments: Attachment[];
}
interface LinkEntry {
  url: string;
  name: string;
}

const CATEGORIES = [
  { value: "", label: "Toutes" },
  { value: "logement", label: "Logement" },
  { value: "banque", label: "Banque" },
  { value: "emploi", label: "Emploi" },
  { value: "telephone", label: "Téléphonie" },
  { value: "identite", label: "Identité" },
  { value: "autre", label: "Autre" },
];

const CATEGORY_COLORS: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  logement: { bg: "#FEF3C7", color: "#92400E", label: "Logement" },
  banque: { bg: "#DBEAFE", color: "#1E40AF", label: "Banque" },
  emploi: { bg: "#D1FAE5", color: "#065F46", label: "Emploi" },
  telephone: { bg: "#EDE9FE", color: "#5B21B6", label: "Téléphonie" },
  identite: { bg: "#FCE7F3", color: "#9D174D", label: "Identité" },
  autre: { bg: "#F3F4F6", color: "#374151", label: "Autre" },
};

/** Retire la syntaxe Markdown pour un aperçu texte propre */
const stripMarkdown = (md: string, maxLength = 160): string => {
  const plain = md
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/\n+/g, " ")
    .trim();
  return plain.length > maxLength
    ? plain.slice(0, maxLength).trimEnd() + "…"
    : plain;
};

const PAGE_SIZE = 12;

//Helper composant erreur de champ
const FieldError = ({
  name,
  errors,
}: {
  name: string;
  errors: Record<string, string>;
}) =>
  errors[name] ? (
    <p
      role="alert"
      aria-live="polite"
      style={{ fontSize: 12, color: "#DC2626", marginTop: 4, marginBottom: 0 }}
    >
      {errors[name]}
    </p>
  ) : null;

export const Scams = () => {
  const navigate = useNavigate();
  const isMobile = useMobile();
  const { user } = useAuth();

  const [scams, setScams] = useState<ScamReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "logement",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [links, setLinks] = useState<LinkEntry[]>([]);
  const [linkInput, setLinkInput] = useState({ url: "", name: "" });
  const [showLinkInput, setShowLinkInput] = useState(false);
  // ── Erreurs formulaire ───────────────────────────────────────────────────
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(() => {
      if (!cancelled) setLoading(true);
    }, 0);
    api
      .get(`/scam${category ? `?category=${category}` : ""}`)
      .then((r) => {
        if (!cancelled) setScams(r.data);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
        clearTimeout(id);
      });
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [category]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...selected.slice(0, 5 - prev.length)]);
    e.target.value = "";
  };

  const addLink = () => {
    if (!linkInput.url.trim()) return;
    setLinks((prev) => [
      ...prev,
      {
        url: linkInput.url.trim(),
        name: linkInput.name.trim() || linkInput.url.trim(),
      },
    ]);
    setLinkInput({ url: "", name: "" });
    setShowLinkInput(false);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    setSubmitting(true);
    setFormErrors({}); // reset avant chaque envoi
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("category", form.category);
      if (links.length) fd.append("links", JSON.stringify(links));
      files.forEach((f) => fd.append("files", f));
      await api.post("/scam", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSubmitted(true);
      setShowForm(false);
      setForm({ title: "", description: "", category: "logement" });
      setFiles([]);
      setLinks([]);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: {
          data?: { errors?: Record<string, string[]>; message?: string };
        };
      };
      const data = axiosErr?.response?.data;
      if (data?.errors) {
        // Erreurs Zod par champ : { description: ["trop courte"], ... }
        const mapped: Record<string, string> = {};
        for (const [field, messages] of Object.entries(data.errors)) {
          mapped[field] = (messages as string[])[0];
        }
        setFormErrors(mapped);
      } else if (data?.message) {
        // Erreur générique de l'API
        setFormErrors({ _global: data.message });
      } else {
        setFormErrors({ _global: "Une erreur est survenue, réessaie." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = scams.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalSources = files.length + links.length;

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
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: 28,
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div>
                <p
                  style={{
                    color: "rgba(255,255,255,0.75)",
                    fontSize: 14,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: 8,
                  }}
                >
                  Sécurité
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
                  Alertes arnaques
                </h1>
                <p
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 15,
                    marginTop: 8,
                  }}
                >
                  Signalements vérifiés par notre équipe pour te protéger.
                </p>
              </div>
              {user && (
                <button
                  onClick={() => setShowForm(!showForm)}
                  aria-expanded={showForm}
                  aria-controls="form-signalement"
                  style={{
                    padding: "10px 20px",
                    background: "#DC2626",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 14,
                    cursor: "pointer",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    whiteSpace: "nowrap",
                    minHeight: 44,
                  }}
                >
                  <Plus size={15} aria-hidden="true" /> Signaler une arnaque
                </button>
              )}
            </div>

            {/* Message confirmation */}
            {submitted && (
              <div
                role="status"
                aria-live="polite"
                style={{
                  background: "rgba(22,163,74,0.15)",
                  border: "0.5px solid rgba(22,163,74,0.5)",
                  borderRadius: 12,
                  padding: "12px 16px",
                  fontSize: 14,
                  color: "#4ADE80",
                  marginBottom: 20,
                }}
              >
                ✓ Merci&nbsp;! Ton signalement est en attente de vérification
                par notre équipe.
              </div>
            )}

            {/* Formulaire signalement */}
            {showForm && (
              <div
                id="form-signalement"
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: isMobile ? "20px 16px" : 28,
                  marginBottom: 24,
                }}
              >
                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#0a1d52",
                    marginBottom: 4,
                  }}
                >
                  Signaler une arnaque
                </h2>
                <p style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>
                  Plus tu fournis d&apos;informations et de preuves, plus ton
                  signalement sera utile à la communauté.
                </p>

                {/* Erreur globale */}
                {formErrors._global && (
                  <div
                    role="alert"
                    aria-live="polite"
                    style={{
                      background: "#FEF2F2",
                      border: "1px solid #FECACA",
                      borderRadius: 8,
                      padding: "10px 14px",
                      fontSize: 13,
                      color: "#DC2626",
                      marginBottom: 16,
                    }}
                  >
                    {formErrors._global}
                  </div>
                )}

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  {/* Titre */}
                  <div>
                    <label htmlFor="scam-title" style={fLabelStyle}>
                      Titre *
                    </label>
                    <input
                      id="scam-title"
                      value={form.title}
                      onChange={(e) => {
                        setForm({ ...form, title: e.target.value });
                        if (formErrors.title)
                          setFormErrors((prev) => {
                            const next = { ...prev };
                            delete next.title;
                            return next;
                          });
                      }}
                      placeholder="Ex : Faux propriétaire sur LeBonCoin"
                      required
                      aria-required="true"
                      aria-describedby={
                        formErrors.title ? "error-title" : undefined
                      }
                      aria-invalid={!!formErrors.title}
                      style={{
                        ...fInputStyle,
                        borderColor: formErrors.title ? "#DC2626" : "#e5e7eb",
                      }}
                    />
                    {formErrors.title && (
                      <p
                        id="error-title"
                        role="alert"
                        aria-live="polite"
                        style={{
                          fontSize: 12,
                          color: "#DC2626",
                          marginTop: 4,
                          marginBottom: 0,
                        }}
                      >
                        {formErrors.title}
                      </p>
                    )}
                  </div>

                  {/* Catégorie */}
                  <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
                    <legend style={fLabelStyle}>Catégorie *</legend>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        marginTop: 8,
                      }}
                    >
                      {CATEGORIES.filter((c) => c.value).map((cat) => {
                        const active = form.category === cat.value;
                        return (
                          <button
                            key={cat.value}
                            type="button"
                            aria-pressed={active}
                            onClick={() =>
                              setForm({ ...form, category: cat.value })
                            }
                            style={{
                              padding: "6px 14px",
                              borderRadius: 50,
                              fontSize: 12,
                              fontWeight: active ? 600 : 400,
                              border: active
                                ? "1.5px solid #DC2626"
                                : "1.5px solid #e5e7eb",
                              background: active ? "#DC2626" : "#f9fafb",
                              color: active ? "#fff" : "#555",
                              cursor: "pointer",
                              minHeight: 36,
                            }}
                          >
                            {cat.label}
                          </button>
                        );
                      })}
                    </div>
                    <FieldError name="category" errors={formErrors} />
                  </fieldset>

                  {/* Description */}
                  <div>
                    <label htmlFor="scam-desc" style={fLabelStyle}>
                      Description détaillée *
                    </label>
                    <textarea
                      id="scam-desc"
                      value={form.description}
                      onChange={(e) => {
                        setForm({ ...form, description: e.target.value });
                        if (formErrors.description)
                          setFormErrors((prev) => {
                            const next = { ...prev };
                            delete next.description;
                            return next;
                          });
                      }}
                      placeholder="Décris l'arnaque en détail : comment ça s'est passé, ce qu'on t'a demandé..."
                      rows={5}
                      required
                      aria-required="true"
                      aria-describedby={
                        formErrors.description ? "error-desc" : undefined
                      }
                      aria-invalid={!!formErrors.description}
                      style={{
                        ...fInputStyle,
                        resize: "none",
                        fontFamily: "inherit",
                        borderColor: formErrors.description
                          ? "#DC2626"
                          : "#e5e7eb",
                      }}
                    />
                    <MarkdownLegend />
                    {formErrors.description && (
                      <p
                        id="error-desc"
                        role="alert"
                        aria-live="polite"
                        style={{
                          fontSize: 12,
                          color: "#DC2626",
                          marginTop: 4,
                          marginBottom: 0,
                        }}
                      >
                        {formErrors.description}
                      </p>
                    )}
                  </div>

                  {/* Aperçu fichiers */}
                  {files.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {files.map((f, i) => {
                        const isImage = f.type.startsWith("image/");
                        const preview = isImage ? URL.createObjectURL(f) : null;
                        return (
                          <div
                            key={i}
                            style={{
                              position: "relative",
                              width: 80,
                              height: 80,
                              borderRadius: 8,
                              border: "1.5px solid #e5e7eb",
                              overflow: "hidden",
                              background: "#f9fafb",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {preview ? (
                              <img
                                src={preview}
                                alt=""
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <FileText
                                size={28}
                                color="#6B7280"
                                aria-hidden="true"
                              />
                            )}
                            <button
                              onClick={() =>
                                setFiles((p) => p.filter((_, j) => j !== i))
                              }
                              aria-label={`Supprimer ${f.name}`}
                              style={{
                                position: "absolute",
                                top: 2,
                                right: 2,
                                width: 18,
                                height: 18,
                                borderRadius: "50%",
                                background: "rgba(220,38,38,0.85)",
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <X size={10} color="#fff" aria-hidden="true" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Aperçu liens */}
                  {links.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {links.map((l, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "8px 12px",
                            background: "#F0F9FF",
                            border: "1px solid #BAE6FD",
                            borderRadius: 8,
                          }}
                        >
                          <ExternalLink
                            size={13}
                            color="#0EA5E9"
                            aria-hidden="true"
                          />
                          <p
                            style={{
                              flex: 1,
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#0369A1",
                              margin: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {l.name}
                          </p>
                          <button
                            onClick={() =>
                              setLinks((p) => p.filter((_, j) => j !== i))
                            }
                            aria-label={`Supprimer ${l.name}`}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "#aaa",
                            }}
                          >
                            <X size={13} aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Saisie lien */}
                  {showLinkInput && (
                    <div
                      style={{
                        background: "#f9fafb",
                        border: "1.5px solid #e5e7eb",
                        borderRadius: 10,
                        padding: "12px 14px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        <label
                          htmlFor="scam-link-url"
                          style={{ display: "none" }}
                        >
                          URL
                        </label>
                        <input
                          id="scam-link-url"
                          value={linkInput.url}
                          onChange={(e) =>
                            setLinkInput({ ...linkInput, url: e.target.value })
                          }
                          placeholder="https://..."
                          type="url"
                          style={{
                            padding: "8px 12px",
                            border: "1.5px solid #e5e7eb",
                            borderRadius: 7,
                            fontSize: 13,
                            outline: "none",
                          }}
                        />
                        <label
                          htmlFor="scam-link-name"
                          style={{ display: "none" }}
                        >
                          Nom
                        </label>
                        <input
                          id="scam-link-name"
                          value={linkInput.name}
                          onChange={(e) =>
                            setLinkInput({ ...linkInput, name: e.target.value })
                          }
                          placeholder="Label (optionnel)"
                          style={{
                            padding: "8px 12px",
                            border: "1.5px solid #e5e7eb",
                            borderRadius: 7,
                            fontSize: 13,
                            outline: "none",
                          }}
                        />
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={addLink}
                            style={{
                              padding: "7px 14px",
                              background: "#0a1d52",
                              color: "#fff",
                              border: "none",
                              borderRadius: 7,
                              fontSize: 12,
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            Ajouter
                          </button>
                          <button
                            onClick={() => setShowLinkInput(false)}
                            style={{
                              padding: "7px 14px",
                              background: "#f3f4f6",
                              color: "#555",
                              border: "none",
                              borderRadius: 7,
                              fontSize: 12,
                              cursor: "pointer",
                            }}
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Boutons fichier / lien */}
                  <div>
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#555",
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Preuves &amp; sources
                      {totalSources > 0 && (
                        <span
                          style={{
                            marginLeft: 8,
                            background: "#DC2626",
                            color: "#fff",
                            borderRadius: 50,
                            padding: "1px 7px",
                            fontSize: 10,
                          }}
                        >
                          {totalSources}
                        </span>
                      )}
                    </p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={files.length >= 5}
                        aria-label={`Ajouter un fichier (${files.length}/5)`}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 8,
                          border: "1.5px dashed #DC2626",
                          background: "transparent",
                          color: "#DC2626",
                          fontSize: 12,
                          cursor: files.length >= 5 ? "not-allowed" : "pointer",
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          opacity: files.length >= 5 ? 0.4 : 1,
                          minHeight: 40,
                        }}
                      >
                        <Paperclip size={13} aria-hidden="true" /> Photo /
                        Document {files.length > 0 && `(${files.length}/5)`}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowLinkInput(true)}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 8,
                          border: "1.5px dashed #0EA5E9",
                          background: "transparent",
                          color: "#0EA5E9",
                          fontSize: 12,
                          cursor: "pointer",
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          minHeight: 40,
                        }}
                      >
                        <LinkIcon size={13} aria-hidden="true" /> Ajouter un
                        lien
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,application/pdf,.doc,.docx"
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                      aria-hidden="true"
                      tabIndex={-1}
                    />
                    <p style={{ fontSize: 11, color: "#bbb", marginTop: 8 }}>
                      JPG, PNG, PDF, Word &middot; Max 10 MB &middot; Max 5
                      fichiers
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={
                        submitting ||
                        !form.title.trim() ||
                        !form.description.trim()
                      }
                      aria-busy={submitting}
                      style={{
                        padding: "10px 24px",
                        background: "#DC2626",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 14,
                        cursor: "pointer",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        opacity:
                          submitting ||
                          !form.title.trim() ||
                          !form.description.trim()
                            ? 0.6
                            : 1,
                        minHeight: 44,
                      }}
                    >
                      <Send size={13} aria-hidden="true" />{" "}
                      {submitting ? "Envoi..." : "Envoyer le signalement"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setFormErrors({});
                      }}
                      style={{
                        padding: "10px 20px",
                        background: "transparent",
                        border: "1.5px solid #e5e7eb",
                        borderRadius: 8,
                        fontSize: 14,
                        cursor: "pointer",
                        color: "#555",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        minHeight: 44,
                      }}
                    >
                      <X size={13} aria-hidden="true" /> Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Recherche */}
            <div style={{ position: "relative", marginBottom: 16 }}>
              <Search
                size={16}
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9CA3AF",
                  pointerEvents: "none",
                }}
              />
              <label htmlFor="search-scams" style={{ display: "none" }}>
                Rechercher un signalement
              </label>
              <input
                id="search-scams"
                type="search"
                placeholder="Rechercher un signalement..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                style={{
                  width: "100%",
                  padding: "12px 14px 12px 40px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.08)",
                  color: "#fff",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Filtres catégorie */}
            <div
              role="group"
              aria-label="Filtrer par catégorie"
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 28,
              }}
            >
              {CATEGORIES.map((cat) => {
                const active = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    onClick={() => {
                      setCategory(cat.value);
                      setPage(1);
                    }}
                    aria-pressed={active}
                    style={{
                      padding: "7px 16px",
                      borderRadius: 50,
                      fontSize: 13,
                      border: active
                        ? "1.5px solid #fff"
                        : "1.5px solid rgba(255,255,255,0.25)",
                      background: active ? "#fff" : "transparent",
                      color: active ? "#0a1d52" : "rgba(255,255,255,0.8)",
                      fontWeight: active ? 600 : 400,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      minHeight: 36,
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Grille */}
            {loading ? (
              <p
                aria-live="polite"
                style={{
                  textAlign: "center",
                  color: "rgba(255,255,255,0.6)",
                  padding: "48px 0",
                }}
              >
                Chargement...
              </p>
            ) : filtered.length === 0 ? (
              <p
                aria-live="polite"
                style={{
                  textAlign: "center",
                  color: "rgba(255,255,255,0.6)",
                  padding: "48px 0",
                }}
              >
                Aucun signalement pour l&apos;instant.
              </p>
            ) : (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile
                      ? "1fr"
                      : "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: 16,
                    marginBottom: 28,
                  }}
                >
                  {paginated.map((scam) => {
                    const colors =
                      CATEGORY_COLORS[scam.category] ?? CATEGORY_COLORS.autre;
                    const images =
                      scam.attachments?.filter((a) => a.type === "image") ?? [];
                    const hasLinks = scam.attachments?.some(
                      (a) => a.type === "link",
                    );
                    const hasDocs = scam.attachments?.some(
                      (a) => a.type === "document",
                    );

                    return (
                      <article
                        key={scam.id}
                        onClick={() => navigate(`/scams/${scam.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ")
                            navigate(`/scams/${scam.id}`);
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`Voir le signalement : ${scam.title}`}
                        style={{
                          background: "#fff",
                          borderRadius: 14,
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                          cursor: "pointer",
                          transition: "transform 0.15s, box-shadow 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.transform =
                            "translateY(-2px)";
                          (e.currentTarget as HTMLElement).style.boxShadow =
                            "0 8px 24px rgba(0,0,0,0.15)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.transform =
                            "translateY(0)";
                          (e.currentTarget as HTMLElement).style.boxShadow =
                            "none";
                        }}
                      >
                        {images.length > 0 && (
                          <div
                            style={{
                              height: 120,
                              overflow: "hidden",
                              background: "#f3f4f6",
                            }}
                          >
                            <img
                              src={images[0].url}
                              alt=""
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          </div>
                        )}

                        <div
                          style={{
                            padding: "16px 18px",
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              marginBottom: 10,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              {scam.reporter && (
                                <>
                                  <div
                                    style={{
                                      width: 32,
                                      height: 32,
                                      borderRadius: "50%",
                                      background: "#FEE2E2",
                                      color: "#991B1B",
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
                                    {scam.reporter.avatarUrl ? (
                                      <img
                                        src={scam.reporter.avatarUrl}
                                        alt=""
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "cover",
                                        }}
                                      />
                                    ) : (
                                      scam.reporter.username[0].toUpperCase()
                                    )}
                                  </div>
                                  <div>
                                    <p
                                      style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        margin: 0,
                                        color: "#0a1d52",
                                      }}
                                    >
                                      {scam.reporter.username}
                                    </p>
                                    {scam.reporter.originTerritory && (
                                      <p
                                        style={{
                                          fontSize: 10,
                                          color: "#999",
                                          margin: 0,
                                        }}
                                      >
                                        {scam.reporter.originTerritory}
                                      </p>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-end",
                                gap: 4,
                              }}
                            >
                              <span
                                style={{
                                  padding: "3px 8px",
                                  borderRadius: 20,
                                  fontSize: 10,
                                  fontWeight: 600,
                                  background: colors.bg,
                                  color: colors.color,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {colors.label}
                              </span>
                              <span
                                style={{
                                  padding: "2px 7px",
                                  borderRadius: 20,
                                  fontSize: 10,
                                  fontWeight: 600,
                                  background: "#FEE2E2",
                                  color: "#991B1B",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 3,
                                }}
                              >
                                <AlertTriangle size={9} aria-hidden="true" />{" "}
                                Signalé
                              </span>
                            </div>
                          </div>

                          <h2
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              margin: "0 0 6px",
                              color: "#0a1d52",
                            }}
                          >
                            {scam.title}
                          </h2>

                          <p
                            style={{
                              fontSize: 13,
                              color: "#555",
                              lineHeight: 1.6,
                              margin: 0,
                              flex: 1,
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {stripMarkdown(scam.description)}
                          </p>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginTop: 10,
                            }}
                          >
                            <p
                              style={{ fontSize: 11, color: "#bbb", margin: 0 }}
                            >
                              <time dateTime={scam.createdAt}>
                                {new Date(scam.createdAt).toLocaleDateString(
                                  "fr-FR",
                                  {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  },
                                )}
                              </time>
                            </p>
                            {(images.length > 1 || hasLinks || hasDocs) && (
                              <div
                                style={{ display: "flex", gap: 4 }}
                                aria-label="Pièces jointes"
                              >
                                {images.length > 1 && (
                                  <span
                                    style={{ fontSize: 10, color: "#9CA3AF" }}
                                    aria-label={`${images.length} photos`}
                                  >
                                    📷 {images.length}
                                  </span>
                                )}
                                {hasDocs && (
                                  <span
                                    style={{ fontSize: 10, color: "#9CA3AF" }}
                                    aria-label="Document joint"
                                  >
                                    📄
                                  </span>
                                )}
                                {hasLinks && (
                                  <span
                                    style={{ fontSize: 10, color: "#9CA3AF" }}
                                    aria-label="Lien joint"
                                  >
                                    🔗
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <nav
                    aria-label="Pagination"
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      aria-label="Page précédente"
                      style={paginationBtnStyle(false, page === 1)}
                    >
                      &larr; Précédent
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          aria-label={`Page ${p}`}
                          aria-current={p === page ? "page" : undefined}
                          style={paginationBtnStyle(p === page, false)}
                        >
                          {p}
                        </button>
                      ),
                    )}
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      aria-label="Page suivante"
                      style={paginationBtnStyle(false, page === totalPages)}
                    >
                      Suivant &rarr;
                    </button>
                  </nav>
                )}
              </>
            )}
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
};

const fLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: "#555",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};
const fInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: "1.5px solid #e5e7eb",
  borderRadius: 8,
  fontSize: 14,
  color: "#0a1d52",
  outline: "none",
  boxSizing: "border-box",
};
const paginationBtnStyle = (
  active: boolean,
  disabled: boolean,
): React.CSSProperties => ({
  minWidth: 36,
  height: 36,
  padding: "0 10px",
  borderRadius: 8,
  border: active ? "1.5px solid #fff" : "1.5px solid rgba(255,255,255,0.25)",
  background: active ? "#fff" : "transparent",
  color: disabled
    ? "rgba(255,255,255,0.3)"
    : active
      ? "#0a1d52"
      : "rgba(255,255,255,0.8)",
  fontWeight: active ? 600 : 400,
  fontSize: 14,
  cursor: disabled ? "default" : "pointer",
  opacity: disabled ? 0.5 : 1,
});
