const axios = require('axios');
require('dotenv').config();

const apiToken = process.env.ODDS_API_TOKEN;
const selectedBookmaker = 'bovada'; // Utilizando Bovada como a casa de apostas selecionada

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

        const melhoresOdds = [
          { resultado: `Vitória ${evento.home_team}`, odds: oddsHome, probabilidade: probabilidadeHome, overvalue: overvalueHome, roi: roiHome, emoji: '' },
          { resultado: `Vitória ${evento.away_team}`, odds: oddsAway, probabilidade: probabilidadeAway, overvalue: overvalueAway, roi: roiAway, emoji: '' },
          { resultado: `Empate`, odds: oddsDraw, probabilidade: probabilidadeDraw, overvalue: overvalueDraw, roi: roiDraw, emoji: '' }
        ];

        const melhorOpcao = melhoresOdds.reduce((prev, current) => (prev.roi > current.roi) ? prev : current);

        melhoresOdds.forEach(opcao => {
          opcao.emoji = opcao === melhorOpcao ? '✔️' : '❌';
        });

        melhoresOdds.forEach(opcao => {
          mensagem += `${opcao.emoji} ${opcao.resultado}: \`${opcao.odds}\` (Casa: ${bookmaker.title}, Probabilidade: ${opcao.probabilidade.toFixed(2)}%, Overvalue: ${opcao.overvalue.toFixed(2)}, ROI: ${opcao.roi.toFixed(2)}%)\n`;
        });

        mensagem += '\n';
      }
    }
  });

  return dividirMensagem(mensagem);
}

const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

console.log('Bot está funcionando...');

bot.on('polling_error', (error) => {
  console.error('Erro de polling:', error.code);
});

bot.onText(/\/odds/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const odds = await buscarOdds();
    const probabilidadeReal = {
      "Juventude": 0.45,
      "Criciuma": 0.35,
      "Draw": 0.20,
      "Palmeiras": 0.70,
      "Vitoria": 0.15,
      "Bahia": 0.45,
      "Internacional": 0.30,
      "Botafogo": 0.55,
      "Cruzeiro": 0.25,
      "Fortaleza": 0.40,
      "Sao Paulo": 0.35,
      "Bragantino-SP": 0.40,
      "Fluminense": 0.30,
      "Flamengo": 0.70,
      "Atletico Goianiense": 0.15,
      "Atletico Mineiro": 0.60,
      "Corinthians": 0.25,
      "Cuiabá": 0.35,
      "Atletico Paranaense": 0.35,
      "Grêmio": 0.40,
      "Vasco da Gama": 0.30,
    };
    if (odds && odds.length > 0) {
      const mensagens = formatarOdds(odds, probabilidadeReal);
      for (const mensagem of mensagens) {
        await bot.sendMessage(chatId, mensagem, { parse_mode: 'Markdown' });
      }
    } else {
      bot.sendMessage(chatId, 'Não há odds disponíveis no momento.');
    }
  } catch (error) {
    bot.sendMessage(chatId, 'Erro ao buscar dados de odds.');
  }
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Bot iniciado! Use /odds para ver as melhores odds de futebol do Brasileirão Série A.')
    .then(() => {
      console.log(`Mensagem de start enviada para o chat ID: ${chatId}`);
    })
    .catch((error) => {
      console.error(`Erro ao enviar mensagem de start para o chat ID: ${chatId}`, error);
    });
});

bot.onText(/\/groupid/, (msg) => {
  const chatId = msg.chat.id;
  const chatType = msg.chat.type;
  if (chatType === 'group' || chatType === 'supergroup') {
    bot.sendMessage(chatId, `O ID deste grupo é: \`${chatId}\``, { parse_mode: 'Markdown' })
      .then(() => {
        console.log(`ID do grupo enviado para o grupo ID: ${chatId}`);
      })
      .catch((error) => {
        console.error(`Erro ao enviar ID do grupo para o grupo ID: ${chatId}`, error);
      });
  } else {
    bot.sendMessage(chatId, 'Por favor, adicione este bot a um grupo para obter o ID do grupo.');
  }
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
*Aqui estão os comandos disponíveis:*
/start - Iniciar o bot
/groupid - Obter o ID do grupo
/help - Exibir esta mensagem de ajuda
/odds - Ver as melhores odds de futebol do Brasileirão Série A
  `;
  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' })
    .then(() => {
      console.log(`Mensagem de ajuda enviada para o chat ID: ${chatId}`);
    })
    .catch((error) => {
      console.error(`Erro ao enviar mensagem de ajuda para o chat ID: ${chatId}`, error);
    });
});
