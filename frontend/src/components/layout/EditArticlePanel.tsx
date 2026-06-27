import { useState, useRef } from "react";
import {
  X,
  Send,
  Paperclip,
  Link as LinkIcon,
  FileText,
  ExternalLink,
  Pin,
  ChevronLeft,
} from "lucide-react";
import { MarkdownLegend } from "./MarkdownLegend";
import api from "../../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExistingAttachment {
  id: string;
  type: "image" | "document" | "link";
  url: string;
  name?: string;
}

export interface EditableArticle {
  id: string;
  title: string;
  /** content for guides/tips, description for scams */
  content: string;
  /** "guide" | "tip" | "scam" */
  articleType: "guide" | "tip" | "scam";
  category?: string;
  isPinned?: boolean;
  attachments: ExistingAttachment[];
}

interface LinkEntry {
  url: string;
  name: string;
}

interface EditArticlePanelProps {
  article: EditableArticle;
  /** Categories available for this article type */
  categories?: readonly string[];
  /** Called with the fully saved article after all API calls succeed */
  onSaved: (updated: EditableArticle) => void;
  onCancel: () => void;
  /** "admin" can edit guides + has access to isPinned; "user" edits their own tips/scams */
  role?: "admin" | "user";
}

// ─── Category helpers ─────────────────────────────────────────────────────────

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

const SCAM_CATEGORIES = [
  "logement",
  "banque",
  "telephone",
  "transport",
  "emploi",
  "sante",
  "autre",
] as const;

const TIP_CATEGORIES = ["tip", "témoignage"] as const;

// ─── Styles ───────────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: "#555",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: "1.5px solid #e5e7eb",
  borderRadius: 8,
  fontSize: 14,
  color: "#0a1d52",
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
};

// ─── Component ────────────────────────────────────────────────────────────────

