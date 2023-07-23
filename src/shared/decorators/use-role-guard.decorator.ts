/**
 * Importing npm packages
 */
import { UseGuards } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { type Role, RoleGuard, type Service } from '@app/shared/guards';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

export const UseRoleGuard = (service: Service, role: Role): MethodDecorator & ClassDecorator => UseGuards(RoleGuard(service, role));
