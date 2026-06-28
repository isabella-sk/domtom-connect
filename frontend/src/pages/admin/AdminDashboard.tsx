import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  X,
  Lightbulb,
  BookOpen,
  AlertTriangle,
  FileText,
  Users,
  Clock,
  ShieldCheck,
  Eye,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Pin,
  Search,
  UserCog,
  Send,
  ExternalLink,
  ChevronLeft,
  Paperclip,
  Link as LinkIcon,
} from "lucide-react";
import api from "../../services/api";
import { Navbar } from "../../components/layout/Navbar";
import {
  EditArticlePanel,
  type EditableArticle,
} from "../../components/layout/EditArticlePanel";
import { MarkdownLegend } from "../../components/layout/MarkdownLegend";
import { Sidebar } from "../../components/layout/Sidebar";
import { Footer } from "../../components/layout/Footer";
import { useMobile } from "../../hooks/useMobile";
import friseSide from "../../assets/frise_side.png";

interface Stats {
  users: number;
  posts: number;
  pendingTips: number;
  pendingScams: number;
  verifiedScams: number;
  approvedTips: number;
}
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
  reporter: { id: string; username: string };
  attachments: Attachment[];
}
interface Tip {
  id: string;
  title: string;
  content: string;
  type: string;
  isApproved: boolean;
  createdAt: string;
  author: { id: string; username: string; originTerritory: string };
  attachments: Attachment[];
}
interface Guide {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  createdAt: string;
  author: { id: string; username: string };
  attachments: Attachment[];
}
interface AdminUser {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  originTerritory: string;
  currentCity?: string;
  isAdmin: boolean;
  isVerified: boolean;
  createdAt: string;
  _count: { posts: number; tips: number; scamReports: number };
}
interface LinkEntry {
  url: string;
  name: string;
}
interface GuideFormData {
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  files?: File[];
  links?: LinkEntry[];
}

type Tab =
  | "overview"
  | "moderation"
  | "guides"
  | "users"
  | "published_tips"
  | "published_scams";
type SubTab = "scams" | "tips";

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

const GUIDE_CATEGORIES = [
  "logement",
  "caf",
  "sante",
  "banque",
  "transport",
  "telephone",
  "crous",
  "autre",
] as const;

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  logement: { bg: "#FEF3C7", color: "#92400E" },
  banque: { bg: "#DBEAFE", color: "#1E40AF" },
  caf: { bg: "#D1FAE5", color: "#065F46" },
  sante: { bg: "#FCE7F3", color: "#9D174D" },
  transport: { bg: "#EDE9FE", color: "#5B21B6" },
  telephone: { bg: "#FEF3C7", color: "#92400E" },
  crous: { bg: "#E6F1FB", color: "#0C447C" },
  autre: { bg: "#F3F4F6", color: "#374151" },
  emploi: { bg: "#D1FAE5", color: "#065F46" },
  identite: { bg: "#FCE7F3", color: "#9D174D" },
};

// ---------------------------------------------------------------------------
// GuideForm — formulaire complet avec pièces jointes (fichiers + liens)
// ---------------------------------------------------------------------------
const GuideForm = ({
  initial,
  onSave,
  onCancel,
  onDeleteAttachment,
}: {
  initial?: Partial<Guide>;
  onSave: (data: GuideFormData) => Promise<void>;
  onCancel: () => void;
  onDeleteAttachment?: (attachmentId: string) => Promise<void>;
}) => {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    content: initial?.content ?? "",
    category: initial?.category ?? "logement",
    isPinned: initial?.isPinned ?? false,
  });
  const [files, setFiles] = useState<File[]>([]);
  // Pré-remplir les liens existants (mode édition)
  const [links, setLinks] = useState<LinkEntry[]>(
    initial?.attachments
      ?.filter((a) => a.type === "link")
      .map((a) => ({ url: a.url, name: a.name ?? a.url })) ?? [],
  );
  const [linkInput, setLinkInput] = useState({ url: "", name: "" });
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSave = async () => {
    setSaving(true);
    setFormErrors({});
    try {
      await onSave({ ...form, files, links });
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
          mapped[field] = (messages as string[])[0];
        }
        setFormErrors(mapped);
      } else if (data?.message) {
        setFormErrors({ _global: data.message });
      } else {
        setFormErrors({ _global: "Une erreur est survenue, réessaie." });
      }
    } finally {
      setSaving(false);
    }
  };

  const totalSources = files.length + links.length;

  return (
    <div
      style={{
        background: "#F9FAFB",
        borderRadius: 12,
        padding: 20,
        border: "1.5px solid #e5e7eb",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
              marginBottom: 4,
            }}
          >
            {formErrors._global}
          </div>
        )}

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
                  const n = { ...prev };
                  delete n.title;
                  return n;
                });
            }}
            placeholder="Ex : Comment ouvrir un compte bancaire en France"
            aria-invalid={!!formErrors.title}
            aria-describedby={formErrors.title ? "error-gtitle" : undefined}
            style={{
              ...fInputStyle,
              borderColor: formErrors.title ? "#DC2626" : "#e5e7eb",
            }}
          />
          {formErrors.title && (
            <p
              id="error-gtitle"
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
            gap: 10,
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
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              style={{ ...fInputStyle, background: "#fff", cursor: "pointer" }}
            >
              {GUIDE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
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
              background: form.isPinned ? "#E1F5EE" : "#fff",
              whiteSpace: "nowrap",
              userSelect: "none",
            }}
          >
            <input
              type="checkbox"
              checked={form.isPinned}
              onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
              style={{ display: "none" }}
            />
            <Pin
              size={14}
              color={form.isPinned ? "#085041" : "#aaa"}
              aria-hidden="true"
            />
            <span
              style={{
                color: form.isPinned ? "#085041" : "#555",
                fontWeight: form.isPinned ? 600 : 400,
              }}
            >
              Épingler
            </span>
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
                  const n = { ...prev };
                  delete n.content;
                  return n;
                });
            }}
            placeholder="Rédige le guide étape par étape..."
            rows={10}
            aria-invalid={!!formErrors.content}
            aria-describedby={formErrors.content ? "error-gcontent" : undefined}
            style={{
              ...fInputStyle,
              borderColor: formErrors.content ? "#DC2626" : "#e5e7eb",
              resize: "vertical",
              fontFamily: "inherit",
              lineHeight: 1.7,
            }}
          />
          {formErrors.content && (
            <p
              id="error-gcontent"
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

        {/* Pièces jointes existantes (mode édition) */}
        {initial?.attachments &&
          initial.attachments.length > 0 &&
          onDeleteAttachment &&
          (() => {
            const existingImages = initial.attachments!.filter(
              (a) => a.type === "image",
            );
            const existingDocs = initial.attachments!.filter(
              (a) => a.type === "document",
            );
            const existingLinks = initial.attachments!.filter(
              (a) => a.type === "link",
            );
            const hasAny =
              existingImages.length > 0 ||
              existingDocs.length > 0 ||
              existingLinks.length > 0;
            if (!hasAny) return null;
            return (
              <div>
                <p style={fLabelStyle}>Pièces jointes existantes</p>
                {existingImages.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>
                      Images ({existingImages.length})
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {existingImages.map((img) => (
                        <div
                          key={img.id}
                          style={{
                            position: "relative",
                            width: 80,
                            height: 80,
                            flexShrink: 0,
                          }}
                        >
                          <a
                            href={img.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "block",
                              width: "100%",
                              height: "100%",
                              borderRadius: 8,
                              overflow: "hidden",
                              border: "1.5px solid #e5e7eb",
                            }}
                          >
                            <img
                              src={img.url}
                              alt={img.name ?? ""}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          </a>
                          <button
                            onClick={() => onDeleteAttachment(img.id)}
                            aria-label="Supprimer"
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
                      ))}
                    </div>
                  </div>
                )}
                {existingDocs.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>
                      Documents ({existingDocs.length})
                    </p>
                    {existingDocs.map((doc) => (
                      <div
                        key={doc.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 12px",
                          background: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: 8,
                          marginBottom: 6,
                        }}
                      >
                        <FileText
                          size={14}
                          color="#5B21B6"
                          aria-hidden="true"
                        />
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: 12,
                            color: "#0a1d52",
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            textDecoration: "none",
                          }}
                        >
                          {doc.name ?? "Document"}
                        </a>
                        <button
                          onClick={() => onDeleteAttachment(doc.id)}
                          aria-label="Supprimer"
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#DC2626",
                            flexShrink: 0,
                          }}
                        >
                          <X size={13} aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {existingLinks.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>
                      Liens ({existingLinks.length})
                    </p>
                    {existingLinks.map((lnk) => (
                      <div
                        key={lnk.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 12px",
                          background: "#F0F9FF",
                          border: "1px solid #BAE6FD",
                          borderRadius: 8,
                          marginBottom: 6,
                        }}
                      >
                        <ExternalLink
                          size={14}
                          color="#0EA5E9"
                          aria-hidden="true"
                        />
                        <a
                          href={lnk.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#0369A1",
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            textDecoration: "none",
                          }}
                        >
                          {lnk.name ?? lnk.url}
                        </a>
                        <button
                          onClick={() => onDeleteAttachment(lnk.id)}
                          aria-label="Supprimer"
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#DC2626",
                            flexShrink: 0,
                          }}
                        >
                          <X size={13} aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

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
                    <FileText size={28} color="#6B7280" aria-hidden="true" />
                  )}
                  <button
                    onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}
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
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
                <ExternalLink size={13} color="#0EA5E9" aria-hidden="true" />
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
                  onClick={() => setLinks((p) => p.filter((_, j) => j !== i))}
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
              background: "#fff",
              border: "1.5px solid #e5e7eb",
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label htmlFor="guide-link-url" style={{ display: "none" }}>
                URL
              </label>
              <input
                id="guide-link-url"
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
              <label htmlFor="guide-link-name" style={{ display: "none" }}>
                Label
              </label>
              <input
                id="guide-link-name"
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
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                cursor: files.length >= 5 ? "not-allowed" : "pointer",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 6,
                opacity: files.length >= 5 ? 0.4 : 1,
                minHeight: 40,
              }}
            >
              <Paperclip size={13} aria-hidden="true" /> Photo / Document{" "}
              {files.length > 0 && `(${files.length}/5)`}
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
              <LinkIcon size={13} aria-hidden="true" /> Ajouter un lien
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
            JPG, PNG, PDF, Word · Max 10 MB · Max 5 fichiers
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "10px 20px",
              background: "#1D9E75",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
              opacity: saving ? 0.6 : 1,
              minHeight: 44,
            }}
          >
            <Send size={13} aria-hidden="true" />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
          <button
            onClick={onCancel}
            style={{
              padding: "10px 20px",
              background: "#f3f4f6",
              color: "#555",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              cursor: "pointer",
              minHeight: 44,
            }}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// ScamDetailPanel
