'use strict';
const mongoose = require('mongoose');

const { Schema } = mongoose;

const noticiasSchema = new Schema({
  timestamp: { type: Date },
  title: { type: String },
  body: { type: String },
});

module.exports = mongoose.model('Noticias', noticiasSchema);
