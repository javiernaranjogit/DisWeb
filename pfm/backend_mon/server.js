'use strict';
const mongoose = require('mongoose');
const cron = require('node-cron');

const config = require('./config');
const app = require('./app');
const registros = require('./api/controllers/backendController');
const noticias = require('./api/controllers/backendNoticiasController');
const { notificarAdmin } = require('./api/services/mailer');

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log(`[backend_mon] Conectado a MongoDB (${config.mongoUri})`);

  if (config.enableCron) {
    // 01:30 — cotizaciones del día y titulares
    cron.schedule('30 1 * * *', async () => {
      await registros.updateDbCron();
      await noticias.updateNoticias();
      await notificarAdmin('CriptoVisor: datos actualizados', 'Cotizaciones y noticias al día.');
    });

    // 03:30 — boletín diario a los usuarios suscritos
    cron.schedule('30 3 * * *', async () => {
      await noticias.createDailyNewsletter();
      await notificarAdmin('CriptoVisor: boletín enviado', 'Boletín diario enviado.');
    });
    console.log('[backend_mon] Tareas programadas activas');
  }

  app.listen(config.port, () => {
    console.log(`[backend_mon] API REST escuchando en el puerto ${config.port}`);
  });
}

main().catch((err) => {
  console.error('[backend_mon] No se pudo arrancar el servicio:', err.message);
  process.exit(1);
});
