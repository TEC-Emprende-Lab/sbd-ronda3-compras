// Puente entre el service worker de la extensión y la página React.

function notifyReady() {
  chrome.runtime.sendMessage({ type: "fundatec-tracker-ready" }).catch(() => {});
}

// Señal 1: apenas este content script carga (puede ser antes de que
// React termine de montar el listener).
notifyReady();

// Señal 2: cuando la página confirma que ya montó su listener, por si
// el content script cargó primero y su primer aviso llegó demasiado
// pronto (poco probable, pero cubre esa carrera).
window.addEventListener("fundatec-tracker:ready", notifyReady);

// Recibe el HTML del reporte ya leído y lo despacha como evento de DOM
// para que components/FundatecReconcile.tsx lo recoja.
chrome.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === "fundatec-autoload" && typeof msg.html === "string") {
    window.dispatchEvent(new CustomEvent("fundatec-tracker:autoload", { detail: { html: msg.html } }));
  }
});
