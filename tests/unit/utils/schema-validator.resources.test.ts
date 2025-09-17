// JsonSchemaValidator テスト - リソースバリデーション
// CLAUDE.md準拠: No any types、TDD実践

import {
  createSchemaValidatorTestSuite,
  assertInvalid
} from '../../helpers/schema-validator-test-template';

import { createResultWithInvalidUnsupportedResources } from './schema-validator.test-helpers';

createSchemaValidatorTestSuite('Resources Validation', [
  {
    name: 'should validate unsupported_resources as string array',
    test: (validator) => {
      const invalidResult = createResultWithInvalidUnsupportedResources();
      const result = validator.validateAnalysisResult(invalidResult);

      assertInvalid(validator, invalidResult);

      const unsupportedError = result.errors.find(err =>
        err.path?.includes('unsupported_resources')
      );
      expect(unsupportedError).toBeDefined();
    }
  }
]);