const axios = require('axios');
const { apiToken } = require('../config/config');
const { calcularProbabilidadeImplicita, dividirMensagem } = require('../utils/oddsUtils');
const { TeamStats } = require('../models');

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

async function obterProbabilidadesReais() {
  const teams = await TeamStats.findAll();
  const probabilidadesReais = {};
  teams.forEach(team => {
    probabilidadesReais[team.teamName] = {
      winRate: team.wins / team.games,
      drawRate: 1 - (team.wins / team.games)
    };
  });
  return probabilidadesReais;
}

async function oddsCommand(bot, msg) {
  const chatId = msg.chat.id;

  try {
    const odds = await buscarOdds();
    const probabilidadesReais = await obterProbabilidadesReais();

    if (odds && odds.length > 0) {
      let mensagem = '*Melhores Odds de Futebol do Brasileirão Série A:*\n\n';
      let melhorEvento = null;
      let maiorProbabilidade = 0;
      const eventos = [];

      // Encontrar o próximo dia com jogos
      const hoje = new Date();
      const proximosEventos = odds.filter(evento => {
        const dataEvento = new Date(evento.commence_time);
        return dataEvento > hoje;
      }).sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time));

      const proximoDia = proximosEventos.length > 0 ? new Date(proximosEventos[0].commence_time).toISOString().split('T')[0] : null;

      // Filtrar os jogos do próximo dia
      proximosEventos.forEach(evento => {
        const dataEventoStr = new Date(evento.commence_time).toISOString().split('T')[0];

        if (dataEventoStr === proximoDia) {
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
            const probabilidadeRealDraw = (probabilidadeRealHome && probabilidadeRealAway) ? (1 - (probabilidadeRealHome / 100 + probabilidadeRealAway / 100)) * 100 : probabilidadeImplicitaDraw;

            eventos.push({
              home_team: evento.home_team,
              away_team: evento.away_team,
              oddsHome,
              oddsAway,
              oddsDraw,
              bookmaker,
              probabilidadeRealHome,
              probabilidadeRealAway,
              probabilidadeRealDraw,
              probabilidadeImplicitaHome,
              probabilidadeImplicitaAway,
              probabilidadeImplicitaDraw
            });
          }
        }
      });

      // Ordenar eventos pela maior probabilidade
      eventos.sort((a, b) => Math.max(b.probabilidadeRealHome, b.probabilidadeRealAway, b.probabilidadeRealDraw) - Math.max(a.probabilidadeRealHome, a.probabilidadeRealAway, a.probabilidadeRealDraw));

      // Garantir que o melhor evento não seja duplicado na lista de opções
      melhorEvento = eventos[0];
      maiorProbabilidade = Math.max(melhorEvento.probabilidadeRealHome, melhorEvento.probabilidadeRealAway, melhorEvento.probabilidadeRealDraw);
      let melhorAposta = '';

      if (maiorProbabilidade === melhorEvento.probabilidadeRealHome) {
        melhorAposta = `👉 *Vitória ${melhorEvento.home_team}*: ${melhorEvento.oddsHome} (Probabilidade Real: ${melhorEvento.probabilidadeRealHome.toFixed(2)}%)\n\n`;
      } else if (maiorProbabilidade === melhorEvento.probabilidadeRealAway) {
        melhorAposta = `👉 *Vitória ${melhorEvento.away_team}*: ${melhorEvento.oddsAway} (Probabilidade Real: ${melhorEvento.probabilidadeRealAway.toFixed(2)}%)\n\n`;
      } else {
        melhorAposta = `👉 *Empate*: ${melhorEvento.oddsDraw} (Probabilidade Real: ${melhorEvento.probabilidadeRealDraw.toFixed(2)}%)\n\n`;
      }

      mensagem += `*${melhorEvento.home_team} vs ${melhorEvento.away_team}*\n`;
      mensagem += melhorAposta;

      // Adicionar as outras opções excluindo o melhor evento
      eventos.slice(1, 4).forEach((evento, index) => {
        if (evento.home_team !== melhorEvento.home_team || evento.away_team !== melhorEvento.away_team) {
          mensagem += `${index + 1}. *${evento.home_team} vs ${evento.away_team}*\n`;
          if (evento.probabilidadeRealHome > evento.probabilidadeRealAway && evento.probabilidadeRealHome > evento.probabilidadeRealDraw) {
            mensagem += `  - *Vitória ${evento.home_team}*: ${evento.oddsHome} (Probabilidade Real: ${evento.probabilidadeRealHome.toFixed(2)}%)\n`;
          } else if (evento.probabilidadeRealAway > evento.probabilidadeRealHome && evento.probabilidadeRealAway > evento.probabilidadeRealDraw) {
            mensagem += `  - *Vitória ${evento.away_team}*: ${evento.oddsAway} (Probabilidade Real: ${evento.probabilidadeRealAway.toFixed(2)}%)\n`;
          } else {
            mensagem += `  - *Empate*: ${evento.oddsDraw} (Probabilidade Real: ${evento.probabilidadeRealDraw.toFixed(2)}%)\n`;
          }
          mensagem += `\n`;
        }
      });

      const mensagens = dividirMensagem(mensagem);
      for (const mensagem of mensagens) {
        await bot.sendMessage(chatId, mensagem, { parse_mode: 'Markdown' });
      }
    } else {
      bot.sendMessage(chatId, 'Não há odds disponíveis no momento.');
    }
  } catch (error) {
    bot.sendMessage(chatId, 'Erro ao buscar dados de odds.');
  }
}

module.exports = oddsCommand;
