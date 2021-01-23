const webhook = require('webhook-discord');
const { DISCORD_MESSAGE_TYPES } = require('../constraints');

const Hook = new webhook.Webhook(process.env.DISCORD_URL);

async function sendMessageToDiscord({ messageType, message }) {
  switch (messageType) {
  case DISCORD_MESSAGE_TYPES.SUCCESS:
    Hook.success('Discord Bot | Success😎', message);
    break;
  case DISCORD_MESSAGE_TYPES.WARN:
    Hook.warn('Discord Bot | Warn🤔', message);
    break;
  case DISCORD_MESSAGE_TYPES.ERROR:
    Hook.err('Discord Bot | Error🙄', message);
    break;
  case DISCORD_MESSAGE_TYPES.INFO:
    Hook.info('Discord Bot | Info🤓', message);
    break;
  default:
    break;
  }
}
module.exports = {
  sendMessageToDiscord,
};
