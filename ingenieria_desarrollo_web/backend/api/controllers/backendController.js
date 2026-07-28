'use strict';
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const config = require('../../config');

const Task = mongoose.model('Tasks');
const Auth = mongoose.model('User');

const SALT_ROUNDS = 10;

exports.list_all_tasks = async function (req, res) {
  try {
    res.json(await Task.find({}).lean());
  } catch (err) {
    console.error('[tasks] Error listando tareas:', err.message);
    res.status(500).json({ mensaje: 'Error interno' });
  }
};

/** Misma lista, pero exigiendo un token válido. */
exports.list_all_tasks_secure = async function (req, res) {
  const cabecera = req.headers.authorization || '';
  const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : req.body.token;
  if (!token) {
    return res.status(401).json({ mensaje: 'Token no proveída.' });
  }
  try {
    jwt.verify(token, config.TOKEN_SECRET);
  } catch (err) {
    return res.status(401).json({ mensaje: 'Token inválida' });
  }
  try {
    res.json(await Task.find({}).lean());
  } catch (err) {
    console.error('[tasks] Error listando tareas:', err.message);
    res.status(500).json({ mensaje: 'Error interno' });
  }
};

exports.create_a_task = async function (req, res) {
  try {
    res.status(201).json(await Task.create(req.body));
  } catch (err) {
    res.status(400).json({ mensaje: 'Datos no válidos' });
  }
};

exports.read_a_task = async function (req, res) {
  try {
    const task = await Task.findById(req.params.taskId).lean();
    if (!task) return res.status(404).json({ mensaje: 'Tarea no encontrada' });
    res.json(task);
  } catch (err) {
    res.status(400).json({ mensaje: 'Identificador no válido' });
  }
};

exports.update_a_task = async function (req, res) {
  try {
    const task = await Task.findOneAndUpdate({ _id: req.params.taskId }, req.body, { new: true });
    if (!task) return res.status(404).json({ mensaje: 'Tarea no encontrada' });
    res.json(task);
  } catch (err) {
    res.status(400).json({ mensaje: 'Datos no válidos' });
  }
};

exports.delete_a_task = async function (req, res) {
  try {
    const resultado = await Task.deleteOne({ _id: req.params.taskId });
    if (resultado.deletedCount === 0) {
      return res.status(404).json({ mensaje: 'Tarea no encontrada' });
    }
    res.json({ message: 'Task successfully deleted' });
  } catch (err) {
    res.status(400).json({ mensaje: 'Identificador no válido' });
  }
};

/**
 * Autenticación. La versión original localizaba al usuario por su nombre y
 * emitía el token sin llegar a comprobar la contraseña, y el payload era
 * `{ check: true }`, que no identificaba a nadie.
 */
exports.auth = async function (req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ mensaje: 'Faltan usuario o contraseña' });
  }
  try {
    const usuario = await Auth.findOne({ username });
    const valida = usuario && (await bcrypt.compare(password, usuario.password));
    if (!valida) {
      return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
    }
    const token = jwt.sign({ username: usuario.username }, config.TOKEN_SECRET, {
      expiresIn: '24m',
    });
    usuario.token = token;
    await usuario.save();
    res.json({ mensaje: 'Auth OK', token });
  } catch (err) {
    console.error('[auth] Error autenticando:', err.message);
    res.status(500).json({ mensaje: 'Error interno' });
  }
};

/** Alta de usuario. La contraseña se guarda hasheada, no en claro. */
exports.create_user = async function (req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ mensaje: 'Faltan usuario o contraseña' });
  }
  try {
    if (await Auth.findOne({ username })) {
      return res.status(409).json({ mensaje: 'El usuario ya existe' });
    }
    const usuario = await Auth.create({
      username,
      password: await bcrypt.hash(password, SALT_ROUNDS),
    });
    const publico = usuario.toObject();
    delete publico.password;
    res.status(201).json(publico);
  } catch (err) {
    console.error('[auth] Error creando usuario:', err.message);
    res.status(500).json({ mensaje: 'Error interno' });
  }
};
