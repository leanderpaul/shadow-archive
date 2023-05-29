/**
 * Importing npm packages
 */
import { expect } from '@jest/globals';

/**
 * Importing user defined packages
 */
import { MailType } from '@app/providers/mail';
import { GraphQLModule, ShadowArchive } from '@tests/utils';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */
const USER = { email: 'test-user@mail.com', name: 'Test User', password: 'Password@123' } as const;

const archive = new ShadowArchive(GraphQLModule.ACCOUNTS);

beforeAll(() => archive.setup(), archive.getTimeout());

describe('[GraphQL][accounts]', function () {
  describe('register new user', () => {
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
      const response = await archive.graphql(query, { ...USER });

      response.expectCookies();
      response.expectGraphQLData({
        register: {
          uid: expect.toBeID(),
          email: USER.email,
          name: USER.name,
          imageUrl: null,
          verified: false,
        },
      });
    });

    it('throws duplicate email address error for already registered email', async () => {
      const response = await archive.graphql(query, { ...USER });

      response.expectGraphQLError('R003');
    });
  });

  describe('login user', () => {
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
          uid: expect.toBeID(),
          email: USER.email,
          name: USER.name,
          imageUrl: null,
          verified: false,
        },
      });
    });
  });

  describe('verify user session', function () {
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

  describe('resend email verification link', function () {
    const query = /* GraphQL */ `
      mutation {
        resendEmailVerificationMail
      }
    `;

    it('should send mail for unverified user', async () => {
      const mockFn = jest.fn();
      const response = await archive.graphql(query).session(USER.email).setMailMock(mockFn);

      expect(mockFn).toHaveBeenLastCalledWith(MailType.EMAIL_VERIFICATION, USER.email, { code: expect.any(String), name: USER.name });
      response.expectGraphQLData({ resendEmailVerificationMail: true });
      archive.storeData('verify-email-code', mockFn.mock.lastCall[2].code);
    });

    it('should throw error for verified user', async () => {
      const mockFn = jest.fn();
      const user = await archive.createUser('verified-user-one@shadow-apps.com', 'Verified User One', true);
      const response = await archive.graphql(query).session(user.email).setMailMock(mockFn);

      expect(mockFn).toBeCalledTimes(0);
      response.expectGraphQLError('IAM012');
    });
  });

  describe('verify email address', function () {
    const query = /* GraphQL */ `
      mutation ($code: String!) {
        verifyEmail(code: $code)
      }
    `;

    it('should throw error for invalid code', async () => {
      const response = await archive.graphql(query, { code: 'invalid-code' });

      response.expectGraphQLError('IAM011');
    });

    it('should verify user email address', async () => {
      const code = archive.getStoredData('verify-email-code');
      const response = await archive.graphql(query, { code });

      response.expectGraphQLData({ verifyEmail: true });
      const user = await archive.getUser(USER.email);
      expect(user.verified).toBe(true);
    });
  });

  describe('forgot password', function () {
    const query = /* GraphQL */ `
      mutation ($email: String!) {
        forgotPassword(email: $email)
      }
    `;

    it('should not send mail for unaccounted email address', async () => {
      const mockFn = jest.fn();
      const response = await archive.graphql(query, { email: 'unaccounted-email@shadow-apps.com' }).setMailMock(mockFn);

      expect(mockFn).toBeCalledTimes(0);
      response.expectGraphQLData({ forgotPassword: true });
    });

    it('should send mail for existing email address', async () => {
      const mockFn = jest.fn();
      const response = await archive.graphql(query, { email: USER.email }).setMailMock(mockFn);

      expect(mockFn).toHaveBeenLastCalledWith(MailType.RESET_PASSWORD, USER.email, { code: expect.any(String), name: USER.name });
      response.expectGraphQLData({ forgotPassword: true });
      archive.storeData('forgot-password-code', mockFn.mock.lastCall[2].code);
    });
  });

  describe('reset password using reset password link', function () {
    const query = /* GraphQL */ `
      mutation ($code: String!, $password: String!) {
        resetPassword(code: $code, newPassword: $password)
      }
    `;

    it('should return error for invalid code', async () => {
      const response = await archive.graphql(query, { code: 'invalid-code', password: 'Password@1234' });

      response.expectGraphQLError('IAM010');
    });

    it('should return false for empty password', async () => {
      const code = archive.getStoredData('forgot-password-code');
      const response = await archive.graphql(query, { code, password: '' });

      response.expectGraphQLData({ resetPassword: false });
    });

    it('should change password for valid code and password', async () => {
      const code = archive.getStoredData('forgot-password-code');
      const response = await archive.graphql(query, { code, password: 'Password@1234' });

      response.expectGraphQLData({ resetPassword: true });
    });
  });

  describe('update user password', function () {
    const query = /* GraphQL */ `
      mutation ($oldPassword: String!, $newPassword: String!) {
        updatePassword(oldPassword: $oldPassword, newPassword: $newPassword)
      }
    `;

    it('should throw error for incorrect old password', async () => {
      const response = await archive.graphql(query, { oldPassword: 'Password@123', newPassword: 'Password@123' }).session(USER.email);

      response.expectGraphQLError('IAM008');
    });

    it('should throw error for invalid new password', async () => {
      const response = await archive.graphql(query, { oldPassword: 'Password@1234', newPassword: 'invalid-password' }).session(USER.email);

      response.expectGraphQLError('R002');
      response.expectGraphQLErrorFields(['password']);
    });

    it('should change password for valid inputs', async () => {
      const response = await archive.graphql(query, { oldPassword: 'Password@1234', newPassword: 'Password@123' }).session(USER.email);

      response.expectGraphQLData({ updatePassword: true });
    });
  });

  describe('logout user session', function () {
    const query = /* GraphQL */ `
      mutation ($sessionId: Int) {
        logout(sessionId: $sessionId)
      }
    `;

    it('should logout only the last session', async () => {
      const response = await archive.graphql(query).session(USER.email);

      response.expectGraphQLData({ logout: true });
      const user = await archive.getUser(USER.email);
      expect(user.sessions).toHaveLength(1);
    });

    it('should logout every session', async () => {
      await archive.createUserSession(USER.email);
      const response = await archive.graphql(query, { sessionId: -1 }).session(USER.email);

      response.expectGraphQLData({ logout: true });
      const user = await archive.getUser(USER.email);
      expect(user.sessions).toHaveLength(0);
    });
  });

  describe('update user profile', function () {
    const query = /* GraphQL */ `
      mutation ($name: String, $imageUrl: String) {
        updateUserProfile(name: $name, imageUrl: $imageUrl) {
          uid
          email
          name
          imageUrl
        }
      }
    `;

    beforeAll(() => archive.createUserSession(USER.email));

    it('should throw error for invalid name and image url', async () => {
      const response = await archive.graphql(query, { name: 'invalid name 1', imageUrl: 'invalid url' }).session(USER.email);

      response.expectGraphQLError('R002');
      response.expectGraphQLErrorFields(['name', 'imageUrl']);
    });

    it('should update user details for valid inputs', async () => {
      const name = 'Test User updated';
      const imageUrl = 'https://accounts.shadow-apps.com/favicon.ico';
      const response = await archive.graphql(query, { name, imageUrl }).session(USER.email);

      response.expectGraphQLData({
        updateUserProfile: {
          uid: expect.stringMatching(/^[0-9a-f]{24}$/),
          email: USER.email,
          name,
          imageUrl,
        },
      });
    });
  });
});

afterAll(() => archive.teardown(), archive.getTimeout());
