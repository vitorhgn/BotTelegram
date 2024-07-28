const axios = require('axios');
const { apiToken, selectedBookmaker } = require('../config/config');

async function buscarOdds() {
  const url = `https://api.the-odds-api.com/v4/sports/soccer_brazil_campeonato/odds/?regions=us&oddsFormat=decimal&apiKey=${apiToken}`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar dados de odds:', error);
    throw error;
  }
}

function dividirMensagem(mensagem, maxLength = 4096) {
  const partes = [];
  while (mensagem.length > 0) {
    if (mensagem.length > maxLength) {
      let i = maxLength;
      while (i > 0 && mensagem[i] !== '\n') {
        i--;
      }
      if (i === 0) {
        i = maxLength;
      }
      partes.push(mensagem.slice(0, i));
      mensagem = mensagem.slice(i);
    } else {
      partes.push(mensagem);
      mensagem = '';
    }
  }
  return partes;
}

function calcularProbabilidadeImplicita(odds) {
  return 1 / odds;
}

function calcularOvervalue(probabilidadeReal, odds) {
  const probabilidadeImplicita = calcularProbabilidadeImplicita(odds);
  return probabilidadeReal / probabilidadeImplicita;
}

function calcularROI(probabilidadeReal, odds) {
  return (probabilidadeReal * odds - 1) * 100;
}

function formatarOdds(odds, probabilidadeReal = {}) {
  let mensagem = '*Melhores Odds de Futebol do Brasileirão Série A:*\n\n';
  const hoje = new Date();
  const amanha = new Date();
  amanha.setDate(hoje.getDate() + 1);

  odds.forEach(evento => {
    const dataEvento = new Date(evento.commence_time);
    if (dataEvento >= hoje && dataEvento <= amanha) {
      const bookmaker = evento.bookmakers.find(bm => bm.key === selectedBookmaker);
      if (bookmaker) {
        mensagem += `*${evento.home_team} vs ${evento.away_team}*\n`;

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

        const melhorAposta = Math.max(roiHome, roiAway, roiDraw);
        const emojiHome = melhorAposta === roiHome ? '✅' : '❌';
        const emojiAway = melhorAposta === roiAway ? '✅' : '❌';
        const emojiDraw = melhorAposta === roiDraw ? '✅' : '❌';

        mensagem += `Vitória ${evento.home_team}: \`${oddsHome}\` (Casa: ${bookmaker.title}, Probabilidade: ${probabilidadeHome.toFixed(2)}%, Overvalue: ${overvalueHome.toFixed(2)}, ROI: ${roiHome.toFixed(2)}%) ${emojiHome}\n`;
        mensagem += `Vitória ${evento.away_team}: \`${oddsAway}\` (Casa: ${bookmaker.title}, Probabilidade: ${probabilidadeAway.toFixed(2)}%, Overvalue: ${overvalueAway.toFixed(2)}, ROI: ${roiAway.toFixed(2)}%) ${emojiAway}\n`;
        mensagem += `Empate: \`${oddsDraw}\` (Casa: ${bookmaker.title}, Probabilidade: ${probabilidadeDraw.toFixed(2)}%, Overvalue: ${overvalueDraw.toFixed(2)}, ROI: ${roiDraw.toFixed(2)}%) ${emojiDraw}\n\n`;
      }
    }
  });

  return dividirMensagem(mensagem);
}

module.exports = { buscarOdds, formatarOdds };
