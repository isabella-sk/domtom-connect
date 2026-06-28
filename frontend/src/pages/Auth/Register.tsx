import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useMobile } from "../../hooks/useMobile";
import heroPattern from "../../assets/banner-hero-pattern.svg";
import { Footer } from "../../components/layout/Footer";

const TERRITORIES = [
  "Nouvelle-Calédonie",
  "Wallis-et-Futuna",
  "Polynésie française",
  "Martinique",
  "Guadeloupe",
  "Guyane",
  "La Réunion",
  "Mayotte",
] as const;

const schema = z
  .object({
    email: z.string().email("Email invalide"),
    username: z
      .string()
      .min(3, "Min 3 caractères")
      .max(30)
      .regex(/^[a-zA-Z0-9_]+$/, "Lettres, chiffres, underscores uniquement"),
    password: z
      .string()
      .min(8, "Min 8 caractères")
      .regex(/[A-Z]/, "Au moins une majuscule")
      .regex(/[0-9]/, "Au moins un chiffre")
      .regex(/[^a-zA-Z0-9]/, "Au moins un caractère spécial"),
    confirmPassword: z.string(),
    originTerritory: z.enum(TERRITORIES, {
      message: "Choisissez un territoire",
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type F = z.infer<typeof schema>;

export const Register = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword: _confirmPassword, ...registerData } = data;
      await registerUser(registerData);
      navigate("/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message;
      setServerError(message ?? "Une erreur est survenue");
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
            style={{
              color: "rgba(255,255,255,0.85)",
              textDecoration: "none",
              fontSize: 15,
            }}
          >
            ← Retour à l'accueil
          </Link>
        </nav>

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
              maxWidth: 460,
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
              Créer un compte
            </h1>
            <p
              style={{
                textAlign: "center",
                color: "#777",
                fontSize: 14,
                marginBottom: 28,
              }}
            >
              Rejoins DOM-TOM Connect
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
              {/* Email */}
              <div>
                <label htmlFor="reg-email" style={labelStyle}>
                  Email
                </label>
                <input
                  id="reg-email"
                  type="email"
                  {...register("email")}
                  placeholder="ton@email.fr"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "reg-email-err" : undefined}
                  style={inputStyle}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "#2888C5")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "#D1D5DB")
                  }
                />
                {errors.email && (
                  <p id="reg-email-err" role="alert" style={errorStyle}>
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Username */}
              <div>
                <label htmlFor="reg-username" style={labelStyle}>
                  Nom d'utilisateur
                </label>
                <input
                  id="reg-username"
                  type="text"
                  {...register("username")}
                  placeholder="ton_pseudo"
                  autoComplete="username"
                  aria-invalid={!!errors.username}
                  aria-describedby={
                    errors.username ? "reg-username-err" : undefined
                  }
                  style={inputStyle}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "#2888C5")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "#D1D5DB")
                  }
                />
                {errors.username && (
                  <p id="reg-username-err" role="alert" style={errorStyle}>
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Territoire */}
              <div>
                <label htmlFor="reg-territory" style={labelStyle}>
                  Territoire d'origine
                </label>
                <select
                  id="reg-territory"
                  {...register("originTerritory")}
                  aria-invalid={!!errors.originTerritory}
                  aria-describedby={
                    errors.originTerritory ? "reg-territory-err" : undefined
                  }
                  style={{ ...inputStyle, background: "#fff" }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "#2888C5")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "#D1D5DB")
                  }
                >
                  <option value="">Sélectionne ton territoire</option>
                  {TERRITORIES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {errors.originTerritory && (
                  <p id="reg-territory-err" role="alert" style={errorStyle}>
                    {errors.originTerritory.message}
                  </p>
                )}
              </div>

              {/* Mot de passe */}
              <div>
                <label htmlFor="login-password" style={labelStyle}>
                  Mot de passe
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    autoComplete="current-password"
                    aria-invalid={!!errors.password}
                    aria-describedby={
                      errors.password ? "password-error" : undefined
                    }
                    style={{ ...inputStyle, paddingRight: 44 }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "#2888C5")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "#D1D5DB")
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#9CA3AF",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                    }}
                    aria-label={
                      showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                  >
                    {showPassword ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" role="alert" style={errorStyle}>
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirmer mot de passe */}
              <div>
                <label htmlFor="reg-confirm" style={labelStyle}>
                  Confirmer le mot de passe
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="reg-confirm"
                    type={showConfirm ? "text" : "password"}
                    {...register("confirmPassword")}
                    autoComplete="new-password"
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={
                      errors.confirmPassword ? "reg-confirm-err" : undefined
                    }
                    style={{ ...inputStyle, paddingRight: 44 }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "#2888C5")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "#D1D5DB")
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#9CA3AF",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                    }}
                    aria-label={showConfirm ? "Masquer" : "Afficher"}
                  >
                    {showConfirm ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p id="reg-confirm-err" role="alert" style={errorStyle}>
                    {errors.confirmPassword.message}
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
                {isLoading ? "Création..." : "Créer mon compte"}
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
              Déjà un compte ?{" "}
              <Link
                to="/login"
                style={{
                  color: "#2888C5",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Se connecter
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
