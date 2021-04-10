import https from 'https';
import { parse as dateParse, addHours } from 'date-fns';
import fs from 'fs';
import { parse } from 'node-html-parser';
import dotenv from 'dotenv';
import Crawler from './Crawler';
import delay from './util/delay';
import Database from './Database';
import logger from './util/logger';

dotenv.config();

export default class PTTCrawler extends Crawler {
  constructor() {
    super();
    this.hostname = 'www.ptt.cc';
    this.cookies = ['over18=1'];
  }

  async crawl() {
    /**
     * @type {Map<string, {
     * link: string,
     * title: string,
     * like: number,
     * unlike: number,
     * total: number,
     * createDate: Date,
     * imagesUrl: Array<string>
     * }}
     */
    const posts = new Map();
    const links = this.expandPreviousPageLinks(process.env.PTT_SCAN_PAGES);
    const pages = [this.rootHtmlElement];

    logger.info(`Request links`);
    for (let pageIndex = 0; pageIndex < links.length; pageIndex += 1) {
      await delay(500 * (pageIndex + 1));
      try {
        await this.request(links[pageIndex]);
        pages.push(this.rootHtmlElement);
      } catch (error) {
        logger.error(error);
      }
    }

    pages.forEach(htmlElement => {
      htmlElement.querySelectorAll('div.r-ent').forEach(post => {
        try {
          const titleDiv = post.querySelector('.title > a');
          const link = titleDiv.getAttribute('href');

          posts.set(link, { link: `${this.hostname}${link}` });
        } catch (error) {}
      });
    });

    await Promise.all(
      Array.from(posts.keys()).map(
        (key, index) =>
          new Promise(resolve => {
            delay((index + 1) * 500)
              .then(() => {
                logger.info(`request ${key}`);
                return this.crawlByUrl(key);
              })
              .then(result => {
                posts.set(key, { link: posts.get(key).link, ...result });
                resolve(result);
              });
          })
      )
    );

    const db = new Database();
    await db.connect();
    const postsIterator = posts.values();

    let post = postsIterator.next();

    logger.info('Upsert posts');
    while (!post.done) {
      if (/\[正妹|帥哥|神人\]/.test(post.value.title)) {
        try {
          await db.upsertPostWithoutPopularityIndex({
            platformId: process.env.PTT_PLATFORM_ID,
            title: post.value.title,
            link: post.value.link,
            likeOfReply: post.value.like,
            unlikeOfReply: post.value.unlike,
            totalOfReply: post.value.total,
            imageUrlList: post.value.imagesUrl,
            createDate: post.value.createDate,
          });
        } catch (error) {
          logger.error(error);
        }
      }
      post = postsIterator.next();
    }

    logger.info(`Update al_of_reply`);
    await db.updateAllOfReply(1);
    logger.info(`Update avg_of_score`);
    await db.updateAvgOfScore(1);
    logger.info(`Update popularity_index and weighted_popularity_index`);
    await db.updatePopularityIndex(1);
    await db.end();
  }

  async crawlByUrl(url) {
    await this.request(url);

    return {
      ...this.crawlHeader(),
      imagesUrl: this.crawlImage(),
      ...this.countReply(),
    };
  }

  crawlHeader() {
    let title = '';
    let createDate = null;

    this.rootHtmlElement
      .querySelectorAll(
        '#main-content > .article-metaline > .article-meta-value'
      )
      .forEach((content, i) => {
        if (i === 1) title = content.text;
        if (i === 2)
          createDate = addHours(
            dateParse(
              content.text.replace('  ', ' '),
              'EEE MMM d HH:mm:ss yyyy',
              new Date()
            ),
            -8
          );
      });

    return {
      title,
      createDate,
    };
  }

  crawlImage() {
    const imagesUrl = [];
    this.rootHtmlElement
      .querySelectorAll('#main-content > a[href]')
      .map(anchorElement => anchorElement.getAttribute('href'))
      .filter(imageUrl =>
        /(.*imgur\.com.*)|(.*(\.(jpg|png|gif|webp))$)/.test(imageUrl)
      )
      .forEach(imageUrl => {
        imagesUrl.push(imageUrl);
      });
    return imagesUrl;
  }

