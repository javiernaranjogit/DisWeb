'use strict';
const mongoose = require('mongoose');
const cron = require('node-cron');

const config = require('./config');
const app = require('./app');
const modelo = require('./api/controllers/backendController');
const { notificarAdmin } = require('./api/services/mailer');

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log(`[ml] Conectado a MongoDB (${config.mongoUri})`);

  if (config.enableCron) {
    // 02:30 — se refresca el histórico y se reentrena el modelo
    cron.schedule('30 2 * * *', async () => {
      await modelo.updateBTCJson();
      await modelo.entrena();
      await notificarAdmin('CriptoVisor: modelo reentrenado', 'Entrenamiento nocturno completado.');
    });
    console.log('[ml] Reentrenamiento programado activo');
  }

  app.listen(config.port, () => {
    console.log(`[ml] API de predicción escuchando en el puerto ${config.port}`);
  });
}

main().catch((err) => {
  console.error('[ml] No se pudo arrancar el servicio:', err.message);
  process.exit(1);
});
