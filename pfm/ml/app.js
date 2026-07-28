'use strict';
const express = require('express');
const cors = require('cors');

const config = require('./config');

require('./api/models/backendModel');
require('./api/models/backendModelPoints');

const app = express();

app.use(cors({ origin: config.corsOrigin === '*' ? '*' : config.corsOrigin.split(',') }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

require('./api/routes/backendRoutes')(app);

app.use((req, res) => res.status(404).json({ message: 'Ruta no encontrada' }));

app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  res.status(500).json({ message: 'Error interno' });
});

module.exports = app;
