import App from './App';
import Database from './Database';
import { serverLogger as logger } from './util/logger';

async function start() {
  const db = new Database;
  const app = new App(db);

  await db.connect();
  const fastify = app.getFastifyInstance();
  
  fastify.listen(8080, async error => {
    if (error) {
      logger.error(error);
      process.exit(1);
    }
    logger.info('Server Started');
  });
}

start();