import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

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
      .regex(/^[a-zA-Z0-9_]+$/, "Lettres, chiffres, underscores"),
    password: z
      .string()
      .min(8, "Min 8 caractères")
      .regex(/[A-Z]/, "Une majuscule")
      .regex(/[0-9]/, "Un chiffre")
      .regex(/[^a-zA-Z0-9]/, "Un caractère spécial"),
    confirmPassword: z.string(),
    originTerritory: z.enum(TERRITORIES, {
      errorMap: () => ({ message: "Choisissez un territoire" }),
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Mots de passe différents",
    path: ["confirmPassword"],
  });

type F = z.infer<typeof schema>;

export const Register = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<F>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: F) => {
    setServerError(null);
    try {
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);
      navigate("/dashboard");
    } catch (err: any) {
      setServerError(err.response?.data?.message || "Une erreur est survenue");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <img
          src="/logo.svg"
          alt="DomTom Connect"
          className="mx-auto mb-4 w-40"
        />
        <h1 className="text-secondary text-center text-2xl font-medium mb-1">
          Créer un compte
        </h1>
        <p className="text-center text-gray-500 text-sm mb-6">
          Rejoins DomTom Connect
        </p>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {[
            {
              id: "email",
              label: "Email",
              type: "email",
              placeholder: "ton@email.fr",
            },
            {
              id: "username",
              label: "Nom d'utilisateur",
              type: "text",
              placeholder: "ton_pseudo",
            },
          ].map(({ id, label, type, placeholder }) => (
            <div key={id}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              <input
                type={type}
                {...register(id as any)}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors[id as keyof F] && (
                <p className="text-red-500 text-xs mt-1">
                  {errors[id as keyof F]?.message as string}
                </p>
              )}
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Territoire d'origine
            </label>
            <select
              {...register("originTerritory")}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
            >
              <option value="">Sélectionne ton territoire</option>
              {TERRITORIES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {errors.originTerritory && (
              <p className="text-red-500 text-xs mt-1">
                {errors.originTerritory.message}
              </p>
            )}
          </div>

          {["password", "confirmPassword"].map((id) => (
            <div key={id}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {id === "password" ? "Mot de passe" : "Confirmer"}
              </label>
              <input
                type="password"
                {...register(id as any)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors[id as keyof F] && (
                <p className="text-red-500 text-xs mt-1">
                  {errors[id as keyof F]?.message as string}
                </p>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-secondary text-white text-sm font-medium rounded-lg hover:bg-secondary/90 disabled:opacity-50 transition"
          >
            {isLoading ? "Création..." : "Créer mon compte"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Déjà un compte ?{" "}
          <Link to="/login" className="text-secondary hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
};
