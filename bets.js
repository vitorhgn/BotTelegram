const axios = require('axios');
require('dotenv').config();

const apiToken = process.env.API_TOKEN;  // Token da API de apostas

async function buscarDadosApostas(tournamentId, limit, page) {
  const url = `https://api.apostasseguras.com/request?product=surebets&source=1xbet&sport=Football&tournament=${tournamentId}&limit=${limit}&page=${page}`;
  const headers = {
    'Authorization': `Bearer ${apiToken}`
  };

  try {
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar dados de apostas:', error);
    throw error;
  }
}

module.exports = { buscarDadosApostas };
