const TelegramBot = require('node-telegram-bot-api');
const { token } = require('./config/config');
const startCommand = require('./commands/start');
const helpCommand = require('./commands/help');
const oddsCommand = require('./commands/odds');
const groupIdCommand = require('./commands/groupid');

const bot = new TelegramBot(token, { polling: true });

console.log('Bot está funcionando...');

bot.on('polling_error', (error) => {
  console.error('Erro de polling:', error.code);
});

bot.onText(/\/start/, (msg) => startCommand(bot, msg));
bot.onText(/\/help/, (msg) => helpCommand(bot, msg));
bot.onText(/\/odds/, (msg) => oddsCommand(bot, msg));
bot.onText(/\/groupid/, (msg) => groupIdCommand(bot, msg));
