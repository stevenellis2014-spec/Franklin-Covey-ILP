"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { addWeeks } from "@/lib/format";

type Activity = { description?: string; comment?: string };
type NextCommitment = { description?: string };
type Roadblock = { description?: string };

type Report = {
  id: string;
  employee_id: string;
  week: string;
  activities: Activity[];
  next_commitments: NextCommitment[];
  roadblocks: Roadblock[];
  status: string;
  submitted_at: string | null;
};

const STEPS = ["Actividades de la semana", "Compromisos próxima semana", "Despejes de camino", "Revisar y enviar"];

function emptyDraft(employeeId: string, week: string): Report {
  return {
    id: "",
    employee_id: employeeId,
    week,
    activities: [{}, {}, {}],
    next_commitments: [{}, {}, {}],
    roadblocks: [],
    status: "draft",
    submitted_at: null,
  };
}

export function ColaboradorWizard({
  employeeId,
  week,
  initialReport,
}: {
  employeeId: string;
  week: string;
  initialReport: Report | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [draft, setDraft] = useState<Report>(initialReport ?? emptyDraft(employeeId, week));
  const [step, setStep] = useState(1);
  const [editingActivity, setEditingActivity] = useState<number | null>(null);
  const [editingCommit, setEditingCommit] = useState<number | null>(null);
  const [addingRoadblock, setAddingRoadblock] = useState(false);

  async function persist(next: Report) {
    setDraft(next);
    const { data, error } = await supabase
      .from("weekly_reports")
      .upsert(
        {
          id: next.id || undefined,
          employee_id: employeeId,
          week,
          activities: next.activities,
          next_commitments: next.next_commitments,
          roadblocks: next.roadblocks,
          status: next.status,
          submitted_at: next.submitted_at,
        },
        { onConflict: "employee_id,week" }
      )
      .select()
      .single();
    if (!error && data) setDraft(data as Report);
  }

  function goWeek(delta: number) {
    router.push(`/rendicion-de-cuentas?week=${addWeeks(week, delta)}`);
  }

  if (draft.status === "submitted") {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
        <div className="text-[42px] text-[#2E7D5B] mb-2.5">✓</div>
        <h3 className="font-semibold text-base mb-2">Reporte enviado</h3>
        <p className="text-xs text-gray-500">
          Tu rendición de cuentas de la semana {draft.week} fue enviada
          {draft.submitted_at ? ` el ${new Date(draft.submitted_at).toLocaleString("es-GT")}` : ""}.
        </p>
        <div className="mt-4 flex gap-2 justify-center">
          <button onClick={() => goWeek(-1)} className="border border-gray-200 rounded-md px-3 py-1.5 text-[13px]">
            ← Semana anterior
          </button>
          <button onClick={() => goWeek(1)} className="border border-gray-200 rounded-md px-3 py-1.5 text-[13px]">
            Semana siguiente →
          </button>
        </div>
      </div>
    );
  }

  async function saveActivity(i: number, description: string, comment: string) {
    const activities = [...draft.activities];
    activities[i] = { description, comment };
    await persist({ ...draft, activities });
    setEditingActivity(null);
  }
  async function removeActivity(i: number) {
    const activities = [...draft.activities];
    activities[i] = {};
    await persist({ ...draft, activities });
  }
  async function saveCommit(i: number, description: string) {
    const next_commitments = [...draft.next_commitments];
    next_commitments[i] = { description };
    await persist({ ...draft, next_commitments });
    setEditingCommit(null);
  }
  async function removeCommit(i: number) {
    const next_commitments = [...draft.next_commitments];
    next_commitments[i] = {};
    await persist({ ...draft, next_commitments });
  }
  async function addRoadblock(description: string) {
    await persist({ ...draft, roadblocks: [...draft.roadblocks, { description }] });
    setAddingRoadblock(false);
  }
  async function removeRoadblock(i: number) {
    const roadblocks = draft.roadblocks.filter((_, idx) => idx !== i);
    await persist({ ...draft, roadblocks });
  }
  async function submit() {
    const now = new Date().toISOString();
    await persist({ ...draft, status: "submitted", submitted_at: now });
    const nextWeek = addWeeks(week, 1);
    const rows = draft.next_commitments
      .filter((c) => c.description)
      .map((c) => ({ week: nextWeek, employee_id: employeeId, description: c.description!, status: "open" }));
    if (rows.length) await supabase.from("commitments").insert(rows);
    router.refresh();
  }

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

      <div className="flex justify-between text-[11px] text-gray-500 mb-1.5">
        {STEPS.map((s, i) => (
          <span key={s}>
            {i + 1}. {s}
          </span>
        ))}
      </div>
      <div className="flex gap-1.5 mb-5">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className="flex-1 h-1.5 rounded-full"
            style={{ background: i + 1 < step ? "#2E7D5B" : i + 1 === step ? "#1B3A4B" : "#EEE8DC" }}
          />
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        {step === 1 && (
          <div>
            <h3 className="font-semibold text-[15px] mb-1" style={{ fontFamily: "Georgia, serif" }}>
              Actividades realizadas esta semana
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Describe idealmente 3 actividades relevantes de tu semana y agrega un comentario sobre cada una.
            </p>
            {draft.activities.map((a, i) => (
              <div key={i} className={`border rounded-lg p-3.5 mb-2.5 ${a.description ? "border-solid bg-[#FBFAF7]" : "border-dashed"}`}>
                <div className="text-xs text-gray-500 mb-1.5">Actividad {i + 1}</div>
                {editingActivity === i ? (
                  <ActivityForm
                    initial={a}
                    onSave={(desc, comment) => saveActivity(i, desc, comment)}
                    onCancel={() => setEditingActivity(null)}
                  />
                ) : a.description ? (
                  <>
                    <div className="font-semibold mb-1">{a.description}</div>
                    <div className="text-[12.5px]">{a.comment}</div>
                    <div className="mt-2">
                      <button onClick={() => setEditingActivity(i)} className="text-[#1B3A4B] underline text-[12.5px] font-semibold mr-3">
                        Editar
                      </button>
                      <button onClick={() => removeActivity(i)} className="text-[#B94A48] underline text-[12.5px] font-semibold">
                        Quitar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-gray-400 italic text-sm">Aún no se ha registrado.</div>
                    <button onClick={() => setEditingActivity(i)} className="text-[#1B3A4B] underline text-[12.5px] font-semibold mt-2">
                      Agregar
                    </button>
                  </>
                )}
              </div>
            ))}
            <div className="flex justify-end mt-4">
              <button onClick={() => setStep(2)} className="bg-[#1B3A4B] text-white rounded-md px-4 py-2 text-[13px] font-semibold">
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className="font-semibold text-[15px] mb-1" style={{ fontFamily: "Georgia, serif" }}>
              Compromisos para la próxima semana
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Define idealmente 3 compromisos que asumirás para la semana entrante ({addWeeks(week, 1)}).
            </p>
            {draft.next_commitments.map((c, i) => (
              <div key={i} className={`border rounded-lg p-3.5 mb-2.5 ${c.description ? "border-solid bg-[#FBFAF7]" : "border-dashed"}`}>
                <div className="text-xs text-gray-500 mb-1.5">Compromiso {i + 1}</div>
                {editingCommit === i ? (
                  <CommitForm initial={c} onSave={(desc) => saveCommit(i, desc)} onCancel={() => setEditingCommit(null)} />
                ) : c.description ? (
                  <>
                    <div className="font-semibold mb-1">{c.description}</div>
                    <div className="mt-2">
                      <button onClick={() => setEditingCommit(i)} className="text-[#1B3A4B] underline text-[12.5px] font-semibold mr-3">
                        Editar
                      </button>
                      <button onClick={() => removeCommit(i)} className="text-[#B94A48] underline text-[12.5px] font-semibold">
                        Quitar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-gray-400 italic text-sm">Aún no se ha registrado.</div>
                    <button onClick={() => setEditingCommit(i)} className="text-[#1B3A4B] underline text-[12.5px] font-semibold mt-2">
                      Agregar
                    </button>
                  </>
                )}
              </div>
            ))}
            <div className="flex justify-between mt-4">
              <button onClick={() => setStep(1)} className="border border-gray-200 rounded-md px-4 py-2 text-[13px] font-semibold text-[#1B3A4B]">
                ← Atrás
              </button>
              <button onClick={() => setStep(3)} className="bg-[#1B3A4B] text-white rounded-md px-4 py-2 text-[13px] font-semibold">
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="font-semibold text-[15px] mb-1" style={{ fontFamily: "Georgia, serif" }}>
              Despejes de camino
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Si tienes obstáculos que tu líder debe ayudarte a resolver, regístralos aquí. Si no tienes ninguno, puedes
              continuar sin agregar.
            </p>
            {draft.roadblocks.length ? (
              draft.roadblocks.map((r, i) => (
                <div key={i} className="border rounded-lg p-3.5 mb-2.5" style={{ borderColor: "#C97A2B" }}>
                  <div className="font-semibold mb-1">{r.description}</div>
                  <button onClick={() => removeRoadblock(i)} className="text-[#B94A48] underline text-[12.5px] font-semibold">
                    Quitar
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-400">No tienes despejes de camino registrados esta semana.</div>
            )}
            {addingRoadblock ? (
              <RoadblockForm onSave={addRoadblock} onCancel={() => setAddingRoadblock(false)} />
            ) : (
              <button onClick={() => setAddingRoadblock(true)} className="border border-gray-200 rounded-md px-3 py-1.5 text-[12.5px] text-[#1B3A4B]">
                + Agregar despeje de camino
              </button>
            )}
            <div className="flex justify-between mt-4">
              <button onClick={() => setStep(2)} className="border border-gray-200 rounded-md px-4 py-2 text-[13px] font-semibold text-[#1B3A4B]">
                ← Atrás
              </button>
              <button onClick={() => setStep(4)} className="bg-[#1B3A4B] text-white rounded-md px-4 py-2 text-[13px] font-semibold">
                {draft.roadblocks.length ? "Siguiente →" : "No tengo despejes — continuar →"}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h3 className="font-semibold text-[15px] mb-1" style={{ fontFamily: "Georgia, serif" }}>
              Reporte generado — semana {draft.week}
            </h3>
            <p className="text-xs text-gray-500 mb-3">Revisa la información antes de enviarla.</p>
            <div className="mb-4">
              <h4 className="font-semibold text-sm mb-2 flex justify-between">
                Actividades de la semana{" "}
                <button onClick={() => setStep(1)} className="text-[#1B3A4B] underline text-[12.5px] font-normal">
                  Editar
                </button>
              </h4>
              {draft.activities.filter((a) => a.description).length ? (
                draft.activities
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
              <h4 className="font-semibold text-sm mb-2 flex justify-between">
                Compromisos para la próxima semana{" "}
                <button onClick={() => setStep(2)} className="text-[#1B3A4B] underline text-[12.5px] font-normal">
                  Editar
                </button>
              </h4>
              {draft.next_commitments.filter((c) => c.description).length ? (
                draft.next_commitments
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
              <h4 className="font-semibold text-sm mb-2 flex justify-between">
                Despejes de camino{" "}
                <button onClick={() => setStep(3)} className="text-[#1B3A4B] underline text-[12.5px] font-normal">
                  Editar
                </button>
              </h4>
              {draft.roadblocks.length ? (
                draft.roadblocks.map((r, i) => (
                  <div key={i} className="border rounded-md p-2.5 mb-2" style={{ borderColor: "#C97A2B" }}>
                    <div className="font-semibold text-sm">{r.description}</div>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 italic text-sm">No se reportaron obstáculos esta semana.</div>
              )}
            </div>
            <div className="flex justify-between mt-4">
              <button onClick={() => setStep(3)} className="border border-gray-200 rounded-md px-4 py-2 text-[13px] font-semibold text-[#1B3A4B]">
                ← Atrás
              </button>
              <button onClick={submit} className="bg-[#D9A441] text-[#3A2A0A] rounded-md px-4 py-2 text-[13px] font-semibold">
                Enviar reporte
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Activity;
  onSave: (description: string, comment: string) => void;
  onCancel: () => void;
}) {
  const [description, setDescription] = useState(initial.description ?? "");
  const [comment, setComment] = useState(initial.comment ?? "");
  return (
    <div>
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descripción de la actividad"
        className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm mb-2"
      />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Comentario (resultado, evidencia, observación)"
        className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm mb-2 min-h-[56px]"
      />
      <div className="flex gap-2">
        <button onClick={() => onSave(description, comment)} className="bg-[#1B3A4B] text-white rounded-md px-3 py-1.5 text-[12.5px] font-semibold">
          Guardar
        </button>
        <button onClick={onCancel} className="border border-gray-200 rounded-md px-3 py-1.5 text-[12.5px]">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function CommitForm({ initial, onSave, onCancel }: { initial: NextCommitment; onSave: (description: string) => void; onCancel: () => void }) {
  const [description, setDescription] = useState(initial.description ?? "");
  return (
    <div>
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descripción del compromiso"
        className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm mb-2"
      />
      <div className="flex gap-2">
        <button onClick={() => onSave(description)} className="bg-[#1B3A4B] text-white rounded-md px-3 py-1.5 text-[12.5px] font-semibold">
          Guardar
        </button>
        <button onClick={onCancel} className="border border-gray-200 rounded-md px-3 py-1.5 text-[12.5px]">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function RoadblockForm({ onSave, onCancel }: { onSave: (description: string) => void; onCancel: () => void }) {
  const [description, setDescription] = useState("");
  return (
    <div className="mt-2.5">
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe el obstáculo"
        className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm mb-2 min-h-[56px]"
      />
      <div className="flex gap-2">
        <button onClick={() => onSave(description)} className="bg-[#1B3A4B] text-white rounded-md px-3 py-1.5 text-[12.5px] font-semibold">
          Guardar
        </button>
        <button onClick={onCancel} className="border border-gray-200 rounded-md px-3 py-1.5 text-[12.5px]">
          Cancelar
        </button>
      </div>
    </div>
  );
}
