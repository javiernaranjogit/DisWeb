'use strict';
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const csv = require('csv-string');
const tf = require('@tensorflow/tfjs');
const mongoose = require('mongoose');

const config = require('../../config');

const Registros = mongoose.model('Registros');
const NubePuntos = mongoose.model('NubePuntos');

const RUTA_COTIZACIONES = path.join(__dirname, '..', '..', 'data', 'cotizaciones.json');

/** Lee el histórico cacheado y se queda con los pares (apertura, cierre). */
function cargarDatos() {
  const contenido = fs.readFileSync(RUTA_COTIZACIONES, 'utf-8');
  return JSON.parse(contenido)
    .map((fila) => ({ open: parseFloat(fila.Open), close: parseFloat(fila.Close) }))
    .filter((fila) => Number.isFinite(fila.open) && Number.isFinite(fila.close));
}

/** Baraja los datos, los pasa a tensores y los normaliza al rango 0-1. */
function convertirATensores(datos) {
  return tf.tidy(() => {
    tf.util.shuffle(datos);

    const inputTensor = tf.tensor2d(datos.map((d) => d.open), [datos.length, 1]);
    const labelTensor = tf.tensor2d(datos.map((d) => d.close), [datos.length, 1]);

    const inputMax = inputTensor.max();
    const inputMin = inputTensor.min();
    const labelMax = labelTensor.max();
    const labelMin = labelTensor.min();

    return {
      inputs: inputTensor.sub(inputMin).div(inputMax.sub(inputMin)),
      labels: labelTensor.sub(labelMin).div(labelMax.sub(labelMin)),
      inputMax,
      inputMin,
      labelMax,
      labelMin,
    };
  });
}

/** Red densa sencilla: 1 entrada -> 50 neuronas sigmoide -> 1 salida. */
function crearModelo() {
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [1], units: 1, useBias: true }));
  model.add(tf.layers.dense({ units: 50, activation: 'sigmoid' }));
  model.add(tf.layers.dense({ units: 1, useBias: true }));
  return model;
}

async function entrenarModelo(model, inputs, labels) {
  model.compile({
    optimizer: tf.train.adam(),
    loss: tf.losses.meanSquaredError,
    metrics: ['mse'],
  });
  return model.fit(inputs, labels, {
    batchSize: config.entrenamiento.batchSize,
    epochs: config.entrenamiento.epochs,
    shuffle: true,
  });
}

/**
 * Genera 100 predicciones sobre el rango completo, las desnormaliza y guarda la
 * nube de puntos (real vs. predicho) para poder pintarla en el cliente.
 */
async function guardarNubePuntos(model, datos, normalizacion) {
  const { inputMax, inputMin, labelMin, labelMax } = normalizacion;
  const [xs, preds] = tf.tidy(() => {
    const entrada = tf.linspace(0, 1, 100);
    const salida = model.predict(entrada.reshape([100, 1]));
    return [
      entrada.mul(inputMax.sub(inputMin)).add(inputMin).dataSync(),
      salida.mul(labelMax.sub(labelMin)).add(labelMin).dataSync(),
    ];
  });

  await NubePuntos.create({
    timestamp: new Date(),
    originalPoints: datos.map((d) => ({ x: d.open, y: d.close })),
    predictedPoints: Array.from(xs).map((x, i) => ({ x, y: preds[i] })),
  });
}

/**
 * Resume el modelo en la recta y = pendiente·x + nplus, que es lo que consulta
 * el endpoint de estimación (así no hay que recargar la red en cada petición).
 */
async function guardarParametrosRecta(normalizacion) {
  const { inputMax, inputMin, labelMin, labelMax } = normalizacion;
  const [pendiente, nplus] = tf.tidy(() => {
    const pend = inputMax.sub(inputMin).div(labelMax.sub(labelMin));
    return [pend.dataSync()[0], labelMax.sub(inputMax.sub(pend)).dataSync()[0]];
  });

  await Registros.create({ timestamp: new Date(), pendiente, nplus });
  console.log(`[ml] Parámetros guardados: pendiente=${pendiente}, nplus=${nplus}`);
  return { pendiente, nplus };
}

/** Entrena el modelo y persiste sus resultados. Usado por la ruta y por el cron. */
exports.entrena = async function (req, res) {
  try {
    const datos = cargarDatos();
    const normalizacion = convertirATensores(datos);
    const model = crearModelo();

    console.log(`[ml] Entrenando con ${datos.length} muestras...`);
    await entrenarModelo(model, normalizacion.inputs, normalizacion.labels);
    console.log('[ml] Entrenamiento terminado');

    await guardarNubePuntos(model, datos, normalizacion);
    const parametros = await guardarParametrosRecta(normalizacion);

    if (res) res.json({ message: 'Modelo entrenado', ...parametros });
    return parametros;
  } catch (err) {
    console.error('[ml] Error entrenando el modelo:', err.message);
    if (res) res.status(500).json({ message: 'No se pudo entrenar el modelo' });
    return null;
  }
};

exports.list_all = async function (req, res) {
  try {
    res.json(await Registros.find({}).lean());
  } catch (err) {
    console.error('[ml] Error listando entrenamientos:', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

exports.list_all_nube = async function (req, res) {
  try {
    res.json(await NubePuntos.find({}).sort({ _id: -1 }).limit(1).lean());
  } catch (err) {
    console.error('[ml] Error listando la nube de puntos:', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

exports.deleteAllData = async function (req, res) {
  try {
    await Promise.all([Registros.deleteMany({}), NubePuntos.deleteMany({})]);
    res.json({ message: 'All registros successfully deleted' });
  } catch (err) {
    console.error('[ml] Error borrando datos:', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

/** Estima el precio de cierre a partir del último entrenamiento almacenado. */
exports.estimacion = async function (req, res) {
  const valor = Number(req.body.value);
  if (!Number.isFinite(valor)) {
    return res.status(400).json({ message: 'El campo value debe ser numérico' });
  }
  try {
    const ultimo = await Registros.findOne({}).sort({ _id: -1 }).lean();
    if (!ultimo) {
      return res.status(404).json({ message: 'Todavía no hay ningún modelo entrenado' });
    }
    res.json(ultimo.pendiente * valor + ultimo.nplus);
  } catch (err) {
    console.error('[ml] Error calculando la estimación:', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

/** Refresca el histórico diario de BTC usado como conjunto de entrenamiento. */
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
    console.log(`[ml] Histórico actualizado (${registros.length} filas)`);
    if (res) res.json({ message: 'Histórico actualizado', registros: registros.length });
  } catch (err) {
    console.error('[ml] Error actualizando el histórico:', err.message);
    if (res) res.status(502).json({ message: 'No se pudo descargar el histórico' });
  }
};
