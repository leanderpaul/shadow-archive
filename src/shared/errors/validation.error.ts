/**
 * Importing npm packages
 */

/**
 * Importing user defined packages
 */

/**
 * Defining types
 */

export interface FieldError {
  field: string;
  msg: string;
}

/**
 * Declaring the constants
 */

export class ValidationError extends Error {
  private errors: FieldError[] = [];

  constructor();
  constructor(field: string, message: string);
  constructor(field?: string, message?: string) {
    super();
    this.name = this.constructor.name;
    if (field && message) this.addFieldError(field, message);
  }

  addFieldError(field: string, msg: string): ValidationError {
    this.errors.push({ field, msg });
    return this;
  }

  getErrors(): FieldError[] {
    return this.errors;
  }

  getErrorCount(): number {
    return this.errors.length;
  }
}
