'use strict';
const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

const { app, conectar, limpiar, desconectar } = require('./helpers');

test.before(async () => {
  await conectar();
  await limpiar();
});
test.after(async () => {
  await limpiar();
  await desconectar();
});

test('el servicio responde en /health', async () => {
  const res = await request(app).get('/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.status, 'ok');
});

test('los endpoints públicos de consulta devuelven JSON', async () => {
  for (const ruta of ['/registros', '/getLatestNews']) {
    const res = await request(app).get(ruta);
    assert.strictEqual(res.status, 200, `${ruta} debería responder 200`);
    assert.ok(Array.isArray(res.body), `${ruta} debería devolver una lista`);
  }
});

test('una ruta inexistente devuelve 404 en JSON', async () => {
  const res = await request(app).get('/no-existe');
  assert.strictEqual(res.status, 404);
  assert.ok(res.body.message);
});

test('la conversión sin cotizaciones cargadas responde 404 y no rompe', async () => {
  const res = await request(app).post('/convertirEuros/BTC/1');
  assert.strictEqual(res.status, 404);
});
