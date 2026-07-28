'use strict';
require('dotenv').config();

function requerida(nombre) {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(
      `Falta la variable de entorno ${nombre}. Copia .env.example a .env y complétala.`
    );
  }
  return valor;
}

module.exports = {
  port: Number(process.env.PORT) || 1994,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pfmDB',
  // Compartido con backend_mon: los tokens emitidos allí valen aquí.
  jwtSecret: requerida('JWT_SECRET'),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  mail: {
    user: process.env.MAIL_USER || '',
    pass: process.env.MAIL_PASS || '',
    from: process.env.MAIL_FROM || process.env.MAIL_USER || '',
    notifyTo: process.env.MAIL_NOTIFY_TO || '',
  },
  entrenamiento: {
    epochs: Number(process.env.ML_EPOCHS) || 140,
    batchSize: Number(process.env.ML_BATCH_SIZE) || 45,
  },
  enableCron: process.env.ENABLE_CRON === 'true',
};
