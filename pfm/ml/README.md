# ml — Servicio de predicción de CriptoVisor

Entrena y sirve un modelo de TensorFlow.js sobre el histórico diario de Bitcoin. Escucha en el
puerto **1994** y comparte base de datos con [`backend_mon`](../backend_mon).

Vive en su propio proceso para que un entrenamiento —que satura la CPU durante varios segundos—
no bloquee las peticiones normales de la aplicación.

## Puesta en marcha

```bash
cp .env.example .env    # el MISMO JWT_SECRET que backend_mon
npm ci
npm start
npm test
```

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `JWT_SECRET` | ✅ | Debe coincidir con el de `backend_mon`: así los tokens emitidos allí valen aquí |
| `PORT` | | Puerto de escucha (1994 por defecto) |
| `MONGODB_URI` | | Cadena de conexión a MongoDB |
| `CORS_ORIGIN` | | Orígenes permitidos |
| `ML_EPOCHS` / `ML_BATCH_SIZE` | | Hiperparámetros del entrenamiento (140 / 45 por defecto) |
| `MAIL_*` | | Aviso por correo al terminar el reentrenamiento nocturno |
| `ENABLE_CRON` | | `true` programa el reentrenamiento diario a las 02:30 |

## El modelo

Red densa `1 → 50 (sigmoide) → 1` que aprende a predecir el **precio de cierre** a partir del
**precio de apertura**. Optimizador Adam, error cuadrático medio, 140 épocas y lotes de 45
muestras, con los datos normalizados al rango 0-1 mediante *min-max scaling*.

Al terminar el entrenamiento se guardan dos cosas en MongoDB:

- Los parámetros de la recta que resume el modelo (`pendiente`, `nplus`), que son los que usa
  `/estimacion`. Así responder una predicción es una multiplicación, no una inferencia.
- La nube de puntos real frente a predicho, que el cliente dibuja en la pantalla del estimador.

## Endpoints

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/health` | público | Estado del servicio |
| POST | `/estimacion` | público | Cierre estimado para un valor de apertura (`{ "value": 10000 }`) |
| GET | `/allData` | público | Parámetros de los entrenamientos realizados |
| GET | `/allNubePuntos` | público | Nube de puntos del último entrenamiento |
| GET | `/entrenaModelo` | administrador | Lanza un entrenamiento |
| GET | `/updateBTCJson` | administrador | Refresca el histórico de `data/cotizaciones.json` |
| DELETE | `/borrarAllData` | administrador | Borra entrenamientos y nubes de puntos |
