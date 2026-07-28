'use strict';
const nodemailer = require('nodemailer');
const config = require('../../config');

// Un único transporte para todo el servicio: antes se creaba en cuatro sitios
// distintos, cada uno con las credenciales escritas en el código.
let transporter = null;

function getTransporter() {
  if (!config.mail.user || !config.mail.pass) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: config.mail.user, pass: config.mail.pass },
    });
  }
  return transporter;
}

/**
 * Envía un correo. Si no hay credenciales configuradas no lanza: registra un
 * aviso y devuelve false, para que la app siga funcionando sin SMTP.
 */
async function enviarCorreo(opciones) {
  const transport = getTransporter();
  if (!transport) {
    console.warn('[mailer] Sin credenciales SMTP configuradas; correo omitido.');
    return false;
  }
  await transport.sendMail({ from: config.mail.from, ...opciones });
  return true;
}

/** Aviso interno al administrador del servicio (usado por las tareas cron). */
async function notificarAdmin(subject, text) {
  if (!config.mail.notifyTo) return false;
  return enviarCorreo({ to: config.mail.notifyTo, subject, text });
}

module.exports = { enviarCorreo, notificarAdmin };
