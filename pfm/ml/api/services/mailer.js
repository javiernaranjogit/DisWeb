'use strict';
const nodemailer = require('nodemailer');
const config = require('../../config');

let transporter = null;

function getTransporter() {
  if (!config.mail.user || !config.mail.pass) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: config.mail.user, pass: config.mail.pass },
    });
  }
  return transporter;
}

/** Aviso al administrador cuando termina el reentrenamiento nocturno. */
async function notificarAdmin(subject, text) {
  const transport = getTransporter();
  if (!transport || !config.mail.notifyTo) {
    console.warn('[mailer] Sin credenciales o destinatario; correo omitido.');
    return false;
  }
  await transport.sendMail({ from: config.mail.from, to: config.mail.notifyTo, subject, text });
  return true;
}

module.exports = { notificarAdmin };
