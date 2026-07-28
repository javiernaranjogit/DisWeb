# din — App híbrida CriptoVisor

Cliente de CriptoVisor: una aplicación Apache Cordova para Android construida con HTML,
jQuery Mobile y Chart.js.

## Configuración

Las direcciones de los servicios están en un único fichero,
[`www/js/config.js`](www/js/config.js):

```js
var AppConfig = {
  API_BASE: 'http://localhost:1988',   // backend_mon
  ML_BASE:  'http://localhost:1994',   // ml
};
```

Cambiar esos dos valores es todo lo necesario para apuntar a otro entorno. Antes, cada fichero
de `www/js/api/` llevaba la URL del servidor escrita a mano.

## Ejecutar en el navegador

Para desarrollar no hace falta compilar nada: basta con servir `www/` y tener los dos backends
arrancados.

```bash
cd www && python3 -m http.server 8080     # http://localhost:8080
```

Los avisos de consola sobre `cordova.js` son normales fuera del dispositivo.

## Compilar el APK

`platforms/` y `plugins/` **no están en el repositorio**: son artefactos generados. Se
reconstruyen con:

```bash
npm install -g cordova
cordova platform add android@8
cordova plugin add cordova-plugin-whitelist cordova-plugin-firebase-lib@3.3.0
cordova build android
```

Para las notificaciones push hace falta un `google-services.json` propio, descargado de la
consola de Firebase y colocado en esta carpeta. Está en `.gitignore`; la plantilla es
[`google-services.example.json`](google-services.example.json).

> **Nota sobre `cordova-android@8`**: es la versión con la que se desarrolló el TFM, y compilar
> con ella hoy requiere un Android SDK de esa época. Actualizar a `cordova-android@13` implicaría
> migrar Gradle y AndroidX; se ha dejado fuera del alcance de la modernización a propósito,
> porque no aporta nada al proyecto y sí mucho riesgo de romperlo.
>
> Esa cadena de herramientas arrastra avisos de Dependabot (`shelljs`, `dot-prop`, `uuid`,
> `brace-expansion`). Son dependencias **de compilación**, no del código que se ejecuta en el
> dispositivo: la app es HTML y JavaScript dentro de un WebView y no instala nada por npm. Los
> servicios de backend, que sí se despliegan, tienen `npm audit` limpio.

## Estructura

```
www/
├── index.html, login.html, ...     páginas públicas
├── registrado/                     páginas que exigen sesión iniciada
├── js/
│   ├── config.js                   direcciones de los servicios
│   ├── auth.js                     sesión, cabecera Authorization y guarda de páginas
│   └── api/                        una llamada al backend por pantalla
├── css/                            hojas de estilo
└── lib/                            Chart.js y CanvasJS
```

## Sesión

El token se guarda en `localStorage` y se envía en la cabecera `Authorization: Bearer`. Las
páginas de `registrado/` llaman a `Auth.protegerPagina()`, que redirige al login si no hay
sesión; antes eran accesibles escribiendo la URL directamente.

Esa comprobación es sólo de usabilidad: **la autorización real la aplica el servidor**, que
identifica al usuario por el contenido del token.
