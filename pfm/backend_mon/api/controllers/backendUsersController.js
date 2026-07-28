'use strict';
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const config = require('../../config');
const { firmarToken } = require('../middleware/auth');
const { enviarCorreo } = require('../services/mailer');

const Usuario = mongoose.model('Usuarios');

const SALT_ROUNDS = 10;
// Nunca se devuelven al cliente el hash ni el token de recuperación.
const CAMPOS_PUBLICOS = '-password -resetPasswordToken -resetPasswordExpires';

/** Listado de usuarios (sólo administradores). */
exports.list_all_users = async function (req, res) {
  try {
    const usuarios = await Usuario.find({}).select(CAMPOS_PUBLICOS).lean();
    res.json(usuarios);
  } catch (err) {
    console.error('[usuarios] Error listando usuarios:', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

exports.deleteAllUsers = async function (req, res) {
  try {
    await Usuario.deleteMany({});
    res.json({ message: 'All users successfully deleted' });
  } catch (err) {
    console.error('[usuarios] Error borrando usuarios:', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

exports.borraUsuario = async function (req, res) {
  try {
    const resultado = await Usuario.deleteOne({ _id: req.params.usuarioId });
    if (resultado.deletedCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario eliminado' });
  } catch (err) {
    console.error('[usuarios] Error borrando usuario:', err.message);
    res.status(400).json({ message: 'Identificador no válido' });
  }
};

/**
 * Alta de usuario. El campo `permiso` se ignora deliberadamente: antes se
 * tomaba del cuerpo de la petición, lo que permitía crearse como administrador.
 */
exports.nuevoUsuario = async function (req, res) {
  const { name, surname, username, email, password, novedades } = req.body;
  if (!username || !password || !email) {
    return res.status(400).json({ message: 'Faltan campos obligatorios' });
  }
  try {
    const existente = await Usuario.findOne({ username });
    if (existente) {
      return res.status(409).json({ message: 'El usuario ya existe' });
    }
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const creado = await Usuario.create({
      name,
      surname,
      username,
      email,
      password: hash,
      novedades: Boolean(novedades),
      permiso: 0,
    });
    const publico = creado.toObject();
    delete publico.password;
    res.status(201).json(publico);
  } catch (err) {
    console.error('[usuarios] Error creando usuario:', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

/**
 * Login. Devuelve siempre el mismo mensaje ante credenciales incorrectas para
 * no permitir enumerar usuarios, y no registra en el log ni contraseñas,
 * ni hashes, ni tokens.
 */
exports.login = async function (req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Faltan usuario o contraseña' });
  }
  try {
    const usuario = await Usuario.findOne({ username });
    const valida = usuario && (await bcrypt.compare(password, usuario.password));
    if (!valida) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }
    res.json({
      token: firmarToken(usuario),
      usernameLogin: usuario.username,
      name: usuario.name,
      surname: usuario.surname,
      email: usuario.email,
      permiso: usuario.permiso,
    });
  } catch (err) {
    console.error('[usuarios] Error en login:', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

/**
 * Solicitud de recuperación. El token es aleatorio (no un JWT) y se guarda
 * hasheado con una caducidad de una hora, coherente con `resetPasswordExpires`.
 */
exports.postForgot = async function (req, res) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Falta el correo' });
  }
  try {
    const usuario = await Usuario.findOne({ email });
    // Respuesta idéntica exista o no la cuenta: no se filtra qué correos hay dados de alta.
    const respuesta = {
      message: 'Si existe una cuenta con ese correo, recibirás un email con instrucciones',
    };
    if (!usuario) {
      return res.json(respuesta);
    }
    const token = crypto.randomBytes(32).toString('hex');
    usuario.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    usuario.resetPasswordExpires = Date.now() + 3600000; // 1 hora
    await usuario.save();

    const enlace = `${config.resetUrlBase}/new_pass.html?token=${token}`;
    await enviarCorreo({
      to: usuario.email,
      subject: 'CriptoVisor: petición de nueva contraseña',
      html:
        '<p>Has solicitado restablecer la contraseña de tu cuenta.</p>' +
        `<p>Abre este enlace para completar el proceso (caduca en 1 hora):<br><a href="${enlace}">${enlace}</a></p>` +
        '<p>Si no has sido tú, ignora este correo y tu contraseña seguirá igual.</p>',
    });
    res.json(respuesta);
  } catch (err) {
    console.error('[usuarios] Error en recuperación de contraseña:', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

/** Fija la nueva contraseña a partir del token recibido por correo. */
exports.resetToken = async function (req, res) {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ message: 'Falta la nueva contraseña' });
  }
  try {
    const hashToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const usuario = await Usuario.findOne({
      resetPasswordToken: hashToken,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!usuario) {
      return res.status(400).json({ message: 'El token no es válido o ha caducado' });
    }
    usuario.password = await bcrypt.hash(password, SALT_ROUNDS);
    usuario.resetPasswordToken = undefined;
    usuario.resetPasswordExpires = undefined;
    await usuario.save();
    res.json({ message: 'Usuario actualizado' });
  } catch (err) {
    console.error('[usuarios] Error actualizando contraseña:', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};
