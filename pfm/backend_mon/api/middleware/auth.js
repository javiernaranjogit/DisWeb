'use strict';
const jwt = require('jsonwebtoken');
const config = require('../../config');

/**
 * Firma un token que identifica al usuario. El payload original era
 * `{ check: true }`, es decir, no identificaba a nadie: cualquier token válido
 * servía para operar sobre los datos de cualquier usuario.
 */
function firmarToken(usuario) {
  return jwt.sign(
    { username: usuario.username, permiso: usuario.permiso || 0 },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

function extraerToken(req) {
  const cabecera = req.headers.authorization || '';
  if (cabecera.startsWith('Bearer ')) {
    return cabecera.slice(7).trim();
  }
  // Compatibilidad con el cliente original, que enviaba el token en el cuerpo.
  return (req.body && req.body.token) || req.query.token || null;
}

/** Exige un token válido y deja el usuario en `req.user`. */
function requireAuth(req, res, next) {
  const token = extraerToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Falta el token de autenticación' });
  }
  try {
    req.user = jwt.verify(token, config.jwtSecret);
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido o caducado' });
  }
}

/** Exige además que el usuario tenga permiso de administrador. */
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!req.user || Number(req.user.permiso) < 1) {
      return res.status(403).json({ message: 'Se requieren permisos de administrador' });
    }
    return next();
  });
}

module.exports = { firmarToken, requireAuth, requireAdmin };
