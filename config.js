// config.js

const { Firestore } = require('@google-cloud/firestore');
const dialogflow = require('@google-cloud/dialogflow');
const logger = require('./logger');

// Configuración global del proyecto de Google Cloud
const PROJECT_ID = 'gastosbot-466422';
const LANGUAGE_CODE = 'es-ES';

// Configurar las credenciales de Google desde el archivo local
process.env.GOOGLE_APPLICATION_CREDENTIALS = './credenciales.json';

// Clientes de las APIs de Google Cloud
const firestore = new Firestore();
const sessionClient = new dialogflow.SessionsClient({ projectId: PROJECT_ID });

logger.info('✅ Clientes de Google Cloud inicializados');

module.exports = {
  PROJECT_ID,
  LANGUAGE_CODE,
  firestore,
  sessionClient,
};