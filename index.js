const TelegramBot = require('node-telegram-bot-api');
const { token } = require('./config/config');
const { handleStartCommand } = require('./commands/start');
const { handleGroupIdCommand } = require('./commands/groupid');
const { handleHelpCommand } = require('./commands/help');
const { handleOddsCommand } = require('./commands/odds');

const bot = new TelegramBot(token, { polling: true });

console.log('Bot está funcionando...');

bot.on('polling_error', (error) => {
  console.error('Erro de polling:', error.code);
});

bot.onText(/\/start/, (msg) => handleStartCommand(bot, msg));

bot.onText(/\/groupid/, (msg) => handleGroupIdCommand(bot, msg));

bot.onText(/\/help/, (msg) => handleHelpCommand(bot, msg));

bot.onText(/\/odds/, (msg) => handleOddsCommand(bot, msg));
