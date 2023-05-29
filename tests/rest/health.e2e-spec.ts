/**
 * Importing npm packages
 */

/**
 * Importing user defined packages
 */
import { ShadowArchive } from '@tests/utils';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */
const archive = new ShadowArchive();

beforeAll(() => archive.setup(), archive.getTimeout());

describe('[REST][status]', function () {
  describe('unhandled api route', () => {
    it('returns resource not found error', async () => {
      const response = await archive.rest('GET', '/');

      response.expectStatusCode(404);
      response.expectRESTError('R001');
    });
  });

  describe('health check', function () {
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
});

afterAll(() => archive.teardown(), archive.getTimeout());
