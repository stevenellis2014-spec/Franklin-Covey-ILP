"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError("No se pudo actualizar la contraseña. El enlace pudo haber expirado — solicita uno nuevo.");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/dashboard"), 1800);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1B3A4B] px-4">
      <div className="bg-white rounded-xl p-9 w-full max-w-[400px]">
        <h1 className="font-semibold text-2xl text-[#1B3A4B] mb-1">Franklin Covey ILP</h1>
        <p className="text-sm text-gray-500 mb-6">Establece tu nueva contraseña</p>

        {done ? (
          <div className="text-sm text-[#2E7D5B] font-medium">
            Contraseña actualizada. Redirigiendo...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="block text-xs text-gray-500 mb-1.5">Nueva contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm mb-4"
              placeholder="Mínimo 8 caracteres"
            />
            <label className="block text-xs text-gray-500 mb-1.5">Confirmar contraseña</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm mb-4"
              placeholder="Repite la contraseña"
            />
            {error && <div className="text-[#B94A48] text-xs mb-3">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1B3A4B] text-white font-semibold text-sm rounded-lg py-2.5 disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar nueva contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
