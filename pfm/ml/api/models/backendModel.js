'use strict';
const mongoose = require('mongoose');

const { Schema } = mongoose;

// Parámetros de la recta que resume cada entrenamiento (y = pendiente·x + nplus).
//
// La colección se nombra explícitamente: este modelo y el de cotizaciones de
// backend_mon se llamaban ambos "Registros" y comparten base de datos, así que
// mongoose los mapeaba sobre la misma colección `registros` y los documentos de
// los dos servicios acababan mezclados.
const RegistroSchema = new Schema(
  {
    timestamp: { type: Date },
    pendiente: { type: Number },
    nplus: { type: Number },
  },
  { collection: 'entrenamientos' }
);

module.exports = mongoose.model('Registros', RegistroSchema);
