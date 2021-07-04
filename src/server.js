import dotenv from 'dotenv';
import App from './App';
import Database from './Database';
import { send } from './webhooks/discord';

dotenv.config();

async function start() {
  const db = new Database();
  const app = new App(db);

  await db.connect();
  const fastify = app.getFastifyInstance();

  fastify.listen(process.env.PORT, process.env.IP, async error => {
    if (error) {
      send(`[Server] error: ${error.message}`);
      process.exit(1);
    }
  });
}

start();
