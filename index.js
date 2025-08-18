const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs/promises'); 
const path = require('path');
const logger = require('./logger');

const botService = require('./botService');

// Configure Google credentials
process.env.GOOGLE_APPLICATION_CREDENTIALS = './credenciales.json';

async function iniciarBot() {
  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './auth' }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox']
    }
  });

  client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    logger.info('📱 Escaneá el código QR con WhatsApp');
  });

  client.on('ready', () => {
    logger.info('✅ Bot conectado correctamente');
  });

  client.on('auth_failure', async (msg) => {
    logger.error('❌ Fallo de autenticación: ' + msg);
    try {
      await fs.rm(path.resolve('./auth'), { recursive: true, force: true });
      logger.info('🧹 Carpeta auth eliminada');
    } catch (err) {
      logger.error('❌ Error al eliminar la carpeta auth: ' + err.message);
    }
  });

  client.on('disconnected', async (reason) => {
    logger.warn(`🔌 Bot desconectado: ${reason}`);
    try {
      await fs.rm(path.resolve('./auth'), { recursive: true, force: true });
      logger.info('🧹 Auth eliminada. Reiniciá el bot para escanear nuevo QR.');
    } catch (err) {
      logger.error('❌ Error al eliminar la carpeta auth: ' + err.message);
    }
  });

  client.on('message', async (msg) => {
    const texto = msg.body;
    if (!texto) return;

    try {
      const sessionId = msg.from;
      const respuesta = await botService.processMessage(sessionId, texto);
      // --- Validación de respuesta ---
            await msg.reply(respuesta ?? '❌ No pude procesar tu solicitud. Por favor, intenta de nuevo.');    
    } catch (error) {
      logger.error('❌ Error al procesar el mensaje:', error);
      await msg.reply('❌ Lo siento, ha ocurrido un error interno. Inténtalo más tarde.');
    }
  });

  client.initialize();
}

iniciarBot();