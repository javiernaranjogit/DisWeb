'use strict';
const jwt = require('jsonwebtoken');
const config = require('../../config');

// Copia deliberada del middleware de backend_mon: son dos servicios
// independientes que sólo comparten el secreto de firma (JWT_SECRET).
function extraerToken(req) {
  const cabecera = req.headers.authorization || '';
  if (cabecera.startsWith('Bearer ')) {
    return cabecera.slice(7).trim();
  }
  return (req.body && req.body.token) || req.query.token || null;
}

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

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!req.user || Number(req.user.permiso) < 1) {
      return res.status(403).json({ message: 'Se requieren permisos de administrador' });
    }
    return next();
  });
}

module.exports = { requireAuth, requireAdmin };
