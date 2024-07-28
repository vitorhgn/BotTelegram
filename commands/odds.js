const { buscarOdds, formatarOdds } = require('../services/odds');
const probabilidadeReal = require('../data/probabilidadeReal.json');

module.exports = {
  handleOddsCommand: async (bot, msg) => {
    const chatId = msg.chat.id;

    try {
      const odds = await buscarOdds();
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
  }
};
