/**
 * Importing npm packages
 */

/**
 * Importing user defined packages
 */
import { GraphQLModule, ShadowArchive } from '@tests/common';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */
const USER = { email: 'test-user@mail.com', name: 'Test User', password: 'Password@123' } as const;

const archive = new ShadowArchive(GraphQLModule.ACCOUNTS);

beforeAll(() => archive.setup(), archive.getTimeout());

describe('[GraphQL][accounts:mutation] Register', () => {
  const query = /* GraphQL */ `
    mutation Regiser($email: String!, $name: String!, $password: String!) {
      register(email: $email, name: $name, password: $password) {
        uid
        email
        name
        imageUrl
        verified
      }
    }
  `;

  it('errors with invalid password', async () => {
    const variables = { email: 'test-user@mail.com', name: 'Test User', password: 'invalid-password' };
    const response = await archive.graphql(query, variables);

    response.expectGraphQLError('R002');
    response.expectGraphQLErrorFields(['password']);
  });

  it('errors with multiple invalid input', async () => {
    const variables = { email: 'email-address', name: 'A', password: 'invalid-password' };
    const response = await archive.graphql(query, variables);

    response.expectGraphQLError('R002');
    response.expectGraphQLErrorFields(['password', 'email', 'name']);
  });

  it('creates user with valid input', async () => {
    const variables = { ...USER };
    const response = await archive.graphql(query, variables);

    response.expectCookies();
    response.expectGraphQLData({
      register: {
        uid: expect.stringMatching(/^[a-f0-9]{24}$/),
        email: variables.email,
        name: variables.name,
        imageUrl: null,
        verified: false,
      },
    });
  });
});

describe('[GraphQL][accounts:mutation] Login', () => {
  const query = /* GraphQL */ `
    mutation Login($email: String!, $password: String!) {
      login(email: $email, password: $password) {
        uid
        email
        name
        imageUrl
        verified
      }
    }
  `;

  it('errors with invalid email address', async () => {
    const variables = { email: 'invalid-email', password: USER.password };
    const response = await archive.graphql(query, variables);
    response.expectGraphQLError('IAM001');
  });

  it('errors with invalid password', async () => {
    const variables = { email: USER.email, password: 'invalid-password' };
    const response = await archive.graphql(query, variables);
    response.expectGraphQLError('IAM006');
  });

  it('returns cookie and data with valid credentials', async () => {
    const variables = { email: USER.email, password: USER.password };
    const response = await archive.graphql(query, variables);

    response.expectCookies(USER.email);
    response.expectGraphQLData({
      login: {
        uid: expect.stringMatching(/^[a-f0-9]{24}$/),
        email: USER.email,
        name: USER.name,
        imageUrl: null,
        verified: false,
      },
    });
  });
});

describe('[GraphQL][accounts:query] VerifySession', function () {
  const query = /* GraphQL */ `
    query verifySession {
      viewer {
        uid
        email
        name
        verified
        imageUrl
        sessions {
          browser
          os
          device
          accessedAt
          currentSession
        }
      }
    }
  `;

  it('errors for invalid session', async () => {
    const response = await archive.graphql(query).cookie('sasid=invalid-cookie-value');
    response.expectGraphQLError('IAM002');
  });

  it('return user for valid session', async () => {
    const response = await archive.graphql(query).session(USER.email);

    response.expectGraphQLData({
      viewer: {
        uid: expect.stringMatching(/^[0-9a-f]{24}$/),
        email: USER.email,
        name: USER.name,
        verified: false,
        imageUrl: null,
        sessions: expect.arrayContaining([
          {
            browser: null,
            os: null,
            device: null,
            accessedAt: expect.stringMatching(/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/),
            currentSession: expect.any(Boolean),
          },
        ]),
      },
    });
  });
});

afterAll(() => archive.teardown(), archive.getTimeout());
