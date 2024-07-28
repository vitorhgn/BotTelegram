const axios = require('axios');
const { apiFootballToken } = require('../config/config');

async function buscarProbabilidadesReais() {
  const hoje = new Date().toISOString().split('T')[0];
  const url = `https://v3.football.api-sports.io/fixtures?league=71&season=2024&date=${hoje}`;

  try {
    const response = await axios.get(url, {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': apiFootballToken,
      },
    });

    const fixtures = response.data.response;
    const probabilidadesReais = {};

    fixtures.forEach(fixture => {
      const homeTeam = fixture.teams.home.name;
      const awayTeam = fixture.teams.away.name;
      const totalGames = fixture.league.season;

      const homeWinPercentage = fixture.goals.home / totalGames;
      const awayWinPercentage = fixture.goals.away / totalGames;
      const drawPercentage = (totalGames - fixture.goals.home - fixture.goals.away) / totalGames;

      probabilidadesReais[homeTeam] = homeWinPercentage;
      probabilidadesReais[awayTeam] = awayWinPercentage;
      probabilidadesReais['Draw'] = drawPercentage;
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
