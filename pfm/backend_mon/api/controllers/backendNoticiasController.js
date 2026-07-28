'use strict';
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const mongoose = require('mongoose');

const { enviarCorreo } = require('../services/mailer');

const Noticias = mongoose.model('Noticias');
const Usuario = mongoose.model('Usuarios');
const Registros = mongoose.model('Registros');

const FUENTE_RSS = 'https://es.cointelegraph.com/rss/tag/blockchain';

exports.getNoticias = async function (req, res) {
  try {
    const noticias = await Noticias.find({}).sort({ _id: -1 }).limit(5).lean();
    res.json(noticias);
  } catch (err) {
    console.error('[noticias] Error listando noticias:', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

/** Quita las etiquetas HTML del resumen que llega en el RSS. */
function limpiarDescripcion(descripcion) {
  if (!descripcion) return '';
  const parrafos = String(descripcion).match(/<p>(.*?)<\/p>/g);
  const texto = parrafos ? parrafos[0] : String(descripcion);
  return texto.replace(/<[^>]+>/g, '').trim();
}

/** Descarga el RSS de Cointelegraph y guarda las noticias nuevas. */
exports.updateNoticias = async function (req, res) {
  try {
    const { data } = await axios.get(FUENTE_RSS, { timeout: 15000, responseType: 'text' });
    const parser = new XMLParser();
    const rss = parser.parse(data);
    const items = [].concat(rss.rss.channel.item || []);

    const nuevas = items.map((item) => ({
      title: item.title,
      body: limpiarDescripcion(item.description),
      timestamp: new Date(),
    }));
    if (nuevas.length) {
      await Noticias.insertMany(nuevas);
    }
    console.log(`[noticias] ${nuevas.length} noticias actualizadas`);
    if (res) res.json({ message: 'Noticias actualizadas', total: nuevas.length });
  } catch (err) {
    console.error('[noticias] Error actualizando noticias:', err.message);
    if (res) res.status(502).json({ message: 'No se pudieron descargar las noticias' });
  }
};

exports.deleteAllNoticias = async function (req, res) {
  try {
    await Noticias.deleteMany({});
    res.json({ message: 'All noticias successfully deleted' });
  } catch (err) {
    console.error('[noticias] Error borrando noticias:', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

/** Compone el cuerpo HTML del boletín con cotizaciones y titulares. */
function componerBoletin(registros, noticias) {
  const [hoy, ayer] = registros;
  const cotizacion = (registro, divisa) =>
    registro && registro.rates ? Math.round(registro.rates[divisa]) : '—';

  const bloques = ['<h2>Últimas cotizaciones</h2>'];
  ['BTC', 'ETH'].forEach((divisa) => {
    bloques.push(
      `<p><strong>${divisa}</strong><br>` +
        `Ayer: ${cotizacion(ayer, divisa)} €<br>` +
        `Hoy: ${cotizacion(hoy, divisa)} €</p>`
    );
  });
  bloques.push('<h2>Últimas noticias</h2>');
  noticias.forEach((noticia) => {
    bloques.push(`<p><strong>${noticia.title}</strong><br>${noticia.body}</p>`);
  });
  return bloques.join('');
}

/** Envía el boletín diario a los usuarios suscritos a novedades. */
exports.createDailyNewsletter = async function (req, res) {
  try {
    const [noticias, registros, suscritos] = await Promise.all([
      Noticias.find({}).sort({ _id: -1 }).limit(5).lean(),
      Registros.find({}).sort({ _id: -1 }).limit(2).lean(),
      Usuario.find({ novedades: true }).select('email').lean(),
    ]);

    const destinatarios = suscritos.map((usuario) => usuario.email).filter(Boolean);
    if (!destinatarios.length) {
      console.log('[newsletter] No hay usuarios suscritos');
      if (res) res.json({ message: 'No hay usuarios suscritos', enviados: 0 });
      return;
    }
    await enviarCorreo({
      bcc: destinatarios,
      subject: 'CriptoVisor: servicio de notificaciones y alertas',
      html: componerBoletin(registros, noticias),
    });
    console.log(`[newsletter] Enviado a ${destinatarios.length} destinatarios`);
    if (res) res.json({ message: 'Boletín enviado', enviados: destinatarios.length });
  } catch (err) {
    console.error('[newsletter] Error enviando el boletín:', err.message);
    if (res) res.status(500).json({ message: 'No se pudo enviar el boletín' });
  }
};
