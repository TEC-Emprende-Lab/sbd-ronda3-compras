export type Category = "prototipado" | "puesta_en_marcha";

export type TramiteType = "orden_compra" | "factura" | "reintegro";

export type TramiteStatus =
  | "en_proceso_firmas"
  | "en_sistema_fundatec"
  | "aprobado"
  | "rechazado";

export interface Project {
  id: number;
  name: string;
  category: Category;
  budget: number;
}

export interface Tramite {
  id: string;
  project_id: number;
  type: TramiteType;
  status: TramiteStatus;
  invoice_number: string | null;
  supplier: string | null;
  amount: number;
  description: string | null;
  submission_date: string | null;
  approval_date: string | null;
  notes: string | null;
  checklist: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

export interface TramiteWithProject extends Tramite {
  project: Project;
}

export const TRAMITE_TYPE_LABELS: Record<TramiteType, string> = {
  orden_compra: "Orden de Compra",
  factura: "Factura",
  reintegro: "Reintegro",
};

export const STATUS_LABELS: Record<TramiteStatus, string> = {
  en_proceso_firmas: "En proceso de firmas",
  en_sistema_fundatec: "En sistema FUNDATEC",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
};

export const STATUS_COLORS: Record<TramiteStatus, string> = {
  en_proceso_firmas: "bg-orange-100 text-orange-800",
  en_sistema_fundatec: "bg-yellow-100 text-yellow-800",
  aprobado: "bg-green-100 text-green-800",
  rechazado: "bg-red-100 text-red-800",
};

// Checklist items per tramite type
export const CHECKLISTS: Record<TramiteType, Record<string, string>> = {
  orden_compra: {
    morosidad: "Morosidad",
    justificacion: "Justificación",
    detalles_compra: "Detalles de compra",
    fechas: "Fechas",
    monto: "Monto",
    minuta: "Minuta",
    colones: "Colones",
    nombre_funda: "A nombre de FUNDA",
  },
  factura: {
    morosidad: "Morosidad",
    justificacion: "Justificación",
    numero_factura: "N° Factura",
    nombre_funda: "A nombre de FUNDA",
    detalles_compra: "Detalles de compra",
    fechas: "Fechas",
    monto: "Monto",
    minuta: "Minuta",
    colones: "Colones",
  },
  reintegro: {
    morosidad: "Morosidad",
    justificacion: "Justificación",
    recibo_factura: "Recibo/Factura",
    nombre_beneficiario: "A nombre del beneficiario",
    detalles_compra: "Detalles de compra",
    fechas: "Fechas",
    monto: "Monto",
    colones: "Colones",
  },
};

export function formatCRC(amount: number): string {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    minimumFractionDigits: 2,
  }).format(amount);
}
