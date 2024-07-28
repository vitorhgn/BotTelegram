module.exports = (bot, msg) => {
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
  };
  