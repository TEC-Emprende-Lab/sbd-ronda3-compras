# Catalitec – Control de Compras SBD Ronda 3

Plataforma para llevar el control de trámites (órdenes de compra, facturas y reintegros) de los 15 proyectos SBD Ronda 3.

---

## Pasos para poner en marcha

### 1. Crear la base de datos en Supabase (5 min, gratis)

1. Ve a [supabase.com](https://supabase.com) → **Start your project** → crea cuenta gratis
2. Crea un nuevo proyecto (nombre sugerido: `catalitec-tracker`, región: `South America - São Paulo`)
3. Una vez creado, ve a **SQL Editor** en el menú lateral
4. Pega y ejecuta el contenido de `supabase/schema.sql` → clic en **Run**
5. Luego pega y ejecuta el contenido de `supabase/seed.sql` → esto carga los 15 proyectos
6. Ve a **Settings → API** y copia:
   - `Project URL` → es tu `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → es tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Instalar y probar localmente

```bash
# Copia el proyecto a donde quieras tenerlo, luego:
cd catalitec-tracker

# Crea el archivo de variables de entorno
cp .env.example .env.local
# Edita .env.local y pega tu URL y clave de Supabase

# Instala dependencias
npm install

# Inicia el servidor de desarrollo
npm run dev
# Abre http://localhost:3000
```

### 3. Publicar en GitHub

1. Crea un repositorio nuevo en [github.com](https://github.com) (privado, sin README)
2. En la carpeta del proyecto ejecuta:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/catalitec-tracker.git
git push -u origin main
```

### 4. Desplegar en Vercel (2 min)

1. Ve a [vercel.com](https://vercel.com) → **New Project**
2. Conecta tu cuenta de GitHub y selecciona el repositorio `catalitec-tracker`
3. En la sección **Environment Variables** agrega:
   - `NEXT_PUBLIC_SUPABASE_URL` = tu URL de Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = tu clave anon
4. Clic en **Deploy** → en ~2 minutos tendrás tu URL pública

---

## Funcionalidades

- **Dashboard**: Vista general de los 15 proyectos con barra de presupuesto y trámites en proceso
- **Detalle de proyecto**: Lista de todos los trámites con filtros por estado, total reintegrado y disponible
- **Nuevo/Editar trámite**: Formulario con campos según el tipo (Orden de Compra, Factura, Reintegro)
- **Checklist de revisión**: Ítems de verificación distintos según el tipo de trámite
- **Avance de estado rápido**: Botón flecha `›` en la tabla para avanzar de estado sin abrir el formulario
  - En proceso de firmas → En sistema FUNDATEC → Aprobado
- **Control de presupuesto**: Solo los reintegros descuentan del presupuesto (aprobados y pendientes por separado)

---

## Checklists configurados

### Factura
Morosidad · Justificación · N° Factura · A nombre de FUNDA · Detalles de compra · Fechas · Monto · Minuta · Colones

### Orden de Compra
Morosidad · Justificación · Detalles de compra · Fechas · Monto · Minuta · Colones · A nombre de FUNDA

### Reintegro
Morosidad · Justificación · Recibo/Factura · A nombre del beneficiario · Detalles de compra · Fechas · Monto · Colones

> Para ajustar los ítems del checklist edita el archivo `lib/types.ts` → objeto `CHECKLISTS`.

---

## Tecnologías

- [Next.js 15](https://nextjs.org) con App Router
- [Supabase](https://supabase.com) (PostgreSQL)
- [Tailwind CSS](https://tailwindcss.com)
- TypeScript
