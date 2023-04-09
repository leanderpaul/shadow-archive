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
    const { errors } = await archive.graphql(query, variables);
    const error = errors[0]!;

    expect(error.extensions.type).toBe('CLIENT_ERROR');
    expect(error.extensions.fields).toHaveLength(1);
    expect(error.extensions?.fields?.[0]?.field).toBe('password');
  });

  it('errors with multiple invalid input', async () => {
    const variables = { email: 'email-address', name: 'A', password: 'invalid-password' };
    const { errors } = await archive.graphql(query, variables);
    const error = errors[0]!;

    expect(error.extensions.type).toBe('CLIENT_ERROR');
    expect(error.extensions.fields).toHaveLength(3);
    const fields = error.extensions.fields?.map((obj: any) => obj.field);
    expect(fields).toEqual(expect.arrayContaining(['password', 'email', 'name']));
  });

  it('creates user with valid input', async () => {
    const variables = { email: 'test-user@mail.com', name: 'Test User', password: 'Password@123' };
    const response = await archive.rawGraphql(query, variables);

    expect(response.get('Set-Cookie')).toEqual(expect.arrayContaining([expect.stringMatching(/^sasid=[a-zA-Z0-9%= \-;]{30,}$/)]));
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.register).toMatchObject({
      uid: expect.stringMatching(/^[a-f0-9]{24}$/),
      email: variables.email,
      name: variables.name,
      csrfToken: expect.stringMatching(/^[a-zA-Z0-9|\-_]{82}$/),
      imageUrl: null,
      verified: false,
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

  it.todo('errors with invalid email address');

  it.todo('errors with invalid password');

  it.todo('returns cookie and data with valid credentials');
});

afterAll(() => archive.teardown());
