'use strict';
const mongoose = require('mongoose');

const { Schema } = mongoose;

// Cotización diaria. `rates` es un objeto libre {divisa: valor}, tal y como lo
// devuelve la API de coinlayer, así que no se declara su forma.
const RegistroSchema = new Schema({
  timestamp: { type: Date },
  currency: { type: String },
  rates: {},
});

module.exports = mongoose.model('Registros', RegistroSchema);
