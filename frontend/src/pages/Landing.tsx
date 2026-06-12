import { useNavigate } from "react-router-dom";
import tiareImg from "../assets/flower-tiare.png";
import heroPattern from "../assets/banner-hero-pattern.svg";
import headerPatternLeft from "../assets/header-pattern-left.svg";
import footerPatternRight from "../assets/footer-pattern-right.svg";
import footerPatternLeft from "../assets/footer-pattern-left.svg";
import fondGeneral from "../assets/fond-general-t.svg";
import fondBambouClair from "../assets/fond-bambou-clair.svg";
import motifBambouHorizontal from "../assets/motif-bambou-horizontal.svg";
import motifBambouCard from "../assets/motif-bambou-card.svg";

const TERRITORIES = [
  "Guadeloupe",
  "Guyane",
  "La Réunion",
  "Martinique",
  "Mayotte",
  "Nouvelle-Calédonie",
  "Polynésie française",
];

const FEATURES = [
  {
    title: "Guides administratifs",
    desc: "CAF, logement, transport, santé... Toutes les démarches expliquées pas à pas.",
  },
  {
    title: "Tips & Témoignages",
    desc: "Des étudiants ultramarins partagent leurs expériences et bons plans pour bien s'installer.",
  },
  {
    title: "Alertes arnaques",
    desc: "Signale et consulte les arnaques vérifiées pour protéger toute la communauté.",
  },
  {
    title: "Carte communautaire",
    desc: "Trouve des étudiants des outres-mer près de chez toi et crée des liens.",
  },
];

const STATS = [
  { value: "+5000", label: "d'étudiants" },
  { value: "7", label: "territoires représentés" },
  { value: "+500", label: "guides rédigés" },
  { value: "100%", label: "gratuit" },
];

