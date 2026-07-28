'use strict';
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const csv = require('csv-string');
const mongoose = require('mongoose');

const config = require('../../config');

const Registros = mongoose.model('Registros');

const RUTA_CSV_BTC = path.join(__dirname, '..', '..', 'data', 'BTC-EUR.csv');
const RUTA_COTIZACIONES = path.join(__dirname, '..', '..', 'data', 'cotizaciones.json');

/** Descarga las cotizaciones del día desde coinlayer y las normaliza. */
async function obtenerCotizaciones() {
  if (!config.coinlayerApiKey) {
    throw new Error('COINLAYER_API_KEY no configurada');
  }
  const { data } = await axios.get('https://api.coinlayer.com/live', {
    params: { access_key: config.coinlayerApiKey, target: 'EUR' },
    timeout: 10000,
  });
  return {
    timestamp: new Date(data.timestamp * 1000),
    currency: 'EUR',
    rates: data.rates,
  };
}

exports.list_all_registros = async function (req, res) {
  try {
    res.json(await Registros.find({}).lean());
  } catch (err) {
    console.error('[registros] Error listando:', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

exports.updateDb = async function (req, res) {
  try {
    const registro = await Registros.create(await obtenerCotizaciones());
    res.json(registro);
  } catch (err) {
    console.error('[registros] Error actualizando cotizaciones:', err.message);
    res.status(502).json({ message: 'No se pudieron obtener las cotizaciones' });
  }
};

/** Misma actualización, invocada desde la tarea programada (sin respuesta HTTP). */
exports.updateDbCron = async function () {
  try {
    await Registros.create(await obtenerCotizaciones());
    console.log('[cron] Cotizaciones actualizadas');
  } catch (err) {
    console.error('[cron] Error actualizando cotizaciones:', err.message);
  }
};

exports.add_registro = async function (req, res) {
  try {
    const data = { ...req.body };
    data.timestamp = new Date(data.timestamp * 1000);
    if (typeof data.rates === 'string') {
      data.rates = JSON.parse(data.rates);
    }
    res.status(201).json(await Registros.create(data));
  } catch (err) {
    console.error('[registros] Error creando registro:', err.message);
    res.status(400).json({ message: 'Datos no válidos' });
  }
};

exports.buscarPorFecha = async function (req, res) {
  try {
    const registros = await Registros.find({
      timestamp: { $gte: req.params.fecha_inicio, $lte: req.params.fecha_fin },
    }).lean();
    res.json(registros);
  } catch (err) {
    console.error('[registros] Error buscando por fecha:', err.message);
    res.status(400).json({ message: 'Fechas no válidas' });
  }
};

/** Igual que la anterior, pero devolviendo sólo las divisas solicitadas. */
exports.buscarPorFechaFiltrando = async function (req, res) {
  const { fecha_inicio, fecha_fin, currencies } = req.body;
  if (!currencies) {
    return res.status(400).json({ message: 'Falta el parámetro currencies' });
  }
  try {
    const divisas = currencies.split(',');
    const registros = await Registros.find({
      timestamp: { $gte: fecha_inicio, $lte: fecha_fin },
    })
      .sort({ _id: -1 })
      .limit(10)
      .lean();

    const resultado = registros.map((registro) => ({
      _id: registro._id,
      timestamp: registro.timestamp,
      currency: registro.currency,
      rates: divisas
        .filter((divisa) => registro.rates && registro.rates[divisa] !== undefined)
        .map((divisa) => ({ [divisa]: registro.rates[divisa] })),
    }));
    res.json(resultado);
  } catch (err) {
    console.error('[registros] Error filtrando por fecha:', err.message);
    res.status(400).json({ message: 'Parámetros no válidos' });
  }
};

/** Devuelve la última cotización registrada. */
async function ultimoRegistro() {
  return Registros.findOne({}).sort({ _id: -1 }).lean();
}

exports.convertirMonedas = async function (req, res) {
  const { divisaOrigen, divisaDestino, cantidad } = req.params;
  try {
    const registro = await ultimoRegistro();
    if (!registro || !registro.rates) {
      return res.status(404).json({ message: 'No hay cotizaciones disponibles' });
    }
    const tasaOrigen = Number(registro.rates[divisaOrigen]) || 0;
    const tasaDestino = Number(registro.rates[divisaDestino]) || 0;
    if (!tasaDestino) {
      return res.status(400).json({ message: 'Divisa de destino desconocida' });
    }
    res.json({
      divisaOrigen,
      divisaDestino,
      cantidad,
      conversion: (Number(cantidad) * tasaOrigen) / tasaDestino,
    });
  } catch (err) {
    console.error('[registros] Error convirtiendo monedas:', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

exports.convertirEuros = async function (req, res) {
  const { divisaOrigen, cantidad } = req.params;
  try {
    const registro = await ultimoRegistro();
    if (!registro || !registro.rates) {
      return res.status(404).json({ message: 'No hay cotizaciones disponibles' });
    }
    const tasaOrigen = Number(registro.rates[divisaOrigen]) || 0;
    res.json({
      divisaOrigen,
      divisaDestino: 'EUR',
      cantidad,
      conversion: Number(cantidad) * tasaOrigen,
    });
  } catch (err) {
    console.error('[registros] Error convirtiendo a euros:', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

exports.deleteregistro = async function (req, res) {
  try {
    const resultado = await Registros.deleteOne({ _id: req.params.registroId });
    if (resultado.deletedCount === 0) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }
    res.json({ message: 'Register successfully deleted' });
  } catch (err) {
    console.error('[registros] Error borrando registro:', err.message);
    res.status(400).json({ message: 'Identificador no válido' });
  }
};

exports.deleteAll = async function (req, res) {
  try {
    await Registros.deleteMany({});
    res.json({ message: 'All registers successfully deleted' });
  } catch (err) {
    console.error('[registros] Error borrando registros:', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

exports.getMetricasGlobales = async function (req, res) {
  if (!config.cmcApiKey) {
    return res.status(503).json({ message: 'CMC_API_KEY no configurada' });
  }
  try {
    const { data } = await axios.get(
      'https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest',
      {
        params: { convert: 'EUR' },
        headers: { 'X-CMC_PRO_API_KEY': config.cmcApiKey },
        timeout: 10000,
      }
    );
    res.json(data);
  } catch (err) {
    console.error('[metricas] Error consultando CoinMarketCap:', err.message);
    res.status(502).json({ message: 'No se pudieron obtener las métricas globales' });
  }
};

exports.getLatestBlockData = async function (req, res) {
  try {
    const { data: ultimo } = await axios.get('https://blockchain.info/latestblock', {
      timeout: 10000,
    });
    const { data: bloque } = await axios.get(
      `https://blockchain.info/rawblock/${ultimo.hash}`,
      { timeout: 15000 }
    );
    delete bloque.tx; // la lista de transacciones es enorme y no se usa
    res.json(bloque);
  } catch (err) {
    console.error('[blockchain] Error consultando el último bloque:', err.message);
    res.status(502).json({ message: 'No se pudo consultar la cadena de bloques' });
  }
};

exports.getStats = async function (req, res) {
  try {
    const { data } = await axios.get('https://api.blockchain.info/stats', { timeout: 10000 });
    res.json(data);
  } catch (err) {
    console.error('[blockchain] Error consultando estadísticas:', err.message);
    res.status(502).json({ message: 'No se pudieron obtener las estadísticas' });
  }
};

/**
 * Lee el histórico de BTC del CSV y lo etiqueta: un día con más volumen que el
 * anterior se interpreta como presión vendedora (1), y en caso contrario como
 * compradora (0). Es el mismo criterio del trabajo original.
 */
function cargarEjemplosHistoricos() {
  const contenido = fs.readFileSync(RUTA_CSV_BTC, 'utf-8');
  const lineas = contenido.split(/\r?\n/).slice(1); // se descarta la cabecera
  const precios = [];
  const etiquetas = [];
  let volumenAnterior = null;

  lineas.forEach((linea) => {
    const campos = linea.split(',');
    if (campos.length < 7) return;
    const cierre = parseFloat(campos[4]);
    const volumen = parseFloat(campos[6]);
    if (!Number.isFinite(cierre) || !Number.isFinite(volumen)) return;
    precios.push(cierre);
    etiquetas.push(volumenAnterior !== null && volumenAnterior < volumen ? 1 : 0);
    volumenAnterior = volumen;
  });
  return { precios, etiquetas };
}

// El modelo se entrena una sola vez y se reutiliza entre peticiones: antes se
// reentrenaba la red entera en cada llamada al endpoint.
let clasificador = null;

async function obtenerClasificador() {
  if (clasificador) return clasificador;

  const tf = require('@tensorflow/tfjs');
  const { precios, etiquetas } = cargarEjemplosHistoricos();
  const min = Math.min(...precios);
  const max = Math.max(...precios);
  const normalizar = (valor) => (max > min ? (valor - min) / (max - min) : 0);

  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [1], units: 8, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
  model.compile({ optimizer: tf.train.adam(), loss: 'binaryCrossentropy' });

  const xs = tf.tensor2d(precios.map(normalizar), [precios.length, 1]);
  const ys = tf.tensor2d(etiquetas, [etiquetas.length, 1]);
  await model.fit(xs, ys, { epochs: 30, batchSize: 32, shuffle: true });
  xs.dispose();
  ys.dispose();

  clasificador = { model, normalizar, tf };
  return clasificador;
}

/**
 * Estimación compra/venta sobre el histórico de BTC. La red original usaba
 * brain.js, abandonada desde 2020 y con una cadena de dependencias nativas
 * vulnerable; se ha reescrito con TensorFlow.js, que ya usa el servicio `ml`.
 * La predicción de precio propiamente dicha sigue viviendo en ese servicio.
 */
exports.estimar = async function (req, res) {
  const divisas = (req.body.currency || 'BTC').split(',');
  try {
    const registro = await ultimoRegistro();
    if (!registro || !registro.rates) {
      return res.status(404).json({ message: 'No hay cotizaciones disponibles' });
    }
    const divisa = divisas.find((d) => registro.rates[d] !== undefined);
    if (!divisa) {
      return res.status(400).json({ message: 'Divisa no disponible en el último registro' });
    }
    const ultimoValor = parseFloat(registro.rates[divisa]);

    const { model, normalizar, tf } = await obtenerClasificador();
    const entrada = tf.tensor2d([normalizar(ultimoValor)], [1, 1]);
    const probabilidadVenta = model.predict(entrada).dataSync()[0];
    entrada.dispose();

    res.json({
      ultimo_valor: ultimoValor,
      evaluacion: { venta: probabilidadVenta, compra: 1 - probabilidadVenta },
    });
  } catch (err) {
    console.error('[estimar] Error generando la estimación:', err.message);
    res.status(500).json({ message: 'No se pudo generar la estimación' });
  }
};

/** Descarga el histórico diario de BTC y lo deja cacheado en data/cotizaciones.json. */
exports.updateBTCJson = async function (req, res) {
  const hasta = Math.round(Date.now() / 1000);
  const desde = hasta - 1000 * 24 * 60 * 60;
  const url =
    'https://query1.finance.yahoo.com/v7/finance/download/BTC-EUR' +
    `?interval=1d&events=history&period1=${desde}&period2=${hasta}`;
  try {
    const { data } = await axios.get(url, { timeout: 20000, responseType: 'text' });
    const filas = csv.parse(data);
    const cabeceras = filas[0];
    const registros = filas.slice(1).map((fila) =>
      Object.fromEntries(cabeceras.map((cabecera, i) => [cabecera, fila[i]]))
    );
    fs.writeFileSync(RUTA_COTIZACIONES, JSON.stringify(registros));
    console.log('[btc] Histórico actualizado');
    if (res) res.json({ message: 'Histórico actualizado', registros: registros.length });
  } catch (err) {
    console.error('[btc] Error actualizando el histórico:', err.message);
    if (res) res.status(502).json({ message: 'No se pudo descargar el histórico' });
  }
};