// ---------------------------------------------------------------------------
const ScamDetailPanel = ({
  scam,
  onValidate,
  onReject,
  onDelete,
  onClose,
}: {
  scam: ScamReport;
  onValidate: () => void;
  onReject: () => void;
  onDelete: () => void;
  onClose: () => void;
}) => {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const images = scam.attachments.filter((a) => a.type === "image");
  const docs = scam.attachments.filter((a) => a.type === "document");
  const links = scam.attachments.filter((a) => a.type === "link");
  const colors = CATEGORY_COLORS[scam.category] ?? CATEGORY_COLORS.autre;
  return (
    <div
      style={{
        flex: 1,
        background: "#fff",
        borderRadius: 14,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #f3f4f6",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#0a1d52",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Détail du signalement
        </span>
        <button
          onClick={onClose}
          aria-label="Fermer le détail"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#aaa",
          }}
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              background: colors.bg,
              color: colors.color,
              padding: "3px 10px",
              borderRadius: 50,
              textTransform: "capitalize",
            }}
          >
            {scam.category}
          </span>
          <span style={{ fontSize: 11, color: "#aaa" }}>
            par{" "}
            <strong style={{ color: "#555" }}>{scam.reporter.username}</strong>{" "}
            · {new Date(scam.createdAt).toLocaleDateString("fr-FR")}
          </span>
        </div>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#0a1d52",
            margin: "0 0 14px",
          }}
        >
          {scam.title}
        </h2>
        <div
          style={{
            background: "#F9FAFB",
            borderRadius: 10,
            padding: "14px 16px",
            marginBottom: 16,
          }}
        >
          <p
            style={{
              fontSize: 14,
              color: "#444",
              lineHeight: 1.75,
              margin: 0,
              whiteSpace: "pre-wrap",
            }}
          >
            {stripMarkdown(scam.description)}
          </p>
        </div>
        {images.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#555",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 10,
              }}
            >
              Photos ({images.length})
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                gap: 8,
              }}
            >
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setLightboxIdx(i)}
                  aria-label={`Agrandir ${img.name ?? `Photo ${i + 1}`}`}
                  style={{
                    height: 90,
                    borderRadius: 8,
                    overflow: "hidden",
                    cursor: "pointer",
                    background: "#f3f4f6",
                    border: "none",
                    padding: 0,
                  }}
                >
                  <img
                    src={img.url}
                    alt={img.name ?? `Photo ${i + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
        {docs.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#555",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 10,
              }}
            >
              Documents ({docs.length})
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {docs.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${doc.name ?? "Document"} (nouvelle fenêtre)`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    background: "#F9FAFB",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    textDecoration: "none",
                  }}
                >
                  <FileText size={16} color="#5B21B6" aria-hidden="true" />
                  <span
                    style={{
                      fontSize: 13,
                      color: "#0a1d52",
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {doc.name ?? "Document"}
                  </span>
                  <ExternalLink size={12} color="#aaa" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        )}
        {links.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#555",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 10,
              }}
            >
              Liens ({links.length})
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {links.map((lnk) => (
                <a
                  key={lnk.id}
                  href={lnk.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${lnk.name ?? lnk.url} (nouvelle fenêtre)`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    background: "#F0F9FF",
                    border: "1px solid #BAE6FD",
                    borderRadius: 8,
                    textDecoration: "none",
                  }}
                >
                  <ExternalLink size={16} color="#0EA5E9" aria-hidden="true" />
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#0369A1",
                      margin: 0,
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {lnk.name ?? lnk.url}
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
      <div
        style={{
          padding: "14px 20px",
          borderTop: "1px solid #f3f4f6",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <button
          onClick={onValidate}
          style={{
            padding: "10px 0",
            background: "#1D9E75",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            cursor: "pointer",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            minHeight: 44,
          }}
        >
          <Check size={14} aria-hidden="true" /> Valider et publier
        </button>
        <button
          onClick={onReject}
          style={{
            padding: "10px 0",
            background: "#FEE2E2",
            color: "#DC2626",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            cursor: "pointer",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            minHeight: 44,
          }}
        >
          <X size={14} aria-hidden="true" /> Rejeter
        </button>
        <button
          onClick={onDelete}
          style={{
            padding: "10px 0",
            background: "transparent",
            color: "#aaa",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            fontSize: 12,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            minHeight: 40,
          }}
        >
          <Trash2 size={12} aria-hidden="true" /> Supprimer
        </button>
      </div>
      {lightboxIdx !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Galerie"
          onClick={() => setLightboxIdx(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.9)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <button
            onClick={() => setLightboxIdx(null)}
            aria-label="Fermer"
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: "50%",
              width: 36,
              height: 36,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} color="#fff" aria-hidden="true" />
          </button>
          <img
            src={images[lightboxIdx].url}
            alt=""
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "88vw",
              maxHeight: "85vh",
              objectFit: "contain",
              borderRadius: 8,
            }}
          />
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIdx(
                    (i) => ((i ?? 0) - 1 + images.length) % images.length,
                  );
                }}
                aria-label="Précédent"
                style={{
                  position: "absolute",
                  left: 16,
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  borderRadius: "50%",
                  width: 40,
                  height: 40,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChevronLeft size={20} color="#fff" aria-hidden="true" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIdx((i) => ((i ?? 0) + 1) % images.length);
                }}
                aria-label="Suivant"
                style={{
                  position: "absolute",
                  right: 16,
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  borderRadius: "50%",
                  width: 40,
                  height: 40,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChevronRight size={20} color="#fff" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// TipDetailPanel
// ---------------------------------------------------------------------------
const TipDetailPanel = ({
  tip,
  onApprove,
  onReject,
  onDelete,
  onClose,
}: {
  tip: Tip;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
  onClose: () => void;
}) => {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const images = tip.attachments.filter((a) => a.type === "image");
  const docs = tip.attachments.filter((a) => a.type === "document");
  const links = tip.attachments.filter((a) => a.type === "link");
  return (
    <div
      style={{
        flex: 1,
        background: "#fff",
        borderRadius: 14,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #f3f4f6",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#0a1d52",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Détail du contenu
        </span>
        <button
          onClick={onClose}
          aria-label="Fermer le détail"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#aaa",
          }}
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
            background: "#F9FAFB",
            borderRadius: 10,
            padding: "10px 12px",
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
              fontSize: 14,
              fontWeight: 700,
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            {tip.author.username[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                margin: 0,
                color: "#0a1d52",
              }}
            >
              {tip.author.username}
            </p>
            <p style={{ fontSize: 11, color: "#aaa", margin: 0 }}>
              {tip.author.originTerritory}
            </p>
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              background: tip.type === "tip" ? "#FAEEDA" : "#E6F1FB",
              color: tip.type === "tip" ? "#633806" : "#0C447C",
              padding: "3px 8px",
              borderRadius: 50,
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            {tip.type === "tip" ? (
              <>
                <Lightbulb size={10} aria-hidden="true" /> Bon plan
              </>
            ) : (
              <>
                <BookOpen size={10} aria-hidden="true" /> Témoignage
              </>
            )}
          </span>
        </div>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#0a1d52",
            margin: "0 0 6px",
          }}
        >
          {tip.title}
        </h2>
        <p style={{ fontSize: 12, color: "#aaa", marginBottom: 14 }}>
          {new Date(tip.createdAt).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <div
          style={{
            background: "#F9FAFB",
            borderRadius: 10,
            padding: "14px 16px",
            marginBottom: 16,
          }}
        >
          <p
            style={{
              fontSize: 14,
              color: "#444",
              lineHeight: 1.75,
              margin: 0,
              whiteSpace: "pre-wrap",
            }}
          >
            {stripMarkdown(tip.content)}
          </p>
        </div>
        {images.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#555",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 10,
              }}
            >
              Photos ({images.length})
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                gap: 8,
              }}
            >
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setLightboxIdx(i)}
                  aria-label={`Agrandir ${img.name ?? `Photo ${i + 1}`}`}
                  style={{
                    height: 90,
                    borderRadius: 8,
                    overflow: "hidden",
                    cursor: "pointer",
                    background: "#f3f4f6",
                    border: "none",
                    padding: 0,
                  }}
                >
                  <img
                    src={img.url}
                    alt={img.name ?? `Photo ${i + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
        {docs.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#555",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 10,
              }}
            >
              Documents ({docs.length})
            </p>
            {docs.map((doc) => (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${doc.name ?? "Document"} (nouvelle fenêtre)`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  background: "#F9FAFB",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  textDecoration: "none",
                  marginBottom: 6,
                }}
              >
                <FileText size={16} color="#5B21B6" aria-hidden="true" />
                <span
                  style={{
                    fontSize: 13,
                    color: "#0a1d52",
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {doc.name ?? "Document"}
                </span>
                <ExternalLink size={12} color="#aaa" aria-hidden="true" />
              </a>
            ))}
          </div>
        )}
        {links.length > 0 && (
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#555",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 10,
              }}
            >
              Liens ({links.length})
            </p>
            {links.map((lnk) => (
              <a
                key={lnk.id}
                href={lnk.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${lnk.name ?? lnk.url} (nouvelle fenêtre)`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  background: "#F0F9FF",
                  border: "1px solid #BAE6FD",
                  borderRadius: 8,
                  textDecoration: "none",
                  marginBottom: 6,
                }}
              >
                <ExternalLink size={16} color="#0EA5E9" aria-hidden="true" />
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#0369A1",
                    margin: 0,
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {lnk.name ?? lnk.url}
                </p>
              </a>
            ))}
          </div>
        )}
      </div>
      <div
        style={{
          padding: "14px 20px",
          borderTop: "1px solid #f3f4f6",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <button
          onClick={onApprove}
          style={{
            padding: "10px 0",
            background: "#1D9E75",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            cursor: "pointer",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            minHeight: 44,
          }}
        >
          <Check size={14} aria-hidden="true" /> Approuver
        </button>
        <button
          onClick={onReject}
          style={{
            padding: "10px 0",
            background: "#FEE2E2",
            color: "#DC2626",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            cursor: "pointer",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            minHeight: 44,
          }}
        >
          <X size={14} aria-hidden="true" /> Refuser
        </button>
        <button
          onClick={onDelete}
          style={{
            padding: "10px 0",
            background: "transparent",
            color: "#aaa",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            fontSize: 12,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            minHeight: 40,
          }}
        >
          <Trash2 size={12} aria-hidden="true" /> Supprimer
        </button>
      </div>
      {lightboxIdx !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Galerie"
          onClick={() => setLightboxIdx(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.9)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <button
            onClick={() => setLightboxIdx(null)}
            aria-label="Fermer"
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: "50%",
              width: 36,
              height: 36,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} color="#fff" aria-hidden="true" />
          </button>
          <img
            src={images[lightboxIdx].url}
            alt=""
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "88vw",
              maxHeight: "85vh",
              objectFit: "contain",
              borderRadius: 8,
            }}
          />
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIdx(
                    (i) => ((i ?? 0) - 1 + images.length) % images.length,
                  );
                }}
                aria-label="Précédent"
                style={{
                  position: "absolute",
                  left: 16,
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  borderRadius: "50%",
                  width: 40,
                  height: 40,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChevronLeft size={20} color="#fff" aria-hidden="true" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIdx((i) => ((i ?? 0) + 1) % images.length);
                }}
                aria-label="Suivant"
                style={{
                  position: "absolute",
                  right: 16,
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  borderRadius: "50%",
                  width: 40,
                  height: 40,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChevronRight size={20} color="#fff" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// TipForm — formulaire création tip/témoignage (admin) avec fichiers + liens
// ---------------------------------------------------------------------------
const TIP_CATEGORIES_FORM = ["tip", "testimonial"] as const;

const TipForm = ({
  onSave,
  onCancel,
}: {
  onSave: (data: {
    title: string;
    content: string;
    type: string;
    files: File[];
    links: LinkEntry[];
  }) => Promise<void>;
  onCancel: () => void;
}) => {
  const [form, setForm] = useState({ title: "", content: "", type: "tip" });
  const [files, setFiles] = useState<File[]>([]);
  const [links, setLinks] = useState<LinkEntry[]>([]);
  const [linkInput, setLinkInput] = useState({ url: "", name: "" });
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSave = async () => {
    setSaving(true);
    setFormErrors({});
    try {
      await onSave({ ...form, files, links });
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: {
          data?: { errors?: Record<string, string[]>; message?: string };
        };
      };
      const data = axiosErr?.response?.data;
      if (data?.errors) {
        const mapped: Record<string, string> = {};
        for (const [field, messages] of Object.entries(data.errors))
          mapped[field] = (messages as string[])[0];
        setFormErrors(mapped);
      } else if (data?.message) {
        setFormErrors({ _global: data.message });
      } else {
        setFormErrors({ _global: "Une erreur est survenue, réessaie." });
      }
    } finally {
      setSaving(false);
    }
  };

  const totalSources = files.length + links.length;

  return (
    <div
      style={{
        background: "#F9FAFB",
        borderRadius: 12,
        padding: 20,
        border: "1.5px solid #e5e7eb",
        marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
            }}
          >
            {formErrors._global}
          </div>
        )}

        {/* Type */}
        <div>
          <p style={fLabelStyle}>Type *</p>
          <div style={{ display: "flex", gap: 8 }}>
            {TIP_CATEGORIES_FORM.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={form.type === t}
                onClick={() => setForm({ ...form, type: t })}
                style={{
                  padding: "6px 16px",
                  borderRadius: 50,
                  fontSize: 12,
                  fontWeight: form.type === t ? 600 : 400,
                  border:
                    form.type === t
                      ? "1.5px solid #1D9E75"
                      : "1.5px solid #e5e7eb",
                  background: form.type === t ? "#1D9E75" : "#f9fafb",
                  color: form.type === t ? "#fff" : "#555",
                  cursor: "pointer",
                  minHeight: 36,
                }}
              >
                {t === "tip" ? "Bon plan" : "Témoignage"}
              </button>
            ))}
          </div>
        </div>

        {/* Titre */}
        <div>
          <label htmlFor="tip-form-title" style={fLabelStyle}>
            Titre *
          </label>
          <input
            id="tip-form-title"
            value={form.title}
            onChange={(e) => {
              setForm({ ...form, title: e.target.value });
              if (formErrors.title)
                setFormErrors((p) => {
                  const n = { ...p };
                  delete n.title;
                  return n;
                });
            }}
            placeholder="Ex : Comment trouver une coloc rapidement"
            aria-invalid={!!formErrors.title}
            aria-describedby={formErrors.title ? "error-tf-title" : undefined}
            style={{
              ...fInputStyle,
              borderColor: formErrors.title ? "#DC2626" : "#e5e7eb",
            }}
          />
          {formErrors.title && (
            <p
              id="error-tf-title"
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
          <label htmlFor="tip-form-content" style={fLabelStyle}>
            Contenu *
          </label>
          <textarea
            id="tip-form-content"
            value={form.content}
            rows={6}
            onChange={(e) => {
              setForm({ ...form, content: e.target.value });
              if (formErrors.content)
                setFormErrors((p) => {
                  const n = { ...p };
                  delete n.content;
                  return n;
                });
            }}
            placeholder="Raconte ton expérience, partage ton conseil..."
            aria-invalid={!!formErrors.content}
            aria-describedby={
              formErrors.content ? "error-tf-content" : undefined
            }
            style={{
              ...fInputStyle,
              borderColor: formErrors.content ? "#DC2626" : "#e5e7eb",
              resize: "vertical",
              fontFamily: "inherit",
              lineHeight: 1.7,
            }}
          />
          {formErrors.content && (
            <p
              id="error-tf-content"
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
                    <FileText size={28} color="#6B7280" aria-hidden="true" />
                  )}
                  <button
                    onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}
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
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
                <ExternalLink size={13} color="#0EA5E9" aria-hidden="true" />
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
                  onClick={() => setLinks((p) => p.filter((_, j) => j !== i))}
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
              background: "#fff",
              border: "1.5px solid #e5e7eb",
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input
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
              <input
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
            Ressources
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
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                cursor: files.length >= 5 ? "not-allowed" : "pointer",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 6,
                opacity: files.length >= 5 ? 0.4 : 1,
                minHeight: 40,
              }}
            >
              <Paperclip size={13} aria-hidden="true" /> Photo / Document{" "}
              {files.length > 0 && `(${files.length}/5)`}
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
              <LinkIcon size={13} aria-hidden="true" /> Ajouter un lien
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
            JPG, PNG, PDF, Word · Max 10 MB · Max 5 fichiers
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "10px 20px",
              background: "#1D9E75",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
              opacity: saving ? 0.6 : 1,
              minHeight: 44,
            }}
          >
            <Send size={13} aria-hidden="true" />{" "}
            {saving ? "Enregistrement..." : "Publier"}
          </button>
          <button
            onClick={onCancel}
            style={{
              padding: "10px 20px",
              background: "#f3f4f6",
              color: "#555",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              cursor: "pointer",
              minHeight: 44,
            }}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// ScamForm — formulaire création signalement arnaque (admin)
