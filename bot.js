const TelegramBot = require('node-telegram-bot-api');
const { buscarDadosApostas } = require('./bets');
require('dotenv').config();

// Token do bot fornecido pelo BotFather
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

console.log('Bot está funcionando...');

// Tratamento de erros de polling
bot.on('polling_error', (error) => {
  console.error('Erro de polling:', error.code);  // => 'EFATAL'
});

// Função para filtrar e formatar as melhores apostas
function filtrarMelhoresApostas(records, limite = 5) {
  const melhoresApostas = records
    .filter(record => record.prongs.some(prong => prong.probability > 0 && prong.overvalue > 1))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, limite);

  let mensagem = '*Melhores apostas do Campeonato Brasileiro:*\n\n';
  melhoresApostas.forEach(record => {
    record.prongs.forEach(prong => {
      const teams = prong.teams;
      const valor = prong.value;
      const probabilidade = prong.probability ? prong.probability * 100 : 0;
      const overvalue = prong.overvalue ? prong.overvalue : 0;
      const roi = record.roi ? record.roi : 0;

      if (probabilidade > 0 && overvalue > 1) {
        mensagem += `*${teams[0]} vs ${teams[1]}*\n`;
        mensagem += `Odd: \`${valor}\`\n`;
        mensagem += `Probabilidade: \`${probabilidade.toFixed(2)}%\`\n`;
        mensagem += `Overvalue: \`${overvalue.toFixed(2)}\`\n`;
        mensagem += `ROI: \`${roi.toFixed(2)}%\`\n`;
        
        // Determine which team to bet on
        const recommendedTeam = probabilidade > 50 ? teams[0] : teams[1];
        mensagem += `Recomendação: Aposte em *${recommendedTeam}* com base nos indicadores acima.\n\n`;
      }
    });
  });

  return mensagem;
}

// Comando para obter dados de apostas
bot.onText(/\/apostas/, async (msg) => {
  const chatId = msg.chat.id;
  const tournamentId = '1268397';  // ID do Campeonato Brasileiro Série A
  const limit = 25;
  const page = 1;

  try {
    const dados = await buscarDadosApostas(tournamentId, limit, page);
    if (dados.records && dados.records.length > 0) {
      const mensagem = filtrarMelhoresApostas(dados.records);
      bot.sendMessage(chatId, mensagem, { parse_mode: 'Markdown' });
    } else {
      bot.sendMessage(chatId, 'Não há jogos disponíveis no momento.');
    }
  } catch (error) {
    bot.sendMessage(chatId, 'Erro ao buscar dados de apostas.');
  }
});

// Comando para iniciar o bot
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Bot iniciado! Use /apostas para ver os próximos jogos de apostas.')
    .then(() => {
      console.log(`Mensagem de start enviada para o chat ID: ${chatId}`);
    })
    .catch((error) => {
      console.error(`Erro ao enviar mensagem de start para o chat ID: ${chatId}`, error);
    });
});

// Comando para obter o ID do grupo
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

// Comando para exibir uma mensagem de ajuda
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
*Aqui estão os comandos disponíveis:*
/start - Iniciar o bot
/groupid - Obter o ID do grupo
/help - Exibir esta mensagem de ajuda
/apostas - Ver os próximos jogos de apostas
  `;
  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' })
    .then(() => {
      console.log(`Mensagem de ajuda enviada para o chat ID: ${chatId}`);
    })
    .catch((error) => {
      console.error(`Erro ao enviar mensagem de ajuda para o chat ID: ${chatId}`, error);
    });
});
