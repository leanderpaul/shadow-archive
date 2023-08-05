/**
 * Importing npm packages
 */
import { faker } from '@faker-js/faker';
import { NestFactory } from '@nestjs/core';
import inquirer from 'inquirer';
import moment from 'moment';

/**
 * Importing user defined packages
 */
import { DatabaseModule, DatabaseService, type User } from './modules/database';
import { Logger } from './providers/logger';
import { Currency, ExpenseCategory, ExpenseVisibiltyLevel } from './shared/constants';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */
const logger = Logger.getLogger('Seeder');
const optional = (getter: () => any) => (faker.datatype.boolean() ? getter() : undefined);
const minDate = parseInt(moment().subtract(1, 'year').format('YYMMDD'));
const maxDate = parseInt(moment().format('YYMMDD'));

function generateDocument(model: string, user?: User | null): Record<string, any> {
  switch (model) {
    case 'User':
    case 'NativeUser':
    case 'OAuthUser': {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      return {
        name: `${firstName} ${lastName}`,
        email: faker.internet.email({ firstName, lastName, provider: 'seeder.shadow-apps.com' }),
        verified: faker.datatype.boolean(),
        password: 'Password@123',
        spuid: faker.string.uuid(),
        refreshToken: faker.string.uuid(),
      };
    }
    case 'Expense': {
      if (!user) throw new Error('User is required to generate Expense');
      const items = Array.from({ length: faker.number.int({ min: 1, max: 10 }) }, () => ({
        name: faker.commerce.productName(),
        qty: optional(() => faker.number.int({ min: 1, max: 10 })),
        price: faker.number.int({ min: 10, max: 2000 }),
      }));
      return {
        uid: user?.uid,
        bid: optional(faker.string.uuid),
        level: faker.helpers.enumValue(ExpenseVisibiltyLevel),
        category: faker.helpers.enumValue(ExpenseCategory),
        store: faker.helpers.arrayElement(['LIDL', 'Tesco', 'Walmart', 'Sainsburg', 'ALDI', 'Tariq Meats', 'Asda', 'Morrisons', 'Waitrose', 'Iceland']),
        storeLoc: optional(faker.location.city),
        date: faker.number.int({ min: minDate, max: maxDate }),
        time: optional(() => faker.number.int({ min: 0, max: 2359 })),
        currency: faker.helpers.enumValue(Currency),
        paymentMethod: faker.helpers.arrayElement(['Cash', 'Card', 'UPI', 'Net Banking', undefined]),
        desc: optional(faker.lorem.sentence),
        items,
        total: items.reduce((total, item) => total + Math.round(item.price * (item.qty ?? 1)), 0),
      };
    }
    default: {
      throw new Error(`Model '${model}' not found`);
    }
  }
}

async function seedDatabase(): Promise<void> {
  const app = await NestFactory.create(DatabaseModule, { logger: ['error', 'warn'] });
  await app.init();

  const databaseService = app.get(DatabaseService);
  const connection = databaseService.getConnection();
  const { model, count, email } = await inquirer.prompt([
    { name: 'model', message: 'Models to seed', type: 'list', choices: connection.modelNames().filter(name => name !== 'User') },
    { name: 'count', message: 'Number of documents to seed', type: 'number', default: 100 },
    { name: 'email', message: 'User email address', type: 'string', when: answers => !answers.model.includes('User'), default: 'admin@shadow-apps.com' },
  ]);

  const user = email ? await databaseService.getUserModel().findOne({ email }).lean() : null;
  const documents = Array.from({ length: count }, () => generateDocument(model, user));
  await connection.model(model).insertMany(documents, { ordered: false, throwOnValidationError: true });

  app.close();
  logger.info(`Seeded ${count} documents in model '${model}'`);
}

seedDatabase();
