import path from 'path';
import PTTCrawler from '../src/PTTCrawler';

const crawler = new PTTCrawler();

describe('Test crawlHeader()', () => {
  test('M.1614414718.A.266.html', async () => {
    await crawler.requestByFile(
      path.resolve(__dirname, './data/M.1614414718.A.266.html')
    );
    expect(crawler.crawlHeader()).toEqual({
      title: '[正妹] 同學  不要玩水好嗎',
      createDate: new Date('2021-02-27T16:31:56+08:00'),
    });
  });
  test('M.1614615620.A.C5D.html', async () => {
    await crawler.requestByFile(
      path.resolve(__dirname, './data/M.1614615620.A.C5D.html')
    );
    expect(crawler.crawlHeader()).toEqual({
      title: '[正妹] 瘦50kg的妹子',
      createDate: new Date('2021-03-02T00:20:18+08:00'),
    });
  });
  test('M.1615420091.A.838.html', async () => {
    await crawler.requestByFile(
      path.resolve(__dirname, './data/M.1615420091.A.838.html')
    );
    expect(crawler.crawlHeader()).toEqual({
      title: '[正妹] 日本主播吃鳳梨',
      createDate: new Date('2021-03-11T07:48:08+08:00'),
    });
  });
});

describe('Test crawImage()', () => {
  test('M.1614414718.A.266.html', async () => {
    await crawler.requestByFile(
      path.resolve(__dirname, './data/M.1614414718.A.266.html')
    );
    expect(crawler.crawlImage()).toEqual([
      'https://i.imgur.com/FF4ACrK.jpg',
      'https://i.imgur.com/sEClxSM.jpg',
      'https://i.imgur.com/H7TS8x7.jpg',
      'https://i.imgur.com/sxR0LWF.jpg',
      'https://i.imgur.com/gfB4XpZ.jpg',
      'https://i.imgur.com/JPg7cQK.jpg',
    ]);
  });
  test('M.1614615620.A.C5D.html', async () => {
    await crawler.requestByFile(
      path.resolve(__dirname, './data/M.1614615620.A.C5D.html')
    );
    expect(crawler.crawlImage(0)).toEqual([
      'https://i.imgur.com/awpSmQh.jpg',
      'https://i.imgur.com/5gqIKva.jpg',
      'https://i.imgur.com/oc06G5t.jpg',
      'https://i.imgur.com/nDn71DC.jpg',
      'https://i.imgur.com/bfBZT5g.jpg',
      'https://i.imgur.com/Li4u0pm.jpg',
      'https://i.imgur.com/RbidjVO.jpg',
      'https://i.imgur.com/FKj7zBI.jpg',
      'https://i.imgur.com/NAmdbCK.jpg',
      'https://i.imgur.com/RkUVA45.jpg',
      'https://i.imgur.com/5ccNMSS.jpg',
      'https://i.imgur.com/X5FEw82.jpg',
      'https://i.imgur.com/lj47rEt.jpg',
      'https://i.imgur.com/lfbaPlS.jpg',
      'https://i.imgur.com/S9xP9ix.jpg',
    ]);
  });
});

describe('Test expand()', () => {
  test('/bbs/Beauty/index3575.html', () => {
    expect(crawler.expand('/bbs/Beauty/index3575.html', 10)).toEqual([
      '/bbs/Beauty/index3575.html',
      '/bbs/Beauty/index3574.html',
      '/bbs/Beauty/index3573.html',
      '/bbs/Beauty/index3572.html',
      '/bbs/Beauty/index3571.html',
      '/bbs/Beauty/index3570.html',
      '/bbs/Beauty/index3569.html',
      '/bbs/Beauty/index3568.html',
      '/bbs/Beauty/index3567.html',
      '/bbs/Beauty/index3566.html',
    ]);
  });
  test('/bbs/Beauty/index2.html', () => {
    expect(crawler.expand('/bbs/Beauty/index2.html')).toEqual([
      '/bbs/Beauty/index2.html',
      '/bbs/Beauty/index1.html',
      '/bbs/Beauty/index0.html',
    ]);
  });
  test('/bbs/Beauty/index0.html', () => {
    expect(crawler.expand('/bbs/Beauty/index0.html')).toEqual([
      '/bbs/Beauty/index0.html',
    ]);
  });
  test('/bbs/Beauty/indexNaN.html', () => {
    expect(crawler.expand('/bbs/Beauty/indexNaN.html')).toEqual([]);
  });
});

describe('Test countReply()', () => {
  test('M.1614414718.A.266.html', async () => {
    await crawler.requestByFile(
      path.resolve(__dirname, './data/M.1614414718.A.266.html')
    );
    expect(crawler.countReply()).toEqual({
      like: 7,
      unlike: 3,
      total: 16,
    });
  });
  test('M.1614615620.A.C5D.html', async () => {
    await crawler.requestByFile(
      path.resolve(__dirname, './data/M.1614615620.A.C5D.html')
    );
    expect(crawler.countReply()).toEqual({
      like: 127,
      unlike: 21,
      total: 226,
    });
  });
});
