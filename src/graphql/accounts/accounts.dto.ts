/**
 * Importing npm packages
 */
import { ArgsType, Field } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@ArgsType()
export class LoginArgs {
  @Field({ description: 'Email Address of the user' })
  email: string;

  @Field({ description: 'Password of the user' })
  password: string;
}

@ArgsType()
export class RegisterArgs extends LoginArgs {
  @Field({ description: 'Full name of the user' })
  name: string;
}

@ArgsType()
export class ResetPasswordArgs {
  @Field({ description: 'Password reset code' })
  code: string;

  @Field()
  newPassword: string;
}

@ArgsType()
export class UpdatePasswordArgs {
  @Field()
  oldPassword: string;

  @Field()
  newPassword: string;
}

@ArgsType()
export class UpdateUserArgs {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  imageUrl?: string;
}
