const axios = require('axios');
const { apiFootballToken } = require('../config/config');

async function getTeams() {
  const url = `https://v3.football.api-sports.io/teams?league=71&season=2024`;

  try {
    const response = await axios.get(url, {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': apiFootballToken,
      },
    });

    const teams = response.data.response;
    teams.forEach(team => {
      console.log(`ID: ${team.team.id}, Name: ${team.team.name}`);
    });
  } catch (error) {
    console.error('Erro ao buscar times:', error);
  }
}

getTeams();
