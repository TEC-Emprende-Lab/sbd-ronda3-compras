const SOIN_HOST = "sistemafundatec.tec.ac.cr";
const TARGET_URL = "https://sbd-ronda3-compras.vercel.app/reporte/fundatec";
// Chrome agrega " (1)", " (2)"... cuando ya existe un archivo con ese
// nombre en Descargas — el patrón debe aceptar esas variantes.
const FILENAME_PATTERN = /rpSituacion(\s*\(\d+\))?\.xls$/i;

// Pestañas cuyo content script ya avisó que está listo para recibir, y
// archivos en espera de que su pestaña destino avise (evita depender de
// un tiempo fijo de espera, que es frágil).
const readyTabs = new Set();
const pendingHtmlByTab = new Map();

chrome.downloads.onChanged.addListener(async (delta) => {
  console.log("[Catalitec] downloads.onChanged", delta);
  if (!delta.state || delta.state.current !== "complete") return;

  const [item] = await chrome.downloads.search({ id: delta.id });
  console.log("[Catalitec] downloads.search ->", item);
  if (!item || !item.filename) {
    console.log("[Catalitec] descartado: sin item o sin filename");
    return;
  }
  if (!FILENAME_PATTERN.test(item.filename)) {
    console.log("[Catalitec] descartado: el nombre no calza con el patrón ->", item.filename);
    return;
  }

  // Solo reacciona a descargas que vinieron del SOIN, para no dispararse
  // con cualquier archivo que por casualidad se llame igual.
  if (item.url && !item.url.includes(SOIN_HOST) && !(item.referrer || "").includes(SOIN_HOST)) {
    console.log("[Catalitec] descartado: url/referrer no son del SOIN ->", item.url, item.referrer);
    return;
  }

  console.log("[Catalitec] archivo aceptado, leyendo:", item.filename);
  let html;
  try {
    const res = await fetch("file://" + item.filename);
    const buf = await res.arrayBuffer();
    // El reporte del SOIN viene en ISO-8859-1 (Latin-1); si se lee como
    // UTF-8 por defecto, las tildes y la ñ salen rotas.
    html = new TextDecoder("iso-8859-1").decode(buf);
    console.log("[Catalitec] archivo leído, largo:", html.length);
  } catch (err) {
    console.error(
      "[Catalitec] No se pudo leer el archivo descargado. Habilita 'Permitir acceso a las URLs de archivos' para esta extensión en chrome://extensions.",
      err
    );
    return;
  }

  await openOrFocusTargetTab(html);
});

async function openOrFocusTargetTab(html) {
  const tabs = await chrome.tabs.query({ url: TARGET_URL + "*" });
  let tab = tabs[0];
  console.log("[Catalitec] pestañas encontradas para el destino:", tabs.length);

  if (!tab) {
    tab = await chrome.tabs.create({ url: TARGET_URL });
    console.log("[Catalitec] pestaña nueva creada, id:", tab.id);
  } else {
    await chrome.tabs.update(tab.id, { active: true });
    console.log("[Catalitec] reutilizando pestaña existente, id:", tab.id, "¿lista ya?", readyTabs.has(tab.id));
  }

  sendOrQueue(tab.id, html);
}

function sendOrQueue(tabId, html) {
  if (readyTabs.has(tabId)) {
    console.log("[Catalitec] enviando archivo de inmediato a la pestaña", tabId);
    chrome.tabs
      .sendMessage(tabId, { type: "fundatec-autoload", html })
      .catch((err) => console.error("[Catalitec] Error enviando el archivo a la pestaña:", err));
  } else {
    console.log("[Catalitec] pestaña", tabId, "aún no lista; queda en espera");
    pendingHtmlByTab.set(tabId, html);
  }
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  console.log("[Catalitec] mensaje recibido en background:", msg, "de tab", sender.tab && sender.tab.id);
  if (msg && msg.type === "fundatec-tracker-ready" && sender.tab) {
    readyTabs.add(sender.tab.id);
    const pending = pendingHtmlByTab.get(sender.tab.id);
    if (pending) {
      console.log("[Catalitec] pestaña", sender.tab.id, "avisó lista; enviando archivo pendiente");
      chrome.tabs
        .sendMessage(sender.tab.id, { type: "fundatec-autoload", html: pending })
        .catch((err) => console.error("[Catalitec] Error enviando el archivo pendiente:", err));
      pendingHtmlByTab.delete(sender.tab.id);
    }
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  readyTabs.delete(tabId);
  pendingHtmlByTab.delete(tabId);
});
