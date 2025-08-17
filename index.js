const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs/promises');
const path = require('path');

const { agregarRegistro } = require('./sheets.js');
const logger = require('./logger');

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

    const partes = texto.trim().split(' ');
    if (partes[0].toLowerCase() !== 'gasto' || isNaN(parseFloat(partes[1]))) {
      await msg.reply('❌ Usa: gasto 200 categoria descripcion');
      return;
    }

    const monto = parseFloat(partes[1]);
    const categoria = partes[2] || 'sin_categoria';
    const descripcion = partes.slice(3).join(' ');

    logger.info(`💸 Registrando: $${monto} en ${categoria} - ${descripcion}`);

    try {
      await agregarRegistro({
        fecha: new Date().toISOString().split('T')[0],
        monto,
        categoria,
        descripcion
      });

      await msg.reply(`✅ Gasto registrado: $${monto} en ${categoria} ${descripcion ? '(' + descripcion + ')' : ''}`);
    } catch (error) {
      logger.error('❌ Error al registrar gasto: ' + error.message);
      await msg.reply('❌ Error al registrar el gasto. Intentalo más tarde.');
    }
  });

  client.initialize();
}

iniciarBot();
