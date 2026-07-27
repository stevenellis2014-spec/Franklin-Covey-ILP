"use client";

import { useState, type ReactNode } from "react";

export type FieldOption = { value: string; label: string };
export type Field = {
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "number" | "date" | "select" | "textarea";
  options?: FieldOption[];
  default?: string | number;
};

export function FormModal({
  title,
  fields,
  initial,
  onSave,
  onClose,
  extra,
  saveLabel = "Guardar",
}: {
  title: string;
  fields: Field[];
  initial?: Record<string, unknown> | null;
  onSave: (data: Record<string, string | number>) => void | Promise<void>;
  onClose: () => void;
  extra?: ReactNode;
  saveLabel?: string;
}) {
  const [values, setValues] = useState<Record<string, string | number>>(() => {
    const v: Record<string, string | number> = {};
    fields.forEach((f) => {
      const initVal = initial ? initial[f.name] : undefined;
      const fallback = f.type === "select" ? f.options?.[0]?.value ?? "" : "";
      v[f.name] = (initVal as string | number | undefined) ?? f.default ?? fallback;
    });
    return v;
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(values);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-[#1B3A4B]/35 flex items-center justify-center z-50 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-[460px] max-h-[86vh] overflow-y-auto">
        <h3 className="font-semibold text-base mb-4" style={{ fontFamily: "Georgia, serif" }}>
          {title}
        </h3>
        <div>
          {fields.map((f) => (
            <div className="mb-3" key={f.name}>
              <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
              {f.type === "select" ? (
                <select
                  value={String(values[f.name])}
                  onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm"
                >
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : f.type === "textarea" ? (
                <textarea
                  value={String(values[f.name])}
                  onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm min-h-[56px]"
                />
              ) : (
                <input
                  type={f.type ?? "text"}
                  value={values[f.name]}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      [f.name]: f.type === "number" ? Number(e.target.value) : e.target.value,
                    })
                  }
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm"
                />
              )}
            </div>
          ))}
        </div>
        {extra}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="border border-gray-200 rounded-md px-3.5 py-2 text-[13px] font-semibold text-[#1B3A4B]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#1B3A4B] text-white rounded-md px-3.5 py-2 text-[13px] font-semibold disabled:opacity-50"
          >
            {saving ? "Guardando..." : saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
