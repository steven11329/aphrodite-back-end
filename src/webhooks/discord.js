import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const id = process.env.DISCORD_WEBHOOK_ID;
const token = process.env.DISCORD_WHBHOOK_TOKEN;

export async function send(message) {
  return fetch(`https://discord.com/api/webhooks/${id}/${token}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ content: message }),
  });
}

export default {
  send,
};
