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

export enum FictionRole {
  READER = 1 << 0,
  PREMIUM_READER = FictionRole.READER | (1 << 1),
  SCRAPER = FictionRole.PREMIUM_READER | (1 << 2),
  ADMIN = FictionRole.SCRAPER | (1 << 3),
}

export enum FictionType {
  WEBNOVEL = 1,
  FANFICTION = 2,
  ORIGINAL = 3,
}

export enum FictionGenre {
  ACTION = 1,
  ADULT = 2,
  ADVENTURE = 3,
  COMEDY = 4,
  DRAMA = 5,
  ECCHI = 6,
  FANTASY = 7,
  GENDER_BENDER = 8,
  HAREM = 9,
  HISTORICAL = 10,
  HORROR = 11,
  JOSEI = 12,
  MARTIAL_ARTS = 13,
  MATURE = 14,
  MECHA = 15,
  MYSTERY = 16,
  PSYCHOLOGICAL = 17,
  ROMANCE = 18,
  SCHOOL_LIFE = 19,
  SCI_FI = 20,
  SEINEN = 21,
  SHOUJO = 22,
  SHOUJO_AI = 23,
  SHOUNEN = 24,
  SHOUNEN_AI = 25,
  SLICE_OF_LIFE = 26,
  SMUT = 27,
  SPORTS = 28,
  SUPERNATURAL = 29,
  TRAGEDY = 30,
  WUXIA = 31,
  XIANXIA = 32,
  XUANHUAN = 33,
  YAOI = 34,
  YURI = 35,
}

export enum FictionStatus {
  COMPLETED = 1,
  ONGOING = 2,
  HIATUS = 3,
}

export enum FictionWebsite {
  WEBNOVEL = 0,
  BOXNOVEL = 1,
  NOVELFULL = 2,
  PATREON = 3,
}

export enum FictionTier {
  FREE = 1,
  PREMIUM = 2,
  PRIVATE = 3,
}
