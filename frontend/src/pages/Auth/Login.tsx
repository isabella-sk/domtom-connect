import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});
type F = z.infer<typeof schema>;

export const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
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
          Connexion
        </h1>
        <p className="text-center text-gray-500 text-sm mb-6">
          Content de te revoir
        </p>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              {...register("email")}
              placeholder="ton@email.fr"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              {...register("password")}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-secondary text-white text-sm font-medium rounded-lg hover:bg-secondary/90 disabled:opacity-50 transition"
          >
            {isLoading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Pas encore de compte ?{" "}
          <Link to="/register" className="text-secondary hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
};
