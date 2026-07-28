'use strict';
const mongoose = require('mongoose');

const { Schema } = mongoose;

const usuarioSchema = new Schema({
  name: { type: String },
  surname: { type: String },
  username: { type: String, unique: true, index: true },
  // Hash bcrypt: nunca se guarda la contraseña en claro.
  password: { type: String },
  email: { type: String },
  // 0 = usuario normal, 1 = administrador. Sólo se cambia desde la base de datos.
  permiso: { type: Number, default: 0 },
  novedades: { type: Boolean, default: false },
  // Token de recuperación, guardado hasheado y con caducidad.
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

module.exports = mongoose.model('Usuarios', usuarioSchema);
