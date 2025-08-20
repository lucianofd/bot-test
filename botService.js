// botService.js

// Importa los clientes y la configuración del archivo config.js
const { PROJECT_ID, firestore, sessionClient, LANGUAGE_CODE } = require('./config');
const logger = require('./logger');


// Función principal para procesar el mensaje
async function processMessage(sessionId, messageText) {
    const sessionPath = sessionClient.projectAgentSessionPath(PROJECT_ID, sessionId);
    
    // 1. Enviar el mensaje a Dialogflow para que lo interprete
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: messageText,
                languageCode: LANGUAGE_CODE,
            },
        },
    };

    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;

    logger.info(`🔍 Dialogflow detectó el intent: ${result.intent.displayName}`);
    
    // 2. Usar la respuesta de Dialogflow
    if (result.intent.displayName === 'registrar_gasto') {
        const monto = result.parameters.fields.monto.numberValue;
        const categoria = result.parameters.fields.categoria.stringValue;
        const descripcion = result.parameters.fields.descripcion.stringValue || result.queryText; // Usar la descripción si se extrae, o el texto original

        if (!monto || !categoria) {
            return `❌ Lo siento, no pude entender el monto o la categoría. Por favor, asegúrate de que el mensaje los contenga.`;
        }
        
        // 3. Guardar los datos extraídos en Firestore
        const registro = {
            monto: monto,
            categoria: categoria,
            descripcion: descripcion,
            fecha: new Date().toISOString(),
        };

        const docRef = await firestore.collection('gastos').add(registro);
        logger.info(`✅ Gasto registrado en Firestore con ID: ${docRef.id}`);

        return `✅ Gasto registrado: $${monto} en ${categoria}.`;

    } else {
        // Si el intent no es 'registrar_gasto', manejarlo como una respuesta de reserva.
        return result.fulfillmentText || '❌ No entendí tu solicitud. ¿Puedes intentar de nuevo?';
    }
}

module.exports = {
    processMessage
};