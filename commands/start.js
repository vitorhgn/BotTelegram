module.exports = (bot, msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Bot iniciado! Use /odds para ver as melhores odds de futebol do Brasileirão Série A.')
      .then(() => {
        console.log(`Mensagem de start enviada para o chat ID: ${chatId}`);
      })
      .catch((error) => {
        console.error(`Erro ao enviar mensagem de start para o chat ID: ${chatId}`, error);
      });
  };
  