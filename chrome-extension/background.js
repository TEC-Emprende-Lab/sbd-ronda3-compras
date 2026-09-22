const SOIN_HOST = "sistemafundatec.tec.ac.cr";
const TARGET_URL = "https://sbd-ronda3-compras.vercel.app/reporte/fundatec";
const FILENAME_PATTERN = /rpSituacion\.xls$/i;

chrome.downloads.onChanged.addListener(async (delta) => {
  if (!delta.state || delta.state.current !== "complete") return;

  const [item] = await chrome.downloads.search({ id: delta.id });
  if (!item || !item.filename) return;
  if (!FILENAME_PATTERN.test(item.filename)) return;

  // Solo reacciona a descargas que vinieron del SOIN, para no dispararse
  // con cualquier archivo que por casualidad se llame igual.
  if (item.url && !item.url.includes(SOIN_HOST) && !item.referrer?.includes(SOIN_HOST)) {
    return;
  }

  let html;
  try {
    const res = await fetch("file://" + item.filename);
    const buf = await res.arrayBuffer();
    // El reporte del SOIN viene en ISO-8859-1 (Latin-1); si se lee como
    // UTF-8 por defecto, las tildes y la ñ salen rotas.
    html = new TextDecoder("iso-8859-1").decode(buf);
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

  if (!tab) {
    tab = await chrome.tabs.create({ url: TARGET_URL });
    await waitForTabLoad(tab.id);
  } else {
    await chrome.tabs.update(tab.id, { active: true });
  }

  // Pequeño margen para que el content script y el listener de React
  // terminen de montarse tras la navegación/activación.
  setTimeout(() => {
    chrome.tabs.sendMessage(tab.id, { type: "fundatec-autoload", html }).catch(() => {});
  }, 300);
}

function waitForTabLoad(tabId) {
  return new Promise((resolve) => {
    function listener(id, info) {
      if (id === tabId && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}
