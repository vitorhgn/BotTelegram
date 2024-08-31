require('dotenv').config();

module.exports = {
  token: process.env.TELEGRAM_BOT_TOKEN,
  apiToken: process.env.ODDS_API_TOKEN,
  apiFootballToken: process.env.API_FOOTBALL_TOKEN,
};
