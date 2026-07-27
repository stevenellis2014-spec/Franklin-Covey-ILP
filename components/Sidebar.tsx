"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { NavGroup } from "@/lib/nav";

function NavLinks({ navSet, onNavigate }: { navSet: NavGroup[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {navSet.map((g) => (
        <div key={g.group}>
          <div className="text-[10.5px] uppercase tracking-wider text-[#9FB4BE] mt-4 mb-1.5">
            {g.group}
          </div>
          {g.items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              onClick={onNavigate}
              className={`block px-2.5 py-2 rounded-md text-[13.5px] mb-0.5 ${
                pathname === it.href ? "bg-white/15 font-semibold" : "hover:bg-white/8"
              }`}
            >
              {it.label}
            </Link>
          ))}
        </div>
      ))}
    </>
  );
}

export function Sidebar({ navSet }: { navSet: NavGroup[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="md:hidden bg-[#1B3A4B] text-[#EFE9DD] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="font-semibold text-[16px]" style={{ fontFamily: "Georgia, serif" }}>
          Franklin Covey ILP
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="text-2xl leading-none px-2"
        >
          ☰
        </button>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#1B3A4B]/60" onClick={() => setOpen(false)}>
          <nav
            className="bg-[#1B3A4B] text-[#EFE9DD] p-5 h-full w-[260px] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="font-semibold text-[17px]" style={{ fontFamily: "Georgia, serif" }}>
                Franklin Covey ILP
              </div>
              <button onClick={() => setOpen(false)} aria-label="Cerrar menú" className="text-xl px-2">
                ✕
              </button>
            </div>
            <NavLinks navSet={navSet} onNavigate={() => setOpen(false)} />
          </nav>
        </div>
      )}

      <nav className="hidden md:block bg-[#1B3A4B] text-[#EFE9DD] p-5 sticky top-0 h-screen overflow-y-auto w-[220px] shrink-0">
        <div className="font-semibold text-[17px] mb-0.5" style={{ fontFamily: "Georgia, serif" }}>
          Franklin Covey ILP
        </div>
        <div className="text-[10.5px] text-[#9FB4BE] mb-4">Instituto de Liderazgo y Productividad</div>
        <NavLinks navSet={navSet} />
      </nav>
    </>
  );
}
