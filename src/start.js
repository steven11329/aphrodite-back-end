import dotenv from 'dotenv';
import PTTCrawler from './PTTCrawler';
import { send } from './webhooks/discord';

dotenv.config();

async function run() {
  try {
    const pttCrawler = new PTTCrawler();
    await pttCrawler.request('/bbs/Beauty/index.html');
    await pttCrawler.crawl();
    await pttCrawler.disableUnlinkedPost();
  } catch (error) {
    send(`[Crawler] error: ${error.message}`);
  }
}

run();
