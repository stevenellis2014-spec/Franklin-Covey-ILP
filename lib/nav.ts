import type { AccessLevel } from "@/lib/session";

export type NavItem = { href: string; label: string };
export type NavGroup = { group: string; items: NavItem[] };

const NAV_ADMIN: NavGroup[] = [
  {
    group: "Administración",
    items: [
      { href: "/admin/usuarios", label: "👥 Gestión de Usuarios" },
      { href: "/admin/roles", label: "🎭 Roles y Permisos" },
      { href: "/admin/organigrama", label: "🏢 Organigrama" },
    ],
  },
];

const NAV_GERENTE: NavGroup[] = [
  {
    group: "Enfoque semanal",
    items: [
      { href: "/dashboard", label: "📊 Dashboard Gerencial" },
      { href: "/mcis", label: "🎯 4DX / MCIs" },
      { href: "/rendicion-de-cuentas", label: "✅ Rendición de Cuentas Semanal" },
    ],
  },
  {
    group: "Personas",
    items: [
      { href: "/personal", label: "🧑‍💼 Gestión de Personal" },
      { href: "/mi-departamento", label: "🏢 Mi Departamento" },
      { href: "/desempeno", label: "📈 Evaluación de Desempeño" },
      { href: "/uno-a-uno", label: "🗣️ Reuniones Individuales" },
      { href: "/tiempo", label: "🗂️ Gestión del Tiempo" },
    ],
  },
  {
    group: "Desarrollo y Reconocimiento",
    items: [
      { href: "/desarrollo", label: "🎓 Desarrollo de Talento" },
      { href: "/reconocimiento", label: "🏅 Reconocimiento" },
    ],
  },
];

const NAV_COLABORADOR: NavGroup[] = [
  {
    group: "Mi semana",
    items: [
      { href: "/rendicion-de-cuentas", label: "✅ Mi Rendición de Cuentas Semanal" },
      { href: "/mcis", label: "🎯 Mis MCIs" },
      { href: "/tiempo", label: "🗂️ Mi Gestión del Tiempo" },
    ],
  },
  {
    group: "Desarrollo y Reconocimiento",
    items: [
      { href: "/desarrollo", label: "🎓 Mi Desarrollo" },
      { href: "/reconocimiento", label: "🏅 Reconocimiento" },
    ],
  },
];

export function navForRole(role: AccessLevel): NavGroup[] {
  if (role === "admin") return NAV_ADMIN;
  return role === "gerente" ? NAV_GERENTE : NAV_COLABORADOR;
}

export const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard Gerencial",
  "/mcis": "4DX / Gestión de MCIs",
  "/rendicion-de-cuentas": "Rendición de Cuentas Semanal",
  "/personal": "Gestión de Personal",
  "/mi-departamento": "Mi Departamento",
  "/desempeno": "Evaluación de Desempeño",
  "/uno-a-uno": "Reuniones Individuales",
  "/tiempo": "Gestión del Tiempo",
  "/desarrollo": "Desarrollo de Talento",
  "/reconocimiento": "Reconocimiento",
  "/admin/usuarios": "Gestión de Usuarios",
  "/admin/roles": "Roles y Permisos",
  "/admin/organigrama": "Organigrama",
  "/account": "Mi cuenta",
};