// ---------------------------------------------------------------------------
const SCAM_CATEGORIES_FORM = [
  "logement",
  "banque",
  "emploi",
  "telephone",
  "identite",
  "autre",
] as const;

const ScamForm = ({
  onSave,
  onCancel,
}: {
  onSave: (data: {
    title: string;
    description: string;
    category: string;
    files: File[];
    links: LinkEntry[];
  }) => Promise<void>;
  onCancel: () => void;
}) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "logement",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [links, setLinks] = useState<LinkEntry[]>([]);
  const [linkInput, setLinkInput] = useState({ url: "", name: "" });
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSave = async () => {
    setSaving(true);
    setFormErrors({});
    try {
      await onSave({ ...form, files, links });
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
          mapped[field] = (messages as string[])[0];
        }
        setFormErrors(mapped);
      } else if (data?.message) {
        setFormErrors({ _global: data.message });
      } else {
        setFormErrors({ _global: "Une erreur est survenue, réessaie." });
      }
    } finally {
      setSaving(false);
    }
  };

  const totalSources = files.length + links.length;

  return (
    <div
      style={{
        background: "#F9FAFB",
        borderRadius: 12,
        padding: 20,
        border: "1.5px solid #e5e7eb",
        marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
            }}
          >
            {formErrors._global}
          </div>
        )}

        {/* Titre */}
        <div>
          <label htmlFor="scam-form-title" style={fLabelStyle}>
            Titre *
          </label>
          <input
            id="scam-form-title"
            value={form.title}
            onChange={(e) => {
              setForm({ ...form, title: e.target.value });
              if (formErrors.title)
                setFormErrors((p) => {
                  const n = { ...p };
                  delete n.title;
                  return n;
                });
            }}
            placeholder="Ex : Faux propriétaire sur LeBonCoin"
            aria-invalid={!!formErrors.title}
            aria-describedby={formErrors.title ? "error-sf-title" : undefined}
            style={{
              ...fInputStyle,
              borderColor: formErrors.title ? "#DC2626" : "#e5e7eb",
            }}
          />
          {formErrors.title && (
            <p
              id="error-sf-title"
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
            style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}
          >
            {SCAM_CATEGORIES_FORM.map((cat) => {
              const active = form.category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setForm({ ...form, category: cat })}
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
                    textTransform: "capitalize",
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Description */}
        <div>
          <label htmlFor="scam-form-desc" style={fLabelStyle}>
            Description *
          </label>
          <textarea
            id="scam-form-desc"
            value={form.description}
            onChange={(e) => {
              setForm({ ...form, description: e.target.value });
              if (formErrors.description)
                setFormErrors((p) => {
                  const n = { ...p };
                  delete n.description;
                  return n;
                });
            }}
            placeholder="Décris l'arnaque en détail..."
            rows={6}
            aria-invalid={!!formErrors.description}
            aria-describedby={
              formErrors.description ? "error-sf-desc" : undefined
            }
            style={{
              ...fInputStyle,
              borderColor: formErrors.description ? "#DC2626" : "#e5e7eb",
              resize: "vertical",
              fontFamily: "inherit",
              lineHeight: 1.7,
            }}
          />
          {formErrors.description && (
            <p
              id="error-sf-desc"
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
          <MarkdownLegend />
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
                    <FileText size={28} color="#6B7280" aria-hidden="true" />
                  )}
                  <button
                    onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}
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
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
                <ExternalLink size={13} color="#0EA5E9" aria-hidden="true" />
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
                  onClick={() => setLinks((p) => p.filter((_, j) => j !== i))}
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
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label htmlFor="scam-link-url" style={{ display: "none" }}>
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
              <label htmlFor="scam-link-name" style={{ display: "none" }}>
                Label
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
            Preuves / ressources
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
              <Paperclip size={13} aria-hidden="true" /> Photo / Document{" "}
              {files.length > 0 && `(${files.length}/5)`}
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
              <LinkIcon size={13} aria-hidden="true" /> Ajouter un lien
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
            JPG, PNG, PDF, Word · Max 10 MB · Max 5 fichiers
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "10px 20px",
              background: "#DC2626",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
              opacity: saving ? 0.6 : 1,
              minHeight: 44,
            }}
          >
            <Send size={13} aria-hidden="true" />{" "}
            {saving ? "Enregistrement..." : "Publier"}
          </button>
          <button
            onClick={onCancel}
            style={{
              padding: "10px 20px",
              background: "#f3f4f6",
              color: "#555",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              cursor: "pointer",
              minHeight: 44,
            }}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// AdminDashboard
