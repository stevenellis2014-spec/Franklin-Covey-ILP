import { getSessionContext } from "@/lib/session";
import { navForRole } from "@/lib/nav";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { employee, role, mode, canToggleMode } = await getSessionContext();
  const navSet = navForRole(role);

  return (
    <div className="flex flex-col md:grid min-h-screen bg-[#F7F5F1]" style={{ gridTemplateColumns: "220px 1fr" }}>
      <Sidebar navSet={navSet} />
      <main className="p-4 sm:p-6 md:p-8 max-w-[1180px] w-full min-w-0">
        <Header name={employee.name} role={role} canToggleMode={canToggleMode} mode={mode} />
        {children}
      </main>
    </div>
  );
}
