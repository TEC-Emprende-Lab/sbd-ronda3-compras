// Puente entre el service worker de la extensión y la página React.
// Recibe el HTML del reporte ya leído y lo despacha como evento de DOM
// para que components/FundatecReconcile.tsx lo recoja.
chrome.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === "fundatec-autoload" && typeof msg.html === "string") {
    window.dispatchEvent(new CustomEvent("fundatec-tracker:autoload", { detail: { html: msg.html } }));
  }
});
