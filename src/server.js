import dotenv from 'dotenv';
import App from './App';
import Database from './Database';
import { serverLogger as logger } from './util/logger';

dotenv.config();

async function start() {
  const db = new Database();
  const app = new App(db);

  await db.connect();
  const fastify = app.getFastifyInstance();

  fastify.listen(process.env.PORT, process.env.IP, async error => {
    if (error) {
      logger.error(error);
      process.exit(1);
    }
    logger.info('Server Started');
  });
}

start();
