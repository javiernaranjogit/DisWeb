'use strict';
const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

const {
  app,
  conectar,
  limpiar,
  desconectar,
  tokenAdmin,
  crearUsuarioYLogin,
} = require('./helpers');

test.before(async () => {
  await conectar();
  await limpiar();
});
test.after(async () => {
  await limpiar();
  await desconectar();
});

test('el listado de usuarios exige token', async () => {
  const res = await request(app).get('/usuarios');
  assert.strictEqual(res.status, 401);
});

test('un usuario normal no puede listar usuarios', async () => {
  const { token } = await crearUsuarioYLogin(request, { username: 'curioso' });
  const res = await request(app).get('/usuarios').set('Authorization', `Bearer ${token}`);
  assert.strictEqual(res.status, 403);
});

test('el listado de administrador nunca incluye hashes ni tokens de recuperación', async () => {
  await crearUsuarioYLogin(request, { username: 'visible' });
  const res = await request(app).get('/usuarios').set('Authorization', `Bearer ${tokenAdmin()}`);
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.length > 0);
  res.body.forEach((usuario) => {
    assert.strictEqual(usuario.password, undefined);
    assert.strictEqual(usuario.resetPasswordToken, undefined);
  });
});

test('los endpoints destructivos rechazan a quien no es administrador', async () => {
  const { token } = await crearUsuarioYLogin(request, { username: 'saboteador' });
  const rutas = [
    '/borraTodosUsuarios',
    '/borraTodosRegistros',
    '/borraTodaCartera',
    '/borrarTodasLasNoticias',
  ];
  for (const ruta of rutas) {
    const sinToken = await request(app).delete(ruta);
    assert.strictEqual(sinToken.status, 401, `${ruta} sin token debería dar 401`);
    const conTokenNormal = await request(app).delete(ruta).set('Authorization', `Bearer ${token}`);
    assert.strictEqual(conTokenNormal.status, 403, `${ruta} con usuario normal debería dar 403`);
  }
});

test('la cartera requiere autenticación', async () => {
  const res = await request(app).post('/getCartera').send({ username: 'quien-sea' });
  assert.strictEqual(res.status, 401);
});

// El fallo original: el propietario se leía del cuerpo de la petición, así que
// cualquier token válido servía para leer o modificar la cartera de otro.
test('un usuario no puede acceder a la cartera de otro', async () => {
  const alicia = await crearUsuarioYLogin(request, { username: 'alicia' });
  const bruno = await crearUsuarioYLogin(request, { username: 'bruno' });

  await request(app)
    .post('/addToCartera')
    .set('Authorization', `Bearer ${alicia.token}`)
    .send({ rates: 'BTC:3' });

  // Bruno pide explícitamente la cartera de Alicia; debe recibir la suya, vacía.
  const res = await request(app)
    .post('/getCartera')
    .set('Authorization', `Bearer ${bruno.token}`)
    .send({ username: 'alicia' });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.usernameLogin, 'bruno');
  assert.deepStrictEqual(res.body.rates, {});
});

test('la cartera propia acumula cantidades sobre la misma divisa', async () => {
  const { token } = await crearUsuarioYLogin(request, { username: 'carmen' });
  const cabecera = { Authorization: `Bearer ${token}` };

  await request(app).post('/addToCartera').set(cabecera).send({ rates: 'ETH:2' });
  await request(app).post('/addToCartera').set(cabecera).send({ rates: 'ETH:5' });
  const res = await request(app).post('/getCartera').set(cabecera);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.rates.ETH, 7);
});

test('un token firmado con otro secreto se rechaza', async () => {
  const jwt = require('jsonwebtoken');
  const falso = jwt.sign({ username: 'intruso', permiso: 1 }, 'otro-secreto');
  const res = await request(app).get('/usuarios').set('Authorization', `Bearer ${falso}`);
  assert.strictEqual(res.status, 401);
});
