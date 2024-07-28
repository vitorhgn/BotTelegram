const axios = require('axios');
const { apiFootballToken } = require('../config/config');

async function buscarProbabilidadesReais() {
  const url = `https://v3.football.api-sports.io/fixtures?league=71&season=2024`;

  try {
    const response = await axios.get(url, {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': apiFootballToken,
      },
    });

    const fixtures = response.data.response;
    const teamStats = {};

    fixtures.forEach(fixture => {
      const homeTeam = fixture.teams.home.name;
      const awayTeam = fixture.teams.away.name;
      const homeGoals = fixture.goals.home;
      const awayGoals = fixture.goals.away;

      if (!teamStats[homeTeam]) {
        teamStats[homeTeam] = { wins: 0, losses: 0, draws: 0, totalGames: 0 };
      }
      if (!teamStats[awayTeam]) {
        teamStats[awayTeam] = { wins: 0, losses: 0, draws: 0, totalGames: 0 };
      }

      if (homeGoals > awayGoals) {
        teamStats[homeTeam].wins++;
        teamStats[awayTeam].losses++;
      } else if (homeGoals < awayGoals) {
        teamStats[homeTeam].losses++;
        teamStats[awayTeam].wins++;
      } else {
        teamStats[homeTeam].draws++;
        teamStats[awayTeam].draws++;
      }

      teamStats[homeTeam].totalGames++;
      teamStats[awayTeam].totalGames++;
    });

    const probabilidadesReais = {};

    Object.keys(teamStats).forEach(team => {
      const stats = teamStats[team];
      const winProbability = stats.wins / stats.totalGames;
      const drawProbability = stats.draws / stats.totalGames;
      const lossProbability = stats.losses / stats.totalGames;

      probabilidadesReais[team] = {
        win: winProbability,
        draw: drawProbability,
        loss: lossProbability,
      };
    });

    return probabilidadesReais;
  } catch (error) {
    console.error('Erro ao buscar probabilidades reais:', error);
    throw error;
  }
}

module.exports = {
  buscarProbabilidadesReais,
};
