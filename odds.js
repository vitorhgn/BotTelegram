const axios = require('axios');
require('dotenv').config();

const apiToken = process.env.ODDS_API_TOKEN;  // Substitua pela sua chave de API

async function buscarOdds() {
  const url = `https://api.the-odds-api.com/v4/sports/soccer/odds/?regions=us&oddsFormat=decimal&apiKey=${apiToken}`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar dados de odds:', error);
    throw error;
  }
}

module.exports = { buscarOdds };
