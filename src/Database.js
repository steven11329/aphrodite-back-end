import { Client, Pool } from 'pg';
import Cursor from 'pg-cursor';
import dotenv from 'dotenv';
import { differenceInCalendarDays } from 'date-fns';

dotenv.config();

class Database {
  constructor() {
    this.client = new Client({
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
    this.pool = new Pool({
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectionTimeoutMillis: 2000,
    });
  }

  /**
   *
   * @param {{
   * platformId: string,
   * title: string,
   * link: String,
   * likeOfReply: number,
   * unlikeOfReply: number,
   * totalOfReply: number,
   * popularityIndex: number,
   * weightedPopularityIndex: number,
   * imageUrlList: Array<string>,
   * createDate: Date
   * }} param0
   */
  async upsertPost({
    platformId,
    title,
    link,
    likeOfReply,
    unlikeOfReply,
    totalOfReply,
    popularityIndex,
    weightedPopularityIndex,
    imageUrlList,
    createDate,
  }) {
    const sql = `INSERT INTO post(platform_id, title, link, like_of_reply, unlike_of_reply, 
      total_of_reply, popularity_index, weighted_popularity_index, image_url_list, create_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (link)
      DO UPDATE
      SET
      title = $2,
      like_of_reply = $4,
      unlike_of_reply = $5,
      total_of_reply = $6,
      image_url_list = $9,
      create_date = $10
    ;`;
    return this.client.query(sql, [
      platformId,
      title,
      link,
      likeOfReply,
      unlikeOfReply,
      totalOfReply,
      popularityIndex,
      weightedPopularityIndex,
      imageUrlList,
      createDate,
    ]);
  }

  /**
   *
   * @param {{
   * platformId: string,
   * title: string,
   * link: String,
   * likeOfReply: number,
   * unlikeOfReply: number,
   * totalOfReply: number,
   * imageUrlList: Array<string>,
   * * createDate: Date
   * }} param0
   */
  async upsertPostWithoutPopularityIndex({
    platformId,
    title,
    link,
    likeOfReply,
    unlikeOfReply,
    totalOfReply,
    imageUrlList,
    createDate,
  }) {
    return this.upsertPost({
      platformId,
      title,
      link,
      likeOfReply,
      unlikeOfReply,
      totalOfReply,
      popularityIndex: 0,
      weightedPopularityIndex: 0,
      imageUrlList,
      createDate,
    });
  }

  async getPosts(skip = 0) {
    const client = await this.pool.connect();
    const result = client.query(
      `SELECT id, title, image_url_list[1] AS "coverImage", create_date AS "createDate" FROM post 
      WHERE available IS NULL OR available != false
      ORDER BY weighted_popularity_index DESC, create_date DESC
      OFFSET ${skip} ROWS
      FETCH FIRST 20 ROWS ONLY;`
    );
    client.release();
    return result;
  }

  async getPost(id) {
    const sql =
      'SELECT title, link, image_url_list AS "imageUrlList", create_date AS "createDate" FROM post WHERE id = $1;';
    const client = await this.pool.connect();
    const result = await client.query(sql, [id]);
    client.release();
    return result;
  }

  async updateAllOfReply(platformId) {
    const sql = `UPDATE platform SET all_of_reply = sub.sum FROM
    (SELECT SUM(total_of_reply) FROM post WHERE platform_id = $1) AS sub;`;
    return this.client.query(sql, [platformId]);
  }

  async updateAvgOfScore(platformId) {
    let sql = `SELECT AVG(sub.score) FROM (
      SELECT ((like_of_reply - unlike_of_reply) * 1000 / total_of_reply) AS score
      FROM post
      WHERE total_of_reply > 0 AND platform_id = $1) AS sub;`;
    const result = await this.client.query(sql, [platformId]);
    sql = `UPDATE platform SET avg_of_score = $1 WHERE id = $2;`;
    await this.client.query(sql, [
      parseInt(result.rows[0].avg, 10),
      platformId,
    ]);
  }

  async updatePopularityIndex(platformId) {
    const queryClient = await this.pool.connect();
    const updateClient = await this.pool.connect();
    const getPlatformSql = `SELECT all_of_reply AS "c", avg_of_score AS "m" FROM platform WHERE id = $1;`;
    const platform = await queryClient.query(getPlatformSql, [platformId]);
    const { c, m } = platform.rows[0];
    const cursor = await queryClient.query(
      new Cursor(
        'SELECT id, title, (like_of_reply - unlike_of_reply) AS sum, total_of_reply AS n, create_date AS "createDate" FROM post WHERE platform_id = $1',
        [platformId]
      )
    );

    const now = new Date();
    function update() {
      return new Promise((resolve, reject) => {
        function read() {
          cursor.read(1, async (error, rows) => {
            if (error) {
              reject(error);
            }
            if (rows.length > 0) {
              try {
                for (const data of rows) {
                  const pi = (c * m + data.sum * 1000) / (c + data.n);
                  const wpi =
                    (pi - m) *
                    1000 *
                    0.98 ** differenceInCalendarDays(now, data.createDate);
                  await updateClient.query(
                    `UPDATE post SET popularity_index = $1, weighted_popularity_index = $2 WHERE id = $3;`,
                    [Math.floor(pi), Math.floor(wpi), data.id]
                  );
                }
                read();
              } catch (error) {
                cursor.close(() => {
                  queryClient.release();
                  updateClient.release();
                  reject(error);
                });
              }
            } else {
              cursor.close(() => {
                queryClient.release();
                updateClient.release();
                resolve();
              });
            }
          });
        }

        read();
      });
    }

    await update();
  }

  /**
   * Update table post available
   * @param {string} link
   * @param {boolean} bool
   * @returns
   */
  async updateLinkAvailable(link, bool) {
    if (typeof link !== 'string') throw new Error('link is not string');
    if (typeof bool !== 'boolean') throw new Error('bool is not boolean');
    return this.client.query(
      `UPDATE post SET available = $1 WHERE link = $2;`,
      [bool, link]
    );
  }

  async deletePost(id) {
    return this.client.query(`DELETE FROM post WHERE id = ${id};`);
  }

  async connect() {
    return this.client.connect();
  }

  async end() {
    return Promise.all([this.pool.end(), this.client.end()]);
  }

  async getPostsCursor(platformId) {
    const client = await this.pool.connect();
    const sql = `
      SELECT title, link FROM post
      WHERE platform_id = $1 AND available IS NULL OR available != false
      ORDER BY create_date DESC
      FETCH FIRST 120 ROWS ONLY;
    `;
    const cursor = client.query(new Cursor(sql, [platformId]));

    function close() {
      cursor.close(() => {
        client.release();
      });
    }

    return {
      cursor,
      close,
    };
  }

  async updateLastUpdate(platformId) {
    const sql = `UPDATE platform SET last_update = $2 WHERE id = $1;`;
    return this.client.query(sql, [platformId, new Date()]);
  }

  async getLastUpdate(platformId) {
    const sql = `SELECT last_update AS "lastUpdate" FROM platform WHERE id = $1`;
    return this.client.query(sql, [platformId]);
  }
}

export default Database;
