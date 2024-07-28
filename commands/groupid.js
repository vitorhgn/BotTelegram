module.exports = {
    handleGroupIdCommand: (bot, msg) => {
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
    }
  };
  