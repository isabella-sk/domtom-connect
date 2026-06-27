import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useMobile } from "../../hooks/useMobile";
import heroPattern from "../../assets/banner-hero-pattern.svg";
import { Footer } from "../../components/layout/Footer";

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});
type F = z.infer<typeof schema>;

export const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const isMobile = useMobile();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<F>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: F) => {
    setServerError(null);
    try {
      await login(data);
      navigate("/dashboard");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setServerError(e.response?.data?.message || "Une erreur est survenue");
    }
  };

  return (
    <div className="font-sans min-h-screen flex flex-col">
      <div
        style={{
          flex: 1,
          background:
            "radial-gradient(ellipse 140% 120% at 50% 35%, #3ab5e6 0%, #14539E 40%, #0a1d52 80%)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        <img
          src={heroPattern}
          alt=""
          aria-hidden="true"
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

        {/* Navbar minimaliste */}
        <nav
          aria-label="Navigation"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: isMobile ? "0 16px" : "0 48px",
            height: 64,
            flexShrink: 0,
            position: "relative",
            zIndex: 10,
          }}
        >
          <Link
            to="/"
            aria-label="DOM-TOM Connect  Retour à l'accueil"
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <div
              aria-hidden="true"
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.5)",
                background: "rgba(255,255,255,0.12)",
              }}
            />
          </Link>

          <Link
            to="/"
            style={{
              color: "rgba(255,255,255,0.85)",
              textDecoration: "none",
              fontSize: 15,
            }}
          >
            ← Retour à l'accueil
          </Link>
        </nav>

        {/* Contenu */}
        <main
          id="main-content"
          tabIndex={-1}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: isMobile ? "24px 16px 60px" : "40px 20px 80px",
            zIndex: 1,
            position: "relative",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              background: "#fff",
              borderRadius: 20,
              boxShadow: "0 20px 60px rgba(10,29,82,0.25)",
              padding: isMobile ? "28px 20px" : "40px 36px",
            }}
          >
            <img
              src="/logo.svg"
              alt="DOM-TOM Connect"
              style={{
                width: 140,
                margin: "0 auto 16px",
                display: "block",
              }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <h1
              style={{
                color: "#0a1d52",
                textAlign: "center",
                fontSize: 24,
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              Connexion
            </h1>
            <p
              style={{
                textAlign: "center",
                color: "#777",
                fontSize: 14,
                marginBottom: 28,
              }}
            >
              Content de te revoir
            </p>

            {serverError && (
              <div
                role="alert"
                aria-live="assertive"
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  color: "#B91C1C",
                  fontSize: 14,
                  padding: "12px 16px",
                  borderRadius: 10,
                  marginBottom: 16,
                }}
              >
                {serverError}
              </div>
            )}

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div>
                <label htmlFor="login-email" style={labelStyle}>
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  {...register("email")}
                  placeholder="ton@email.fr"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  style={inputStyle}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "#2888C5")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "#D1D5DB")
                  }
                />
                {errors.email && (
                  <p id="email-error" role="alert" style={errorStyle}>
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="login-password" style={labelStyle}>
                  Mot de passe
                </label>
                <input
                  id="login-password"
                  type="password"
                  {...register("password")}
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  style={inputStyle}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "#2888C5")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "#D1D5DB")
                  }
                />
                {errors.password && (
                  <p id="password-error" role="alert" style={errorStyle}>
                    {errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                aria-busy={isLoading}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#0a1d52",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 600,
                  borderRadius: 10,
                  border: "none",
                  cursor: isLoading ? "default" : "pointer",
                  opacity: isLoading ? 0.6 : 1,
                  marginTop: 8,
                  transition: "background 0.2s",
                  minHeight: 48,
                }}
              >
                {isLoading ? "Connexion..." : "Se connecter"}
              </button>
            </form>

            <p
              style={{
                textAlign: "center",
                fontSize: 14,
                color: "#777",
                marginTop: 20,
              }}
            >
              Pas encore de compte ?{" "}
              <Link
                to="/register"
                style={{
                  color: "#2888C5",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Créer un compte
              </Link>
            </p>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 14,
  fontWeight: 500,
  color: "#374151",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: "1.5px solid #D1D5DB",
  borderRadius: 10,
  fontSize: 14,
  outline: "none",
  transition: "border-color 0.2s",
  boxSizing: "border-box",
};

const errorStyle: React.CSSProperties = {
  color: "#EF4444",
  fontSize: 12,
  marginTop: 4,
};
