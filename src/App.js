import fs from 'fs';
import fastify from 'fastify';
import dotenv from 'dotenv';
import path from 'path';
import fastifyStatic from 'fastify-static';
import fastifyCompress from 'fastify-compress';

dotenv.config();

const httpsOptions =
  process.env.HTTPS === 'true'
    ? {
        key: fs.readFileSync(path.join(__dirname, '../cert/server.key')),
        cert: fs.readFileSync(path.join(__dirname, '../cert/server.cert')),
      }
    : undefined;
export default class App {
  /**
   *
   * @param {import('./Database').default} db
   */
  constructor(db) {
    this.db = db;
    this.app = fastify({
      http2: process.env.HTTPS === 'true',
      https: httpsOptions,
    });
    this.app.register(fastifyCompress, {
      encodings: ['gzip', 'deflate', 'br'],
    });
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
      }
    });

    this.app.get('/platform/:id/last-update', async (request, reply) => {
      const { id } = request.params;
      try {
        if (id) {
          const result = await this.db.getLastUpdate(id);
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
    await this.db.end();
    await this.app.close();
  }
}
