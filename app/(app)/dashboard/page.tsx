import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const { employee, role } = await getSessionContext();
  const supabase = await createClient();

  const { data: mcis } = await supabase.from("mcis").select("*");
  const list = mcis ?? [];

  const progress = (w: { baseline: number | null; target: number | null; current_value: number | null }) => {
    const baseline = w.baseline ?? 0;
    const target = w.target ?? 0;
    const current = w.current_value ?? 0;
    const range = target - baseline;
    if (range === 0) return 0;
    return Math.max(0, Math.min(100, Math.round(((current - baseline) / range) * 100)));
  };

  const avgCompliance = list.length
    ? Math.round(list.reduce((s, w) => s + progress(w), 0) / list.length)
    : 0;
  const atRisk = list.filter((w) => w.status === "at_risk" || w.status === "off_track");

  const { data: recognitions } = await supabase
    .from("recognitions")
    .select("*")
    .order("date", { ascending: false })
    .limit(4);

  return (
    <div>
      <div className="text-xs text-gray-500 mb-4">
        Bienvenido, {employee.name} — {role === "gerente" ? "vista de tu equipo" : "tu información"}.
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-5">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-[11.5px] text-gray-500 mb-1">Cumplimiento promedio de MCIs</div>
          <div className="font-mono text-2xl text-[#1B3A4B]">{avgCompliance}%</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-[11.5px] text-gray-500 mb-1">MCIs en riesgo</div>
          <div className="font-mono text-2xl text-[#1B3A4B]">{atRisk.length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-[11.5px] text-gray-500 mb-1">Total de MCIs</div>
          <div className="font-mono text-2xl text-[#1B3A4B]">{list.length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-[11.5px] text-gray-500 mb-1">Reconocimientos recientes</div>
          <div className="font-mono text-2xl text-[#1B3A4B]">{recognitions?.length ?? 0}</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-[15px] mb-3" style={{ fontFamily: "Georgia, serif" }}>
          Alertas de desviación
        </h3>
        {atRisk.length ? (
          atRisk.map((w) => (
            <div key={w.id} className="flex gap-2 py-2 border-b border-gray-100 text-sm last:border-0">
              <span style={{ color: w.status === "off_track" ? "#B94A48" : "#C97A2B" }}>●</span>
              <div>
                <strong>{w.title}</strong>
                <div className="text-gray-500 text-[11.5px]">{progress(w)}% de avance</div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-400 italic text-sm py-2">Sin desviaciones activas.</div>
        )}
      </div>
    </div>
  );
}
