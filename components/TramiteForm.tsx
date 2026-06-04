"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { parseCostaRicaXML } from "@/lib/xml-parser";
import { parsePDF } from "@/lib/pdf-parser";
import {
  CHECKLISTS, TRAMITE_TYPE_LABELS, STATUS_LABELS,
  type TramiteType, type TramiteStatus, type Tramite,
} from "@/lib/types";

interface Props {
  projects: Array<{ id: number; name: string; category: string }>;
  defaultProjectId?: number;
  tramite?: Tramite;
}

const STATUSES: TramiteStatus[] = ["en_proceso_firmas", "en_sistema_fundatec", "aprobado", "rechazado"];

const APPROVAL_NOTES: Record<TramiteType, string> = {
  reintegro: "Reintegro aprobado por el gestor técnico, comprobable en minuta adjunta.\nMontos y detalles correctos.",
  factura:   "Compra aprobada por el gestor técnico, comprobable en minuta adjunta.\nMontos y detalles correctos.",
  uso_tc:    "Compra aprobada por el gestor técnico, comprobable en minuta adjunta.\nMontos y detalles correctos.",
};

export default function TramiteForm({ projects, defaultProjectId, tramite }: Props) {
  const router = useRouter();
  const isEditing = !!tramite;

  const [projectId,      setProjectId]      = useState<number>(tramite?.project_id ?? defaultProjectId ?? (projects[0]?.id || 0));
  const [type,           setType]           = useState<TramiteType>(tramite?.type ?? "factura");
  const [status,         setStatus]         = useState<TramiteStatus>(tramite?.status ?? "en_proceso_firmas");
  const [invoiceNumber,  setInvoiceNumber]  = useState(tramite?.invoice_number ?? "");
  const [supplier,       setSupplier]       = useState(tramite?.supplier ?? "");
  const [amount,         setAmount]         = useState(tramite?.amount?.toString() ?? "");
  const [description,    setDescription]    = useState(tramite?.description ?? "");
  const [submissionDate, setSubmissionDate] = useState(tramite?.submission_date ?? "");
  const [approvalDate,   setApprovalDate]   = useState(tramite?.approval_date ?? "");
  const [notes,          setNotes]          = useState(tramite?.notes ?? "");
  const [fundatecNumber, setFundatecNumber] = useState((tramite as Tramite & { fundatec_number?: string })?.fundatec_number ?? "");
  const [checklist,      setChecklist]      = useState<Record<string, boolean>>(tramite?.checklist ?? {});
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState("");
  const [fileMsg,        setFileMsg]        = useState("");
  const [fileLoading,    setFileLoading]    = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleTypeChange(newType: TramiteType) {
    setType(newType);
    const newKeys = Object.keys(CHECKLISTS[newType]);
    setChecklist((prev) => {
      const next: Record<string, boolean> = {};
      newKeys.forEach((k) => { next[k] = prev[k] ?? false; });
      return next;
    });
  }

  function applyParsed(parsed: ReturnType<typeof parseCostaRicaXML>, label: string) {
    if (!parsed) {
      setFileMsg(`No se pudieron leer los datos del ${label}. Verifica que sea una factura electrónica de Hacienda.`);
      return;
    }
    if (parsed.invoiceNumber) setInvoiceNumber(parsed.invoiceNumber);
    if (parsed.supplier)      setSupplier(parsed.supplier);
    if (parsed.amount > 0)    setAmount(parsed.amount.toString());
    if (parsed.date)          setSubmissionDate(parsed.date);
    if (parsed.description)   setDescription(parsed.description);
    handleTypeChange(parsed.detectedType);
    setFileMsg(`✓ ${label} leído: ${parsed.supplier || "sin nombre"} — ₡${parsed.amount.toLocaleString("es-CR")}`);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileLoading(true);
    setFileMsg("Leyendo archivo...");
    if (file.name.toLowerCase().endsWith(".pdf")) {
      const parsed = await parsePDF(file);
      applyParsed(parsed, "PDF");
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        applyParsed(parseCostaRicaXML(ev.target?.result as string), "XML");
      };
      reader.readAsText(file, "UTF-8");
    }
    setFileLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const activeChecklist = CHECKLISTS[type];
  const displayChecklist: Record<string, boolean> = {};
  Object.keys(activeChecklist).forEach((k) => { displayChecklist[k] = checklist[k] ?? false; });
  const checkedCount = Object.values(displayChecklist).filter(Boolean).length;
  const totalItems   = Object.keys(activeChecklist).length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const supabase = createClient();
    const payload = {
      project_id:       projectId,
      type,             status,
      invoice_number:   invoiceNumber || null,
      supplier:         supplier || null,
      amount:           parseFloat(amount) || 0,
      description:      description || null,
      submission_date:  submissionDate || null,
      approval_date:    approvalDate || null,
      notes:            notes || null,
      fundatec_number:  fundatecNumber || null,
      checklist:        displayChecklist,
    };
    let err;
    if (isEditing) {
      ({ error: err } = await supabase.from("tramites").update(payload).eq("id", tramite!.id));
    } else {
      ({ error: err } = await supabase.from("tramites").insert(payload));
    }
    setSaving(false);
    if (err) { setError(err.message); }
    else { router.push(`/projects/${projectId}`); router.refresh(); }
  }

  const prototipado    = projects.filter((p) => p.category === "prototipado");
  const puestaEnMarcha = projects.filter((p) => p.category === "puesta_en_marcha");

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Upload panel ─────────────────────────────────────── */}
      <div style={{
        border: "2px dashed var(--border)", borderRadius: "var(--radius-lg)",
        padding: "16px 20px", background: "var(--cream-2)",
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 600, fontSize: 13, color: "var(--black)" }}>
            Cargar factura electrónica
          </p>
          <p style={{ fontSize: 12, color: "var(--gray)", marginTop: 2 }}>
            Sube el <strong>XML</strong> o <strong>PDF</strong> de Hacienda — los campos se rellenan automáticamente
          </p>
          {fileMsg && (
            <p style={{
              marginTop: 8, fontSize: 12, fontWeight: 500,
              color: fileMsg.startsWith("✓") ? "var(--green)" : "var(--orange-d)",
            }}>
              {fileMsg}
            </p>
          )}
        </div>
        <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer", flexShrink: 0 }}>
          {fileLoading ? "Leyendo..." : "↑ Seleccionar archivo"}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xml,.pdf,application/xml,text/xml,application/pdf"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {/* ── Error ─────────────────────────────────────────────── */}
      {error && (
        <div className="alert alert-red" style={{ fontSize: 13 }}>{error}</div>
      )}

      {/* ── Información del trámite ───────────────────────────── */}
      <div className="card card-padded" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ fontWeight: 600, fontSize: 14, color: "var(--black)" }}>Información del trámite</h2>

        {/* Proyecto */}
        <div>
          <label className="caps" style={{ display: "block", marginBottom: 6 }}>Proyecto *</label>
          <select className="finput" value={projectId} onChange={(e) => setProjectId(parseInt(e.target.value))} required>
            <optgroup label="Prototipado">
              {prototipado.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </optgroup>
            <optgroup label="Puesta en Marcha">
              {puestaEnMarcha.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </optgroup>
          </select>
        </div>

        {/* Tipo */}
        <div>
          <label className="caps" style={{ display: "block", marginBottom: 6 }}>Tipo de trámite *</label>
          <div style={{ display: "flex", gap: 8 }}>
            {(Object.entries(TRAMITE_TYPE_LABELS) as [TramiteType, string][]).map(([key, label]) => (
              <button key={key} type="button" onClick={() => handleTypeChange(key)}
                style={{
                  flex: 1, padding: "8px 12px", borderRadius: "var(--radius-md)",
                  border: type === key ? "2px solid var(--orange)" : "1px solid var(--border)",
                  background: type === key ? "#FEE5D8" : "var(--white)",
                  color: type === key ? "var(--orange-d)" : "var(--gray)",
                  fontWeight: type === key ? 600 : 400,
                  fontSize: 13, cursor: "pointer", transition: "all .15s",
                  fontFamily: "var(--font-body)",
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Estado */}
        <div>
          <label className="caps" style={{ display: "block", marginBottom: 6 }}>Estado *</label>
          <select className="finput" value={status} onChange={(e) => setStatus(e.target.value as TramiteStatus)} required>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>

        {/* N° Factura + Monto */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label className="caps" style={{ display: "block", marginBottom: 6 }}>N° Factura / Documento</label>
            <input className="finput" type="text" value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="ej. 00600001010000026182" />
          </div>
          <div>
            <label className="caps" style={{ display: "block", marginBottom: 6 }}>Monto (₡) *</label>
            <input className="finput" type="number" step="0.01" min="0"
              value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00" required />
          </div>
        </div>

        {/* Proveedor */}
        <div>
          <label className="caps" style={{ display: "block", marginBottom: 6 }}>Proveedor / Beneficiario</label>
          <input className="finput" type="text" value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder="Nombre del proveedor o persona" />
        </div>

        {/* Descripción */}
        <div>
          <label className="caps" style={{ display: "block", marginBottom: 6 }}>Descripción / Detalle de compra</label>
          <textarea className="finput" rows={2} value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve descripción de lo que se compra o reintegra" />
        </div>

        {/* Fechas */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label className="caps" style={{ display: "block", marginBottom: 6 }}>Fecha de entrega / ingreso</label>
            <input className="finput" type="date" value={submissionDate}
              onChange={(e) => setSubmissionDate(e.target.value)} />
          </div>
          <div>
            <label className="caps" style={{ display: "block", marginBottom: 6 }}>Fecha de aprobación</label>
            <input className="finput" type="date" value={approvalDate}
              onChange={(e) => setApprovalDate(e.target.value)} />
          </div>
        </div>

        {/* N° Consecutivo FUNDATEC */}
        <div>
          <label className="caps" style={{ display: "block", marginBottom: 6 }}>N° Consecutivo FUNDATEC</label>
          <input className="finput" type="text" value={fundatecNumber}
            onChange={(e) => setFundatecNumber(e.target.value)}
            placeholder="ej. 2025-001 (asignado por sistema FUNDATEC)" />
        </div>

        {/* Notas de aprobación */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <label className="caps">Nota de aprobación</label>
            <button type="button"
              onClick={() => setNotes(APPROVAL_NOTES[type])}
              style={{
                fontSize: 11, fontWeight: 600, color: "var(--orange)",
                background: "none", border: "none", cursor: "pointer",
                padding: "2px 8px", borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font-body)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#FEE5D8")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              ↩ Insertar texto estándar
            </button>
          </div>
          <textarea className="finput" rows={3} value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={APPROVAL_NOTES[type]} />
        </div>
      </div>

      {/* ── Checklist ─────────────────────────────────────────── */}
      <div className="card card-padded">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ fontWeight: 600, fontSize: 14, color: "var(--black)" }}>Checklist de revisión</h2>
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: checkedCount === totalItems ? "var(--green)" : "var(--orange)",
          }}>
            {checkedCount}/{totalItems} completados
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {Object.entries(activeChecklist).map(([key, label]) => (
            <label key={key} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 12px", borderRadius: "var(--radius-md)", cursor: "pointer",
              border: displayChecklist[key] ? "2px solid var(--green)" : "1px solid var(--border)",
              background: displayChecklist[key] ? "var(--green-l)" : "var(--white)",
              transition: "all .15s",
            }}>
              <input type="checkbox" checked={displayChecklist[key]}
                onChange={(e) => setChecklist((prev) => ({ ...prev, [key]: e.target.checked }))}
                style={{ accentColor: "var(--green)", width: 15, height: 15 }} />
              <span style={{
                fontSize: 12, fontWeight: displayChecklist[key] ? 600 : 400,
                color: displayChecklist[key] ? "var(--green)" : "var(--gray)",
              }}>
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* ── Actions ───────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button type="button" onClick={() => router.back()} className="btn btn-ghost">
          Cancelar
        </button>
        <button type="submit" disabled={saving} className="btn btn-orange">
          {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear trámite"}
        </button>
      </div>
    </form>
  );
}
