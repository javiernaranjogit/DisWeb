'use strict';
const express = require('express');
const mongoose = require('mongoose');

// Los modelos se registran antes que los controladores, que los recuperan
// mediante mongoose.model(...).
require('./api/models/backendModel');
require('./api/models/authModel');

const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/backendDB';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

require('./api/routes/backendRoutes')(app);

async function main() {
  await mongoose.connect(mongoUri);
  app.listen(port, () => {
    console.log(`backend Rest API server started on: ${port}`);
  });
}

main().catch((err) => {
  console.error('No se pudo arrancar el servicio:', err.message);
  process.exit(1);
});
