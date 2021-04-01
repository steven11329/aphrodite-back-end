import fastify from 'fastify';
import path from 'path';
import fastifyStatic from 'fastify-static';

import { serverLogger as logger } from './util/logger';

export default class App {
  constructor(db) {
    this.db = db;
    this.app = fastify();
    this.app.register(fastifyStatic, {
      root: path.join(__dirname, '../build'),
    });

    this.app.get('/posts', async (request, reply) => {
      const { skip } = request.query;
      try {
        const result = await this.db.getPosts(skip);
        reply.send({ rows: result.rows });
      } catch (error) {
        reply.code(404).send({
          message: error.message,
        });
        logger.error(error);
      }
    });

    this.app.get('/post/:id', async (request, reply) => {
      const { id } = request.params;
      try {
        if (id) {
          const result = await db.getPost(id);
          if (result.rowCount === 1) {
            reply.send(result.rows[0]);
          } else {
            reply.code(404).send({
              message: `id=${id} not found`,
            });
          }
        }
      } catch (error) {
        reply.code(404).send({
          message: error.message,
        });
        logger.error(error);
      }
    });

    process.stdin.on('readable', async () => {
      const input = process.stdin.read();
      const inputString = input.toString('utf-8').trim();

      if (input !== null && inputString === 'exit') {
        await this.close();
      }
    });
  }

  getFastifyInstance() {
    return this.app;
  }

  async close() {
    logger.info('Disconnect Database');
    await this.db.end();
    await this.app.close();
    logger.info('Server Stop');
  }
}
