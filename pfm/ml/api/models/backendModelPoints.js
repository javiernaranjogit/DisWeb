'use strict';
const mongoose = require('mongoose');

const { Schema } = mongoose;

// Nube de puntos (valores reales frente a predichos) del último entrenamiento.
const NubePuntosSchema = new Schema(
  {
    timestamp: { type: Date },
    originalPoints: {},
    predictedPoints: {},
  },
  { collection: 'nube_puntos' }
);

module.exports = mongoose.model('NubePuntos', NubePuntosSchema);
