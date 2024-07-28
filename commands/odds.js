const axios = require('axios');
const { calcularProbabilidadeImplicita, calcularOvervalue, calcularROI, dividirMensagem } = require('../utils/oddsUtils');
const { apiToken, apiFootballToken } = require('../config/config');
const { buscarProbabilidadesReais } = require('../services/odds');

async function oddsCommand(bot, msg) {
  const chatId = msg.chat.id;
  const url = `https://api.the-odds-api.com/v4/sports/soccer_brazil_campeonato/odds/?regions=us&oddsFormat=decimal&apiKey=${apiToken}`;

  try {
    const response = await axios.get(url);
    const odds = response.data;
    const probabilidadesReais = await buscarProbabilidadesReais();

    if (odds && odds.length > 0) {
      const mensagens = formatarOdds(odds, probabilidadesReais);
      for (const mensagem of mensagens) {
        await bot.sendMessage(chatId, mensagem, { parse_mode: 'Markdown' });
      }
    } else {
      bot.sendMessage(chatId, 'Não há odds disponíveis no momento.');
    }
  } catch (error) {
    console.error('Erro ao buscar dados de odds:', error);
    bot.sendMessage(chatId, 'Erro ao buscar dados de odds.');
  }
}

function formatarOdds(odds, probabilidadeReal = {}) {
  let mensagem = '*Melhores Odds de Futebol do Brasileirão Série A:*\n\n';
  const hoje = new Date();
  const amanha = new Date();
  amanha.setDate(hoje.getDate() + 1);

  odds.forEach(evento => {
    const dataEvento = new Date(evento.commence_time);
    if (dataEvento >= hoje && dataEvento <= amanha) {
      const bookmaker = evento.bookmakers.find(bm => bm.key === 'bovada');
      if (bookmaker) {
        const mercado = bookmaker.markets.find(market => market.key === 'h2h');
        const oddsHome = mercado.outcomes.find(outcome => outcome.name === evento.home_team).price;
        const oddsAway = mercado.outcomes.find(outcome => outcome.name === evento.away_team).price;
        const oddsDraw = mercado.outcomes.find(outcome => outcome.name === 'Draw').price;

        const probabilidadeHome = calcularProbabilidadeImplicita(oddsHome) * 100;
        const probabilidadeAway = calcularProbabilidadeImplicita(oddsAway) * 100;
        const probabilidadeDraw = calcularProbabilidadeImplicita(oddsDraw) * 100;

        const probabilidadeRealHome = probabilidadeReal[evento.home_team] || probabilidadeHome / 100;
        const probabilidadeRealAway = probabilidadeReal[evento.away_team] || probabilidadeAway / 100;
        const probabilidadeRealDraw = probabilidadeReal['Draw'] || probabilidadeDraw / 100;

        const overvalueHome = calcularOvervalue(probabilidadeRealHome, oddsHome);
        const overvalueAway = calcularOvervalue(probabilidadeRealAway, oddsAway);
        const overvalueDraw = calcularOvervalue(probabilidadeRealDraw, oddsDraw);

        const roiHome = calcularROI(probabilidadeRealHome, oddsHome);
        const roiAway = calcularROI(probabilidadeRealAway, oddsAway);
        const roiDraw = calcularROI(probabilidadeRealDraw, oddsDraw);

        const apostas = [
          { tipo: 'Vitória', time: evento.home_team, odds: oddsHome, probabilidade: probabilidadeHome, overvalue: overvalueHome, roi: roiHome },
          { tipo: 'Vitória', time: evento.away_team, odds: oddsAway, probabilidade: probabilidadeAway, overvalue: overvalueAway, roi: roiAway },
          { tipo: 'Empate', time: 'Draw', odds: oddsDraw, probabilidade: probabilidadeDraw, overvalue: overvalueDraw, roi: roiDraw }
        ];

        const melhorAposta = apostas.reduce((prev, curr) => (curr.probabilidade > prev.probabilidade ? curr : prev));

        mensagem += `*${evento.home_team} vs ${evento.away_team}*\n`;
        mensagem += `${melhorAposta.tipo} ${melhorAposta.time === 'Draw' ? 'Empate' : melhorAposta.time}: ✅ \`${melhorAposta.odds}\` (Casa: ${bookmaker.title}, Probabilidade: ${melhorAposta.probabilidade.toFixed(2)}%, Overvalue: ${melhorAposta.overvalue.toFixed(2)}, ROI: ${melhorAposta.roi.toFixed(2)}%)\n\n`;
      }
    }
  });

  return dividirMensagem(mensagem);
}

module.exports = oddsCommand;
