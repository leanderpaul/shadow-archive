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
const USER = { email: 'test-user@mail.com', name: 'Test User', password: 'Password@123' } as const;

const archive = new ShadowArchive();

beforeAll(() => archive.setup());

describe('[GraphQL][accounts:mutation] Register', () => {
  const query = /* GraphQL */ `
    mutation Regiser($email: String!, $name: String!, $password: String!) {
      register(email: $email, name: $name, password: $password) {
        uid
        email
        name
        csrfToken
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
        csrfToken: expect.stringMatching(/^[a-zA-Z0-9|\-_]{82}$/),
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
        csrfToken
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

    response.expectCookies();
    response.expectGraphQLData({
      login: {
        uid: expect.stringMatching(/^[a-f0-9]{24}$/),
        email: USER.email,
        name: USER.name,
        csrfToken: expect.stringMatching(/^[a-zA-Z0-9|\-_]{82}$/),
        imageUrl: null,
        verified: false,
      },
    });
  });
});

afterAll(() => archive.teardown());
