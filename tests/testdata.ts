/**
 * Importing npm packages
 */
import sagus from 'sagus';
import bcrypt from 'bcrypt';

import { Types } from 'mongoose';

/**
 * Importing user defined packages
 */

/**
 * Defining types
 */
import type { NativeUser, OAuthUser, UserSession } from '@app/providers/database';

export type SampleUserEmail = keyof typeof sampleUsers;

/**
 * Declaring the constants
 */

type IUser = (Omit<NativeUser, 'sessions' | 'createdAt' | 'updatedAt'> | Omit<OAuthUser, 'sessions' | 'createdAt' | 'updatedAt'>) & { sessions: readonly UserSession[] };

const password = bcrypt.hashSync('Password@123', 10);

export const sampleUsers = {
  'sample-user-1@mail.com': {
    _id: new Types.ObjectId('640dd64b137b480b9cabf3b1'),
    uid: '640dd64b137b480b9cabf3b1',
    email: 'sample-user-1@mail.com',
    name: 'Sample User One',
    sessions: [{ id: sagus.genRandom(32, 'base64'), expireAt: new Date('2100-12-31') }],
    type: 'NativeUser',
    verified: false,
    emailVerificationCode: '77fd709d8ee2ad70b0539a8d659c43a3',
    password,
  },
  'sample-user-2@mail.com': {
    _id: new Types.ObjectId('640dd64b137b480b9cabf3b2'),
    uid: '640dd64b137b480b9cabf3b2',
    email: 'sample-user-2@mail.com',
    name: 'Sample User Two',
    sessions: [{ id: sagus.genRandom(32, 'base64'), expireAt: new Date('2100-12-31') }],
    type: 'NativeUser',
    verified: true,
    password,
  },
  'sample-user-3@mail.com': {
    _id: new Types.ObjectId('640dd64b137b480b9cabf3b3'),
    uid: '640dd64b137b480b9cabf3b3',
    email: 'sample-user-3@mail.com',
    name: 'Sample User Three',
    sessions: [{ id: sagus.genRandom(32, 'base64'), expireAt: new Date() }],
    type: 'NativeUser',
    verified: true,
    password,
  },
  'sample-user-4@mail.com': {
    _id: new Types.ObjectId('640dd64b137b480b9cabf3b4'),
    uid: '640dd64b137b480b9cabf3b4',
    email: 'sample-user-4@mail.com',
    name: 'Sample User Four',
    sessions: [{ id: sagus.genRandom(32, 'base64'), expireAt: new Date('2100-12-31') }],
    type: 'NativeUser',
    verified: true,
    password,
  },
  'sample-user-5@mail.com': {
    _id: new Types.ObjectId('640dd64b137b480b9cabf3b5'),
    uid: '640dd64b137b480b9cabf3b5',
    email: 'sample-user-5@mail.com',
    name: 'Sample User Five',
    sessions: [{ id: sagus.genRandom(32, 'base64'), expireAt: new Date('2100-12-31') }],
    type: 'NativeUser',
    verified: true,
    password,
  },
} as const satisfies Record<string, IUser>;
