"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PAGE_TITLES } from "@/lib/nav";
import { signOut, toggleMode } from "@/app/(app)/actions";
import type { AccessLevel } from "@/lib/session";

const ROLE_LABEL: Record<AccessLevel, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  colaborador: "Colaborador",
};

export function Header({
  name,
  role,
  canToggleMode,
  mode,
}: {
  name: string;
  role: AccessLevel;
  canToggleMode: boolean;
  mode: "admin" | "normal";
}) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Dashboard";

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <header className="flex justify-between items-center gap-3 mb-5 flex-wrap">
      <h1 className="font-semibold text-xl text-[#1B3A4B]" style={{ fontFamily: "Georgia, serif" }}>
        {title}
      </h1>
      <div className="flex items-center gap-2.5">
        <div className="text-right text-xs leading-tight">
          <div className="font-semibold">{name}</div>
          <div className="text-gray-500">{ROLE_LABEL[role]}</div>
        </div>
        <div className="w-[30px] h-[30px] rounded-full bg-[#D9A441] flex items-center justify-center font-semibold text-[#3A2A0A] text-[13px] shrink-0">
          {initials}
        </div>
        <Link
          href="/account"
          className="border border-gray-200 rounded-md px-2.5 py-1 text-[11.5px] text-[#1B3A4B]"
        >
          Mi cuenta
        </Link>
        {canToggleMode && (
          <form action={toggleMode}>
            <button className="border border-gray-200 rounded-md px-2.5 py-1 text-[11.5px] text-[#1B3A4B]">
              {mode === "admin" ? "Ver como Gerente" : "Volver a Administración"}
            </button>
          </form>
        )}
        <form action={signOut}>
          <button className="border border-gray-200 rounded-md px-2.5 py-1 text-[11.5px] text-[#1B3A4B]">
            Cerrar sesión
          </button>
        </form>
      </div>
    </header>
  );
}
