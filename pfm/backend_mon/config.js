'use strict';
require('dotenv').config();

// El secreto de firma no tiene valor por defecto a propósito: un fallback
// conocido equivale a no tener autenticación.
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
  port: Number(process.env.PORT) || 1988,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pfmDB',
  jwtSecret: requerida('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '3d',
  // En una app Cordova el origin es file://, por eso se deja configurable.
  corsOrigin: process.env.CORS_ORIGIN || '*',
  resetUrlBase: process.env.RESET_URL_BASE || 'http://localhost:8080',
  coinlayerApiKey: process.env.COINLAYER_API_KEY || '',
  cmcApiKey: process.env.CMC_API_KEY || '',
  mail: {
    user: process.env.MAIL_USER || '',
    pass: process.env.MAIL_PASS || '',
    from: process.env.MAIL_FROM || process.env.MAIL_USER || '',
    notifyTo: process.env.MAIL_NOTIFY_TO || '',
  },
  // Las tareas programadas se desactivan por defecto (tests y desarrollo).
  enableCron: process.env.ENABLE_CRON === 'true',
};
