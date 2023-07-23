/**
 * Importing npm packages
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { ChronicleRole } from '@app/shared/constants';

/**
 * Importing user defined packages
 */

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

/**
 * @class
 * Contains all the metadata related details related for the chronicle app
 */
@Schema({ _id: false })
export class ChronicleUser {
  /** User's role in the chronicle app */
  @Prop({
    type: 'number',
    required: true,
    enum: Object.values(ChronicleRole).filter(v => typeof v === 'number'),
    default: ChronicleRole.USER,
  })
  role: ChronicleRole;

  /** Difference between the expense security level 1 and -1  */
  @Prop({
    type: 'number',
    required: true,
    default: 0,
    set: (val: number) => Math.round(val),
  })
  deviation: number;

  /** Array containg payment methods associated with the user */
  @Prop({
    type: ['string'],
    required: true,
  })
  paymentMethods: string[];
}

export const ChronicleUserSchema = SchemaFactory.createForClass(ChronicleUser);