export const EditArticlePanel = ({
  article,
  onSaved,
  onCancel,
  role = "user",
}: EditArticlePanelProps) => {
  // ── Local form state (never touches the DB until Save) ────────────────────
  const [title, setTitle] = useState(article.title);
  const [content, setContent] = useState(article.content);
  const [category, setCategory] = useState(article.category ?? "");
  const [isPinned, setIsPinned] = useState(article.isPinned ?? false);

  // Existing attachments — we track which to delete locally (not sent to API until save)
  const [existingAtts] = useState<ExistingAttachment[]>(
    article.attachments ?? [],
  );
  const [toDelete, setToDelete] = useState<Set<string>>(new Set());

  // New files & links to add
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newLinks, setNewLinks] = useState<LinkEntry[]>([]);
  const [linkInput, setLinkInput] = useState({ url: "", name: "" });
  const [showLinkInput, setShowLinkInput] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const markForDeletion = (id: string) => {
    setToDelete((prev) => new Set(prev).add(id));
  };

  const unmarkForDeletion = (id: string) => {
    setToDelete((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const remaining =
      5 -
      newFiles.length -
      existingAtts.filter((a) => a.type !== "link" && !toDelete.has(a.id))
        .length;
    setNewFiles((prev) => [...prev, ...selected.slice(0, remaining)]);
    e.target.value = "";
  };

  const addLink = () => {
    if (!linkInput.url.trim()) return;
    setNewLinks((prev) => [
      ...prev,
      {
        url: linkInput.url.trim(),
        name: linkInput.name.trim() || linkInput.url.trim(),
      },
    ]);
    setLinkInput({ url: "", name: "" });
    setShowLinkInput(false);
  };

  const categoryOptions =
    article.articleType === "guide"
      ? GUIDE_CATEGORIES
      : article.articleType === "scam"
        ? SCAM_CATEGORIES
        : TIP_CATEGORIES;

  // ── Save — all API calls in sequence ─────────────────────────────────────

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    setError(null);

    try {
      const baseUrl =
        article.articleType === "guide"
          ? role === "admin"
            ? `/admin/posts/${article.id}`
            : `/posts/${article.id}`
          : article.articleType === "tip"
            ? `/tips/${article.id}`
            : `/scam/${article.id}`;

      // 1. PATCH scalar fields (always JSON)
      const scalarPayload: Record<string, unknown> = { title };
      // Scams use "description", everything else uses "content"
      if (article.articleType === "scam") {
        scalarPayload.description = content;
      } else {
        scalarPayload.content = content;
      }
      if (category) scalarPayload.category = category;
      if (article.articleType === "guide") scalarPayload.isPinned = isPinned;
      await api.patch(baseUrl, scalarPayload);

      // 2. DELETE marked attachments (route différente selon le rôle)
      for (const id of toDelete) {
        const deleteUrl =
          role === "admin"
            ? `/admin/attachments/${id}`
            : `/users/me/attachments/${id}`;
        await api.delete(deleteUrl).catch(() => {});
      }

      // 3. Upload new files + links (multipart if any file, JSON otherwise)
      if (newFiles.length > 0 || newLinks.length > 0) {
        const fd = new FormData();
        newFiles.forEach((f) => fd.append("files", f));
        if (newLinks.length > 0) fd.append("links", JSON.stringify(newLinks));
        // Use the same PATCH route — the router already handles multipart
        await api.patch(baseUrl, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      // 4. Build updated article for parent state
      const remainingExisting = existingAtts.filter((a) => !toDelete.has(a.id));
      const addedLinks: ExistingAttachment[] = newLinks.map((l, i) => ({
        id: `new-link-${i}`,
        type: "link",
        url: l.url,
        name: l.name,
      }));
      // New files don't have IDs until refetch — parent should ideally refetch,
      // but we optimistically add what we can
      const updatedArticle: EditableArticle = {
        ...article,
        title,
        content,
        category,
        isPinned,
        attachments: [...remainingExisting, ...addedLinks],
      };

      onSaved(updatedArticle);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : ((err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message ?? "Une erreur est survenue");
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Attachment sections ───────────────────────────────────────────────────

  const visibleExisting = existingAtts.filter((a) => !toDelete.has(a.id));
  const deletedExisting = existingAtts.filter((a) => toDelete.has(a.id));
  const existingImages = visibleExisting.filter((a) => a.type === "image");
  const existingDocs = visibleExisting.filter((a) => a.type === "document");
  const existingLinks = visibleExisting.filter((a) => a.type === "link");

  const totalFiles =
    existingImages.length + existingDocs.length + newFiles.length;

  return (
    <div
      style={{
        background: "#F9FAFB",
        borderRadius: 12,
        padding: 24,
        border: "1.5px solid #e5e7eb",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <button
          onClick={onCancel}
          style={{
            background: "transparent",
            border: "1.5px solid #e5e7eb",
            borderRadius: 7,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 10px",
            color: "#555",
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          <ChevronLeft size={13} aria-hidden="true" /> Annuler
        </button>
        <span style={{ fontSize: 13, color: "#888" }}>
          Modification —{" "}
          <strong style={{ color: "#0a1d52" }}>{article.title}</strong>
        </span>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            background: "#FEE2E2",
            border: "1px solid #FECACA",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 13,
            color: "#DC2626",
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>✗ {error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#DC2626",
            }}
          >
            <X size={13} aria-hidden="true" />
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Titre */}
        <div>
          <label htmlFor="edit-title" style={labelStyle}>
            Titre *
          </label>
          <input
            id="edit-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Catégorie + épingler (guides admin) */}
        {category !== undefined && (
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "flex-end",
            }}
          >
            <div style={{ flex: 1, minWidth: 160 }}>
              <label htmlFor="edit-category" style={labelStyle}>
                Catégorie
              </label>
              <select
                id="edit-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {(categoryOptions as readonly string[]).map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            {article.articleType === "guide" && role === "admin" && (
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  cursor: "pointer",
                  padding: "10px 14px",
                  border: isPinned
                    ? "1.5px solid #1D9E75"
                    : "1.5px solid #e5e7eb",
                  borderRadius: 8,
                  background: isPinned ? "#E1F5EE" : "#fff",
                  whiteSpace: "nowrap",
                  userSelect: "none",
                  color: isPinned ? "#085041" : "#555",
                }}
              >
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  style={{ display: "none" }}
                />
                <Pin
                  size={14}
                  color={isPinned ? "#085041" : "#aaa"}
                  aria-hidden="true"
                />
                <span style={{ fontWeight: isPinned ? 600 : 400 }}>
                  Épingler
                </span>
              </label>
            )}
          </div>
        )}

        {/* Contenu */}
        <div>
          <label htmlFor="edit-content" style={labelStyle}>
            {article.articleType === "scam" ? "Description *" : "Contenu *"}
          </label>
          <textarea
            id="edit-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            style={{
              ...inputStyle,
              resize: "vertical",
              fontFamily: "inherit",
              lineHeight: 1.7,
            }}
          />
          <MarkdownLegend />
        </div>

        {/* ── Pièces jointes existantes ────────────────────────────────────── */}
        {existingAtts.length > 0 && (
          <div>
            <p style={labelStyle}>
              Pièces jointes existantes
              {deletedExisting.length > 0 && (
                <span
                  style={{
                    marginLeft: 8,
                    color: "#DC2626",
                    fontWeight: 500,
                    textTransform: "none",
                    fontSize: 11,
                  }}
                >
                  ({deletedExisting.length} marquée
                  {deletedExisting.length > 1 ? "s" : ""} pour suppression —
                  annulable)
                </span>
              )}
            </p>

            {/* Images */}
            {existingImages.length > 0 && (
              <div style={{ marginBottom: 12 }}>
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
                        onClick={() => markForDeletion(img.id)}
                        aria-label={`Marquer pour suppression : ${img.name ?? "image"}`}
                        style={{
                          position: "absolute",
                          top: 2,
                          right: 2,
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: "rgba(220,38,38,0.9)",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <X size={11} color="#fff" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {existingDocs.length > 0 && (
              <div style={{ marginBottom: 12 }}>
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
                    <FileText size={14} color="#5B21B6" aria-hidden="true" />
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
                      onClick={() => markForDeletion(doc.id)}
                      aria-label="Marquer pour suppression"
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

            {/* Liens */}
            {existingLinks.length > 0 && (
              <div style={{ marginBottom: 12 }}>
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
                      onClick={() => markForDeletion(lnk.id)}
                      aria-label="Marquer pour suppression"
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

            {/* Éléments marqués pour suppression — annulables */}
            {deletedExisting.length > 0 && (
              <div
                style={{
                  background: "#FFF5F5",
                  border: "1px solid #FECACA",
                  borderRadius: 8,
                  padding: "10px 14px",
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    color: "#DC2626",
                    fontWeight: 600,
                    margin: "0 0 8px",
                  }}
                >
                  Marqués pour suppression (cliquer pour annuler)
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {deletedExisting.map((att) => (
                    <button
                      key={att.id}
                      onClick={() => unmarkForDeletion(att.id)}
                      title="Annuler la suppression"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 10px",
                        background: "#FEE2E2",
                        border: "1.5px dashed #DC2626",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: 12,
                        color: "#DC2626",
                        fontWeight: 500,
                      }}
                    >
                      {att.type === "image" ? (
                        <img
                          src={att.url}
                          alt=""
                          style={{
                            width: 20,
                            height: 20,
                            objectFit: "cover",
                            borderRadius: 3,
                            opacity: 0.5,
                          }}
                        />
                      ) : att.type === "document" ? (
                        <FileText size={12} aria-hidden="true" />
                      ) : (
                        <ExternalLink size={12} aria-hidden="true" />
                      )}
                      <span style={{ opacity: 0.7 }}>
                        {att.name ?? att.url.slice(0, 20)}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          background: "#DC2626",
                          color: "#fff",
                          borderRadius: 4,
                          padding: "1px 5px",
                        }}
                      >
                        ↩ restaurer
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Nouveaux fichiers (preview) ───────────────────────────────────── */}
        {newFiles.length > 0 && (
          <div>
            <p style={{ ...labelStyle, color: "#1D9E75" }}>
              Nouveaux fichiers à ajouter
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {newFiles.map((f, i) => {
                const isImage = f.type.startsWith("image/");
                const preview = isImage ? URL.createObjectURL(f) : null;
                return (
                  <div
                    key={i}
                    style={{
                      position: "relative",
                      width: 80,
                      height: 80,
                      flexShrink: 0,
                      borderRadius: 8,
                      overflow: "hidden",
                      border: "1.5px solid #1D9E75",
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
                      <FileText size={26} color="#6B7280" aria-hidden="true" />
                    )}
                    <button
                      onClick={() =>
                        setNewFiles((p) => p.filter((_, j) => j !== i))
                      }
                      aria-label={`Retirer ${f.name}`}
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
          </div>
        )}

        {/* ── Nouveaux liens (preview) ──────────────────────────────────────── */}
        {newLinks.length > 0 && (
          <div>
            <p style={{ ...labelStyle, color: "#0EA5E9" }}>
              Nouveaux liens à ajouter
            </p>
            {newLinks.map((l, i) => (
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
                  marginBottom: 6,
                }}
              >
                <ExternalLink size={13} color="#0EA5E9" aria-hidden="true" />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#0369A1",
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {l.name}
                </span>
                <button
                  onClick={() =>
                    setNewLinks((p) => p.filter((_, j) => j !== i))
                  }
                  aria-label="Retirer"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#DC2626",
                  }}
                >
                  <X size={13} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Saisie d'un lien ─────────────────────────────────────────────── */}
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
              <label htmlFor="new-link-url" style={{ display: "none" }}>
                URL
              </label>
              <input
                id="new-link-url"
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
                onKeyDown={(e) => e.key === "Enter" && addLink()}
              />
              <label htmlFor="new-link-name" style={{ display: "none" }}>
                Label
              </label>
              <input
                id="new-link-name"
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
                onKeyDown={(e) => e.key === "Enter" && addLink()}
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

        {/* ── Boutons ajout fichier / lien ──────────────────────────────────── */}
        <div>
          <p style={labelStyle}>
            Ajouter des ressources
            {(newFiles.length > 0 || newLinks.length > 0) && (
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
                {newFiles.length + newLinks.length}
              </span>
            )}
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={totalFiles >= 5}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "1.5px dashed #1D9E75",
                background: "transparent",
                color: "#1D9E75",
                fontSize: 12,
                cursor: totalFiles >= 5 ? "not-allowed" : "pointer",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 6,
                opacity: totalFiles >= 5 ? 0.4 : 1,
                minHeight: 40,
              }}
            >
              <Paperclip size={13} aria-hidden="true" /> Photo / Document
              {newFiles.length > 0 && ` (+${newFiles.length})`}
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
          <p style={{ fontSize: 11, color: "#bbb", marginTop: 6 }}>
            JPG, PNG, PDF, Word · Max 10 MB · Max 5 fichiers au total
          </p>
        </div>

        {/* ── Actions ───────────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            gap: 8,
            paddingTop: 4,
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <button
            onClick={handleSave}
            disabled={saving || !title.trim() || !content.trim()}
            style={{
              padding: "10px 24px",
              background: "#1D9E75",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              cursor:
                saving || !title.trim() || !content.trim()
                  ? "not-allowed"
                  : "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
              opacity: saving || !title.trim() || !content.trim() ? 0.6 : 1,
              minHeight: 44,
            }}
          >
            <Send size={13} aria-hidden="true" />
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
          <button
            onClick={onCancel}
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
  );
};
