import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lightbulb,
  BookOpen,
  Plus,
  X,
  Send,
  Paperclip,
  Link as LinkIcon,
  ExternalLink,
  FileText,
} from "lucide-react";
import api from "../../services/api";
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
interface Tip {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    avatarUrl?: string;
    originTerritory: string;
  };
  attachments: Attachment[];
}

interface LinkEntry {
  url: string;
  name: string;
}

const PAGE_SIZE = 12;

export const Tips = () => {
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "tip" | "testimonial">("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", type: "tip" });
  const [files, setFiles] = useState<File[]>([]);
  const [links, setLinks] = useState<LinkEntry[]>([]);
  const [linkInput, setLinkInput] = useState({ url: "", name: "" });
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [page, setPage] = useState(1);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    const params = filter !== "all" ? `?type=${filter}` : "";
    api
      .get(`/tips${params}`)
      .then((r) => {
        if (!cancelled) {
          setTips(r.data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(err);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
      setLoading(true);
    };
  }, [filter]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const remaining = 5 - files.length;
    setFiles((prev) => [...prev, ...selected.slice(0, remaining)]);
    e.target.value = "";
  };

  const removeFile = (index: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== index));

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

  const removeLink = (index: number) =>
    setLinks((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    setSubmitting(true);
    setFormErrors({});
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("content", form.content);
      formData.append("type", form.type);
      if (links.length > 0) formData.append("links", JSON.stringify(links));
      files.forEach((f) => formData.append("files", f));

      await api.post("/tips", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
      setShowForm(false);
      setForm({ title: "", content: "", type: "tip" });
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

  const totalPages = Math.max(1, Math.ceil(tips.length / PAGE_SIZE));
  const paginated = tips.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
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
                  Communauté
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
                  Tips & Témoignages
                </h1>
                <p
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 15,
                    marginTop: 8,
                  }}
                >
                  Des étudiants ultramarins partagent leur vécu.
                </p>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                aria-expanded={showForm}
                aria-controls="form-partage"
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
                <Plus size={15} aria-hidden="true" /> Partager
              </button>
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
                  color: "#5DCAA5",
                  marginBottom: 20,
                }}
              >
                ✓ Merci ! Ton partage est en attente de validation par l'équipe.
              </div>
            )}

            {/* Formulaire */}
            {showForm && (
              <div
                id="form-partage"
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
                  Partager ton expérience
                </h2>
                <p style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>
                  Tu peux enrichir ton post avec des photos, documents ou liens.
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
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}
                >
                  {/* Type */}
                  <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
                    <legend
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#555",
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Type de publication
                    </legend>
                    <div style={{ display: "flex", gap: 10 }}>
                      {(["tip", "testimonial"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setForm({ ...form, type: t })}
                          aria-pressed={form.type === t}
                          style={{
                            flex: 1,
                            padding: "9px 0",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontSize: 13,
                            border:
                              form.type === t
                                ? "1.5px solid #1D9E75"
                                : "1px solid #e5e7eb",
                            background: form.type === t ? "#E1F5EE" : "#f9fafb",
                            color: form.type === t ? "#085041" : "#555",
                            fontWeight: form.type === t ? 600 : 400,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            minHeight: 44,
                          }}
                        >
                          {t === "tip" ? (
                            <>
                              <Lightbulb size={13} aria-hidden="true" /> Bon
                              plan
                            </>
                          ) : (
                            <>
                              <BookOpen size={13} aria-hidden="true" />{" "}
                              Témoignage
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  {/* Titre */}
                  <div>
                    <label
                      htmlFor="tip-title"
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#555",
                        marginBottom: 6,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Titre *
                    </label>
                    <input
                      id="tip-title"
                      value={form.title}
                      onChange={(e) => {
                        setForm({ ...form, title: e.target.value });
                        if (formErrors.title)
                          setFormErrors((prev) => {
                            const n = { ...prev };
                            delete n.title;
                            return n;
                          });
                      }}
                      placeholder="Ex: Comment trouver une coloc rapidement"
                      required
                      aria-required="true"
                      aria-invalid={!!formErrors.title}
                      aria-describedby={
                        formErrors.title ? "error-tip-title" : undefined
                      }
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        border: "1.5px solid",
                        borderColor: formErrors.title ? "#DC2626" : "#e5e7eb",
                        borderRadius: 8,
                        fontSize: 14,
                        color: "#0a1d52",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                    {formErrors.title && (
                      <p
                        id="error-tip-title"
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

                  {/* Contenu */}
                  <div>
                    <label
                      htmlFor="tip-content"
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#555",
                        marginBottom: 6,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Ton expérience *
                    </label>
                    <textarea
                      id="tip-content"
                      value={form.content}
                      onChange={(e) => {
                        setForm({ ...form, content: e.target.value });
                        if (formErrors.content)
                          setFormErrors((prev) => {
                            const n = { ...prev };
                            delete n.content;
                            return n;
                          });
                      }}
                      placeholder="Raconte ton expérience, partage ton conseil..."
                      rows={5}
                      required
                      aria-required="true"
                      aria-invalid={!!formErrors.content}
                      aria-describedby={
                        formErrors.content ? "error-tip-content" : undefined
                      }
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        border: "1.5px solid",
                        borderColor: formErrors.content ? "#DC2626" : "#e5e7eb",
                        borderRadius: 8,
                        fontSize: 14,
                        color: "#0a1d52",
                        outline: "none",
                        boxSizing: "border-box",
                        resize: "none",
                        fontFamily: "inherit",
                      }}
                    />
                    {formErrors.content && (
                      <p
                        id="error-tip-content"
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
                    <MarkdownLegend />
                  </div>

                  {/* Sources & Médias */}
                  <div>
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#555",
                        marginBottom: 4,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Photos, documents & liens
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
                    <p
                      style={{ fontSize: 12, color: "#aaa", marginBottom: 10 }}
                    >
                      Optionnel &mdash; enrichis ton post avec des visuels ou
                      des ressources utiles.
                    </p>

                    {files.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 8,
                          marginBottom: 10,
                        }}
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
                                width: 76,
                                height: 76,
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
                                  alt={`Aperçu ${f.name}`}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                <FileText
                                  size={26}
                                  color="#6B7280"
                                  aria-hidden="true"
                                />
                              )}
                              <button
                                onClick={() => removeFile(i)}
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

                    {links.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                          marginBottom: 10,
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
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p
                                style={{
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
                            </div>
                            <button
                              onClick={() => removeLink(i)}
                              aria-label={`Supprimer le lien ${l.name}`}
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

                    {showLinkInput && (
                      <div
                        style={{
                          background: "#f9fafb",
                          border: "1.5px solid #e5e7eb",
                          borderRadius: 10,
                          padding: "12px 14px",
                          marginBottom: 10,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                          }}
                        >
                          <label htmlFor="link-url" style={{ display: "none" }}>
                            URL du lien
                          </label>
                          <input
                            id="link-url"
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
                            htmlFor="link-name"
                            style={{ display: "none" }}
                          >
                            Nom du lien
                          </label>
                          <input
                            id="link-name"
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
                                background: "#1D9E75",
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

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={files.length >= 5}
                        aria-label={`Ajouter une photo ou un document (${files.length}/5)`}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 8,
                          border: "1.5px dashed #1D9E75",
                          background: "transparent",
                          color: "#1D9E75",
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
                      JPG, PNG, WEBP, GIF, PDF, Word · Max 10 MB · Max 5
                      fichiers
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting}
                      aria-busy={submitting}
                      style={{
                        padding: "10px 20px",
                        background: "#1D9E75",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 14,
                        cursor: "pointer",
                        opacity: submitting ? 0.6 : 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontWeight: 600,
                        minHeight: 44,
                      }}
                    >
                      <Send size={13} aria-hidden="true" />{" "}
                      {submitting ? "Envoi..." : "Envoyer"}
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
                        border: "1px solid #e5e7eb",
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

            {/* Filtres */}
            <div
              role="group"
              aria-label="Filtrer les publications"
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 24,
                flexWrap: "wrap",
              }}
            >
              {(["all", "tip", "testimonial"] as const).map((f) => {
                const active = filter === f;
                return (
                  <button
                    key={f}
                    onClick={() => {
                      setFilter(f);
                      setPage(1);
                    }}
                    aria-pressed={active}
                    style={{
                      padding: "7px 18px",
                      borderRadius: 50,
                      cursor: "pointer",
                      fontSize: 13,
                      border: active
                        ? "1.5px solid #fff"
                        : "1.5px solid rgba(255,255,255,0.25)",
                      background: active ? "#fff" : "transparent",
                      color: active ? "#0a1d52" : "rgba(255,255,255,0.8)",
                      fontWeight: active ? 600 : 400,
                      transition: "all 0.15s",
                      minHeight: 36,
                    }}
                  >
                    {f === "all"
                      ? "Tout"
                      : f === "tip"
                        ? "Bons plans"
                        : "Témoignages"}
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
                  color: "rgba(255,255,255,0.5)",
                  padding: "48px 0",
                }}
              >
                Chargement...
              </p>
            ) : tips.length === 0 ? (
              <p
                aria-live="polite"
                style={{
                  textAlign: "center",
                  color: "rgba(255,255,255,0.5)",
                  padding: "48px 0",
                  fontSize: 14,
                }}
              >
                Aucun contenu pour l'instant &mdash; sois le premier à partager
                !
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
                  {paginated.map((tip) => {
                    const images =
                      tip.attachments?.filter((a) => a.type === "image") ?? [];
                    const hasLinks = tip.attachments?.some(
                      (a) => a.type === "link",
                    );
                    const hasDocs = tip.attachments?.some(
                      (a) => a.type === "document",
                    );
                    return (
                      <article
                        key={tip.id}
                        onClick={() => navigate(`/tips/${tip.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ")
                            navigate(`/tips/${tip.id}`);
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`Lire : ${tip.title}`}
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
                              <div
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: "50%",
                                  background: "#E1F5EE",
                                  color: "#085041",
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
                                {tip.author.avatarUrl ? (
                                  <img
                                    src={tip.author.avatarUrl}
                                    alt=""
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    }}
                                  />
                                ) : (
                                  tip.author.username[0].toUpperCase()
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
                                  {tip.author.username}
                                </p>
                                <p
                                  style={{
                                    fontSize: 10,
                                    color: "#999",
                                    margin: 0,
                                  }}
                                >
                                  {tip.author.originTerritory}
                                </p>
                              </div>
                            </div>
                            <span
                              style={{
                                padding: "3px 8px",
                                borderRadius: 20,
                                fontSize: 10,
                                fontWeight: 600,
                                background:
                                  tip.type === "tip" ? "#FAEEDA" : "#E6F1FB",
                                color:
                                  tip.type === "tip" ? "#633806" : "#0C447C",
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {tip.type === "tip" ? (
                                <>
                                  <Lightbulb size={10} aria-hidden="true" /> Bon
                                  plan
                                </>
                              ) : (
                                <>
                                  <BookOpen size={10} aria-hidden="true" />{" "}
                                  Témoignage
                                </>
                              )}
                            </span>
                          </div>

                          <h2
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              margin: "0 0 6px",
                              color: "#0a1d52",
                            }}
                          >
                            {tip.title}
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
                            {tip.content}
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
                              <time dateTime={tip.createdAt}>
                                {new Date(tip.createdAt).toLocaleDateString(
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
                      ← Précédent
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
                      Suivant →
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
