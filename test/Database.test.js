import Database from '../src/Database';

describe('Test getPosts()', () => {
  const db = new Database();
  beforeAll(async () => {
    await db.connect();
  });

  test('Test skip 0', async () => {
    const result = await db.getPosts(0);
    expect(result.rows.length <= 20).toBeTruthy();
    if (result.rows.length > 0) {
      expect(result.rows[0]).toHaveProperty('title');
      expect(result.rows[0]).toHaveProperty('coverImage');
      expect(result.rows[0]).toHaveProperty('createDate');
    }
  });

  test('Test skip 20', async () => {
    const result = await db.getPosts(20);
    expect(result.rows.length <= 20).toBeTruthy();
    if (result.rows.length > 0) {
      expect(result.rows[0]).toHaveProperty('title');
      expect(result.rows[0]).toHaveProperty('coverImage');
      expect(result.rows[0]).toHaveProperty('createDate');
    }
  });

  afterAll(async () => {
    await db.end();
  });
});

describe('Test getPost()', () => {
  const db = new Database();
  beforeAll(async () => {
    await db.connect();
  });

  test('Get id c5f62fd7-9688-4b42-947c-e965487d4dca', async () => {
    const result = await db.getPost('c5f62fd7-9688-4b42-947c-e965487d4dca');
    expect(result.rowCount).toBe(1);
    expect(result.rows[0]).toHaveProperty('title');
    expect(result.rows[0]).toHaveProperty('link');
    expect(result.rows[0]).toHaveProperty('imageUrlList');
    expect(result.rows[0]).toHaveProperty('createDate');
  });

  afterAll(async () => {
    await db.end();
  });
});

describe('Test last update', () => {
  const db = new Database();
  beforeAll(async () => {
    await db.connect();
  });

  test('updateLastUpdate()', async () => {
    await db.updateLastUpdate(1);
    const result = await db.getLastUpdate(1);
    expect(result.rows[0]).toHaveProperty('lastUpdate');
  });

  afterAll(async () => {
    await db.end();
  });
});
