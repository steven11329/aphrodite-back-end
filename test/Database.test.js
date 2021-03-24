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

  test('Get id 844', async () => {
    const result = await db.getPost(844);
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
