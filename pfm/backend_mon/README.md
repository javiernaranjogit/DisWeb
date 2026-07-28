# backend_mon — API principal de CriptoVisor

Servicio REST que gestiona cotizaciones, usuarios, cartera y noticias. Escucha en el puerto
**1988** y guarda los datos en MongoDB.

## Puesta en marcha

```bash
cp .env.example .env    # completa al menos JWT_SECRET
npm ci
npm start               # o npm run dev, con recarga automática
npm test                # pruebas contra la base de datos criptovisor_test
```

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `JWT_SECRET` | ✅ | Secreto de firma de los tokens. Sin él el servicio no arranca. Generar con `openssl rand -hex 32` |
| `PORT` | | Puerto de escucha (1988 por defecto) |
| `MONGODB_URI` | | Cadena de conexión (`mongodb://127.0.0.1:27017/pfmDB` por defecto) |
| `JWT_EXPIRES_IN` | | Validez del token (`3d` por defecto) |
| `CORS_ORIGIN` | | Orígenes permitidos, separados por comas (`*` por defecto) |
| `RESET_URL_BASE` | | Base del enlace de recuperación de contraseña |
| `COINLAYER_API_KEY` | | Clave de [coinlayer](https://coinlayer.com), para las cotizaciones |
| `CMC_API_KEY` | | Clave de [CoinMarketCap](https://coinmarketcap.com/api/), para las métricas globales |
| `MAIL_USER` / `MAIL_PASS` | | Cuenta SMTP. Con Gmail hace falta una *contraseña de aplicación* |
| `MAIL_FROM` / `MAIL_NOTIFY_TO` | | Remitente y destinatario de los avisos internos |
| `ENABLE_CRON` | | `true` activa las tareas programadas (desactivadas por defecto) |

Sin `COINLAYER_API_KEY` o `CMC_API_KEY` el servicio arranca igual: los endpoints que dependen de
esas APIs responden 502/503 y el resto funciona con normalidad.

## Estructura

```
api/
├── controllers/    lógica de cada grupo de endpoints
├── models/         esquemas de Mongoose (Registros, Usuarios, Cartera, Noticias)
├── routes/         tabla de rutas y nivel de acceso de cada una
├── middleware/     firma y verificación de JWT (requireAuth, requireAdmin)
└── services/       transporte de correo compartido
app.js              aplicación Express (exportada, para poder testearla)
server.js           conexión a Mongo, tareas programadas y arranque
data/BTC-EUR.csv    histórico usado por /estimar
```

`app.js` y `server.js` están separados a propósito: los tests cargan la aplicación sin abrir un
puerto ni programar tareas.

## Crear un administrador

El alta de usuarios crea siempre cuentas sin privilegios. Para promocionar una:

```bash
mongosh pfmDB --eval 'db.usuarios.updateOne({username:"tu_usuario"},{$set:{permiso:1}})'
```

La lista de endpoints y su nivel de acceso está en el [README del proyecto](../README.md#endpoints-principales).
