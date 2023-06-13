/**
 * Importing npm packages
 */
import { expect } from '@jest/globals';

/**
 * Importing user defined packages
 */
import { Currency, ExpenseVisibiltyLevel } from '@app/modules/database';
import { GraphQLModule, ShadowArchive } from '@tests/utils';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */
const emailOne = 'expense-tester-one@shadow-apps.com';
const emailTwo = 'expense-tester-two@shadow-apps.com';
const emailThree = 'expense-tester-three@shadow-apps.com';
const archive = new ShadowArchive(GraphQLModule.CHRONICLE);

beforeAll(() => archive.setup(), archive.getTimeout());

describe('[GraphQL][chronicle]', function () {
  beforeAll(() =>
    Promise.all([
      archive.createUser(emailOne, 'Expense Tester One', true),
      archive.createUser(emailTwo, 'Expense Tester Two', true),
      archive.createUser(emailThree, 'Expense Tester Three'),
    ]),
  );

  describe('create new expense', function () {
    const query = /* GraphQL */ `
      mutation AddExpense($input: AddExpenseInput!) {
        addExpense(input: $input) {
          eid
          bid
          date
          level
          time
          store
          storeLoc
          currency
          category
          paymentMethod
          desc
          items {
            name
            price
            qty
          }
          total
        }
      }
    `;
    const variables = {
      input: {
        bid: 'bill-0001',
        level: 'STANDARD',
        category: 'GROCERIES',
        date: 230101,
        time: 1000,
        store: 'Store Name',
        storeLoc: 'Location',
        paymentMethod: 'Master card',
        items: [
          { name: 'item 1', price: 150 },
          { name: 'item 2', price: 235 },
          { name: 'item 3', price: 45 },
          { name: 'item 4', price: 100, qty: 0.9 },
        ],
        currency: 'GBP',
      },
    };

    it('throws not verified error for unverified user', async () => {
      const response = await archive.graphql(query, variables).session(emailThree);

      response.expectGraphQLError('IAM003');
    });

    it('throws error for invalid input', async () => {
      const items = [...variables.input.items, { name: 'Toothpaste', price: 0, qty: 0 }];
      const input = { ...variables.input, items, date: 100101, time: 2400 };
      const response = await archive.graphql(query, { input }).session(emailOne);

      response.expectGraphQLError('R002');
      response.expectGraphQLErrorFields(['date', 'time', 'price', 'qty']);
    });

    it('return created expense for valid input', async () => {
      const response = await archive.graphql(query, variables).session(emailOne);

      response.expectGraphQLData({ addExpense: { ...variables.input, eid: expect.toBeID(), desc: null, total: 520 } });
      const user = await archive.getUser(emailOne);
      expect(user.chronicle).toMatchObject({ deviation: 0, paymentMethods: [variables.input.paymentMethod] });

      archive.storeData('expense', response.getBody().data.addExpense);
    });
  });

  describe('get an expense', function () {
    const query = /* GraphQL */ `
      query GetExpense($eid: ID!) {
        expense(eid: $eid) {
          eid
          date
        }
      }
    `;

    it('return null for invalid eid', async () => {
      const response = await archive.graphql(query, { eid: 'invalid-eid' }).session(emailOne);

      response.expectGraphQLData({ expense: null });
    });

    it('returns null for valid eid of another user', async () => {
      const expense = archive.getStoredData('expense');
      const response = await archive.graphql(query, { eid: expense.eid }).session(emailTwo);

      response.expectGraphQLData({ expense: null });
    });

    it('returns correct expense for valid eid', async () => {
      const expense = archive.getStoredData('expense');
      const response = await archive.graphql(query, { eid: expense.eid }).session(emailOne);

      response.expectGraphQLData({ expense: { eid: expense.eid, date: expense.date } });
    });
  });

  describe('search for expenses', function () {
    const query = /* GraphQL */ `
      query SearchExpenses($filter: ExpenseFilter) {
        expenses(filter: $filter) {
          page {
            hasPrev
            hasNext
          }
          totalCount
          items {
            eid
            bid
            date
            level
          }
        }
      }
    `;

    beforeAll(async () => {
      const user = await archive.getUser(emailOne);
      const model = archive.getDatabaseService().getExpenseModel();
      const items = [{ name: 'item 1', price: 150 }];
      const data = { uid: user.uid, store: 'Store Name', paymentMethod: 'Master card', items, currency: Currency.GBP, total: 150 };
      return await Promise.all([
        model.create({ ...data, level: ExpenseVisibiltyLevel.DISGUISE, bid: 'bill-0002', date: 230102 }),
        model.create({ ...data, level: ExpenseVisibiltyLevel.HIDDEN, bid: 'bill-0003', date: 230103 }),
        model.create({ ...data, level: ExpenseVisibiltyLevel.STANDARD, bid: 'bill-0004', date: 230104 }),
      ]);
    });

    it('return empty for invalid search', async () => {
      const response = await archive.graphql(query, { filter: { fromDate: 230101, currency: 'INR' } }).session(emailOne);

      response.expectGraphQLData({ expenses: { page: { hasPrev: false, hasNext: false }, totalCount: 0, items: [] } });
      expect(response.getBody().data.expenses.items).toHaveLength(0);
    });

    it('returns expense list for valid search', async () => {
      const response = await archive.graphql(query, { filter: { fromDate: 230104 } }).session(emailOne);

      response.expectGraphQLData({
        expenses: {
          page: { hasPrev: false, hasNext: false },
          totalCount: 1,
          items: expect.arrayContaining([{ eid: expect.toBeID(), bid: 'bill-0004', date: 230104, level: 'STANDARD' }]),
        },
      });
      expect(response.getBody().data.expenses.items).toHaveLength(1);
    });

    it('returns correct expense list for visibility search', async () => {
      const response = await archive.graphql(query, { filter: { levels: ['HIDDEN'] } }).session(emailOne);

      response.expectGraphQLData({
        expenses: {
          page: { hasPrev: false, hasNext: false },
          totalCount: 1,
          items: expect.arrayContaining([{ eid: expect.toBeID(), bid: 'bill-0003', date: 230103, level: 'HIDDEN' }]),
        },
      });
      expect(response.getBody().data.expenses.items).toHaveLength(1);
    });
  });

  describe('update an expense', function () {
    const query = /* GraphQL */ `
      mutation UpdateExpense($eid: ID!, $update: UpdateExpenseInput!) {
        updateExpense(eid: $eid, update: $update) {
          eid
          bid
          level
          category
          date
          total
        }
      }
    `;

    it('throws expense not found error for invalid eid', async () => {
      const response = await archive.graphql(query, { eid: 'invalid-eid', update: { bid: 'bill-0009' } }).session(emailOne);

      response.expectGraphQLError('R001');
    });

    it('throws expense not found error for valid eid of another user', async () => {
      const expense = archive.getStoredData('expense');
      const response = await archive.graphql(query, { eid: expense.eid, update: { bid: 'bill-0009' } }).session(emailTwo);

      response.expectGraphQLError('R001');
    });

    it('returns updated expense for valid input', async () => {
      const expense = archive.getStoredData('expense');
      const update = { bid: 'bill-0009', items: [{ name: 'Item updated', price: 500, qty: 2 }], level: 'DISGUISE' };
      const response = await archive.graphql(query, { eid: expense.eid, update }).session(emailOne);

      response.expectGraphQLData({
        updateExpense: {
          eid: expense.eid,
          bid: update.bid,
          level: 'DISGUISE',
          category: expense.category,
          date: expense.date,
          total: 1000,
        },
      });
    });
  });

  describe('delete a expense', function () {
    const query = /* GraphQL */ `
      mutation DeleteExpense($eid: ID!) {
        removeExpense(eid: $eid) {
          eid
        }
      }
    `;

    it('throws expense not found for eid of another user', async () => {
      const expense = archive.getStoredData('expense');
      const response = await archive.graphql(query, { eid: expense.eid }).session(emailTwo);

      response.expectGraphQLError('R001');
    });

    it('returns the deleted expense for valid eid', async () => {
      const expense = archive.getStoredData('expense');
      const response = await archive.graphql(query, { eid: expense.eid }).session(emailOne);

      response.expectGraphQLData({ removeExpense: { eid: expense.eid } });
    });
  });
});

afterAll(() => archive.teardown(), archive.getTimeout());
