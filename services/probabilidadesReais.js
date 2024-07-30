const { TeamStats } = require('../models');

async function obterProbabilidadesReais() {
  const teams = await TeamStats.findAll();
  const probabilidadesReais = {};
  teams.forEach(team => {
    if (team.games > 0) {
      const winRate = team.wins / team.games;
      const drawRate = (team.games - team.wins - team.loses) / team.games;
      probabilidadesReais[team.teamName] = {
        winRate: winRate,
        drawRate: drawRate || 0,
      };
    } else {
      probabilidadesReais[team.teamName] = {
        winRate: 0,
        drawRate: 0,
      };
    }
  });
  console.log('Probabilidades Reais:', probabilidadesReais);
  return probabilidadesReais;
}

module.exports = obterProbabilidadesReais;
