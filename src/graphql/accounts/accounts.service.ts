/**
 * Importing npm packages
 */
import sagus from 'sagus';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

/**
 * Importing user defined packages
 */
import { NativeUser, ContextService } from '@app/providers';
import { AppError } from '@app/shared/errors';
import { AuthService } from '@app/shared/modules';

/**
 * Importing and defining types
 */
import type { NativeUserModel } from '@app/providers';

/**
 * Declaring the constants
 */

@Injectable()
export class AccountsService {
  constructor(@InjectModel(NativeUser.name) private nativeUserModel: NativeUserModel, private authService: AuthService, private contextService: ContextService) {}

  getUser() {
    return this.contextService.getCurrentUser(true);
  }

  async loginUser(email: string, password: string) {
    const user = await this.nativeUserModel.findOne({ email }).lean();
    if (!user) throw new AppError('CLIENT_ERROR', "User account doesn't exist");
    const isValidPassword = await sagus.compareHash(password, user.password);
    if (!isValidPassword) throw new AppError('CLIENT_ERROR', 'User email address or password is incorrect');
    const session = await this.authService.initUserSession(user);
    this.contextService.setCurrentUser(user);
    this.contextService.setCurrentSession(session);
    return user;
  }

  registerUser(email: string, password: string, name: string) {
    return this.authService.createUser({ email, password, name, createSession: true });
  }

  logoutUser(clearAllSessions: boolean) {
    const user = this.getUser();
    const session = this.contextService.getCurrentSession(true);
    return this.authService.removeSession(user, clearAllSessions ? '*' : session.id);
  }

  getCSRFToken() {
    const user = this.getUser();
    return this.authService.generateCSRFToken(user.uid);
  }
}
