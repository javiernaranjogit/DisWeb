'use strict';
const mongoose = require('mongoose');

const Cartera = mongoose.model('Cartera');

/** Listado completo de carteras (sólo administradores). */
exports.list_all_cartera = async function (req, res) {
  try {
    res.json(await Cartera.find({}).lean());
  } catch (err) {
    console.error('[cartera] Error listando carteras:', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

/**
 * Añade una cantidad de una divisa a la cartera del usuario autenticado.
 * El propietario sale del token (`req.user`), no del cuerpo de la petición:
 * antes bastaba cualquier token válido para operar sobre la cartera ajena.
 */
exports.addToCartera = async function (req, res) {
  const username = req.user.username;
  const [divisa, cantidadTexto] = String(req.body.rates || '').split(':');
  const cantidad = Number(cantidadTexto);
  if (!divisa || !Number.isFinite(cantidad)) {
    return res.status(400).json({ message: 'Formato esperado: DIVISA:cantidad' });
  }
  try {
    const cartera = await Cartera.findOne({ username });
    if (!cartera) {
      const creada = await Cartera.create({ username, rates: { [divisa]: cantidad } });
      return res.status(201).json(creada);
    }
    // `rates` es un campo libre del esquema: hay que reasignarlo y marcarlo
    // como modificado para que mongoose persista el cambio.
    const rates = { ...(cartera.rates || {}) };
    rates[divisa] = (Number(rates[divisa]) || 0) + cantidad;
    cartera.rates = rates;
    cartera.markModified('rates');
    await cartera.save();
    res.json(cartera);
  } catch (err) {
    console.error('[cartera] Error actualizando la cartera:', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

exports.deleteAllCartera = async function (req, res) {
  try {
    await Cartera.deleteMany({});
    res.json({ message: 'All cartera successfully deleted' });
  } catch (err) {
    console.error('[cartera] Error borrando carteras:', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

/** Devuelve la cartera del usuario autenticado. */
exports.getCartera = async function (req, res) {
  const username = req.user.username;
  try {
    const cartera = await Cartera.findOne({ username }).lean();
    res.json({ usernameLogin: username, rates: (cartera && cartera.rates) || {} });
  } catch (err) {
    console.error('[cartera] Error consultando la cartera:', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};
