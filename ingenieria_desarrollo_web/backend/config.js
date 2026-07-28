// config.js
const crypto = require('crypto');

// Si no se define TOKEN_SECRET se genera uno aleatorio al arrancar: así la
// práctica funciona sin configuración, pero sin dejar un secreto conocido
// escrito en el repositorio (el valor original era la cadena "code").
// Al reiniciar el servidor los tokens emitidos antes dejan de ser válidos.
module.exports = {
  TOKEN_SECRET: process.env.TOKEN_SECRET || crypto.randomBytes(32).toString('hex'),
};
