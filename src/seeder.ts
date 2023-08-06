/**
 * Importing npm packages
 */
import { NestFactory } from '@nestjs/core';
import inquirer from 'inquirer';

/**
 * Importing user defined packages
 */
import { DatabaseService, UserVariant } from './modules/database';
import { SeederModule, SeederService } from './modules/seeder';

/**
 * Defining types
 */
interface SeedOptions {
  model: string;
  count: number;
  email?: string;
}

/**
 * Declaring the constants
 */
const log = console.log; // eslint-disable-line no-console
const error = console.error; // eslint-disable-line no-console

async function seedModel(options: SeedOptions, seederService: SeederService): Promise<void> {
  switch (options.model) {
    case 'NativeUser':
      return seederService
        .seedUsers(UserVariant.NATIVE, options.count)
        .then(users => log(`${users.length} native users seeded successfully`))
        .catch(err => error(err));
    case 'OAuthUser':
      return seederService
        .seedUsers(UserVariant.OAUTH, options.count)
        .then(users => log(`${users.length} oauth users seeded successfully`))
        .catch(err => error(err));
    case 'Expense': {
      const email = options.email ?? 'admin@shadow-apps.com';
      return seederService
        .seedExpenses(email, options.count)
        .then(expenses => log(`${expenses.length} expenses seeded successfully`))
        .catch(err => error(err));
    }
    default:
      return Promise.reject(new Error(`Seeding for model '${options.model}' not yet implemented`));
  }
}

async function seedDatabase(): Promise<void> {
  const app = await NestFactory.create(SeederModule, { logger: ['error', 'warn'] });
  await app.init();

  const seederService = app.get(SeederService);
  const databaseService = app.get(DatabaseService);
  const connection = databaseService.getConnection();
  const options: SeedOptions = await inquirer.prompt([
    { name: 'model', message: 'Models to seed', type: 'list', choices: connection.modelNames().filter(name => name !== 'User') },
    { name: 'count', message: 'Number of documents to seed', type: 'number', default: 100 },
    { name: 'email', message: 'User email address', type: 'string', when: answers => !answers.model.includes('User'), default: 'admin@shadow-apps.com' },
  ]);

  await seedModel(options, seederService);
  app.close();
}

seedDatabase();
