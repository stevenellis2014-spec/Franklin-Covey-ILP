"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError("Correo o contraseña incorrectos.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1B3A4B] px-4">
      <div className="bg-white rounded-xl p-9 w-full max-w-[400px]">
        <h1 className="font-semibold text-2xl text-[#1B3A4B] mb-1">Franklin Covey ILP</h1>
        <p className="text-sm text-gray-500 mb-6">Instituto de Liderazgo y Productividad</p>

        <form onSubmit={handleSubmit}>
          <label className="block text-xs text-gray-500 mb-1.5">Correo electrónico</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm mb-4"
            placeholder="nombre@empresa.com"
          />

          <label className="block text-xs text-gray-500 mb-1.5">Contraseña</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm mb-4"
            placeholder="••••••••"
          />

          {error && <div className="text-[#B94A48] text-xs mb-3">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1B3A4B] text-white font-semibold text-sm rounded-lg py-2.5 disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className="text-center mt-4">
          <Link href="/forgot-password" className="text-xs text-[#1B3A4B] underline font-medium">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>
    </div>
  );
}
