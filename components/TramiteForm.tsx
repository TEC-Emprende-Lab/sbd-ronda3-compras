"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { parseCostaRicaXML } from "@/lib/xml-parser";
import {
  CHECKLISTS,
  TRAMITE_TYPE_LABELS,
  STATUS_LABELS,
  type TramiteType,
  type TramiteStatus,
  type Tramite,
} from "@/lib/types";

interface Props {
  projects: Array<{ id: number; name: string; category: string }>;
  defaultProjectId?: number;
  tramite?: Tramite;
}

export default function TramiteForm({ projects, defaultProjectId, tramite }: Props) {
  const router = useRouter();
  const isEditing = !!tramite;

  const [projectId, setProjectId] = useState<number>(
    tramite?.project_id ?? defaultProjectId ?? (projects[0]?.id || 0)
  );
  const [type, setType] = useState<TramiteType>(tramite?.type ?? "factura");
  const [status, setStatus] = useState<TramiteStatus>(tramite?.status ?? "en_proceso_firmas");
  const [invoiceNumber, setInvoiceNumber] = useState(tramite?.invoice_number ?? "");
  const [supplier, setSupplier] = useState(tramite?.supplier ?? "");
  const [amount, setAmount] = useState(tramite?.amount?.toString() ?? "");
  const [description, setDescription] = useState(tramite?.description ?? "");
  const [submissionDate, setSubmissionDate] = useState(tramite?.submission_date ?? "");
  const [approvalDate, setApprovalDate] = useState(tramite?.approval_date ?? "");
  const [notes, setNotes] = useState(tramite?.notes ?? "");
  const [checklist, setChecklist] = useState<Record<string, boolean>>(
    tramite?.checklist ?? {}
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [xmlMsg, setXmlMsg] = useState("");
  const xmlInputRef = useRef<HTMLInputElement>(null);

  function handleXmlUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCostaRicaXML(text);
      if (!parsed) {
        setXmlMsg("No se pudo leer el XML. Verifica que sea una factura electrónica de Hacienda.");
        return;
      }
      if (parsed.invoiceNumber) setInvoiceNumber(parsed.invoiceNumber);
      if (parsed.supplier)      setSupplier(parsed.supplier);
      if (parsed.amount > 0)    setAmount(parsed.amount.toString());
      if (parsed.date)          setSubmissionDate(parsed.date);
      if (parsed.description)   setDescription(parsed.description);
      handleTypeChange(parsed.detectedType);
      setXmlMsg(`✓ XML leído: ${parsed.supplier || "sin nombre"} — ₡${parsed.amount.toLocaleString("es-CR")}`);
    };
    reader.readAsText(file, "UTF-8");
    if (xmlInputRef.current) xmlInputRef.current.value = "";
  }

  // When type changes, preserve checked items that exist in new type
  function handleTypeChange(newType: TramiteType) {
    setType(newType);
    const newKeys = Object.keys(CHECKLISTS[newType]);
    setChecklist((prev) => {
      const next: Record<string, boolean> = {};
      newKeys.forEach((k) => { next[k] = prev[k] ?? false; });
      return next;
    });
  }

  // Initialize checklist if empty
  const activeChecklist = CHECKLISTS[type];
  const displayChecklist: Record<string, boolean> = {};
  Object.keys(activeChecklist).forEach((k) => {
    displayChecklist[k] = checklist[k] ?? false;
  });

  const checkedCount = Object.values(displayChecklist).filter(Boolean).length;
  const totalItems = Object.keys(activeChecklist).length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const supabase = createClient();
    const payload = {
      project_id: projectId,
      type,
      status,
      invoice_number: invoiceNumber || null,
      supplier: supplier || null,
      amount: parseFloat(amount) || 0,
      description: description || null,
      submission_date: submissionDate || null,
      approval_date: approvalDate || null,
      notes: notes || null,
      checklist: displayChecklist,
    };

    let err;
    if (isEditing) {
      ({ error: err } = await supabase.from("tramites").update(payload).eq("id", tramite!.id));
    } else {
      ({ error: err } = await supabase.from("tramites").insert(payload));
    }

    setSaving(false);
    if (err) {
      setError(err.message);
    } else {
      router.push(`/projects/${projectId}`);
      router.refresh();
    }
  }

  const prototipado = projects.filter((p) => p.category === "prototipado");
  const puestaEnMarcha = projects.filter((p) => p.category === "puesta_en_marcha");

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* XML uploader */}
      <div className="card p-4 border-dashed border-2 border-brand-200 bg-brand-50">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-brand-700">Cargar factura electrónica (XML)</p>
            <p className="text-xs text-brand-500 mt-0.5">
              Sube el XML de Hacienda y los campos se rellenan automáticamente
            </p>
          </div>
          <label className="btn-primary cursor-pointer shrink-0">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            Seleccionar XML
            <input
              ref={xmlInputRef}
              type="file"
              accept=".xml,application/xml,text/xml"
              onChange={handleXmlUpload}
              className="hidden"
            />
          </label>
        </div>
        {xmlMsg && (
          <p className={`mt-2 text-xs font-medium ${xmlMsg.startsWith("✓") ? "text-green-700" : "text-red-600"}`}>
            {xmlMsg}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-700">Información del trámite</h2>

        {/* Proyecto */}
        <div>
          <label className="label">Proyecto *</label>
          <select
            className="select"
            value={projectId}
            onChange={(e) => setProjectId(parseInt(e.target.value))}
            required
          >
            <optgroup label="Prototipado">
              {prototipado.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </optgroup>
            <optgroup label="Puesta en Marcha">
              {puestaEnMarcha.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Tipo */}
        <div>
          <label className="label">Tipo de trámite *</label>
          <div className="flex gap-3">
            {(Object.entries(TRAMITE_TYPE_LABELS) as [TramiteType, string][]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleTypeChange(key)}
                className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${
                  type === key
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Estado */}
        <div>
          <label className="label">Estado *</label>
          <select
            className="select"
            value={status}
            onChange={(e) => setStatus(e.target.value as TramiteStatus)}
            required
          >
            {(Object.entries(STATUS_LABELS) as [TramiteStatus, string][]).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* N° Factura */}
          <div>
            <label className="label">N° Factura / Documento</label>
            <input
              className="input"
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="ej. 00600001010000026182"
            />
          </div>

          {/* Monto */}
          <div>
            <label className="label">Monto (₡) *</label>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
        </div>

        {/* Proveedor */}
        <div>
          <label className="label">Proveedor / Beneficiario</label>
          <input
            className="input"
            type="text"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder="Nombre del proveedor o persona"
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="label">Descripción / Detalle de compra</label>
          <textarea
            className="input"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve descripción de lo que se compra o reintegra"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Fecha de entrega */}
          <div>
            <label className="label">Fecha de entrega / ingreso</label>
            <input
              className="input"
              type="date"
              value={submissionDate}
              onChange={(e) => setSubmissionDate(e.target.value)}
            />
          </div>

          {/* Fecha aprobación */}
          <div>
            <label className="label">Fecha de aprobación</label>
            <input
              className="input"
              type="date"
              value={approvalDate}
              onChange={(e) => setApprovalDate(e.target.value)}
            />
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="label">Notas internas</label>
          <textarea
            className="input"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observaciones, pendientes, referencias..."
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">
            Checklist de revisión
          </h2>
          <span className={`text-sm font-medium ${checkedCount === totalItems ? "text-green-600" : "text-orange-500"}`}>
            {checkedCount}/{totalItems} completados
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Object.entries(activeChecklist).map(([key, label]) => (
            <label
              key={key}
              className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 cursor-pointer transition-colors ${
                displayChecklist[key]
                  ? "border-green-400 bg-green-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="checkbox"
                checked={displayChecklist[key]}
                onChange={(e) =>
                  setChecklist((prev) => ({ ...prev, [key]: e.target.checked }))
                }
                className="h-4 w-4 rounded accent-green-600"
              />
              <span className={`text-sm ${displayChecklist[key] ? "text-green-800 font-medium" : "text-gray-600"}`}>
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
        >
          Cancelar
        </button>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear trámite"}
        </button>
      </div>
    </form>
  );
}
