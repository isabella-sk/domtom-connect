import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Pin,
  Plus,
  X,
  Send,
  Paperclip,
  Link as LinkIcon,
  ExternalLink,
  FileText,
  Shield,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { MarkdownLegend } from "../../components/layout/MarkdownLegend";
import { Navbar } from "../../components/layout/Navbar";
import { Sidebar } from "../../components/layout/Sidebar";
import { Footer } from "../../components/layout/Footer";
import { postsService, type Post } from "../../services/postsService";
import { useMobile } from "../../hooks/useMobile";
import friseSide from "../../assets/frise_side.png";

interface LinkEntry {
  url: string;
  name: string;
}

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

const CATEGORIES = [
  { value: "", label: "Tous" },
  { value: "caf", label: "CAF" },
  { value: "logement", label: "Logement" },
  { value: "sante", label: "Santé" },
  { value: "banque", label: "Banque" },
  { value: "transport", label: "Transport" },
  { value: "telephone", label: "Téléphonie" },
  { value: "crous", label: "CROUS" },
];

const GUIDE_CATEGORIES_FORM = [
  "caf",
  "logement",
  "sante",
  "banque",
  "transport",
  "telephone",
  "crous",
  "autre",
] as const;

const PAGE_SIZE = 20;

// ── Helper erreur champ ──────────────────────────────────────────────────────
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

