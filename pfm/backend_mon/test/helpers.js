'use strict';
// Se fija el entorno antes de cargar config.js, que valida las variables.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto-solo-para-tests';
process.env.MONGODB_URI =
  process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/criptovisor_test';
process.env.ENABLE_CRON = 'false';

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const config = require('../config');
const app = require('../app');

async function conectar() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
  }
}

async function limpiar() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

async function desconectar() {
  await mongoose.disconnect();
}

/** Token de administrador sin pasar por el alta: /nuevoUsuario nunca da permiso 1. */
function tokenAdmin(username = 'admin') {
  return jwt.sign({ username, permiso: 1 }, config.jwtSecret, { expiresIn: '1h' });
}

/** Da de alta un usuario y devuelve sus credenciales y su token. */
async function crearUsuarioYLogin(request, datos) {
  const usuario = {
    name: 'Test',
    surname: 'User',
    username: datos.username,
    email: datos.email || `${datos.username}@example.com`,
    password: datos.password || 'contrasenya-segura',
  };
  await request(app).post('/nuevoUsuario').send(usuario);
  const respuesta = await request(app)
    .post('/login')
    .send({ username: usuario.username, password: usuario.password });
  return { usuario, token: respuesta.body.token, respuesta };
}

module.exports = { app, conectar, limpiar, desconectar, tokenAdmin, crearUsuarioYLogin };
