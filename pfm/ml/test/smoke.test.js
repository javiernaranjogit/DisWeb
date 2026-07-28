'use strict';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto-solo-para-tests';
// Base de datos propia: si compartiera la de backend_mon, los borrados de un
// conjunto de pruebas dejarían al otro sin datos a mitad de ejecución.
process.env.MONGODB_URI =
  process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/criptovisor_ml_test';
process.env.ENABLE_CRON = 'false';

const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const config = require('../config');
const app = require('../app');

test.before(async () => {
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
  await mongoose.model('Registros').deleteMany({});
});
test.after(async () => {
  await mongoose.model('Registros').deleteMany({});
  await mongoose.disconnect();
});

test('el servicio responde en /health', async () => {
  const res = await request(app).get('/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.servicio, 'ml');
});

test('sin modelo entrenado la estimación responde 404', async () => {
  const res = await request(app).post('/estimacion').send({ value: 10000 });
  assert.strictEqual(res.status, 404);
});

test('la estimación usa los parámetros del último entrenamiento', async () => {
  await mongoose.model('Registros').create({ timestamp: new Date(), pendiente: 2, nplus: 100 });
  const res = await request(app).post('/estimacion').send({ value: 10 });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body, 120); // 2 * 10 + 100
});

test('un value no numérico se rechaza', async () => {
  const res = await request(app).post('/estimacion').send({ value: 'mucho' });
  assert.strictEqual(res.status, 400);
});

test('el reentrenamiento exige permisos de administrador', async () => {
  const sinToken = await request(app).get('/entrenaModelo');
  assert.strictEqual(sinToken.status, 401);

  const tokenNormal = jwt.sign({ username: 'pepe', permiso: 0 }, config.jwtSecret);
  const conTokenNormal = await request(app)
    .get('/entrenaModelo')
    .set('Authorization', `Bearer ${tokenNormal}`);
  assert.strictEqual(conTokenNormal.status, 403);
});

test('el borrado masivo exige permisos de administrador', async () => {
  const res = await request(app).delete('/borrarAllData');
  assert.strictEqual(res.status, 401);
});
