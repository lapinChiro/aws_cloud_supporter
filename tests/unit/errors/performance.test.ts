// Performance tests for error handling system (Phase 4.3)

import { performance } from 'perf_hooks';

import { Errors, ErrorBuilder, ErrorCatalog } from '../../../src/errors';

describe('Error System Performance Tests (Phase 4.3)', () => {
  // Performance benchmarks
  const PERFORMANCE_LIMITS = {
    SINGLE_ERROR_GENERATION_MS: 1, // 1ms for single error generation
    BATCH_ERROR_GENERATION_MS: 100, // 100ms for 1000 errors
    FACTORY_ERROR_OVERHEAD_MS: 0.1, // 0.1ms max overhead per factory call
    BUILDER_ERROR_OVERHEAD_MS: 0.5, // 0.5ms max overhead per builder call
    MEMORY_LEAK_THRESHOLD_MB: 10, // 10MB max memory increase
  };

  describe('Single Error Generation Performance', () => {
    it('should generate factory errors within performance limits', () => {
      const startTime = performance.now();

      // Generate various types of errors
      const lambdaError = Errors.Lambda.metricsNotFound();
      const dynamoError = Errors.DynamoDB.metricsNotFound();
      const albError = Errors.ALB.metricsNotFound();
      const commonError = Errors.Common.validationFailed('Test error');

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_LIMITS.SINGLE_ERROR_GENERATION_MS);

      // Verify errors are properly created
      expect(lambdaError).toBeDefined();
      expect(dynamoError).toBeDefined();
      expect(albError).toBeDefined();
      expect(commonError).toBeDefined();
    });

    it('should generate builder errors within performance limits', () => {
      const startTime = performance.now();

      const builderError = ErrorBuilder
        .fromCatalog(ErrorCatalog.validationFailed('Complex validation error'))
        .withFilePath('/test/path.yaml')
        .withLineNumber(42)
        .withDetails({
          resourceType: 'AWS::Lambda::Function',
          resourceId: 'TestFunction',
          reason: 'Performance test'
        })
        .build();

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_LIMITS.BUILDER_ERROR_OVERHEAD_MS);
      expect(builderError).toBeDefined();
    });
  });

  describe('Batch Error Generation Performance', () => {
    it('should handle high-volume error generation efficiently', () => {
      const startTime = performance.now();
      const errorCount = 1000;
      const errors: unknown[] = [];

      for (let i = 0; i < errorCount; i++) {
        const serviceIndex = i % 6;
        switch (serviceIndex) {
          case 0:
            errors.push(Errors.Lambda.metricsNotFound());
            break;
          case 1:
            errors.push(Errors.DynamoDB.metricsNotFound());
            break;
          case 2:
            errors.push(Errors.ALB.metricsNotFound());
            break;
          case 3:
            errors.push(Errors.ECS.metricsNotFound());
            break;
          case 4:
            errors.push(Errors.APIGateway.metricsNotFound());
            break;
          case 5:
            errors.push(Errors.Common.validationFailed(`Error ${i}`));
            break;
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_LIMITS.BATCH_ERROR_GENERATION_MS);
      expect(errors).toHaveLength(errorCount);

      // Calculate per-error overhead
      const perErrorTime = duration / errorCount;
      expect(perErrorTime).toBeLessThan(PERFORMANCE_LIMITS.FACTORY_ERROR_OVERHEAD_MS);
    });
  });

  describe('Memory Efficiency Tests', () => {
    it('should not cause memory leaks during error generation', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Generate and discard many errors
      for (let i = 0; i < 10000; i++) {
        const error = Errors.Lambda.metricsNotFound();
        // Immediately discard reference
        void error;
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // Convert to MB

      expect(memoryIncrease).toBeLessThan(PERFORMANCE_LIMITS.MEMORY_LEAK_THRESHOLD_MB);
    });

    it('should efficiently handle error object creation and disposal', () => {
      const iterations = 5000;
      const startTime = performance.now();
      const initialMemory = process.memoryUsage().heapUsed;

      for (let i = 0; i < iterations; i++) {
        // Create complex error with builder pattern
        const error = ErrorBuilder
          .fromCatalog(ErrorCatalog.validationFailed(`Test error ${i}`))
          .withFilePath(`/test/file-${i}.yaml`)
          .withLineNumber(i)
          .withDetails({
            iteration: i,
            resourceType: 'AWS::Test::Resource',
            testData: new Array(10).fill(`data-${i}`)
          })
          .build();

        // Use the error briefly
        expect(error.message).toContain(`Test error ${i}`);
      }

      const endTime = performance.now();
      const finalMemory = process.memoryUsage().heapUsed;

      const duration = endTime - startTime;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;

      // Performance assertions
      expect(duration).toBeLessThan(iterations * PERFORMANCE_LIMITS.BUILDER_ERROR_OVERHEAD_MS);
      expect(memoryIncrease).toBeLessThan(PERFORMANCE_LIMITS.MEMORY_LEAK_THRESHOLD_MB);
    });
  });

  describe('Factory Method Overhead Analysis', () => {
    const factories = [
      { name: 'Lambda', fn: () => Errors.Lambda.metricsNotFound() },
      { name: 'DynamoDB', fn: () => Errors.DynamoDB.metricsNotFound() },
      { name: 'ALB', fn: () => Errors.ALB.metricsNotFound() },
      { name: 'ECS', fn: () => Errors.ECS.metricsNotFound() },
      { name: 'APIGateway', fn: () => Errors.APIGateway.metricsNotFound() },
      { name: 'RDS', fn: () => Errors.RDS.metricsNotFound() },
      { name: 'Common', fn: () => Errors.Common.validationFailed('Test') }
    ];

    factories.forEach(({ name, fn }) => {
      it(`should have minimal overhead for ${name} factory methods`, () => {
        const iterations = 1000;
        const startTime = performance.now();

        for (let i = 0; i < iterations; i++) {
          const error = fn();
          void error; // Prevent optimization
        }

        const endTime = performance.now();
        const duration = endTime - startTime;
        const perCallOverhead = duration / iterations;

        expect(perCallOverhead).toBeLessThan(PERFORMANCE_LIMITS.FACTORY_ERROR_OVERHEAD_MS);
      });
    });
  });

  describe('Error Serialization Performance', () => {
    it('should efficiently serialize errors to JSON', () => {
      const complexError = ErrorBuilder
        .fromCatalog(ErrorCatalog.validationFailed('Complex validation error'))
        .withFilePath('/very/long/path/to/template/file/with/complex/structure.yaml')
        .withLineNumber(12345)
        .withDetails({
          resourceType: 'AWS::Lambda::Function',
          resourceId: 'VeryLongResourceIdentifierWithManyCharacters',
          validationErrors: [
            'Missing required property: Type',
            'Invalid property value: Runtime',
            'Timeout value exceeds maximum',
            'Memory value is below minimum'
          ],
          metadata: {
            templateSize: 1024 * 1024, // 1MB
            resourceCount: 500,
            processingTime: 15.67
          }
        })
        .build();

      const iterations = 1000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const json = JSON.stringify(complexError.toJSON());
        expect(json).toBeDefined();
        expect(json.length).toBeGreaterThan(0);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const perSerializationTime = duration / iterations;

      // Should serialize complex errors quickly
      expect(perSerializationTime).toBeLessThan(0.1); // 0.1ms per serialization
    });
  });

  describe('Concurrent Error Generation', () => {
    it('should handle concurrent error generation efficiently', async () => {
      const concurrentTasks = 50;
      const errorsPerTask = 100;

      const startTime = performance.now();

      const promises = Array(concurrentTasks).fill(null).map((_, taskIndex) => {
        const errors = [];
        for (let i = 0; i < errorsPerTask; i++) {
          errors.push(Errors.Lambda.invalidRuntime(`runtime-${taskIndex}-${i}`));
        }
        return errors;
      });

      const results = await Promise.all(promises);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Verify all tasks completed
      expect(results).toHaveLength(concurrentTasks);
      results.forEach(taskErrors => {
        expect(taskErrors).toHaveLength(errorsPerTask);
      });

      // Should handle concurrent generation efficiently
      const totalErrors = concurrentTasks * errorsPerTask;
      const perErrorTime = duration / totalErrors;
      expect(perErrorTime).toBeLessThan(PERFORMANCE_LIMITS.FACTORY_ERROR_OVERHEAD_MS);
    });
  });
});