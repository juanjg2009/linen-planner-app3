# Linen Paper Co. — App de escritorio (Windows / macOS)

Envoltorio **Electron** que abre el planner como app nativa (icono propio,
ventana propia, sin navegador). Los datos persisten en el `localStorage` de la
app (carpeta userData del sistema).

Requiere primero el HTML del planner construido:

```
cd ..                       # carpeta del proyecto
npm install && npm run build:planner
cd desktop
npm install
```

## Windows (.exe portable) — se compila aquí

```
npm run dist:win:portable
```

Genera `dist/Linen Paper Co.-win32-x64/` con **`Linen Paper Co..exe`**.
Es **portable**: copia esa carpeta donde quieras y doble clic al `.exe`.
Para distribuir: comprime la carpeta en .zip y compártela.

> Se empaqueta de forma manual (`portable.mjs`) copiando el Electron de
> `node_modules` e inyectando la app. Esto evita el bug de `electron-builder`
> en Windows sin permisos de administrador (extrae symlinks de macOS del cache
> `winCodeSign` y falla con *"Cannot create symbolic link"*). El `.exe` no está
> firmado: Windows SmartScreen puede avisar la primera vez → "Más información" →
> "Ejecutar de todas formas".

Si tienes **Modo de desarrollador** activado (Configuración → Privacidad y
seguridad → Para desarrolladores) o ejecutas como admin, también funciona el
instalador NSIS clásico:

```
npm run dist:win:installer      # genera dist/*.exe (Setup)
```

## macOS (.dmg) — necesita un Mac

`electron-builder --mac dmg` **solo funciona en macOS** (firma/empaquetado del
.app). Desde Windows no se puede generar el .dmg. Dos opciones:

1. **En un Mac**:
   ```
   cd .. && npm install && npm run build:planner
   cd desktop && npm install && npm run dist:mac
   ```
   Genera `dist/*.dmg`.

2. **GitHub Actions (gratis, sin Mac)**: este repo incluye
   `.github/workflows/build-mac.yml`. Sube el proyecto a GitHub (con la carpeta
   `linen-planner-app` como raíz del repo) → pestaña **Actions** → ejecuta
   *"Build macOS app (.dmg)"* → descarga el artefacto `linen-planner-macos`.

   > El .dmg sale **sin firmar**. macOS Gatekeeper avisará: clic derecho sobre
   > la app → **Abrir** la primera vez. Para firma/notarización oficial hace
   > falta cuenta de Apple Developer (99 $/año) y añadir credenciales al workflow.

## Cambiar icono

Edita el PNG fuente (`../assets/icons/icon-512.png`, se regenera con
`node ../build/gen-icons.mjs`). `node icons.mjs` lo convierte a `.ico`/`.icns`.
