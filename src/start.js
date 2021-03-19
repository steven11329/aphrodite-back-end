/* eslint-disable no-unused-vars */
import dotenv from 'dotenv';
import PTTCrawler from './PTTCrawler';
import Database from './Database';
import logger from './util/logger';

dotenv.config();

async function run() {
  try {
    const pttCrawler = new PTTCrawler();
    await pttCrawler.request('/bbs/Beauty/index.html');
    await pttCrawler.crawl();
  } catch (error) {
    logger.error(error);
  }
}

async function runDB() {
  const db = new Database();
  try {
    await db.connect();
    await db.updatePopularityIndex(1);
  } catch (error) {
    logger.error(error);
  } finally {
    db.end();
  }
}

run();
// runDB();