export const Landing = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        minHeight: "100vh",
        background: `url(${fondGeneral})`,
        backgroundSize: "cover",
      }}
    >
      {/* Bande motif bambou haut*/}
      <div
        style={{
          height: 36,
          overflow: "hidden",
          backgroundImage: `url(${headerPatternLeft})`,
          backgroundRepeat: "repeat-x",
          backgroundColor: "#0a1d52",
        }}
      />

      {/* HERO SECTION */}
      <section
        style={{
          minHeight: "calc(100vh - 72px)",
          background:
            "radial-gradient(ellipse 140% 120% at 50% 35%, #3ab5e6 0%, #1a6fc4 40%, #0a1d52 80%)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Motif décoratif en fond du hero */}
        <img
          src={heroPattern}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.15,
            pointerEvents: "none",
          }}
        />

        {/* NAVBAR */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 48px",
            height: 64,
            flexShrink: 0,
            position: "relative",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.5)",
                background: "rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
              🌴
            </div>
          </div>

          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            <a
              href="#"
              style={{
                color: "rgba(255,255,255,0.85)",
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              Accueil
            </a>
            <a
              href="#about"
              style={{
                color: "rgba(255,255,255,0.85)",
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              À propos
            </a>
            <a
              href="#demarches"
              style={{
                color: "rgba(255,255,255,0.85)",
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              Démarches
            </a>
            <a
              href="#features"
              style={{
                color: "rgba(255,255,255,0.85)",
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              Fonctionnalités
            </a>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => navigate("/register")}
              style={{
                padding: "8px 22px",
                background: "transparent",
                border: "1.5px solid rgba(255,255,255,0.65)",
                color: "#fff",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 400,
              }}
            >
              S'inscrire
            </button>
            <button
              onClick={() => navigate("/login")}
              style={{
                padding: "8px 22px",
                background: "#0a1d52",
                border: "1.5px solid #0a1d52",
                color: "#fff",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Se connecter
            </button>
          </div>
        </nav>

        {/* Fleur tiare décorative */}
        <img
          src={tiareImg}
          alt=""
          style={{
            position: "absolute",
            right: "10%",
            top: "55%",
            width: 140,
            opacity: 0.95,
            userSelect: "none",
            pointerEvents: "none",
            filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.25))",
          }}
        />

        {/* Contenu hero */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 20px 80px",
            zIndex: 1,
            position: "relative",
          }}
        >
          <p
            style={{
              color: "rgba(255,255,255,0.9)",
              fontSize: 18,
              fontWeight: 300,
              marginBottom: 12,
            }}
          >
            Bienvenue sur
          </p>

          <h1
            style={{
              fontSize: "clamp(52px, 8vw, 80px)",
              fontWeight: 800,
              margin: "0 0 24px",
              letterSpacing: "-2px",
              lineHeight: 0.95,
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: "0.75em" }}>🌺</span>
            <span style={{ color: "#0a1d52" }}>DOM-TOM Connect</span>
          </h1>

          <p
            style={{
              color: "rgba(255,255,255,0.9)",
              fontSize: 16,
              lineHeight: 1.7,
              maxWidth: 600,
              textAlign: "center",
              marginBottom: 40,
            }}
          >
            Une appli web qui t'accompagne dans ton installation en France :
            démarches administratives, bons plans, alertes arnaques et une
            communauté des outres-mer près de chez toi.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 10,
              maxWidth: 640,
            }}
          >
            {TERRITORIES.map((t) => (
              <span
                key={t}
                style={{
                  padding: "7px 18px",
                  border: "1.5px solid rgba(255,255,255,0.6)",
                  borderRadius: 50,
                  color: "#fff",
                  fontSize: 13,
                }}
              >
                {t}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 40 }}>
            <button
              onClick={() => navigate("/register")}
              style={{
                padding: "12px 32px",
                background: "#fff",
                border: "none",
                borderRadius: 10,
                color: "#0a1d52",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Rejoindre la communauté
            </button>
            <button
              onClick={() => navigate("/login")}
              style={{
                padding: "12px 32px",
                background: "rgba(255,255,255,0.15)",
                border: "1.5px solid rgba(255,255,255,0.5)",
                borderRadius: 10,
                color: "#fff",
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              Se connecter
            </button>
          </div>
        </div>

        {/* Bande motif bambou bas du hero */}
        <div
          style={{
            height: 36,
            overflow: "hidden",
            backgroundImage: `url(${motifBambouHorizontal})`,
            backgroundRepeat: "repeat-x",
            position: "relative",
            zIndex: 2,
          }}
        />
      </section>

      {/* STATS SECTION */}
      <section
        style={{
          background: "#1a6fc4",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          padding: "40px 60px",
          gap: 0,
        }}
      >
        {STATS.map(({ value, label }) => (
          <div key={label} style={{ textAlign: "center", color: "#fff" }}>
            <p
              style={{
                fontSize: 40,
                fontWeight: 700,
                margin: 0,
                lineHeight: 1,
              }}
            >
              {value}
            </p>
            <p style={{ fontSize: 14, opacity: 0.85, margin: "6px 0 0" }}>
              {label}
            </p>
          </div>
        ))}
      </section>

      {/* Bande motif bambou (séparateur) */}
      <div
        style={{
          height: 36,
          overflow: "hidden",
          backgroundImage: `url(${motifBambouHorizontal})`,
          backgroundRepeat: "repeat-x",
        }}
      />

      {/* FEATURES SECTION */}
      <section
        id="features"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, #1a4fa0 0%, #0a1d52 50%, #040e2e 100%)",
          padding: "80px 60px",
          textAlign: "center",
          position: "relative",
        }}
      >
        <img
          src={fondBambouClair}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.08,
            pointerEvents: "none",
          }}
        />

        <p
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 12,
            position: "relative",
          }}
        >
          Fonctionnalités
        </p>
        <h2
          style={{
            color: "#fff",
            fontSize: "clamp(24px, 4vw, 38px)",
            fontWeight: 700,
            marginBottom: 12,
            lineHeight: 1.2,
            position: "relative",
          }}
        >
          Tout ce dont tu as besoin pour{" "}
          <span style={{ color: "#3ab5e6" }}>bien t'installer</span>.
        </h2>
        <p
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 15,
            maxWidth: 500,
            margin: "0 auto 56px",
            position: "relative",
          }}
        >
          Une plateforme complète pour t'accompagner de A à Z dans ton
          intégration.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 24,
            maxWidth: 1000,
            margin: "0 auto",
            position: "relative",
          }}
        >
          {FEATURES.map((f) => (
            <div
              key={f.title}
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: "28px 24px",
                textAlign: "left",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <img
                src={motifBambouCard}
                alt=""
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: 8,
                  objectFit: "cover",
                }}
              />
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#0a1d52",
                  marginBottom: 8,
                  marginTop: 8,
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: "#555",
                  lineHeight: 1.6,
                  marginBottom: 14,
                }}
              >
                {f.desc}
              </p>
              <a
                href="#"
                style={{
                  color: "#1a6fc4",
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                En savoir plus →
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* CTA SECTION */}
      <section
        style={{
          background: "#040e2e",
          padding: "60px 40px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            color: "#fff",
            fontSize: 30,
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          Prêt(e) à rejoindre la communauté ?
        </h2>
        <p
          style={{
            color: "rgba(255,255,255,0.65)",
            fontSize: 15,
            marginBottom: 28,
          }}
        >
          Inscription gratuite · Aucune carte bancaire requise
        </p>
        <button
          onClick={() => navigate("/register")}
          style={{
            padding: "14px 40px",
            background: "#1a6fc4",
            border: "none",
            borderRadius: 10,
            color: "#fff",
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Créer mon compte gratuitement
        </button>
      </section>

      {/* Bande motif bambou footer */}
      <div
        style={{
          height: 36,
          overflow: "hidden",
          display: "flex",
        }}
      >
        <img
          src={footerPatternLeft}
          alt=""
          style={{ width: "50%", height: "100%", objectFit: "cover" }}
        />
        <img
          src={footerPatternRight}
          alt=""
          style={{ width: "50%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* FOOTER */}
      <footer
        style={{
          background: "#040e2e",
          borderTop: "0.5px solid rgba(255,255,255,0.1)",
          padding: "20px 48px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
          DOM-TOM Connect - {new Date().getFullYear()}
        </p>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
          Fait avec pour les étudiants ultramarins
        </p>
      </footer>
    </div>
  );
};
