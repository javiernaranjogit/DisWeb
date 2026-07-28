'use strict';
const backend = require('../controllers/backendController');
const backendUsers = require('../controllers/backendUsersController');
const backendCartera = require('../controllers/backendCarteraController');
const backendNoticias = require('../controllers/backendNoticiasController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Se conservan los nombres originales de los endpoints (en español) porque son
// los que documenta la memoria del TFM; lo que cambia es quién puede llamarlos.
module.exports = function (app) {
  app.get('/health', (req, res) => res.json({ status: 'ok', servicio: 'backend_mon' }));

  // Cotizaciones: consulta pública; escritura y borrado, sólo administradores
  app.route('/registros').get(backend.list_all_registros);
  app.route('/buscarFecha/:fecha_inicio/:fecha_fin').post(backend.buscarPorFecha);
  app.route('/buscarPorFechaFiltrando').post(backend.buscarPorFechaFiltrando);
  app.route('/convertirMonedas/:divisaOrigen/:divisaDestino/:cantidad').post(backend.convertirMonedas);
  app.route('/convertirEuros/:divisaOrigen/:cantidad').post(backend.convertirEuros);
  app.route('/getMetricasGlobales').get(backend.getMetricasGlobales);
  app.route('/getLatestBlockData').get(backend.getLatestBlockData);
  app.route('/getStats').get(backend.getStats);
  app.route('/estimar').post(backend.estimar);

  app.route('/nuevoRegistro').post(requireAdmin, backend.add_registro);
  app.route('/borraRegistro/:registroId').delete(requireAdmin, backend.deleteregistro);
  app.route('/borraTodosRegistros').delete(requireAdmin, backend.deleteAll);
  app.route('/updateDb').get(requireAdmin, backend.updateDb);
  app.route('/updateBTCJson').get(requireAdmin, backend.updateBTCJson);

  // Usuarios
  app.route('/nuevoUsuario').post(backendUsers.nuevoUsuario);
  app.route('/login').post(backendUsers.login);
  app.route('/forgot').post(backendUsers.postForgot);
  app.route('/reset/:token').post(backendUsers.resetToken);
  app.route('/usuarios').get(requireAdmin, backendUsers.list_all_users);
  app.route('/borraUsuario/:usuarioId').delete(requireAdmin, backendUsers.borraUsuario);
  app.route('/borraTodosUsuarios').delete(requireAdmin, backendUsers.deleteAllUsers);

  // Cartera: cada usuario sólo puede ver y modificar la suya
  app.route('/addToCartera').post(requireAuth, backendCartera.addToCartera);
  app.route('/getCartera').post(requireAuth, backendCartera.getCartera);
  app.route('/cartera').get(requireAdmin, backendCartera.list_all_cartera);
  app.route('/borraTodaCartera').delete(requireAdmin, backendCartera.deleteAllCartera);

  // Noticias
  app.route('/getLatestNews').get(backendNoticias.getNoticias);
  app.route('/updateNews').get(requireAdmin, backendNoticias.updateNoticias);
  app.route('/borrarTodasLasNoticias').delete(requireAdmin, backendNoticias.deleteAllNoticias);
  app.route('/createDailyNewsletter').get(requireAdmin, backendNoticias.createDailyNewsletter);
};
