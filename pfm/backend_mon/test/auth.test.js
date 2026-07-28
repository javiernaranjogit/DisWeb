'use strict';
const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const { app, conectar, limpiar, desconectar, crearUsuarioYLogin } = require('./helpers');

test.before(async () => {
  await conectar();
  await limpiar();
});
test.after(async () => {
  await limpiar();
  await desconectar();
});

test('el alta de usuario no devuelve el hash de la contraseña', async () => {
  const res = await request(app).post('/nuevoUsuario').send({
    name: 'Ana',
    surname: 'García',
    username: 'ana',
    email: 'ana@example.com',
    password: 'contrasenya-segura',
  });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.username, 'ana');
  assert.strictEqual(res.body.password, undefined);
});

test('el alta ignora el permiso enviado por el cliente', async () => {
  const res = await request(app).post('/nuevoUsuario').send({
    username: 'aspirante',
    email: 'aspirante@example.com',
    password: 'contrasenya-segura',
    permiso: 99,
  });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.permiso, 0);
});

test('no se puede registrar dos veces el mismo usuario', async () => {
  const datos = {
    username: 'repetido',
    email: 'repetido@example.com',
    password: 'contrasenya-segura',
  };
  await request(app).post('/nuevoUsuario').send(datos);
  const res = await request(app).post('/nuevoUsuario').send(datos);
  assert.strictEqual(res.status, 409);
});

test('el login correcto devuelve un token que identifica al usuario', async () => {
  const { token } = await crearUsuarioYLogin(request, { username: 'lucia' });
  assert.ok(token, 'debería devolver un token');
  const payload = jwt.decode(token);
  assert.strictEqual(payload.username, 'lucia');
  assert.strictEqual(payload.permiso, 0);
});

test('la contraseña incorrecta devuelve 401', async () => {
  await crearUsuarioYLogin(request, { username: 'marcos' });
  const res = await request(app)
    .post('/login')
    .send({ username: 'marcos', password: 'contrasenya-equivocada' });
  assert.strictEqual(res.status, 401);
});

// Regresión: con un usuario inexistente el código original seguía ejecutando
// después de responder y reventaba al leer `user.password` sobre null.
test('un usuario inexistente devuelve 401 sin romper el servidor', async () => {
  const res = await request(app)
    .post('/login')
    .send({ username: 'no-existe', password: 'da-igual' });
  assert.strictEqual(res.status, 401);
});

test('el mensaje de error no permite distinguir si el usuario existe', async () => {
  await crearUsuarioYLogin(request, { username: 'sonia' });
  const malaPassword = await request(app)
    .post('/login')
    .send({ username: 'sonia', password: 'incorrecta' });
  const noExiste = await request(app)
    .post('/login')
    .send({ username: 'fantasma', password: 'incorrecta' });
  assert.strictEqual(malaPassword.body.message, noExiste.body.message);
});

test('la recuperación de contraseña no revela si el correo está dado de alta', async () => {
  const conCuenta = await request(app).post('/forgot').send({ email: 'ana@example.com' });
  const sinCuenta = await request(app).post('/forgot').send({ email: 'nadie@example.com' });
  assert.strictEqual(conCuenta.status, 200);
  assert.strictEqual(sinCuenta.status, 200);
  assert.strictEqual(conCuenta.body.message, sinCuenta.body.message);
});

test('un token de recuperación inventado se rechaza', async () => {
  const res = await request(app).post('/reset/token-falso').send({ password: 'otra-contrasenya' });
  assert.strictEqual(res.status, 400);
});
