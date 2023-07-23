/**
 * Importing npm packages
 */
import { UseGuards } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { DevGuard, type Role, type Service } from '@app/shared/guards';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

export function UseDevGuard(): MethodDecorator & ClassDecorator;
export function UseDevGuard(service: Service, role: Role): MethodDecorator & ClassDecorator;
export function UseDevGuard(service?: Service, role?: Role): MethodDecorator & ClassDecorator {
  if (service === undefined || role === undefined) return UseGuards(DevGuard());
  return UseGuards(DevGuard(service, role));
}
