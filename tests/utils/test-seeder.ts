/**
 * Importing npm packages
 */
import sagus from 'sagus';

/**
 * Importing user defined packages
 */
import { type DatabaseService, Expense, type NativeUser, type OAuthUser, type User, UserVariant } from '@app/modules/database';

import { ShadowArchiveResponse } from './shadow-archive-response';

/**
 * Defining types
 */

type UserInput = Pick<User, 'email' | 'name' | 'admin'> & { verified?: false };

type ExpenseInput = Omit<Expense, 'eid' | 'uid' | 'level' | 'category'> & Partial<Pick<Expense, 'level' | 'category'>>;

interface Operation {
  id?: string;
  op: 'create-user' | 'create-expense' | 'create-session';
  args: any[];
}

/**
 * Declaring the constants
 */

export class TestSeeder {
  private readonly seededUserMap = new Map<string, User>();
  private readonly operations: Operation[] = [];

  private databaseService?: DatabaseService;
  private seeded = false;

  private async createUser(input: UserInput): Promise<User> {
    if (!this.databaseService) throw new Error('Cannot create user before init');
    const userObj = { verified: true, ...input, password: 'Password@123', sessions: [{ id: 1 }] };
    const user = await this.databaseService.getUserModel(UserVariant.NATIVE).create(userObj);
    const cookie = user.uid.toString() + '|' + user.sessions[0]?.token;
    ShadowArchiveResponse.cookies.set(user.email, cookie);
    return user;
  }

  private async createExpense(email: string, input: ExpenseInput) {
    if (!this.databaseService) throw new Error('Cannot create expense before init');
    const user = await this.getUser(email);
    await this.databaseService.getExpenseModel().create({ ...input, uid: user.uid });
  }

  getSeedUser(id: string): User {
    const user = this.seededUserMap.get(id);
    if (!user) throw new Error(`User '${id}' not present`);
    return user;
  }

  async createUserSession(email: string): Promise<User> {
    if (!this.databaseService) throw new Error('Cannot create session before init');
    const userModel = this.databaseService.getUserModel();
    const user = await userModel.findOne({ email }).lean();
    if (!user) throw new Error(`User '${email}' not present`);
    const id = (user.sessions[user.sessions.length - 1]?.id ?? 0) + 1;
    const token = sagus.genRandom(32, 'base64');
    await userModel.updateOne({ email }, { $push: { sessions: { id, token } } });
    const cookie = user.uid.toString() + '|' + token;
    ShadowArchiveResponse.cookies.set(user.email, cookie);
    return user;
  }

  addUser(id: string, user: UserInput): void;
  addUser(user: UserInput): void;
  addUser(idOrUser: string | UserInput, user?: UserInput): void {
    if (this.seeded) throw new Error('Cannot add user after inited');
    const userObj = typeof idOrUser === 'string' ? user : idOrUser;
    const id = typeof idOrUser === 'string' ? idOrUser : undefined;
    this.operations.push({ id, op: 'create-user', args: [userObj] });
  }

  addSession(email: string): void {
    if (this.seeded) throw new Error('Cannot add user session after inited');
    this.operations.push({ op: 'create-session', args: [email] });
  }

  addExpense(email: string, expense: ExpenseInput): void {
    if (this.seeded) throw new Error('Cannot add expense after inited');
    this.operations.push({ op: 'create-expense', args: [email, expense] });
  }

  async init(databaseService: DatabaseService): Promise<void> {
    this.databaseService = databaseService;
    for (const operation of this.operations) {
      switch (operation.op) {
        case 'create-user': {
          const [user] = operation.args;
          const seededUser = await this.createUser(user);
          if (operation.id) this.seededUserMap.set(operation.id, seededUser);
          break;
        }
        case 'create-session': {
          const [email] = operation.args;
          await this.createUserSession(email);
          break;
        }
        case 'create-expense': {
          const [email, expense] = operation.args;
          await this.createExpense(email, expense);
          break;
        }
        default:
          throw new Error(`Unknown operation '${operation.op}'`);
      }
    }
    this.seeded = true;
  }

  async getUser(email: string): Promise<NativeUser & OAuthUser> {
    if (!this.databaseService) throw new Error('Cannot get user before init');
    const userModel = this.databaseService.getUserModel();
    const user = await userModel.findOne({ email }).lean();
    if (!user) throw new Error(`User '${email}' not present`);
    return user as any;
  }
}
