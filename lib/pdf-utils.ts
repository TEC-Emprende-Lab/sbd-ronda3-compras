// Carga el logo PNG desde /public como data URL para insertarlo en jsPDF.
// (jsPDF.addImage no acepta SVG, por eso usamos el PNG extraído del logo.)
export async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch("/logo-tec-blanco.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// Proporción real del logo (283 x 77)
export const LOGO_RATIO = 283 / 77;
