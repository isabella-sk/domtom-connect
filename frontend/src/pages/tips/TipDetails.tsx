import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Lightbulb,
  BookOpen,
  ArrowLeft,
  ExternalLink,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import api from "../../services/api";
import { Navbar } from "../../components/layout/Navbar";
import { Sidebar } from "../../components/layout/Sidebar";
import { Footer } from "../../components/layout/Footer";
import { useMobile } from "../../hooks/useMobile";
import friseSide from "../../assets/frise_side.png";
import { MarkdownContent } from "../../components/layout/MarkdownContent";

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

export const TipDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [tip, setTip] = useState<Tip | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{
    images: Attachment[];
    index: number;
  } | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    api
      .get(`/tips/${id}`)
      .then((r) => {
        if (!cancelled) setTip(r.data);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      setLoading(true);
    };
  }, [id]);

  const images = tip?.attachments?.filter((a) => a.type === "image") ?? [];
  const docs = tip?.attachments?.filter((a) => a.type === "document") ?? [];
  const links = tip?.attachments?.filter((a) => a.type === "link") ?? [];

  const closeLightbox = () => setLightbox(null);
  const prevImage = () =>
    setLightbox((l) =>
      l
        ? { ...l, index: (l.index - 1 + l.images.length) % l.images.length }
        : l,
    );
  const nextImage = () =>
    setLightbox((l) =>
      l ? { ...l, index: (l.index + 1) % l.images.length } : l,
    );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    };
    if (lightbox) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox]);

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
            <button
              onClick={() => navigate("/tips")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: "rgba(255,255,255,0.85)",
                background: "transparent",
                border: "1.5px solid rgba(255,255,255,0.4)",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 14,
                cursor: "pointer",
                marginBottom: 24,
                minHeight: 44,
              }}
            >
              <ArrowLeft size={16} aria-hidden="true" /> Retour aux tips
            </button>

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
            ) : !tip ? (
              <p
                role="alert"
                style={{
                  textAlign: "center",
                  color: "rgba(255,255,255,0.6)",
                  padding: "48px 0",
                }}
              >
                Contenu introuvable.
              </p>
            ) : (
              <div style={{ maxWidth: 820 }}>
                {/* Carte principale */}
                <article
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    padding: isMobile ? "20px 18px" : "32px 36px",
                    marginBottom: 16,
                  }}
                >
                  {/* Auteur + badge */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 20,
                      flexWrap: "wrap",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: "50%",
                          background: "#E1F5EE",
                          color: "#085041",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 16,
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
                            fontSize: 14,
                            fontWeight: 700,
                            margin: 0,
                            color: "#0a1d52",
                          }}
                        >
                          {tip.author.username}
                        </p>
                        <p style={{ fontSize: 12, color: "#999", margin: 0 }}>
                          {tip.author.originTerritory}
                        </p>
                      </div>
                    </div>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        background: tip.type === "tip" ? "#FAEEDA" : "#E6F1FB",
                        color: tip.type === "tip" ? "#633806" : "#0C447C",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      {tip.type === "tip" ? (
                        <>
                          <Lightbulb size={13} aria-hidden="true" /> Bon plan
                        </>
                      ) : (
                        <>
                          <BookOpen size={13} aria-hidden="true" /> Témoignage
                        </>
                      )}
                    </span>
                  </div>

                  <h1
                    style={{
                      color: "#0a1d52",
                      fontSize: isMobile ? 20 : "clamp(22px, 4vw, 30px)",
                      fontWeight: 800,
                      margin: "0 0 8px",
                      lineHeight: 1.2,
                    }}
                  >
                    {tip.title}
                  </h1>
                  <p style={{ color: "#aaa", fontSize: 13, marginBottom: 24 }}>
                    <time dateTime={tip.createdAt}>
                      {new Date(tip.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </time>
                  </p>

                  <MarkdownContent content={tip.content} />
                </article>

                {/* Galerie images */}
                {images.length > 0 && (
                  <section
                    aria-label={`Photos (${images.length})`}
                    style={{
                      background: "#fff",
                      borderRadius: 14,
                      padding: "22px 24px",
                      marginBottom: 16,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#0a1d52",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: 14,
                      }}
                    >
                      Photos ({images.length})
                    </p>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(140px, 1fr))",
                        gap: 10,
                      }}
                    >
                      {images.map((img, i) => (
                        <button
                          key={img.id}
                          onClick={() => setLightbox({ images, index: i })}
                          aria-label={`Agrandir : ${img.name ?? `Photo ${i + 1}`}`}
                          style={{
                            height: 130,
                            borderRadius: 10,
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
                  </section>
                )}

                {/* Documents */}
                {docs.length > 0 && (
                  <section
                    aria-label={`Documents (${docs.length})`}
                    style={{
                      background: "#fff",
                      borderRadius: 14,
                      padding: "22px 24px",
                      marginBottom: 16,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#0a1d52",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: 14,
                      }}
                    >
                      Documents ({docs.length})
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {docs.map((doc) => (
                        <a
                          key={doc.id}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Télécharger ${doc.name ?? "Document"} (nouvelle fenêtre)`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "12px 14px",
                            background: "#F9FAFB",
                            border: "1px solid #e5e7eb",
                            borderRadius: 10,
                            textDecoration: "none",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#F3F4F6";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#F9FAFB";
                          }}
                        >
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 8,
                              background: "#EDE9FE",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                            aria-hidden="true"
                          >
                            <FileText size={18} color="#5B21B6" />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#0a1d52",
                                margin: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {doc.name ?? "Document"}
                            </p>
                            <p
                              style={{ fontSize: 11, color: "#aaa", margin: 0 }}
                            >
                              Cliquer pour ouvrir
                            </p>
                          </div>
                          <ExternalLink
                            size={14}
                            color="#9CA3AF"
                            aria-hidden="true"
                          />
                        </a>
                      ))}
                    </div>
                  </section>
                )}

                {/* Liens */}
                {links.length > 0 && (
                  <section
                    aria-label={`Liens utiles (${links.length})`}
                    style={{
                      background: "#fff",
                      borderRadius: 14,
                      padding: "22px 24px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#0a1d52",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: 14,
                      }}
                    >
                      Liens utiles ({links.length})
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
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
                            gap: 12,
                            padding: "12px 14px",
                            background: "#F0F9FF",
                            border: "1px solid #BAE6FD",
                            borderRadius: 10,
                            textDecoration: "none",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#E0F2FE";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#F0F9FF";
                          }}
                        >
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 8,
                              background: "#DBEAFE",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                            aria-hidden="true"
                          >
                            <ExternalLink size={18} color="#1D4ED8" />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#0369A1",
                                margin: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {lnk.name ?? lnk.url}
                            </p>
                            <p
                              style={{
                                fontSize: 11,
                                color: "#0EA5E9",
                                margin: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {lnk.url}
                            </p>
                          </div>
                          <ExternalLink
                            size={14}
                            color="#7DD3FC"
                            aria-hidden="true"
                          />
                        </a>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
      <Footer />

      {/* Lightbox */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${lightbox.index + 1} sur ${lightbox.images.length}`}
          onClick={closeLightbox}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.92)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <button
            onClick={closeLightbox}
            aria-label="Fermer la galerie"
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: "50%",
              width: 44,
              height: 44,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} color="#fff" aria-hidden="true" />
          </button>
          <div
            aria-live="polite"
            style={{
              position: "absolute",
              top: 24,
              left: "50%",
              transform: "translateX(-50%)",
              color: "rgba(255,255,255,0.6)",
              fontSize: 13,
            }}
          >
            {lightbox.index + 1} / {lightbox.images.length}
          </div>
          <img
            src={lightbox.images[lightbox.index].url}
            alt={
              lightbox.images[lightbox.index].name ??
              `Photo ${lightbox.index + 1}`
            }
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "88vw",
              maxHeight: "85vh",
              objectFit: "contain",
              borderRadius: 8,
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          />
          {lightbox.images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                aria-label="Photo précédente"
                style={{
                  position: "absolute",
                  left: 16,
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  borderRadius: "50%",
                  width: 48,
                  height: 48,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChevronLeft size={22} color="#fff" aria-hidden="true" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                aria-label="Photo suivante"
                style={{
                  position: "absolute",
                  right: 16,
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  borderRadius: "50%",
                  width: 48,
                  height: 48,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChevronRight size={22} color="#fff" aria-hidden="true" />
              </button>
            </>
          )}
          {lightbox.images.length > 1 && (
            <div
              style={{
                position: "absolute",
                bottom: 20,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: 8,
              }}
            >
              {lightbox.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightbox((l) => (l ? { ...l, index: i } : l));
                  }}
                  aria-label={`Afficher la photo ${i + 1}`}
                  aria-current={i === lightbox.index ? "true" : undefined}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 6,
                    overflow: "hidden",
                    cursor: "pointer",
                    border:
                      i === lightbox.index
                        ? "2px solid #fff"
                        : "2px solid transparent",
                    opacity: i === lightbox.index ? 1 : 0.5,
                    transition: "all 0.15s",
                    padding: 0,
                    background: "none",
                  }}
                >
                  <img
                    src={img.url}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
