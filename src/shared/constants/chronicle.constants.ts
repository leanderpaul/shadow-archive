/**
 * Importing npm packages
 */

/**
 * Importing user defined packages
 */

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

export enum ChronicleRole {
  USER = 1 << 0,
  ADMIN = ChronicleRole.USER | (1 << 1),
}

export enum Currency {
  INR = 1,
  GBP = 2,
}

export enum ExpenseCategory {
  UNKNOWN = 0,
  BILLS = 1,
  CHARITY = 2,
  EATING_OUT = 3,
  ENTERTAINMENT = 4,
  FAMILY = 5,
  GENERAL = 6,
  GROCERIES = 7,
  GIFTS = 8,
  HOLIDAYS = 9,
  PERSONAL_CARE = 10,
  SHOPPING = 11,
  TRANSPORT = 12,
}

export enum ExpenseVisibiltyLevel {
  STANDARD = 0,
  HIDDEN = 1,
  DISGUISE = -1,
}

export enum ActivityType {
  ANIME = 'ANIME',
  CODING = 'CODING',
  MOVIE = 'MOVIE',
  VIDEO = 'VIDEO',
  WEBNOVEL = 'WEBNOVEL',
}
