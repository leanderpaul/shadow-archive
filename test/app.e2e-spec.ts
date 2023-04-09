/**
 * Importing npm packages
 */

/**
 * Importing user defined packages
 */
import { ShadowArchive } from '@test/common';

/**
 * Importing and defining types
 */

/**
 * Declaring the constants
 */
const archive = new ShadowArchive();

beforeAll(() => archive.setup());

describe('App Status', () => {
  it('Returns resource not found error', async () => {
    const response = await archive.rest('GET', '/');
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      code: 'NOT_FOUND',
      message: 'Resource not found',
      rid: expect.stringMatching(/^[0-9A-F]{8}-[0-9A-F]{4}-[1][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i),
    });
  });

  it('returns health response', async () => {
    const response = await archive.rest('GET', '/health');
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('info');
    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('details');
  });
});

afterAll(() => archive.teardown());
