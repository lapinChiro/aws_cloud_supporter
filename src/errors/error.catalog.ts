import type { ErrorCatalogEntry, ErrorCode } from './error.types';
import { ERROR_CODES, ErrorType } from './error.types';

export const ErrorCatalog = {
  // Metrics
  metricsNotFound: (service: string): ErrorCatalogEntry => ({
    code: ERROR_CODES.METRICS_NOT_FOUND,
    type: ErrorType.RESOURCE_ERROR,
    message: `${service} metrics configuration not found`
  }),

  // Resource
  unsupportedResourceType: (expected: string, actual: string): ErrorCatalogEntry => ({
    code: ERROR_CODES.RESOURCE_UNSUPPORTED_TYPE,
    type: ErrorType.RESOURCE_ERROR,
    message: `Only ${expected} are supported, but got ${actual}`
  }),

  // Validation
  validationFailed: (message: string): ErrorCatalogEntry => ({
    code: ERROR_CODES.VALIDATION_FAILED,
    type: ErrorType.VALIDATION_ERROR,
    message
  }),

  // File
  fileNotFound: (path: string): ErrorCatalogEntry => ({
    code: ERROR_CODES.FILE_NOT_FOUND,
    type: ErrorType.FILE_ERROR,
    message: `File not found: ${path}`
  }),

  // Common patterns
  generic: (code: ErrorCode, type: ErrorType, message: string): ErrorCatalogEntry => ({
    code,
    type,
    message
  })
};