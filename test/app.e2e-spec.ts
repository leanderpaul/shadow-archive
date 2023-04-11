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

describe('[REST][status] Page not found and Health', () => {
  it('Returns resource not found error', async () => {
    const response = await archive.rest('GET', '/');

    response.expectStatusCode(404);
    response.expectRESTError('R001');
  });

  it('returns health response', async () => {
    const response = await archive.rest('GET', '/health');
    const modules = Object.keys(response.getBody().details);
    const expectModule = expect.objectContaining({ status: expect.stringMatching(/^(up|down)$/) });
    response.expectRESTData({
      status: expect.stringMatching(/^(error|ok|shutting_down)$/),
      details: modules.reduce((acc, mod) => ({ ...acc, [mod]: expectModule }), {}),
    });
  });
});

afterAll(() => archive.teardown());