export const Guides = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const isMobile = useMobile();
  const { user } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "logement",
    isPinned: false,
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
    postsService
      .getAll(category || undefined)
      .then((data) => {
        if (!cancelled) {
          setPosts(data);
          setLoading(false);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      setLoading(true);
    };
  }, [category]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    setPage(1);
  };

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
    if (!form.title.trim() || !form.content.trim()) return;
    setSubmitting(true);
    setFormErrors({});
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("content", form.content);
      fd.append("category", form.category);
      fd.append("isPinned", String(form.isPinned));
      if (links.length) fd.append("links", JSON.stringify(links));
      files.forEach((f) => fd.append("files", f));
      const res = await api.post("/admin/posts", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPosts((prev) => [res.data, ...prev]);
      setSubmitted(true);
      setShowForm(false);
      setForm({
        title: "",
        content: "",
        category: "logement",
        isPinned: false,
      });
      setFiles([]);
      setLinks([]);
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: {
          data?: { errors?: Record<string, string[]>; message?: string };
        };
      };
      const data = axiosErr?.response?.data;
      if (data?.errors) {
        const mapped: Record<string, string> = {};
        for (const [field, messages] of Object.entries(data.errors)) {
          mapped[field] = messages[0];
        }
        setFormErrors(mapped);
      } else if (data?.message) {
        setFormErrors({ _global: data.message });
      } else {
        setFormErrors({ _global: "Une erreur est survenue, réessaie." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase()),
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
            <div style={{ maxWidth: "100%" }}>
              {/* En-tête */}
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
                    Démarches
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
                    Guides démarches
                  </h1>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.7)",
                      fontSize: 15,
                      marginTop: 8,
                    }}
                  >
                    Tout ce qu&apos;il faut savoir pour t&apos;installer en
                    France.
                  </p>
                </div>

                {user?.isAdmin && (
                  <button
                    onClick={() => setShowForm(!showForm)}
                    aria-expanded={showForm}
                    aria-controls="form-guide"
                    style={{
                      padding: "10px 20px",
                      background: "#1D9E75",
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
                    <Plus size={15} aria-hidden="true" /> Publier un guide
                  </button>
                )}
              </div>

              {submitted && (
                <div
                  role="status"
                  aria-live="polite"
                  style={{
                    background: "rgba(29,158,117,0.15)",
                    border: "0.5px solid rgba(29,158,117,0.5)",
                    borderRadius: 12,
                    padding: "12px 16px",
                    fontSize: 14,
                    color: "#4ADE80",
                    marginBottom: 20,
                  }}
                >
                  ✓ Guide publié avec succès&nbsp;!
                </div>
              )}

              {/* Formulaire admin */}
              {showForm && user?.isAdmin && (
                <div
                  id="form-guide"
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    padding: isMobile ? "20px 16px" : 28,
                    marginBottom: 28,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 4,
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "#E1F5EE",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      aria-hidden="true"
                    >
                      <Shield size={16} color="#085041" />
                    </div>
                    <h2
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#0a1d52",
                        margin: 0,
                      }}
                    >
                      Publier un guide
                    </h2>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        background: "#FEE2E2",
                        color: "#DC2626",
                        padding: "2px 8px",
                        borderRadius: 4,
                      }}
                    >
                      ADMIN
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>
                    Les guides sont publiés directement et visibles par toute la
                    communauté.
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
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                    }}
                  >
                    {/* Titre */}
                    <div>
                      <label htmlFor="guide-title" style={fLabelStyle}>
                        Titre *
                      </label>
                      <input
                        id="guide-title"
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
                        placeholder="Ex : Comment ouvrir un compte bancaire en France"
                        required
                        aria-required="true"
                        aria-describedby={
                          formErrors.title ? "error-guide-title" : undefined
                        }
                        aria-invalid={!!formErrors.title}
                        style={{
                          ...fInputStyle,
                          borderColor: formErrors.title ? "#DC2626" : "#e5e7eb",
                        }}
                      />
                      {formErrors.title && (
                        <p
                          id="error-guide-title"
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

                    {/* Catégorie + épingler */}
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        flexWrap: "wrap",
                        alignItems: "flex-end",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <label htmlFor="guide-category" style={fLabelStyle}>
                          Catégorie *
                        </label>
                        <select
                          id="guide-category"
                          value={form.category}
                          onChange={(e) => {
                            setForm({ ...form, category: e.target.value });
                            if (formErrors.category)
                              setFormErrors((prev) => {
                                const next = { ...prev };
                                delete next.category;
                                return next;
                              });
                          }}
                          aria-invalid={!!formErrors.category}
                          style={{
                            ...fInputStyle,
                            background: "#fff",
                            cursor: "pointer",
                            borderColor: formErrors.category
                              ? "#DC2626"
                              : "#e5e7eb",
                          }}
                        >
                          {GUIDE_CATEGORIES_FORM.map((c) => (
                            <option key={c} value={c}>
                              {c.charAt(0).toUpperCase() + c.slice(1)}
                            </option>
                          ))}
                        </select>
                        <FieldError name="category" errors={formErrors} />
                      </div>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 13,
                          color: form.isPinned ? "#085041" : "#555",
                          cursor: "pointer",
                          padding: "10px 14px",
                          border: form.isPinned
                            ? "1.5px solid #1D9E75"
                            : "1.5px solid #e5e7eb",
                          borderRadius: 8,
                          background: form.isPinned ? "#E1F5EE" : "#f9fafb",
                          whiteSpace: "nowrap",
                          userSelect: "none",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={form.isPinned}
                          onChange={(e) =>
                            setForm({ ...form, isPinned: e.target.checked })
                          }
                          style={{ display: "none" }}
                        />
                        <Pin
                          size={14}
                          color={form.isPinned ? "#085041" : "#aaa"}
                          aria-hidden="true"
                        />
                        Épingler le guide
                      </label>
                    </div>

                    {/* Contenu */}
                    <div>
                      <label htmlFor="guide-content" style={fLabelStyle}>
                        Contenu *
                      </label>
                      <textarea
                        id="guide-content"
                        value={form.content}
                        onChange={(e) => {
                          setForm({ ...form, content: e.target.value });
                          if (formErrors.content)
                            setFormErrors((prev) => {
                              const next = { ...prev };
                              delete next.content;
                              return next;
                            });
                        }}
                        placeholder="Rédige le guide étape par étape..."
                        rows={10}
                        required
                        aria-required="true"
                        aria-describedby={
                          formErrors.content ? "error-guide-content" : undefined
                        }
                        aria-invalid={!!formErrors.content}
                        style={{
                          ...fInputStyle,
                          resize: "vertical",
                          fontFamily: "inherit",
                          lineHeight: 1.7,
                          borderColor: formErrors.content
                            ? "#DC2626"
                            : "#e5e7eb",
                        }}
                      />
                      <MarkdownLegend />
                      {formErrors.content && (
                        <p
                          id="error-guide-content"
                          role="alert"
                          aria-live="polite"
                          style={{
                            fontSize: 12,
                            color: "#DC2626",
                            marginTop: 4,
                            marginBottom: 0,
                          }}
                        >
                          {formErrors.content}
                        </p>
                      )}
                    </div>

                    {/* Aperçu fichiers */}
                    {files.length > 0 && (
                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
                      >
                        {files.map((f, i) => {
                          const isImage = f.type.startsWith("image/");
                          const preview = isImage
                            ? URL.createObjectURL(f)
                            : null;
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
                            htmlFor="guide-link-url"
                            style={{ display: "none" }}
                          >
                            URL
                          </label>
                          <input
                            id="guide-link-url"
                            value={linkInput.url}
                            onChange={(e) =>
                              setLinkInput({
                                ...linkInput,
                                url: e.target.value,
                              })
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
                            htmlFor="guide-link-name"
                            style={{ display: "none" }}
                          >
                            Label
                          </label>
                          <input
                            id="guide-link-name"
                            value={linkInput.name}
                            onChange={(e) =>
                              setLinkInput({
                                ...linkInput,
                                name: e.target.value,
                              })
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

                    {/* Boutons pièces jointes */}
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
                        Ressources complémentaires
                        {totalSources > 0 && (
                          <span
                            style={{
                              marginLeft: 8,
                              background: "#1D9E75",
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
                      <div
                        style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                      >
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={files.length >= 5}
                          aria-label={`Ajouter un fichier (${files.length}/5)`}
                          style={{
                            padding: "8px 14px",
                            borderRadius: 8,
                            border: "1.5px dashed #1D9E75",
                            background: "transparent",
                            color: "#1D9E75",
                            fontSize: 12,
                            cursor:
                              files.length >= 5 ? "not-allowed" : "pointer",
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
                          !form.content.trim()
                        }
                        aria-busy={submitting}
                        style={{
                          padding: "10px 24px",
                          background: "#1D9E75",
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
                            !form.content.trim()
                              ? 0.6
                              : 1,
                          minHeight: 44,
                        }}
                      >
                        <Send size={13} aria-hidden="true" />{" "}
                        {submitting ? "Publication..." : "Publier le guide"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false);
                          setFiles([]);
                          setLinks([]);
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
                <label htmlFor="search-guides" style={{ display: "none" }}>
                  Rechercher un guide
                </label>
                <input
                  id="search-guides"
                  type="search"
                  placeholder="Rechercher un guide..."
                  value={search}
                  onChange={handleSearchChange}
                  aria-label="Rechercher un guide"
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

              {/* Catégories */}
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
                      onClick={() => handleCategoryChange(cat.value)}
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

              {/* Liste des guides */}
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
                  Aucun guide trouvé.
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
                    {paginated.map((post) => (
                      <article
                        key={post.id}
                        onClick={() => navigate(`/guides/${post.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ")
                            navigate(`/guides/${post.id}`);
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`Voir le guide : ${post.title}`}
                        style={{
                          background: "#fff",
                          borderRadius: 14,
                          padding: "20px 22px",
                          cursor: "pointer",
                          transition: "transform 0.15s, box-shadow 0.15s",
                          display: "flex",
                          flexDirection: "column",
                          minHeight: 140,
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.transform =
                            "translateY(-2px)";
                          (e.currentTarget as HTMLElement).style.boxShadow =
                            "0 10px 24px rgba(10,29,82,0.18)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.transform =
                            "translateY(0)";
                          (e.currentTarget as HTMLElement).style.boxShadow =
                            "none";
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          {post.isPinned && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 11,
                                fontWeight: 600,
                                background: "#E6F1FB",
                                color: "#2888C5",
                                padding: "3px 10px",
                                borderRadius: 50,
                              }}
                            >
                              <Pin size={11} aria-hidden="true" /> Épinglé
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              background: "#F3F4F6",
                              color: "#6B7280",
                              padding: "3px 10px",
                              borderRadius: 50,
                              textTransform: "capitalize",
                            }}
                          >
                            {post.category}
                          </span>
                        </div>
                        <h2
                          style={{
                            color: "#0a1d52",
                            fontSize: 15,
                            fontWeight: 700,
                            margin: "0 0 6px",
                            lineHeight: 1.3,
                            flex: 1,
                          }}
                        >
                          {post.title}
                        </h2>
                        <p
                          style={{
                            color: "#777",
                            fontSize: 13,
                            margin: 0,
                            lineHeight: 1.6,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {stripMarkdown(post.content)}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginTop: 10,
                          }}
                        >
                          <p style={{ color: "#bbb", fontSize: 11, margin: 0 }}>
                            {post.author.username} &middot;{" "}
                            <time dateTime={post.createdAt}>
                              {new Date(post.createdAt).toLocaleDateString(
                                "fr-FR",
                              )}
                            </time>
                          </p>
                          {post.attachments &&
                            post.attachments.length > 0 &&
                            (() => {
                              const imgs = post.attachments.filter(
                                (a) => a.type === "image",
                              );
                              const docs = post.attachments.filter(
                                (a) => a.type === "document",
                              );
                              const lnks = post.attachments.filter(
                                (a) => a.type === "link",
                              );
                              return (
                                <div
                                  style={{ display: "flex", gap: 4 }}
                                  aria-label="Pièces jointes"
                                >
                                  {imgs.length > 0 && (
                                    <span
                                      style={{ fontSize: 10, color: "#9CA3AF" }}
                                      aria-label={`${imgs.length} photo${imgs.length > 1 ? "s" : ""}`}
                                    >
                                      📷 {imgs.length}
                                    </span>
                                  )}
                                  {docs.length > 0 && (
                                    <span
                                      style={{ fontSize: 10, color: "#9CA3AF" }}
                                      aria-label={`${docs.length} document${docs.length > 1 ? "s" : ""}`}
                                    >
                                      📄 {docs.length}
                                    </span>
                                  )}
                                  {lnks.length > 0 && (
                                    <span
                                      style={{ fontSize: 10, color: "#9CA3AF" }}
                                      aria-label={`${lnks.length} lien${lnks.length > 1 ? "s" : ""}`}
                                    >
                                      🔗 {lnks.length}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                        </div>
                      </article>
                    ))}
                  </div>

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
            </div>
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
