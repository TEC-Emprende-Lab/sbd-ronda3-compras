# Extensión: auto-conciliar FUNDATEC

Cuando descargas el reporte `rpSituacion.xls` desde el SOIN, esta extensión
lo detecta, lo lee, y abre automáticamente la herramienta de conciliación
(`/reporte/fundatec`) ya con los datos cargados — sin tener que buscar el
archivo ni volver a seleccionarlo a mano.

## Instalación (una sola vez)

1. Abre `chrome://extensions` en Chrome.
2. Activa **"Modo de desarrollador"** (interruptor arriba a la derecha).
3. Clic en **"Cargar descomprimida"** (Load unpacked).
4. Selecciona esta carpeta (`chrome-extension`).
5. La extensión "Catalitec: auto-conciliar FUNDATEC" debería aparecer en la lista.
6. **Paso obligatorio:** en la tarjeta de la extensión, clic en **"Detalles"**
   → activa **"Permitir acceso a las URLs de archivos"**. Sin esto, la
   extensión no puede leer el archivo que Chrome acaba de guardar en tu
   disco (es una restricción de seguridad normal de Chrome, no un error).

## Cómo se usa

No hace nada distinto a lo de siempre: entras al SOIN, generas y descargas
el reporte del proyecto que quieras (`rpSituacion.xls`). En cuanto la
descarga termina, se abre sola una pestaña con la conciliación ya hecha.

Si ya tenías la pestaña de la herramienta abierta, la reutiliza en vez de
abrir una nueva.

## Si deja de funcionar

- Revisa que "Permitir acceso a las URLs de archivos" siga activado
  (a veces Chrome lo desactiva solo tras una actualización de la extensión).
- Si cambia la URL del SOIN o del sitio de Vercel, hay que actualizar
  `manifest.json` y `background.js` con la URL nueva.
- Si FUNDATEC cambia el nombre del archivo (ya no es "rpSituacion.xls"),
  hay que ajustar `FILENAME_PATTERN` en `background.js`.
