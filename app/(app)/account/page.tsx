"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AccountPage() {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOk(false);

    if (password.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      setError("No se pudo verificar tu sesión.");
      setLoading(false);
      return;
    }

    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    });

    if (reauthError) {
      setError("Tu contraseña actual no es correcta.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError("No se pudo actualizar la contraseña.");
      return;
    }

    setOk(true);
    setCurrent("");
    setPassword("");
    setConfirm("");
  }

  return (
    <div className="max-w-md">
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="font-semibold text-[15px] mb-1" style={{ fontFamily: "Georgia, serif" }}>
          Cambiar contraseña
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Ingresa tu contraseña actual y la nueva contraseña que quieras usar.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="block text-xs text-gray-500 mb-1.5">Contraseña actual</label>
          <input
            type="password"
            required
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm mb-3"
          />
          <label className="block text-xs text-gray-500 mb-1.5">Nueva contraseña</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm mb-3"
            placeholder="Mínimo 8 caracteres"
          />
          <label className="block text-xs text-gray-500 mb-1.5">Confirmar nueva contraseña</label>
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm mb-3"
          />

          {error && <div className="text-[#B94A48] text-xs mb-3">{error}</div>}
          {ok && <div className="text-[#2E7D5B] text-xs mb-3">Contraseña actualizada correctamente.</div>}

          <button
            type="submit"
            disabled={loading}
            className="bg-[#1B3A4B] text-white font-semibold text-sm rounded-lg py-2 px-4 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>
    </div>
  );
}
