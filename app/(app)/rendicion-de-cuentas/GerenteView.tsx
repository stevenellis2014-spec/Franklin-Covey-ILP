"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { addWeeks, fmtDate } from "@/lib/format";
import { Pill } from "@/components/Pill";
import { sendReminder } from "./actions";

type Direct = { id: string; name: string; email: string };
type Report = {
  id: string;
  employee_id: string;
  week: string;
  activities: { description?: string; comment?: string }[];
  next_commitments: { description?: string }[];
  roadblocks: { description?: string }[];
  status: string;
};
type Commitment = {
  id: string;
  employee_id: string;
  description: string;
  due_date: string | null;
  status: string;
};

export function GerenteView({
  week,
  leaderName,
  directs,
  reports,
  weekCommitments,
  allCommitments,
  emailEnabled,
}: {
  week: string;
  leaderName: string;
  directs: Direct[];
  reports: Report[];
  weekCommitments: Commitment[];
  allCommitments: Commitment[];
  emailEnabled: boolean;
}) {
  const router = useRouter();
  const [viewing, setViewing] = useState<Report | null>(null);
  const [sending, setSending] = useState<string | null>(null);

  function goWeek(delta: number) {
    router.push(`/rendicion-de-cuentas?week=${addWeeks(week, delta)}`);
  }

  const empName = (id: string) => directs.find((d) => d.id === id)?.name ?? "—";

  function mailto(emails: string[]) {
    const subject = encodeURIComponent(`Recordatorio: Rendición de Cuentas Semanal — ${week}`);
    const body = encodeURIComponent(
      `Hola,\n\nTe recuerdo ingresar a Franklin Covey ILP y enviar tu Rendición de Cuentas Semanal (${week}).\n\nGracias,\n${leaderName}`
    );
    return `mailto:${emails.join(",")}?subject=${subject}&body=${body}`;
  }

  async function handleSendReminder(emails: string[], key: string) {
    setSending(key);
    const result = await sendReminder(emails, week);
    setSending(null);
    if (result.error) alert(result.error);
    else alert(emails.length > 1 ? "Recordatorios enviados." : "Recordatorio enviado.");
  }

  const pending = directs.filter((d) => d.email && !reports.some((r) => r.employee_id === d.id && r.status === "submitted"));

  const byEmp: Record<string, { total: number; done: number }> = {};
  allCommitments.forEach((c) => {
    byEmp[c.employee_id] = byEmp[c.employee_id] || { total: 0, done: 0 };
    byEmp[c.employee_id].total++;
    if (c.status === "done") byEmp[c.employee_id].done++;
  });

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-3.5">
        <button onClick={() => goWeek(-1)} className="bg-white border border-gray-200 rounded-md px-2.5 py-1.5 text-[13px]">
          ← Semana anterior
        </button>
        <span className="font-mono font-medium">{week}</span>
        <button onClick={() => goWeek(1)} className="bg-white border border-gray-200 rounded-md px-2.5 py-1.5 text-[13px]">
          Semana siguiente →
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-[15px] mb-3 flex justify-between items-center" style={{ fontFamily: "Georgia, serif" }}>
          Reportes semanales del equipo
          {pending.length > 0 &&
            (emailEnabled ? (
              <button
                onClick={() => handleSendReminder(pending.map((p) => p.email), "all")}
                disabled={sending === "all"}
                className="bg-[#D9A441] text-[#3A2A0A] text-[11.5px] font-semibold rounded-md px-2.5 py-1 disabled:opacity-50"
              >
                {sending === "all" ? "Enviando..." : `✉ Recordar a todos los pendientes (${pending.length})`}
              </button>
            ) : (
              <a
                href={mailto(pending.map((p) => p.email))}
                className="bg-[#D9A441] text-[#3A2A0A] text-[11.5px] font-semibold rounded-md px-2.5 py-1"
              >
                ✉ Recordar a todos los pendientes ({pending.length})
              </a>
            ))}
        </h3>
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 border-b-2 border-gray-200">
              <th className="py-1.5 px-2">Colaborador</th>
              <th className="py-1.5 px-2">Estado</th>
              <th className="py-1.5 px-2">Actividades reportadas</th>
              <th className="py-1.5 px-2">Despejes de camino</th>
              <th className="py-1.5 px-2" />
            </tr>
          </thead>
          <tbody>
            {directs.length ? (
              directs.map((d) => {
                const rep = reports.find((r) => r.employee_id === d.id && r.status === "submitted");
                return (
                  <tr key={d.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 px-2">{d.name}</td>
                    <td className="py-2 px-2">
                      <Pill status={rep ? "submitted" : "pending"} />
                    </td>
                    <td className="py-2 px-2">{rep ? `${rep.activities.filter((a) => a.description).length}/3` : "—"}</td>
                    <td className="py-2 px-2">
                      {rep ? (
                        rep.roadblocks.length ? (
                          <Pill status="missed" />
                        ) : (
                          "Ninguno"
                        )
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2 px-2">
                      {rep ? (
                        <button onClick={() => setViewing(rep)} className="text-[#1B3A4B] underline text-[12.5px] font-semibold">
                          Ver reporte
                        </button>
                      ) : d.email ? (
                        emailEnabled ? (
                          <button
                            onClick={() => handleSendReminder([d.email], d.id)}
                            disabled={sending === d.id}
                            className="text-[#1B3A4B] underline text-[12.5px] font-semibold disabled:opacity-50"
                          >
                            {sending === d.id ? "Enviando..." : "✉ Recordar"}
                          </button>
                        ) : (
                          <a href={mailto([d.email])} className="text-[#1B3A4B] underline text-[12.5px] font-semibold">
                            ✉ Recordar
                          </a>
                        )
                      ) : null}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-3 text-gray-400 italic">
                  No tienes colaboradores directos asignados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-[15px] mb-3" style={{ fontFamily: "Georgia, serif" }}>
          Compromisos de la semana (vista consolidada)
        </h3>
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 border-b-2 border-gray-200">
              <th className="py-1.5 px-2">Colaborador</th>
              <th className="py-1.5 px-2">Compromiso</th>
              <th className="py-1.5 px-2">Fecha límite</th>
              <th className="py-1.5 px-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {weekCommitments.length ? (
              weekCommitments.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-2 px-2">{empName(c.employee_id)}</td>
                  <td className="py-2 px-2">{c.description}</td>
                  <td className="py-2 px-2">{fmtDate(c.due_date)}</td>
                  <td className="py-2 px-2">
                    <Pill status={c.status} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-3 text-gray-400 italic">
                  Sin compromisos registrados para esta semana.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-[15px] mb-3" style={{ fontFamily: "Georgia, serif" }}>
          Histórico de cumplimiento por persona
        </h3>
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 border-b-2 border-gray-200">
              <th className="py-1.5 px-2">Colaborador</th>
              <th className="py-1.5 px-2">Compromisos totales</th>
              <th className="py-1.5 px-2">Cumplidos</th>
              <th className="py-1.5 px-2">% Cumplimiento</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(byEmp).length ? (
              Object.entries(byEmp).map(([id, st]) => (
                <tr key={id} className="border-b border-gray-100 last:border-0">
                  <td className="py-2 px-2">{empName(id)}</td>
                  <td className="py-2 px-2">{st.total}</td>
                  <td className="py-2 px-2">{st.done}</td>
                  <td className="py-2 px-2">{Math.round((100 * st.done) / st.total)}%</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-3 text-gray-400 italic">
                  Sin histórico todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {viewing && (
        <div
          className="fixed inset-0 bg-[#1B3A4B]/35 flex items-center justify-center z-50 px-4"
          onClick={(e) => e.target === e.currentTarget && setViewing(null)}
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-[460px] max-h-[86vh] overflow-y-auto">
            <h3 className="font-semibold text-base mb-4">
              Reporte de {empName(viewing.employee_id)} — {viewing.week}
            </h3>
            <div className="mb-4">
              <h4 className="font-semibold text-sm mb-2">Actividades de la semana</h4>
              {viewing.activities.filter((a) => a.description).length ? (
                viewing.activities
                  .filter((a) => a.description)
                  .map((a, i) => (
                    <div key={i} className="border border-gray-200 rounded-md p-2.5 mb-2 bg-[#FBFAF7]">
                      <div className="font-semibold text-sm">{a.description}</div>
                      <div className="text-[12.5px]">{a.comment}</div>
                    </div>
                  ))
              ) : (
                <div className="text-gray-400 italic text-sm">Sin actividades registradas.</div>
              )}
            </div>
            <div className="mb-4">
              <h4 className="font-semibold text-sm mb-2">Compromisos para la próxima semana</h4>
              {viewing.next_commitments.filter((c) => c.description).length ? (
                viewing.next_commitments
                  .filter((c) => c.description)
                  .map((c, i) => (
                    <div key={i} className="border border-gray-200 rounded-md p-2.5 mb-2 bg-[#FBFAF7]">
                      <div className="font-semibold text-sm">{c.description}</div>
                    </div>
                  ))
              ) : (
                <div className="text-gray-400 italic text-sm">Sin compromisos registrados.</div>
              )}
            </div>
            <div className="mb-4">
              <h4 className="font-semibold text-sm mb-2">Despejes de camino</h4>
              {viewing.roadblocks.length ? (
                viewing.roadblocks.map((r, i) => (
                  <div key={i} className="border rounded-md p-2.5 mb-2" style={{ borderColor: "#C97A2B" }}>
                    <div className="font-semibold text-sm">{r.description}</div>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 italic text-sm">No reportó obstáculos esta semana.</div>
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setViewing(null)}
                className="bg-[#1B3A4B] text-white rounded-md px-3.5 py-2 text-[13px] font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
