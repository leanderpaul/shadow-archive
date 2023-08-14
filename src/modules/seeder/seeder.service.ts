/**
 * Importing npm packages
 */
import { faker } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';
import moment from 'moment';

/**
 * Importing user defined packages
 */
import { ExpenseService } from '@app/modules/chronicle';
import { type ID, UserVariant } from '@app/modules/database';
import { UserService } from '@app/modules/user';
import { Logger } from '@app/providers/logger';
import { Currency, ExpenseCategory, ExpenseVisibiltyLevel } from '@app/shared/constants';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */
const optional = (getter: () => any) => (faker.datatype.boolean() ? getter() : undefined);

@Injectable()
export class SeederService {
  private readonly logger = Logger.getLogger(SeederService.name);

  constructor(private readonly userService: UserService, private readonly expenseService: ExpenseService) {}

  private generateDate(): number {
    const date = new Date();
    const currentYear = date.getFullYear() - 2000;
    const year = faker.number.int({ min: currentYear - 1, max: currentYear });
    const month = faker.number.int({ min: 1, max: date.getMonth() });
    const day = faker.number.int({ min: 1, max: 28 });
    const generatedDate = year * 10000 + month * 100 + day;
    return moment(generatedDate, 'YYMMDD').isAfter(date) ? this.generateDate() : generatedDate;
  }

  private generateTime(): number {
    const hour = faker.number.int({ min: 0, max: 23 });
    const minute = faker.number.int({ min: 0, max: 59 });
    return hour * 100 + minute;
  }

  async seedUsers(type: UserVariant, count: number): Promise<string[]> {
    const users = Array.from({ length: count }, () => ({ firstName: faker.name.firstName(), lastName: faker.name.lastName() }));
    const createdUserEmails: string[] = [];
    for (const user of users) {
      const name = `${user.firstName} ${user.lastName}`;
      const email = faker.internet.email({ firstName: user.firstName, lastName: user.lastName, provider: 'seeder.shadow-apps.com' });
      const userTypeObj = type === UserVariant.NATIVE ? { password: 'Password@123' } : { spuid: faker.string.uuid(), refreshToken: faker.string.uuid() };
      await this.userService
        .createUser({ name, email, ...(userTypeObj as any), verified: faker.datatype.boolean() })
        .then(user => createdUserEmails.push(user.email))
        .catch(err => this.logger.error(err));
    }
    return createdUserEmails;
  }

  async seedExpenses(uidOrEmail: ID, count: number): Promise<string[]> {
    const user = await this.userService.getUser(uidOrEmail);
    if (!user) throw new Error(`User with uid or email '${uidOrEmail}' not found`);
    const expenses = Array.from({ length: count }, () => ({
      bid: optional(() => faker.string.alphanumeric(8)),
      level: faker.helpers.enumValue(ExpenseVisibiltyLevel),
      category: faker.helpers.enumValue(ExpenseCategory),
      store: faker.helpers.arrayElement(['LIDL', 'Tesco', 'Walmart', 'Sainsburg', 'ALDI', 'Tariq Meats', 'Asda', 'Morrisons', 'Waitrose', 'Iceland']),
      storeLoc: optional(faker.location.city),
      date: this.generateDate(),
      time: optional(() => this.generateTime()),
      currency: faker.helpers.enumValue(Currency),
      paymentMethod: faker.helpers.arrayElement(['Cash', 'Card', 'UPI', 'Net Banking', undefined]),
      desc: optional(faker.lorem.sentence),
      items: Array.from({ length: faker.number.int({ min: 1, max: 10 }) }, () => ({
        name: faker.commerce.productName(),
        qty: optional(() => faker.number.int({ min: 1, max: 10 })),
        price: faker.number.int({ min: 10, max: 2000 }),
      })),
    }));
    const createdExpenseIds: string[] = [];
    for (const expense of expenses) {
      await this.expenseService
        .addExpense(user.uid, expense)
        .then(expense => createdExpenseIds.push(expense.eid.toString()))
        .catch(err => this.logger.error(err));
    }
    return createdExpenseIds;
  }
}
