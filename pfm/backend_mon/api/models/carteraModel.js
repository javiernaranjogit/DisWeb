'use strict';
const mongoose = require('mongoose');

const { Schema } = mongoose;

// Una cartera por usuario. `rates` es un objeto libre {divisa: cantidad}.
const carteraSchema = new Schema({
  username: { type: String, unique: true, index: true },
  rates: {},
});

module.exports = mongoose.model('Cartera', carteraSchema);
