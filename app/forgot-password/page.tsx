"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError("No se pudo procesar la solicitud. Intenta de nuevo.");
      return;
    }
    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1B3A4B] px-4">
      <div className="bg-white rounded-xl p-9 w-full max-w-[400px]">
        <h1 className="font-semibold text-2xl text-[#1B3A4B] mb-1">Franklin Covey ILP</h1>
        <p className="text-sm text-gray-500 mb-6">Recuperar contraseña</p>

        {sent ? (
          <div className="text-sm text-gray-700">
            Si el correo <strong>{email}</strong> está registrado, te enviamos un enlace para
            restablecer tu contraseña. Revisa tu bandeja de entrada (y spam).
          </div>
        ) : (
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
            {error && <div className="text-[#B94A48] text-xs mb-3">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1B3A4B] text-white font-semibold text-sm rounded-lg py-2.5 disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviar enlace de recuperación"}
            </button>
          </form>
        )}

        <div className="text-center mt-4">
          <Link href="/login" className="text-xs text-[#1B3A4B] underline font-medium">
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