  request(path) {
    return new Promise((resolve, reject) => {
      let html = '';
      const request = https.request(
        {
          hostname: this.hostname,
          path,
        },
        res => {
          res.on('data', data => {
            html += data.toString('utf8');
          });

          res.on('end', () => {
            this.rootHtmlElement = parse(html);
            resolve(html);
          });
        }
      );

      request.setHeader('Cookie', this.cookies);

      request.on('error', error => {
        reject(error);
      });

      request.end();
    });
  }

  requestByFile(filePath) {
    return new Promise((resolve, reject) => {
      let html = '';
      fs.readFile(filePath, (err, buffer) => {
        if (err) reject(err);
        else {
          html += buffer.toString('utf-8');
          this.rootHtmlElement = parse(html);
          resolve(this.rootHtmlElement);
        }
      });
    });
  }

  requestToFile(path, filePath) {
    return new Promise((resolve, reject) => {
      let html = '';
      const ws = fs.createWriteStream(filePath);
      const request = https.request(
        {
          hostname: this.hostname,
          path,
        },
        res => {
          res.on('data', data => {
            html += data;
            ws.write(data);
          });

          res.on('end', () => {
            ws.close();
            this.rootHtmlElement = parse(html);
            resolve(filePath);
          });
        }
      );

      request.setHeader('Cookie', this.cookies);

      request.on('error', error => {
        reject(error);
      });

      request.end();
    });
  }

  expandPreviousPageLinks(expandNumber) {
    const link = this.rootHtmlElement
      .querySelectorAll('.btn-group.btn-group-paging > a')[1]
      .getAttribute('href');
    return this.expand(link, expandNumber);
  }

  expand(link, expandNumber = 5) {
    const expandedLinks = [];
    const regex = /\/bbs\/Beauty\/index(\d+)\.html/;
    const result = regex.exec(link);

    if (result && result[1]) {
      const start = parseInt(result[1], 10);
      for (let i = start; i >= 0 && i > start - expandNumber; i -= 1) {
        expandedLinks.push(`/bbs/Beauty/index${i}.html`);
      }
    }

    return expandedLinks;
  }

  countReply() {
    let like = 0;
    let unlike = 0;
    let normal = 0;
    this.rootHtmlElement
      .querySelectorAll('div.push > span.push-tag')
      .forEach(pushElement => {
        switch (pushElement.text.replace(' ', '')) {
          case '推':
            like += 1;
            break;
          case '噓':
            unlike += 1;
            break;
          case '→':
            normal += 1;
            break;
          default:
        }
      });
    return {
      like,
      unlike,
      total: normal + like + unlike,
    };
  }

  isLinkUnavaliable(path) {
    return new Promise((resolve, reject) => {
      const request = https.request({
        hostname: this.hostname,
        path: path.replace(this.hostname, ''),
      });

      request.setHeader('Cookie', this.cookies);

      request.on('response', res => {
        resolve(res.statusCode !== 404);
      });

      request.on('error', error => {
        reject(error);
      });

      request.end();
    });
  }

  async disableUnlinkedPost() {
    const db = new Database();
    await db.connect();
    const { cursor, close } = await db.getPostsCursor(
      process.env.PTT_PLATFORM_ID
    );

    const update = async (err, rows) => {
      if (err) {
        await db.end();
        throw err;
      }
      if (rows.length > 0) {
        for (const { title, link } of rows) {
          const result = await this.isLinkUnavaliable(link);

          if (!result) {
            logger.info(`Update available ${title} ${link} ${result}`);
            await db.updateLinkAvailable(link, result);
          }

          await delay(500);
        }
        cursor.read(100, update);
      } else {
        close();
        logger.info('disableUnlinkedPost() end');
        await db.end();
      }
    };
    logger.info('disableUnlinkedPost() start');
    cursor.read(100, update);
  }
}