// ---------------------------------------------------------------------------
export const AdminDashboard = () => {
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [tab, setTab] = useState<Tab>("overview");
  const [subTab, setSubTab] = useState<SubTab>("scams");
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [scams, setScams] = useState<ScamReport[]>([]);
  const [tips, setTips] = useState<Tip[]>([]);
  const [selectedScam, setSelectedScam] = useState<ScamReport | null>(null);
  const [selectedTip, setSelectedTip] = useState<Tip | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [guidesLoading, setGuidesLoading] = useState(false);
  const [guideSearch, setGuideSearch] = useState("");
  const [showGuideForm, setShowGuideForm] = useState(false);
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [publishedTips, setPublishedTips] = useState<Tip[]>([]);
  const [publishedTipsLoading, setPublishedTipsLoading] = useState(false);
  const [publishedScams, setPublishedScams] = useState<ScamReport[]>([]);
  const [publishedScamsLoading, setPublishedScamsLoading] = useState(false);
  const [editingTip, setEditingTip] = useState<Tip | null>(null);
  const [editingScam, setEditingScam] = useState<ScamReport | null>(null);
  const [showTipForm, setShowTipForm] = useState(false);
  const [showScamForm, setShowScamForm] = useState(false);
  const [tipSearch, setTipSearch] = useState("");
  const [scamSearch, setScamSearch] = useState("");

  useEffect(() => {
    api
      .get("/admin/stats")
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setStatsLoading(false));
  }, []);

  useEffect(() => {
    if (tab !== "moderation") return;
    if (subTab === "scams")
      api
        .get("/admin/scam/pending")
        .then((r) => setScams(r.data))
        .catch(console.error);
    if (subTab === "tips")
      api
        .get("/admin/tips/pending")
        .then((r) => setTips(r.data))
        .catch(console.error);
  }, [tab, subTab]);

  useEffect(() => {
    if (tab !== "published_tips") return;
    let cancelled = false;
    const tid = setTimeout(() => {
      if (!cancelled) setPublishedTipsLoading(true);
    }, 0);
    api
      .get("/tips?isApproved=true&limit=100")
      .then((r) => {
        if (!cancelled)
          setPublishedTips(
            Array.isArray(r.data)
              ? r.data.filter((t: Tip) => t.isApproved)
              : [],
          );
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setPublishedTipsLoading(false);
        clearTimeout(tid);
      });
    return () => {
      cancelled = true;
      clearTimeout(tid);
    };
  }, [tab]);

  useEffect(() => {
    if (tab !== "published_scams") return;
    let cancelled = false;
    const sid = setTimeout(() => {
      if (!cancelled) setPublishedScamsLoading(true);
    }, 0);
    api
      .get("/admin/scam/all")
      .then((r) => {
        if (!cancelled)
          setPublishedScams(
            Array.isArray(r.data)
              ? r.data.filter((s: ScamReport) => s.status === "verified")
              : [],
          );
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setPublishedScamsLoading(false);
        clearTimeout(sid);
      });
    return () => {
      cancelled = true;
      clearTimeout(sid);
    };
  }, [tab]);

  useEffect(() => {
    if (tab !== "guides") return;
    let cancelled = false;
    const gid = setTimeout(() => {
      if (!cancelled) setGuidesLoading(true);
    }, 0);
    api
      .get("/admin/posts")
      .then((r) => {
        if (!cancelled) setGuides(r.data);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setGuidesLoading(false);
        clearTimeout(gid);
      });
    return () => {
      cancelled = true;
      clearTimeout(gid);
    };
  }, [tab]);

  useEffect(() => {
    if (tab !== "users") return;
    let cancelled = false;
    const uid = setTimeout(() => {
      if (!cancelled) setUsersLoading(true);
    }, 0);
    api
      .get("/admin/users")
      .then((r) => {
        if (!cancelled) setUsers(r.data);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setUsersLoading(false);
        clearTimeout(uid);
      });
    return () => {
      cancelled = true;
      clearTimeout(uid);
    };
  }, [tab]);

  // --- Handlers ---
  const handleScam = async (id: string, status: "verified" | "rejected") => {
    await api.patch(`/admin/scam/${id}/status`, { status });
    setScams((s) => s.filter((r) => r.id !== id));
    setStats((s) => (s ? { ...s, pendingScams: s.pendingScams - 1 } : s));
    setSelectedScam(null);
  };
  const handleDeleteScam = async (id: string) => {
    await api.delete(`/admin/scam/${id}`);
    setScams((s) => s.filter((r) => r.id !== id));
    setSelectedScam(null);
  };
  const handleTip = async (id: string, isApproved: boolean) => {
    await api.patch(`/admin/tips/${id}/status`, { isApproved });
    setTips((t) => t.filter((r) => r.id !== id));
    setStats((s) => (s ? { ...s, pendingTips: s.pendingTips - 1 } : s));
    setSelectedTip(null);
  };
  const handleDeleteTip = async (id: string) => {
    await api.delete(`/admin/tips/${id}`);
    setTips((t) => t.filter((r) => r.id !== id));
    setSelectedTip(null);
  };

  // Création guide — envoie en multipart si fichiers présents
  const handleCreateGuide = async (data: GuideFormData) => {
    const { files, links, ...fields } = data;
    const hasFiles = files && files.length > 0;
    const hasLinks = links && links.length > 0;

    let r;
    if (hasFiles || hasLinks) {
      const fd = new FormData();
      Object.entries(fields).forEach(([k, v]) => fd.append(k, String(v)));
      if (hasLinks) fd.append("links", JSON.stringify(links));
      files?.forEach((f) => fd.append("files", f));
      r = await api.post("/admin/posts", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } else {
      r = await api.post("/admin/posts", fields);
    }
    setGuides((g) => [r.data, ...g]);
    setShowGuideForm(false);
    setStats((s) => (s ? { ...s, posts: s.posts + 1 } : s));
  };

  const handleDeleteGuide = async (id: string) => {
    if (!window.confirm("Supprimer ce guide ?")) return;
    await api.delete(`/admin/posts/${id}`);
    setGuides((g) => g.filter((guide) => guide.id !== id));
    setStats((s) => (s ? { ...s, posts: s.posts - 1 } : s));
  };
  const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
    await api.patch(`/admin/users/${userId}/admin`, { isAdmin });
    setUsers((u) =>
      u.map((user) => (user.id === userId ? { ...user, isAdmin } : user)),
    );
    if (selectedUser?.id === userId)
      setSelectedUser((u) => (u ? { ...u, isAdmin } : u));
  };
  const handleCreateTip = async (data: {
    title: string;
    content: string;
    type: string;
  }) => {
    const fd = new FormData();
    fd.append("title", data.title);
    fd.append("content", data.content);
    fd.append("type", data.type);
    const r = await api.post("/tips", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setPublishedTips((t) => [r.data, ...t]);
    setShowTipForm(false);
  };

  const handleCreateScam = async (data: {
    title: string;
    description: string;
    category: string;
    files?: File[];
    links?: LinkEntry[];
  }) => {
    const fd = new FormData();
    fd.append("title", data.title);
    fd.append("description", data.description);
    fd.append("category", data.category);
    if (data.links && data.links.length > 0)
      fd.append("links", JSON.stringify(data.links));
    data.files?.forEach((f) => fd.append("files", f));
    const r = await api.post("/scam", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setPublishedScams((s) => [r.data, ...s]);
    setShowScamForm(false);
  };

  const handleDeletePublishedTip = async (id: string) => {
    if (!window.confirm("Supprimer ce tip ?")) return;
    await api.delete(`/admin/tips/${id}`);
    setPublishedTips((t) => t.filter((r) => r.id !== id));
  };
  const handleDeletePublishedScam = async (id: string) => {
    if (!window.confirm("Supprimer ce signalement ?")) return;
    await api.delete(`/admin/scam/${id}`);
    setPublishedScams((s) => s.filter((r) => r.id !== id));
  };
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Supprimer cet utilisateur ?")) return;
    await api.delete(`/admin/users/${userId}`);
    setUsers((u) => u.filter((user) => user.id !== userId));
    setSelectedUser(null);
    setStats((s) => (s ? { ...s, users: s.users - 1 } : s));
  };

  const TABS = [
    { key: "overview", label: "Vue d'ensemble" },
    {
      key: "moderation",
      label: `Modération (${(stats?.pendingScams ?? 0) + (stats?.pendingTips ?? 0)})`,
    },
    { key: "guides", label: "Guides" },
    { key: "published_tips", label: "Tips publiés" },
    { key: "published_scams", label: "Arnaques publiées" },
    { key: "users", label: "Utilisateurs" },
  ] as const;

  const filteredGuides = guides.filter(
    (g) =>
      g.title.toLowerCase().includes(guideSearch.toLowerCase()) ||
      g.category.toLowerCase().includes(guideSearch.toLowerCase()),
  );
  const filteredPublishedTips = publishedTips.filter(
    (t) =>
      t.title.toLowerCase().includes(tipSearch.toLowerCase()) ||
      t.author.username.toLowerCase().includes(tipSearch.toLowerCase()),
  );
  const filteredPublishedScams = publishedScams.filter(
    (s) =>
      s.title.toLowerCase().includes(scamSearch.toLowerCase()) ||
      s.description.toLowerCase().includes(scamSearch.toLowerCase()),
  );
  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()),
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
                flexWrap: "wrap",
                gap: 16,
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
                  Administration
                </p>
                <h1
                  style={{
                    color: "#fff",
                    fontSize: isMobile ? 26 : "clamp(26px, 4vw, 36px)",
                    fontWeight: 800,
                    margin: 0,
                    letterSpacing: "-1px",
                  }}
                >
                  Dashboard Admin
                </h1>
                <p
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 15,
                    marginTop: 8,
                  }}
                >
                  Gestion et modération de la plateforme.
                </p>
              </div>
              <span
                style={{
                  padding: "6px 14px",
                  background: "rgba(220,38,38,0.2)",
                  color: "#FCA5A5",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  border: "1px solid rgba(220,38,38,0.3)",
                  alignSelf: "flex-start",
                  marginTop: 8,
                }}
              >
                ADMIN
              </span>
            </div>

            {/* Tabs */}
            <div
              role="tablist"
              aria-label="Sections d'administration"
              style={{
                display: "flex",
                gap: 4,
                marginBottom: 28,
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
                    onClick={() => setTab(key as Tab)}
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
                      transition: "all 0.15s",
                      minHeight: 36,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* OVERVIEW */}
            {tab === "overview" && (
              <div>
                {statsLoading ? (
                  <p
                    aria-live="polite"
                    style={{
                      textAlign: "center",
                      color: "rgba(255,255,255,0.6)",
                      padding: "40px 0",
                    }}
                  >
                    Chargement...
                  </p>
                ) : (
                  <>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile
                          ? "repeat(2, 1fr)"
                          : "repeat(auto-fill, minmax(160px, 1fr))",
                        gap: 14,
                        marginBottom: 28,
                      }}
                    >
                      {[
                        {
                          label: "Utilisateurs",
                          val: stats?.users,
                          icon: <Users size={20} aria-hidden="true" />,
                          bg: "#E6F1FB",
                          text: "#0C447C",
                        },
                        {
                          label: "Guides publiés",
                          val: stats?.posts,
                          icon: <FileText size={20} aria-hidden="true" />,
                          bg: "#E1F5EE",
                          text: "#085041",
                        },
                        {
                          label: "Tips approuvés",
                          val: stats?.approvedTips,
                          icon: <Lightbulb size={20} aria-hidden="true" />,
                          bg: "#FAEEDA",
                          text: "#633806",
                        },
                        {
                          label: "Arnaques vérifiées",
                          val: stats?.verifiedScams,
                          icon: <ShieldCheck size={20} aria-hidden="true" />,
                          bg: "#D1FAE5",
                          text: "#065F46",
                        },
                        {
                          label: "Arnaques en attente",
                          val: stats?.pendingScams,
                          icon: <AlertTriangle size={20} aria-hidden="true" />,
                          bg: "#FEE2E2",
                          text: "#991B1B",
                        },
                        {
                          label: "Tips en attente",
                          val: stats?.pendingTips,
                          icon: <Clock size={20} aria-hidden="true" />,
                          bg: "#FCEBEB",
                          text: "#791F1F",
                        },
                      ].map(({ label, val, icon, bg, text }) => (
                        <div
                          key={label}
                          style={{
                            background: "#fff",
                            borderRadius: 14,
                            padding: "16px 18px",
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 9,
                              background: bg,
                              color: text,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginBottom: 10,
                            }}
                          >
                            {icon}
                          </div>
                          <p
                            style={{
                              fontSize: 26,
                              fontWeight: 800,
                              margin: 0,
                              color: "#0a1d52",
                            }}
                          >
                            {val ?? "..."}
                          </p>
                          <p
                            style={{
                              fontSize: 12,
                              margin: "3px 0 0",
                              color: "#888",
                            }}
                          >
                            {label}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile
                          ? "1fr"
                          : "repeat(auto-fill, minmax(240px, 1fr))",
                        gap: 12,
                      }}
                    >
                      {[
                        {
                          label: "Modérer les arnaques",
                          count: stats?.pendingScams,
                          dest: "moderation" as Tab,
                          sub: "scams" as SubTab,
                          color: "#DC2626",
                          bg: "#FEE2E2",
                          icon: <AlertTriangle size={16} aria-hidden="true" />,
                        },
                        {
                          label: "Modérer les tips",
                          count: stats?.pendingTips,
                          dest: "moderation" as Tab,
                          sub: "tips" as SubTab,
                          color: "#633806",
                          bg: "#FAEEDA",
                          icon: <Lightbulb size={16} aria-hidden="true" />,
                        },
                        {
                          label: "Gérer les guides",
                          count: stats?.posts,
                          dest: "guides" as Tab,
                          sub: null,
                          color: "#085041",
                          bg: "#E1F5EE",
                          icon: <FileText size={16} aria-hidden="true" />,
                        },
                        {
                          label: "Gérer les utilisateurs",
                          count: stats?.users,
                          dest: "users" as Tab,
                          sub: null,
                          color: "#0C447C",
                          bg: "#E6F1FB",
                          icon: <Users size={16} aria-hidden="true" />,
                        },
                      ].map(({ label, count, dest, sub, color, bg, icon }) => (
                        <button
                          key={dest + label}
                          onClick={() => {
                            setTab(dest);
                            if (sub) setSubTab(sub);
                          }}
                          style={{
                            background: "#fff",
                            borderRadius: 12,
                            padding: "14px 18px",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            textAlign: "left",
                            transition: "box-shadow 0.15s",
                            minHeight: 56,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow =
                              "0 4px 16px rgba(10,29,82,0.12)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          <span
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 8,
                              background: bg,
                              color,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {icon}
                          </span>
                          <span
                            style={{
                              flex: 1,
                              fontSize: 13,
                              color: "#0a1d52",
                              fontWeight: 500,
                            }}
                          >
                            {label}
                          </span>
                          <span
                            style={{ fontSize: 14, fontWeight: 700, color }}
                          >
                            {count ?? 0}
                          </span>
                          <ChevronRight
                            size={14}
                            color="#ccc"
                            aria-hidden="true"
                          />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* MODÉRATION */}
            {tab === "moderation" && (
              <div>
                <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                  {(
                    [
                      {
                        key: "scams",
                        label: `Arnaques (${stats?.pendingScams ?? 0})`,
                      },
                      {
                        key: "tips",
                        label: `Tips (${stats?.pendingTips ?? 0})`,
                      },
                    ] as const
                  ).map(({ key, label }) => {
                    const active = subTab === key;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setSubTab(key);
                          setSelectedScam(null);
                          setSelectedTip(null);
                        }}
                        aria-pressed={active}
                        style={{
                          padding: "7px 16px",
                          borderRadius: 8,
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
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    alignItems: "flex-start",
                    flexDirection: isMobile ? "column" : "row",
                  }}
                >
                  <div
                    style={{
                      width: isMobile ? "100%" : "25%",
                      minWidth: isMobile ? "auto" : 200,
                      flexShrink: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {subTab === "scams" &&
                      (scams.length === 0 ? (
                        <div
                          style={{
                            background: "#fff",
                            borderRadius: 12,
                            padding: "32px 0",
                            textAlign: "center",
                            color: "#aaa",
                            fontSize: 13,
                          }}
                        >
                          ✓ Aucun signalement
                        </div>
                      ) : (
                        scams.map((r) => {
                          const isSelected = selectedScam?.id === r.id;
                          return (
                            <div
                              key={r.id}
                              onClick={() =>
                                setSelectedScam(isSelected ? null : r)
                              }
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  setSelectedScam(isSelected ? null : r);
                              }}
                              aria-pressed={isSelected}
                              style={{
                                background: "#fff",
                                borderRadius: 10,
                                padding: "12px 14px",
                                cursor: "pointer",
                                border: isSelected
                                  ? "2px solid #14539E"
                                  : "2px solid transparent",
                                transition: "all 0.15s",
                              }}
                            >
                              <p
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  margin: "0 0 3px",
                                  color: "#0a1d52",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {r.title}
                              </p>
                              <p
                                style={{
                                  fontSize: 11,
                                  color: "#aaa",
                                  margin: 0,
                                }}
                              >
                                par {r.reporter.username}
                              </p>
                            </div>
                          );
                        })
                      ))}
                    {subTab === "tips" &&
                      (tips.length === 0 ? (
                        <div
                          style={{
                            background: "#fff",
                            borderRadius: 12,
                            padding: "32px 0",
                            textAlign: "center",
                            color: "#aaa",
                            fontSize: 13,
                          }}
                        >
                          ✓ Aucun tip en attente
                        </div>
                      ) : (
                        tips.map((t) => {
                          const isSelected = selectedTip?.id === t.id;
                          return (
                            <div
                              key={t.id}
                              onClick={() =>
                                setSelectedTip(isSelected ? null : t)
                              }
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  setSelectedTip(isSelected ? null : t);
                              }}
                              aria-pressed={isSelected}
                              style={{
                                background: "#fff",
                                borderRadius: 10,
                                padding: "12px 14px",
                                cursor: "pointer",
                                border: isSelected
                                  ? "2px solid #14539E"
                                  : "2px solid transparent",
                                transition: "all 0.15s",
                              }}
                            >
                              <p
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  margin: "0 0 3px",
                                  color: "#0a1d52",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {t.title}
                              </p>
                              <p
                                style={{
                                  fontSize: 11,
                                  color: "#aaa",
                                  margin: 0,
                                }}
                              >
                                {t.author.username}
                              </p>
                            </div>
                          );
                        })
                      ))}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      minHeight: isMobile ? "auto" : 500,
                    }}
                  >
                    {subTab === "scams" && selectedScam && (
                      <ScamDetailPanel
                        scam={selectedScam}
                        onValidate={() =>
                          handleScam(selectedScam.id, "verified")
                        }
                        onReject={() => handleScam(selectedScam.id, "rejected")}
                        onDelete={() => handleDeleteScam(selectedScam.id)}
                        onClose={() => setSelectedScam(null)}
                      />
                    )}
                    {subTab === "tips" && selectedTip && (
                      <TipDetailPanel
                        tip={selectedTip}
                        onApprove={() => handleTip(selectedTip.id, true)}
                        onReject={() => handleTip(selectedTip.id, false)}
                        onDelete={() => handleDeleteTip(selectedTip.id)}
                        onClose={() => setSelectedTip(null)}
                      />
                    )}
                    {((subTab === "scams" && !selectedScam) ||
                      (subTab === "tips" && !selectedTip)) &&
                      !isMobile && (
                        <div
                          style={{
                            background: "rgba(255,255,255,0.06)",
                            borderRadius: 14,
                            height: "100%",
                            minHeight: 300,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1.5px dashed rgba(255,255,255,0.15)",
                          }}
                        >
                          <div style={{ textAlign: "center" }}>
                            <Eye
                              size={32}
                              aria-hidden="true"
                              style={{
                                color: "rgba(255,255,255,0.2)",
                                marginBottom: 10,
                              }}
                            />
                            <p
                              style={{
                                color: "rgba(255,255,255,0.4)",
                                fontSize: 14,
                                margin: 0,
                              }}
                            >
                              Clique sur un élément pour voir le détail
                            </p>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )}

            {/* GUIDES */}
            {tab === "guides" && (
              <div>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginBottom: 20,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
                    <Search
                      size={15}
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        left: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#9CA3AF",
                        pointerEvents: "none",
                      }}
                    />
                    <label htmlFor="guide-search" style={{ display: "none" }}>
                      Rechercher un guide
                    </label>
                    <input
                      id="guide-search"
                      value={guideSearch}
                      onChange={(e) => setGuideSearch(e.target.value)}
                      placeholder="Rechercher un guide..."
                      style={{
                        width: "100%",
                        padding: "10px 14px 10px 36px",
                        border: "1.5px solid rgba(255,255,255,0.2)",
                        borderRadius: 10,
                        background: "rgba(255,255,255,0.1)",
                        color: "#fff",
                        fontSize: 13,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <button
                    onClick={() => {
                      setShowGuideForm(true);
                      setEditingGuide(null);
                    }}
                    style={{
                      padding: "10px 18px",
                      background: "#1D9E75",
                      color: "#fff",
                      border: "none",
                      borderRadius: 10,
                      fontSize: 13,
                      cursor: "pointer",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      whiteSpace: "nowrap",
                      minHeight: 44,
                    }}
                  >
                    <Plus size={14} aria-hidden="true" /> Nouveau guide
                  </button>
                </div>
                {/* Formulaire création */}
                {showGuideForm && !editingGuide && (
                  <div style={{ marginBottom: 20 }}>
                    <GuideForm
                      onSave={handleCreateGuide}
                      onCancel={() => setShowGuideForm(false)}
                    />
                  </div>
                )}

                {/* Formulaire édition guide — hors grille, pleine largeur */}
                {editingGuide && (
                  <div style={{ marginBottom: 20 }}>
                    <EditArticlePanel
                      key={editingGuide.id}
                      article={{
                        id: editingGuide.id,
                        title: editingGuide.title,
                        content: editingGuide.content,
                        articleType: "guide",
                        category: editingGuide.category,
                        isPinned: editingGuide.isPinned,
                        attachments: editingGuide.attachments ?? [],
                      }}
                      role="admin"
                      onSaved={(updated: EditableArticle) => {
                        setGuides((g) =>
                          g.map((guide) =>
                            guide.id === updated.id
                              ? {
                                  ...guide,
                                  title: updated.title,
                                  content: updated.content,
                                  category: updated.category ?? guide.category,
                                  isPinned: updated.isPinned ?? guide.isPinned,
                                  attachments: updated.attachments,
                                }
                              : guide,
                          ),
                        );
                        setEditingGuide(null);
                      }}
                      onCancel={() => setEditingGuide(null)}
                    />
                  </div>
                )}

                {guidesLoading ? (
                  <p
                    aria-live="polite"
                    style={{
                      textAlign: "center",
                      color: "rgba(255,255,255,0.6)",
                      padding: "40px 0",
                    }}
                  >
                    Chargement...
                  </p>
                ) : filteredGuides.length === 0 ? (
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 14,
                      padding: "40px 0",
                      textAlign: "center",
                      color: "#aaa",
                      fontSize: 14,
                    }}
                  >
                    Aucun guide trouvé
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr" : "repeat(5, 1fr)",
                      gap: 14,
                    }}
                  >
                    {filteredGuides.map((guide) => {
                      const colors =
                        CATEGORY_COLORS[guide.category] ??
                        CATEGORY_COLORS.autre;
                      const isEditing = editingGuide?.id === guide.id;
                      return (
                        <div
                          key={guide.id}
                          style={{
                            background: "#fff",
                            borderRadius: 12,
                            padding: "16px 18px",
                            display: "flex",
                            flexDirection: "column",
                            minHeight: 160,
                            outline: isEditing
                              ? "2px solid #14539E"
                              : undefined,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              gap: 8,
                              marginBottom: 8,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                gap: 5,
                                flexWrap: "wrap",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  background: colors.bg,
                                  color: colors.color,
                                  padding: "3px 10px",
                                  borderRadius: 50,
                                  textTransform: "capitalize",
                                }}
                              >
                                {guide.category}
                              </span>
                              {guide.isPinned && (
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    background: "#E6F1FB",
                                    color: "#0C447C",
                                    padding: "3px 10px",
                                    borderRadius: 50,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 3,
                                  }}
                                >
                                  <Pin size={10} aria-hidden="true" /> Épinglé
                                </span>
                              )}
                            </div>
                            <div
                              style={{ display: "flex", gap: 5, flexShrink: 0 }}
                            >
                              <button
                                onClick={() => {
                                  setEditingGuide(guide);
                                  setShowGuideForm(false);
                                }}
                                aria-label={`Modifier ${guide.title}`}
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 7,
                                  border: "1.5px solid #e5e7eb",
                                  background: "#fff",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Pencil
                                  size={12}
                                  color="#555"
                                  aria-hidden="true"
                                />
                              </button>
                              <button
                                onClick={() => handleDeleteGuide(guide.id)}
                                aria-label={`Supprimer ${guide.title}`}
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 7,
                                  border: "1.5px solid #FEE2E2",
                                  background: "#FFF5F5",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Trash2
                                  size={12}
                                  color="#DC2626"
                                  aria-hidden="true"
                                />
                              </button>
                            </div>
                          </div>
                          <p
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: "#0a1d52",
                              margin: "0 0 6px",
                              lineHeight: 1.3,
                            }}
                          >
                            {guide.title}
                          </p>
                          <p
                            style={{
                              fontSize: 12,
                              color: "#888",
                              margin: 0,
                              flex: 1,
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              lineHeight: 1.55,
                            }}
                          >
                            {stripMarkdown(guide.content)}
                          </p>
                          {/* Indicateurs pièces jointes */}
                          {guide.attachments &&
                            guide.attachments.length > 0 &&
                            (() => {
                              const imgs = guide.attachments.filter(
                                (a) => a.type === "image",
                              );
                              const docs = guide.attachments.filter(
                                (a) => a.type === "document",
                              );
                              const lnks = guide.attachments.filter(
                                (a) => a.type === "link",
                              );
                              return (
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 6,
                                    marginTop: 8,
                                    flexWrap: "wrap",
                                  }}
                                  aria-label="Pièces jointes"
                                >
                                  {imgs.length > 0 && (
                                    <span
                                      style={{
                                        fontSize: 10,
                                        color: "#6B7280",
                                        fontWeight: 500,
                                      }}
                                      aria-label={`${imgs.length} photo${imgs.length > 1 ? "s" : ""}`}
                                    >
                                      📷 {imgs.length}
                                    </span>
                                  )}
                                  {docs.length > 0 && (
                                    <span
                                      style={{
                                        fontSize: 10,
                                        color: "#6B7280",
                                        fontWeight: 500,
                                      }}
                                      aria-label={`${docs.length} document${docs.length > 1 ? "s" : ""}`}
                                    >
                                      📄 {docs.length}
                                    </span>
                                  )}
                                  {lnks.length > 0 && (
                                    <span
                                      style={{
                                        fontSize: 10,
                                        color: "#6B7280",
                                        fontWeight: 500,
                                      }}
                                      aria-label={`${lnks.length} lien${lnks.length > 1 ? "s" : ""}`}
                                    >
                                      🔗 {lnks.length}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TIPS PUBLIÉS */}
            {tab === "published_tips" && (
              <div>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginBottom: 20,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
                    <Search
                      size={15}
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        left: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#9CA3AF",
                        pointerEvents: "none",
                      }}
                    />
                    <label htmlFor="tip-search" style={{ display: "none" }}>
                      Rechercher un tip
                    </label>
                    <input
                      id="tip-search"
                      value={tipSearch}
                      onChange={(e) => setTipSearch(e.target.value)}
                      placeholder="Rechercher un tip..."
                      style={{
                        width: "100%",
                        padding: "10px 14px 10px 36px",
                        border: "1.5px solid rgba(255,255,255,0.2)",
                        borderRadius: 10,
                        background: "rgba(255,255,255,0.1)",
                        color: "#fff",
                        fontSize: 13,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <button
                    onClick={() => {
                      setShowTipForm(true);
                      setEditingTip(null);
                    }}
                    style={{
                      padding: "10px 18px",
                      background: "#1D9E75",
                      color: "#fff",
                      border: "none",
                      borderRadius: 10,
                      fontSize: 13,
                      cursor: "pointer",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      whiteSpace: "nowrap",
                      minHeight: 44,
                    }}
                  >
                    <Plus size={14} aria-hidden="true" /> Nouveau tip
                  </button>
                </div>

                {showTipForm && !editingTip && (
                  <TipForm
                    onSave={handleCreateTip}
                    onCancel={() => setShowTipForm(false)}
                  />
                )}

                {/* Formulaire édition tip — hors liste, pleine largeur */}
                {editingTip && (
                  <div style={{ marginBottom: 20 }}>
                    <EditArticlePanel
                      key={editingTip.id}
                      article={{
                        id: editingTip.id,
                        title: editingTip.title,
                        content: editingTip.content,
                        articleType: "tip",
                        category: editingTip.type,
                        attachments: editingTip.attachments ?? [],
                      }}
                      role="admin"
                      onSaved={(updated: EditableArticle) => {
                        setPublishedTips((t) =>
                          t.map((tip) =>
                            tip.id === updated.id
                              ? {
                                  ...tip,
                                  title: updated.title,
                                  content: updated.content,
                                  attachments: updated.attachments,
                                }
                              : tip,
                          ),
                        );
                        setEditingTip(null);
                      }}
                      onCancel={() => setEditingTip(null)}
                    />
                  </div>
                )}

                {publishedTipsLoading ? (
                  <p
                    aria-live="polite"
                    style={{
                      textAlign: "center",
                      color: "rgba(255,255,255,0.6)",
                      padding: "40px 0",
                    }}
                  >
                    Chargement...
                  </p>
                ) : filteredPublishedTips.length === 0 ? (
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 14,
                      padding: "40px 0",
                      textAlign: "center",
                      color: "#aaa",
                      fontSize: 14,
                    }}
                  >
                    {tipSearch ? "Aucun tip trouvé." : "Aucun tip approuvé."}
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr" : "repeat(5, 1fr)",
                      gap: 14,
                    }}
                  >
                    {filteredPublishedTips.map((tip) => {
                      const isEditing = editingTip?.id === tip.id;
                      return (
                        <div
                          key={tip.id}
                          style={{
                            background: "#fff",
                            borderRadius: 12,
                            padding: "16px 20px",
                            outline: isEditing
                              ? "2px solid #14539E"
                              : undefined,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              gap: 12,
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  display: "flex",
                                  gap: 6,
                                  marginBottom: 6,
                                  flexWrap: "wrap",
                                  alignItems: "center",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    background:
                                      tip.type === "tip"
                                        ? "#FAEEDA"
                                        : "#E6F1FB",
                                    color:
                                      tip.type === "tip"
                                        ? "#633806"
                                        : "#0C447C",
                                    padding: "3px 10px",
                                    borderRadius: 50,
                                  }}
                                >
                                  {tip.type === "tip"
                                    ? "Bon plan"
                                    : "Témoignage"}
                                </span>
                                <span style={{ fontSize: 11, color: "#aaa" }}>
                                  par {tip.author.username} ·{" "}
                                  {new Date(tip.createdAt).toLocaleDateString(
                                    "fr-FR",
                                  )}
                                </span>
                              </div>
                              <p
                                style={{
                                  fontSize: 14,
                                  fontWeight: 700,
                                  color: "#0a1d52",
                                  margin: "0 0 4px",
                                }}
                              >
                                {tip.title}
                              </p>
                              <p
                                style={{
                                  fontSize: 12,
                                  color: "#888",
                                  margin: 0,
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}
                              >
                                {stripMarkdown(tip.content)}
                              </p>
                              {tip.attachments &&
                                tip.attachments.length > 0 &&
                                (() => {
                                  const imgs = tip.attachments.filter(
                                    (a) => a.type === "image",
                                  );
                                  const docs = tip.attachments.filter(
                                    (a) => a.type === "document",
                                  );
                                  const lnks = tip.attachments.filter(
                                    (a) => a.type === "link",
                                  );
                                  return (
                                    <div
                                      style={{
                                        display: "flex",
                                        gap: 6,
                                        marginTop: 8,
                                        flexWrap: "wrap",
                                      }}
                                    >
                                      {imgs.length > 0 && (
                                        <span
                                          style={{
                                            fontSize: 10,
                                            color: "#6B7280",
                                            fontWeight: 500,
                                          }}
                                        >
                                          📷 {imgs.length}
                                        </span>
                                      )}
                                      {docs.length > 0 && (
                                        <span
                                          style={{
                                            fontSize: 10,
                                            color: "#6B7280",
                                            fontWeight: 500,
                                          }}
                                        >
                                          📄 {docs.length}
                                        </span>
                                      )}
                                      {lnks.length > 0 && (
                                        <span
                                          style={{
                                            fontSize: 10,
                                            color: "#6B7280",
                                            fontWeight: 500,
                                          }}
                                        >
                                          🔗 {lnks.length}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}
                            </div>
                            <div
                              style={{ display: "flex", gap: 6, flexShrink: 0 }}
                            >
                              <button
                                onClick={() => setEditingTip(tip)}
                                aria-label={`Modifier ${tip.title}`}
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  border: "1.5px solid #e5e7eb",
                                  background: "#fff",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Pencil
                                  size={14}
                                  color="#555"
                                  aria-hidden="true"
                                />
                              </button>
                              <button
                                onClick={() => handleDeletePublishedTip(tip.id)}
                                aria-label={`Supprimer ${tip.title}`}
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  border: "1.5px solid #FEE2E2",
                                  background: "#FFF5F5",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Trash2
                                  size={14}
                                  color="#DC2626"
                                  aria-hidden="true"
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ARNAQUES PUBLIÉES */}
            {tab === "published_scams" && (
              <div>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginBottom: 20,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
                    <Search
                      size={15}
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        left: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#9CA3AF",
                        pointerEvents: "none",
                      }}
                    />
                    <label htmlFor="scam-search" style={{ display: "none" }}>
                      Rechercher un signalement
                    </label>
                    <input
                      id="scam-search"
                      value={scamSearch}
                      onChange={(e) => setScamSearch(e.target.value)}
                      placeholder="Rechercher un signalement..."
                      style={{
                        width: "100%",
                        padding: "10px 14px 10px 36px",
                        border: "1.5px solid rgba(255,255,255,0.2)",
                        borderRadius: 10,
                        background: "rgba(255,255,255,0.1)",
                        color: "#fff",
                        fontSize: 13,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <button
                    onClick={() => {
                      setShowScamForm(true);
                      setEditingScam(null);
                    }}
                    style={{
                      padding: "10px 18px",
                      background: "#DC2626",
                      color: "#fff",
                      border: "none",
                      borderRadius: 10,
                      fontSize: 13,
                      cursor: "pointer",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      whiteSpace: "nowrap",
                      minHeight: 44,
                    }}
                  >
                    <Plus size={14} aria-hidden="true" /> Nouveau signalement
                  </button>
                </div>

                {showScamForm && !editingScam && (
                  <ScamForm
                    onSave={handleCreateScam}
                    onCancel={() => setShowScamForm(false)}
                  />
                )}

                {/* Formulaire édition arnaque — hors liste, pleine largeur */}
                {editingScam && (
                  <div style={{ marginBottom: 20 }}>
                    <EditArticlePanel
                      key={editingScam.id}
                      article={{
                        id: editingScam.id,
                        title: editingScam.title,
                        content: editingScam.description,
                        articleType: "scam",
                        category: editingScam.category,
                        attachments: editingScam.attachments ?? [],
                      }}
                      role="admin"
                      onSaved={(updated: EditableArticle) => {
                        setPublishedScams((s) =>
                          s.map((scam) =>
                            scam.id === updated.id
                              ? {
                                  ...scam,
                                  title: updated.title,
                                  description: updated.content,
                                  category: updated.category ?? scam.category,
                                  attachments: updated.attachments,
                                }
                              : scam,
                          ),
                        );
                        setEditingScam(null);
                      }}
                      onCancel={() => setEditingScam(null)}
                    />
                  </div>
                )}

                {publishedScamsLoading ? (
                  <p
                    aria-live="polite"
                    style={{
                      textAlign: "center",
                      color: "rgba(255,255,255,0.6)",
                      padding: "40px 0",
                    }}
                  >
                    Chargement...
                  </p>
                ) : filteredPublishedScams.length === 0 ? (
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 14,
                      padding: "40px 0",
                      textAlign: "center",
                      color: "#aaa",
                      fontSize: 14,
                    }}
                  >
                    {scamSearch
                      ? "Aucun signalement trouvé."
                      : "Aucun signalement vérifié."}
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr" : "repeat(5, 1fr)",
                      gap: 14,
                    }}
                  >
                    {filteredPublishedScams.map((scam) => {
                      const colors =
                        CATEGORY_COLORS[scam.category] ?? CATEGORY_COLORS.autre;
                      const isEditing = editingScam?.id === scam.id;
                      return (
                        <div
                          key={scam.id}
                          style={{
                            background: "#fff",
                            borderRadius: 12,
                            padding: "16px 20px",
                            outline: isEditing
                              ? "2px solid #14539E"
                              : undefined,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 12,
                              alignItems: "flex-start",
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  display: "flex",
                                  gap: 6,
                                  marginBottom: 8,
                                  flexWrap: "wrap",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    background: "#FEE2E2",
                                    color: "#991B1B",
                                    padding: "3px 10px",
                                    borderRadius: 50,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 3,
                                  }}
                                >
                                  <AlertTriangle size={10} aria-hidden="true" />{" "}
                                  Vérifié
                                </span>
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    background: colors.bg,
                                    color: colors.color,
                                    padding: "3px 10px",
                                    borderRadius: 50,
                                    textTransform: "capitalize",
                                  }}
                                >
                                  {scam.category}
                                </span>
                                <span style={{ fontSize: 11, color: "#aaa" }}>
                                  par {scam.reporter?.username ?? "—"} ·{" "}
                                  {new Date(scam.createdAt).toLocaleDateString(
                                    "fr-FR",
                                  )}
                                </span>
                              </div>
                              <p
                                style={{
                                  fontSize: 14,
                                  fontWeight: 700,
                                  color: "#0a1d52",
                                  margin: "0 0 4px",
                                }}
                              >
                                {scam.title}
                              </p>
                              <p
                                style={{
                                  fontSize: 12,
                                  color: "#888",
                                  margin: 0,
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}
                              >
                                {stripMarkdown(scam.description)}
                              </p>
                              {scam.attachments &&
                                scam.attachments.length > 0 &&
                                (() => {
                                  const imgs = scam.attachments.filter(
                                    (a) => a.type === "image",
                                  );
                                  const docs = scam.attachments.filter(
                                    (a) => a.type === "document",
                                  );
                                  const lnks = scam.attachments.filter(
                                    (a) => a.type === "link",
                                  );
                                  return (
                                    <div
                                      style={{
                                        display: "flex",
                                        gap: 6,
                                        marginTop: 8,
                                        flexWrap: "wrap",
                                      }}
                                    >
                                      {imgs.length > 0 && (
                                        <span
                                          style={{
                                            fontSize: 10,
                                            color: "#6B7280",
                                            fontWeight: 500,
                                          }}
                                        >
                                          📷 {imgs.length}
                                        </span>
                                      )}
                                      {docs.length > 0 && (
                                        <span
                                          style={{
                                            fontSize: 10,
                                            color: "#6B7280",
                                            fontWeight: 500,
                                          }}
                                        >
                                          📄 {docs.length}
                                        </span>
                                      )}
                                      {lnks.length > 0 && (
                                        <span
                                          style={{
                                            fontSize: 10,
                                            color: "#6B7280",
                                            fontWeight: 500,
                                          }}
                                        >
                                          🔗 {lnks.length}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}
                            </div>
                            <div
                              style={{ display: "flex", gap: 6, flexShrink: 0 }}
                            >
                              <button
                                onClick={() => setEditingScam(scam)}
                                aria-label={`Modifier ${scam.title}`}
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  border: "1.5px solid #e5e7eb",
                                  background: "#fff",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Pencil
                                  size={14}
                                  color="#555"
                                  aria-hidden="true"
                                />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeletePublishedScam(scam.id)
                                }
                                aria-label={`Supprimer ${scam.title}`}
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  border: "1.5px solid #FEE2E2",
                                  background: "#FFF5F5",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <Trash2
                                  size={14}
                                  color="#DC2626"
                                  aria-hidden="true"
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* UTILISATEURS */}
            {tab === "users" && (
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  flexDirection: isMobile ? "column" : "row",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ position: "relative", marginBottom: 16 }}>
                    <Search
                      size={15}
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        left: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#9CA3AF",
                        pointerEvents: "none",
                      }}
                    />
                    <label htmlFor="user-search" style={{ display: "none" }}>
                      Rechercher un utilisateur
                    </label>
                    <input
                      id="user-search"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Rechercher un utilisateur..."
                      style={{
                        width: "100%",
                        padding: "10px 14px 10px 36px",
                        border: "1.5px solid rgba(255,255,255,0.2)",
                        borderRadius: 10,
                        background: "rgba(255,255,255,0.1)",
                        color: "#fff",
                        fontSize: 13,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  {usersLoading ? (
                    <p
                      aria-live="polite"
                      style={{
                        textAlign: "center",
                        color: "rgba(255,255,255,0.6)",
                        padding: "40px 0",
                      }}
                    >
                      Chargement...
                    </p>
                  ) : (
                    <div>
                      {filteredUsers.length === 0 ? (
                        <div
                          style={{
                            background: "#fff",
                            borderRadius: 14,
                            padding: "40px 0",
                            textAlign: "center",
                            color: "#aaa",
                            fontSize: 14,
                          }}
                        >
                          Aucun utilisateur trouvé
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: isMobile
                              ? "1fr"
                              : "repeat(auto-fill, minmax(220px, 1fr))",
                            gap: 10,
                          }}
                        >
                          {filteredUsers.map((u) => {
                            const isSelected = selectedUser?.id === u.id;
                            const joinedDate = new Date(u.createdAt);
                            const now = new Date();
                            const diffMs = now.getTime() - joinedDate.getTime();
                            const diffDays = Math.floor(diffMs / 86400000);
                            const joinedLabel =
                              diffDays === 0
                                ? "Inscrit aujourd'hui"
                                : diffDays < 30
                                  ? `Inscrit il y a ${diffDays}j`
                                  : diffDays < 365
                                    ? `Inscrit il y a ${Math.floor(diffDays / 30)}mois`
                                    : `Inscrit il y a ${Math.floor(diffDays / 365)}an${Math.floor(diffDays / 365) > 1 ? "s" : ""}`;
                            const totalContribs =
                              (u._count?.posts ?? 0) +
                              (u._count?.tips ?? 0) +
                              (u._count?.scamReports ?? 0);
                            return (
                              <div
                                key={u.id}
                                onClick={() =>
                                  setSelectedUser(isSelected ? null : u)
                                }
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    setSelectedUser(isSelected ? null : u);
                                }}
                                aria-pressed={isSelected}
                                style={{
                                  background: "#fff",
                                  borderRadius: 12,
                                  padding: "16px",
                                  cursor: "pointer",
                                  border: isSelected
                                    ? "2px solid #14539E"
                                    : "2px solid transparent",
                                  transition: "all 0.15s",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 10,
                                }}
                              >
                                {/* Ligne 1 : avatar + nom + badges */}
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
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
                                    {u.avatarUrl ? (
                                      <img
                                        src={u.avatarUrl}
                                        alt=""
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "cover",
                                        }}
                                      />
                                    ) : (
                                      u.username[0].toUpperCase()
                                    )}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 5,
                                        flexWrap: "wrap",
                                      }}
                                    >
                                      <p
                                        style={{
                                          fontSize: 13,
                                          fontWeight: 700,
                                          margin: 0,
                                          color: "#0a1d52",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                          maxWidth: 110,
                                        }}
                                      >
                                        {u.username}
                                      </p>
                                      {u.isAdmin && (
                                        <span
                                          style={{
                                            fontSize: 9,
                                            fontWeight: 700,
                                            background: "#FEE2E2",
                                            color: "#DC2626",
                                            padding: "1px 5px",
                                            borderRadius: 4,
                                            flexShrink: 0,
                                          }}
                                        >
                                          ADMIN
                                        </span>
                                      )}
                                      {u.isVerified && (
                                        <span
                                          style={{
                                            fontSize: 9,
                                            fontWeight: 700,
                                            background: "#D1FAE5",
                                            color: "#065F46",
                                            padding: "1px 5px",
                                            borderRadius: 4,
                                            flexShrink: 0,
                                          }}
                                        >
                                          ✓
                                        </span>
                                      )}
                                    </div>
                                    <p
                                      style={{
                                        fontSize: 10,
                                        color: "#aaa",
                                        margin: 0,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {u.email}
                                    </p>
                                  </div>
                                </div>

                                {/* Ligne 2 : origine + ville */}
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 6,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  {u.originTerritory && (
                                    <span
                                      style={{
                                        fontSize: 10,
                                        color: "#555",
                                        background: "#F3F4F6",
                                        padding: "2px 7px",
                                        borderRadius: 50,
                                      }}
                                    >
                                      🌍 {u.originTerritory}
                                    </span>
                                  )}
                                  {u.currentCity && (
                                    <span
                                      style={{
                                        fontSize: 10,
                                        color: "#555",
                                        background: "#F3F4F6",
                                        padding: "2px 7px",
                                        borderRadius: 50,
                                      }}
                                    >
                                      📍 {u.currentCity}
                                    </span>
                                  )}
                                </div>

                                {/* Ligne 3 : date inscription + contributions */}
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <span style={{ fontSize: 10, color: "#aaa" }}>
                                    {joinedLabel}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 600,
                                      color:
                                        totalContribs > 0 ? "#14539E" : "#ccc",
                                      background:
                                        totalContribs > 0
                                          ? "#E6F1FB"
                                          : "#f3f4f6",
                                      padding: "2px 7px",
                                      borderRadius: 50,
                                    }}
                                  >
                                    {totalContribs} contrib.
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {selectedUser && (
                  <div
                    style={{ width: isMobile ? "100%" : 280, flexShrink: 0 }}
                  >
                    <div
                      style={{
                        background: "#fff",
                        borderRadius: 14,
                        padding: 22,
                        position: isMobile ? "static" : "sticky",
                        top: 24,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 16,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#0a1d52",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          Fiche utilisateur
                        </span>
                        <button
                          onClick={() => setSelectedUser(null)}
                          aria-label="Fermer la fiche"
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#aaa",
                          }}
                        >
                          <X size={16} aria-hidden="true" />
                        </button>
                      </div>
                      <div style={{ textAlign: "center", marginBottom: 16 }}>
                        <div
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg, #3ab5e6, #14539E)",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 22,
                            fontWeight: 800,
                            margin: "0 auto 10px",
                            overflow: "hidden",
                          }}
                          aria-hidden="true"
                        >
                          {selectedUser.avatarUrl ? (
                            <img
                              src={selectedUser.avatarUrl}
                              alt=""
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            selectedUser.username[0].toUpperCase()
                          )}
                        </div>
                        <p
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: "#0a1d52",
                            margin: "0 0 2px",
                          }}
                        >
                          {selectedUser.username}
                        </p>
                        <p style={{ fontSize: 12, color: "#888", margin: 0 }}>
                          {selectedUser.email}
                        </p>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        <button
                          onClick={() =>
                            navigate(`/profile/${selectedUser.id}`)
                          }
                          style={{
                            padding: "9px 0",
                            background: "#E6F1FB",
                            color: "#0C447C",
                            border: "none",
                            borderRadius: 8,
                            fontSize: 13,
                            cursor: "pointer",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 5,
                            minHeight: 44,
                          }}
                        >
                          <Eye size={14} aria-hidden="true" /> Voir le profil
                        </button>
                        <button
                          onClick={() =>
                            handleToggleAdmin(
                              selectedUser.id,
                              !selectedUser.isAdmin,
                            )
                          }
                          style={{
                            padding: "9px 0",
                            background: selectedUser.isAdmin
                              ? "#FEE2E2"
                              : "#FAEEDA",
                            color: selectedUser.isAdmin ? "#DC2626" : "#633806",
                            border: "none",
                            borderRadius: 8,
                            fontSize: 13,
                            cursor: "pointer",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 5,
                            minHeight: 44,
                          }}
                        >
                          <UserCog size={14} aria-hidden="true" />{" "}
                          {selectedUser.isAdmin
                            ? "Retirer le rôle admin"
                            : "Promouvoir admin"}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(selectedUser.id)}
                          style={{
                            padding: "9px 0",
                            background: "transparent",
                            color: "#aaa",
                            border: "1px solid #e5e7eb",
                            borderRadius: 8,
                            fontSize: 12,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 5,
                            minHeight: 40,
                          }}
                        >
                          <Trash2 size={12} aria-hidden="true" /> Supprimer le
                          compte
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Styles partagés
// ---------------------------------------------------------------------------
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
  borderWidth: "1.5px",
  borderStyle: "solid",
  borderColor: "#e5e7eb",
  borderRadius: 8,
  fontSize: 14,
  color: "#0a1d52",
  outline: "none",
  boxSizing: "border-box",
};
