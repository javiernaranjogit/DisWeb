'use strict';
const backend = require('../controllers/backendController');
const { requireAdmin } = require('../middleware/auth');

module.exports = function (app) {
  app.get('/health', (req, res) => res.json({ status: 'ok', servicio: 'ml' }));

  // Consulta pública: predicción y datos del último entrenamiento
  app.route('/estimacion').post(backend.estimacion);
  app.route('/allData').get(backend.list_all);
  app.route('/allNubePuntos').get(backend.list_all_nube);

  // Operaciones costosas o destructivas: sólo administradores
  app.route('/entrenaModelo').get(requireAdmin, backend.entrena);
  app.route('/updateBTCJson').get(requireAdmin, backend.updateBTCJson);
  app.route('/borrarAllData').delete(requireAdmin, backend.deleteAllData);
};
