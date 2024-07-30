const axios = require('axios');
const { apiToken } = require('../config/config');
const { calcularProbabilidadeImplicita, dividirMensagem, calcularROI, calcularOvervalue } = require('../utils/oddsUtils');
const obterProbabilidadesReais = require('../services/probabilidadesReais');

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

function formatarDataProximoJogo(odds) {
  const proximoJogo = odds[0]?.commence_time;
  if (proximoJogo) {
    const data = new Date(proximoJogo);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}`;
  }
  return '';
}

function obterProximoDiaComJogos(odds, hoje) {
  const datasEventos = odds.map(evento => new Date(evento.commence_time));
  const datasFuturas = datasEventos.filter(data => data >= hoje);
  const proximoDia = Math.min(...datasFuturas);
  return new Date(proximoDia).toISOString().split('T')[0];
}

async function oddsCommand(bot, msg) {
  const chatId = msg.chat.id;

  try {
    const odds = await buscarOdds();
    const probabilidadesReais = await obterProbabilidadesReais();

    if (odds && odds.length > 0) {
      let mensagem = `*Melhores Odds de Futebol do Brasileirão Série A para ${formatarDataProximoJogo(odds)}:*\n\n`;
      let melhorEvento = null;
      let maiorProbabilidade = 0;
      let outrasOpcoes = [];

      const hoje = new Date();
      const proximoDia = obterProximoDiaComJogos(odds, hoje);

      odds.forEach(evento => {
        const dataEvento = new Date(evento.commence_time);
        if (dataEvento.toISOString().split('T')[0] === proximoDia) {
          const bookmaker = evento.bookmakers.find(bm => bm.key === 'bovada');
          if (bookmaker) {
            const mercado = bookmaker.markets.find(market => market.key === 'h2h');
            const oddsHome = mercado.outcomes.find(outcome => outcome.name === evento.home_team).price;
            const oddsAway = mercado.outcomes.find(outcome => outcome.name === evento.away_team).price;
            const oddsDraw = mercado.outcomes.find(outcome => outcome.name === 'Draw').price;

            const probabilidadeImplicitaHome = calcularProbabilidadeImplicita(oddsHome) * 100;
            const probabilidadeImplicitaAway = calcularProbabilidadeImplicita(oddsAway) * 100;
            const probabilidadeImplicitaDraw = calcularProbabilidadeImplicita(oddsDraw) * 100;

            const probabilidadeRealHome = (probabilidadesReais[evento.home_team]?.winRate || probabilidadeImplicitaHome / 100) * 100;
            const probabilidadeRealAway = (probabilidadesReais[evento.away_team]?.winRate || probabilidadeImplicitaAway / 100) * 100;
            const probabilidadeRealDraw = (probabilidadesReais[evento.home_team]?.drawRate || probabilidadeImplicitaDraw / 100) * 100;

            // Se a probabilidade do empate for zero, usamos a probabilidade implícita.
            const probabilidadeFinalDraw = probabilidadeRealDraw === 0 ? probabilidadeImplicitaDraw : probabilidadeRealDraw;

            const overvalueHome = calcularOvervalue(probabilidadeRealHome, oddsHome);
            const overvalueAway = calcularOvervalue(probabilidadeRealAway, oddsAway);
            const overvalueDraw = calcularOvervalue(probabilidadeFinalDraw, oddsDraw);

            const roiHome = calcularROI(probabilidadeRealHome, oddsHome);
            const roiAway = calcularROI(probabilidadeRealAway, oddsAway);
            const roiDraw = calcularROI(probabilidadeFinalDraw, oddsDraw);

            const maiorProbabilidadeAtual = Math.max(probabilidadeRealHome, probabilidadeRealAway, probabilidadeFinalDraw);

            const eventoAtual = {
              home_team: evento.home_team,
              away_team: evento.away_team,
              oddsHome,
              oddsAway,
              oddsDraw,
              bookmaker,
              probabilidadeRealHome,
              probabilidadeRealAway,
              probabilidadeFinalDraw,
              probabilidadeImplicitaHome,
              probabilidadeImplicitaAway,
              probabilidadeImplicitaDraw,
              overvalueHome,
              overvalueAway,
              overvalueDraw,
              roiHome,
              roiAway,
              roiDraw
            };

            if (maiorProbabilidadeAtual > maiorProbabilidade) {
              if (melhorEvento) {
                outrasOpcoes.push(melhorEvento);
              }
              maiorProbabilidade = maiorProbabilidadeAtual;
              melhorEvento = eventoAtual;
            } else {
              outrasOpcoes.push(eventoAtual);
            }
          }
        }
      });

      if (melhorEvento) {
        const melhorOpcao = {
          time: '',
          probabilidade: 0,
          odds: 0,
          overvalue: 0,
          roi: 0
        };
        if (melhorEvento.probabilidadeRealHome >= melhorEvento.probabilidadeRealAway && melhorEvento.probabilidadeRealHome >= melhorEvento.probabilidadeFinalDraw) {
          melhorOpcao.time = `Vitória ${melhorEvento.home_team}`;
          melhorOpcao.probabilidade = melhorEvento.probabilidadeRealHome;
          melhorOpcao.odds = melhorEvento.oddsHome;
          melhorOpcao.overvalue = melhorEvento.overvalueHome;
          melhorOpcao.roi = melhorEvento.roiHome;
        } else if (melhorEvento.probabilidadeRealAway > melhorEvento.probabilidadeRealHome && melhorEvento.probabilidadeRealAway >= melhorEvento.probabilidadeFinalDraw) {
          melhorOpcao.time = `Vitória ${melhorEvento.away_team}`;
          melhorOpcao.probabilidade = melhorEvento.probabilidadeRealAway;
          melhorOpcao.odds = melhorEvento.oddsAway;
          melhorOpcao.overvalue = melhorEvento.overvalueAway;
          melhorOpcao.roi = melhorEvento.roiAway;
        } else {
          melhorOpcao.time = 'Empate';
          melhorOpcao.probabilidade = melhorEvento.probabilidadeFinalDraw;
          melhorOpcao.odds = melhorEvento.oddsDraw;
          melhorOpcao.overvalue = melhorEvento.overvalueDraw;
          melhorOpcao.roi = melhorEvento.roiDraw;
        }

        mensagem += `👉 ${melhorOpcao.time}: ${melhorOpcao.odds} (Probabilidade Real: ${melhorOpcao.probabilidade.toFixed(2)}%, Overvalue: ${melhorOpcao.overvalue.toFixed(2)}, ROI: ${melhorOpcao.roi.toFixed(2)}%)\n\n`;

        outrasOpcoes = outrasOpcoes.filter(evento => evento.home_team !== melhorEvento.home_team && evento.away_team !== melhorEvento.away_team);
        outrasOpcoes.forEach((evento, index) => {
          const outraOpcao = {
            time: '',
            probabilidade: 0,
            odds: 0,
            overvalue: 0,
            roi: 0
          };
          if (evento.probabilidadeRealHome >= evento.probabilidadeRealAway && evento.probabilidadeRealHome >= evento.probabilidadeFinalDraw) {
            outraOpcao.time = `Vitória ${evento.home_team}`;
            outraOpcao.probabilidade = evento.probabilidadeRealHome;
            outraOpcao.odds = evento.oddsHome;
            outraOpcao.overvalue = evento.overvalueHome;
            outraOpcao.roi = evento.roiHome;
          } else if (evento.probabilidadeRealAway > evento.probabilidadeRealHome && evento.probabilidadeRealAway >= evento.probabilidadeFinalDraw) {
            outraOpcao.time = `Vitória ${evento.away_team}`;
            outraOpcao.probabilidade = evento.probabilidadeRealAway;
            outraOpcao.odds = evento.oddsAway;
            outraOpcao.overvalue = evento.overvalueAway;
            outraOpcao.roi = evento.roiAway;
          } else {
            outraOpcao.time = 'Empate';
            outraOpcao.probabilidade = evento.probabilidadeFinalDraw;
            outraOpcao.odds = evento.oddsDraw;
            outraOpcao.overvalue = evento.overvalueDraw;
            outraOpcao.roi = evento.roiDraw;
          }

          mensagem += `${index + 1}. ${evento.home_team} vs ${evento.away_team}\n`;
          mensagem += `  - ${outraOpcao.time}: ${outraOpcao.odds} (Probabilidade Real: ${outraOpcao.probabilidade.toFixed(2)}%, Overvalue: ${outraOpcao.overvalue.toFixed(2)}, ROI: ${outraOpcao.roi.toFixed(2)}%)\n\n`;
          });
  
          const mensagens = dividirMensagem(mensagem);
          for (const mensagem of mensagens) {
            await bot.sendMessage(chatId, mensagem, { parse_mode: 'Markdown' });
          }
        } else {
          bot.sendMessage(chatId, 'Não há odds disponíveis no momento.');
        }
      } else {
        bot.sendMessage(chatId, 'Não há odds disponíveis no momento.');
      }
    } catch (error) {
      bot.sendMessage(chatId, 'Erro ao buscar dados de odds.');
    }
  }
  
  module.exports = oddsCommand;
  