export type Category = "prototipado" | "puesta_en_marcha";

export type TramiteType = "factura" | "reintegro" | "uso_tc";

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
  fundatec_number: string | null;
  deleted_at: string | null;
  historical: boolean;
  created_at: string;
  updated_at: string;
}

export interface TramiteWithProject extends Tramite {
  project: Project;
}

export const TRAMITE_TYPE_LABELS: Record<TramiteType, string> = {
  factura: "Compra por OC",
  reintegro: "Reintegro",
  uso_tc: "Uso de TC",
};

export const STATUS_LABELS: Record<TramiteStatus, string> = {
  en_proceso_firmas: "En proceso de firmas",
  en_sistema_fundatec: "En sistema FUNDATEC",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
};

export const STATUS_COLORS: Record<TramiteStatus, string> = {
  en_proceso_firmas:   "badge badge-orange",
  en_sistema_fundatec: "badge badge-amber",
  aprobado:            "badge badge-green",
  rechazado:           "badge badge-red",
};

// Checklist items per tramite type
export const CHECKLISTS: Record<TramiteType, Record<string, string>> = {
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
  uso_tc: {
    morosidad: "Morosidad",
    justificacion: "Justificación",
    formulario_tc: "Formulario P-02 TC",
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
