const axios = require('axios');
const { TeamStats } = require('../models');
const { apiFootballToken } = require('../config/config');

async function updateTeamStats(teamId) {
  const url = `https://v3.football.api-sports.io/teams/statistics?league=71&season=2024&team=${teamId}`;

  try {
    const response = await axios.get(url, {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': apiFootballToken,
      },
    });
    const data = response.data.response;

    if (!data || !data.team || !data.fixtures || !data.goals) {
      console.log(`Dados insuficientes para o time: ${teamId}`);
      return;
    }

    const teamName = data.team.name;
    const wins = data.fixtures.wins.total;
    const games = data.fixtures.played.total;
    const goalsFor = data.goals.for.total.total;
    const goalsAgainst = data.goals.against.total.total;

    await TeamStats.upsert({
      teamName,
      wins,
      games,
      goalsFor,
      goalsAgainst,
      data: JSON.stringify(data), // Armazenar todo o JSON
    });

    console.log(`Estatísticas do time ${teamName} atualizadas.`);
  } catch (error) {
    console.error(`Erro ao buscar estatísticas do time ${teamId}:`, error.message);
  }
}

async function updateAllTeams() {
  const teamIds = [118, 119, 120, 121, 124, 126, 127, 130, 131, 133, 134, 135, 136, 140, 144, 152, 154, 794, 1062, 1193];

  for (let i = 0; i < teamIds.length; i++) {
    if (i > 0 && i % 10 === 0) {
      console.log('Esperando 1 minuto para evitar limites de taxa...');
      await new Promise(resolve => setTimeout(resolve, 60000)); // Espera 1 minuto
    }
    await updateTeamStats(teamIds[i]);
  }
}

updateAllTeams();
