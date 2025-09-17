import { ErrorBuilder } from '../error.builder';
import { ErrorCatalog } from '../error.catalog';
import type { CloudSupporterError } from '../error.class';
import { ERROR_CODES, ErrorType } from '../error.types';
import type { ErrorDetails } from '../error.types';

export const CommonErrors = {
  fileNotFound: (path: string): CloudSupporterError =>
    ErrorBuilder.fromCatalog(ErrorCatalog.fileNotFound(path))
      .withFilePath(path)
      .build(),

  validationFailed: (message: string, details?: ErrorDetails): CloudSupporterError => {
    const builder = ErrorBuilder.fromCatalog(ErrorCatalog.validationFailed(message));
    if (details) {
      builder.withDetails(details);
    }
    return builder.build();
  },

  fileReadError: (path: string, reason: string): CloudSupporterError =>
    ErrorBuilder.fromCatalog(
      ErrorCatalog.generic(
        ERROR_CODES.FILE_READ_ERROR,
        ErrorType.FILE_ERROR,
        `Failed to read file ${path}: ${reason}`
      )
    )
    .withFilePath(path)
    .withDetails({ reason })
    .build(),

  outputError: (message: string, details?: ErrorDetails): CloudSupporterError => {
    const builder = ErrorBuilder.fromCatalog(
      ErrorCatalog.generic(
        ERROR_CODES.OUTPUT_ERROR,
        ErrorType.OUTPUT_ERROR,
        message
      )
    );
    if (details) {
      builder.withDetails(details);
    }
    return builder.build();
  },

  parseError: (message: string, filePath?: string, lineNumber?: number, details?: ErrorDetails): CloudSupporterError => {
    const builder = ErrorBuilder.fromCatalog(
      ErrorCatalog.generic(
        ERROR_CODES.PARSE_ERROR,
        ErrorType.PARSE_ERROR,
        message
      )
    );
    if (filePath) {
      builder.withFilePath(filePath);
    }
    if (lineNumber) {
      builder.withLineNumber(lineNumber);
    }
    if (details) {
      builder.withDetails(details);
    }
    return builder.build();
  },

  fileWriteError: (path: string, format: string, error: string): CloudSupporterError =>
    ErrorBuilder.fromCatalog(
      ErrorCatalog.generic(
        ERROR_CODES.FILE_WRITE_ERROR,
        ErrorType.FILE_ERROR,
        `Failed to write ${format} file`
      )
    )
    .withFilePath(path)
    .withDetails({ filePath: path, error })
    .build(),

  resourceUnsupportedType: (resourceType: string, supportedTypes: string[]): CloudSupporterError =>
    ErrorBuilder.fromCatalog(
      ErrorCatalog.generic(
        ERROR_CODES.RESOURCE_UNSUPPORTED_TYPE,
        ErrorType.RESOURCE_ERROR,
        `Unsupported resource type: ${resourceType}`
      )
    )
    .withDetails({ resourceType, supportedTypes })
    .build()
} as const;