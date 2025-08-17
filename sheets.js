const { google } = require('googleapis');
require('dotenv').config();

const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_KEY_FILE,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function agregarRegistro({ fecha, monto, tipo, categoria, descripcion }) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const values = [[fecha, monto, tipo, categoria, descripcion]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'A1',
    valueInputOption: 'USER_ENTERED',
    resource: { values },
  });
}

module.exports = { agregarRegistro };
