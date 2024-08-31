const axios = require('axios');
const { TeamStats } = require('../models');
const { apiFootballToken } = require('../config/config');

async function fetchTeamStats(teamId) {
  const url = `https://v3.football.api-sports.io/teams/statistics?league=71&season=2024&team=${teamId}`;
  try {
    const response = await axios.get(url, {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': apiFootballToken,
      },
    });

    const stats = response.data.response;

    console.log(`Dados da API para o time ${teamId}:`, JSON.stringify(stats, null, 2));

    if (stats && stats.team && stats.fixtures && stats.goals && stats.fixtures.wins && stats.fixtures.played) {
      const { team, fixtures, goals } = stats;

      await TeamStats.upsert({
        teamName: team.name,
        wins: fixtures.wins.total,
        games: fixtures.played.total,
        goalsFor: goals.for.total,
        goalsAgainst: goals.against.total,
      });

      console.log(`Estatísticas do time ${team.name} atualizadas.`);
    } else {
      console.log(`Dados insuficientes para o time: ${teamId}`);
    }
  } catch (error) {
    console.error(`Erro ao buscar estatísticas do time ${teamId}:`, error.message);
  }
}

async function updateTeamStats() {
  const teams = [118, 119, 120, 121, 124, 126, 127, 130, 131, 133, 134, 135, 136, 140, 144, 152, 154, 794, 1062, 1193];
  
  for (let i = 0; i < teams.length; i += 10) {
    const teamBatch = teams.slice(i, i + 10);

    const promises = teamBatch.map((teamId, index) => 
      new Promise(resolve => setTimeout(() => resolve(fetchTeamStats(teamId)), index * 2000)) // Espaça as requisições por 2 segundos
    );

    await Promise.all(promises);

    if (i + 10 < teams.length) {
      console.log('Aguardando 1 minuto para continuar com o próximo lote de times...');
      await new Promise(resolve => setTimeout(resolve, 60000)); // Aguarda 1 minuto antes de continuar
    }
  }
}

updateTeamStats();
