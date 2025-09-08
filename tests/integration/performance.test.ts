// Performance Tests for Large Scale Templates
// CLAUDE.md準拠: No any types、TDD実践

import { MetricsAnalyzer } from '../../src/core/analyzer';
import { TemplateParser } from '../../src/core/parser';
import { JSONOutputFormatter } from '../../src/core/json-formatter';
import { HTMLOutputFormatter } from '../../src/core/html-formatter';
import { Logger } from '../../src/utils/logger';
import { AnalysisOptions } from '../../src/types/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { performance } from 'perf_hooks';

// Memory usage tracking
interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

function getMemoryUsage(): MemoryMetrics {
  const usage = process.memoryUsage();
  return {
    heapUsed: usage.heapUsed / 1024 / 1024, // MB
    heapTotal: usage.heapTotal / 1024 / 1024, // MB
    external: usage.external / 1024 / 1024, // MB
    rss: usage.rss / 1024 / 1024 // MB
  };
}

describe('Performance Tests', () => {
  let analyzer: MetricsAnalyzer;
  const FIXTURES_PATH = path.join(__dirname, '..', 'fixtures', 'templates');
  
  beforeAll(() => {
    const parser = new TemplateParser();
    const logger = new Logger('error', false);
    analyzer = new MetricsAnalyzer(parser, logger);
  });

  beforeEach(() => {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });

  describe('Large Template Performance', () => {
    test('Should process 478 resources within performance limits', async () => {
      const templatePath = path.join(FIXTURES_PATH, 'large-template-500-resources.yaml');
      
      // Memory before
      const memBefore = getMemoryUsage();
      const startTime = performance.now();
      
      const result = await analyzer.analyze(templatePath, {
        outputFormat: 'json',
        concurrency: 6
      });
      
      // Timing metrics
      const totalTime = performance.now() - startTime;
      const memAfter = getMemoryUsage();
      const memoryDelta = memAfter.heapUsed - memBefore.heapUsed;
      
      // Performance assertions
      expect(totalTime).toBeLessThan(30000); // 30 seconds
      expect(memoryDelta).toBeLessThan(256); // 256MB delta
      expect(result.metadata.processing_time_ms).toBeLessThan(30000);
      
      // Resource processing metrics
      const resourcesPerSecond = (result.resources.length / totalTime) * 1000;
      const metricsGenerated = result.resources.reduce((sum, r) => sum + r.metrics.length, 0);
      const metricsPerSecond = (metricsGenerated / totalTime) * 1000;
      
      console.log('=== Performance Test Results ===');
      console.log(`Total Resources: ${result.metadata.total_resources}`);
      console.log(`Supported Resources: ${result.resources.length}`);
      console.log(`Total Metrics Generated: ${metricsGenerated}`);
      console.log(`Total Time: ${totalTime.toFixed(2)}ms`);
      console.log(`Resources/Second: ${resourcesPerSecond.toFixed(2)}`);
      console.log(`Metrics/Second: ${metricsPerSecond.toFixed(2)}`);
      console.log(`Memory Delta: ${memoryDelta.toFixed(2)}MB`);
      console.log(`Peak Memory: ${memAfter.heapUsed.toFixed(2)}MB`);
      console.log('==============================');
      
      // Minimum performance thresholds
      expect(resourcesPerSecond).toBeGreaterThan(10); // At least 10 resources/second
      expect(metricsPerSecond).toBeGreaterThan(100); // At least 100 metrics/second
    });

    test('Should maintain consistent performance with different concurrency levels', async () => {
      const templatePath = path.join(FIXTURES_PATH, 'large-template-500-resources.yaml');
      const concurrencyLevels = [1, 3, 6, 10];
      const results: Array<{concurrency: number; time: number; memory: number}> = [];
      
      for (const concurrency of concurrencyLevels) {
        const memBefore = getMemoryUsage();
        const startTime = performance.now();
        
        const result = await analyzer.analyze(templatePath, {
          outputFormat: 'json',
          concurrency
        });
        
        const time = performance.now() - startTime;
        const memAfter = getMemoryUsage();
        
        results.push({
          concurrency,
          time,
          memory: memAfter.heapUsed - memBefore.heapUsed
        });
        
        // All concurrency levels should meet basic requirements
        expect(time).toBeLessThan(30000);
        expect(result.resources.length).toBeGreaterThan(300);
      }
      
      console.log('=== Concurrency Performance Comparison ===');
      results.forEach(r => {
        console.log(`Concurrency ${r.concurrency}: ${r.time.toFixed(0)}ms, Memory: ${r.memory.toFixed(2)}MB`);
      });
      console.log('========================================');
      
      // Higher concurrency should generally be faster
      const single = results.find(r => r.concurrency === 1)!;
      const parallel = results.find(r => r.concurrency === 10)!;
      expect(parallel.time).toBeLessThan(single.time * 0.8); // At least 20% faster
    });
  });

  describe('Memory Management', () => {
    test('Should respect memory limits and fail gracefully', async () => {
      const templatePath = path.join(FIXTURES_PATH, 'large-template-500-resources.yaml');
      
      // Get current memory usage as baseline
      const baselineMemory = process.memoryUsage().heapUsed;
      const restrictiveLimit = 5 * 1024 * 1024; // Very restrictive 5MB limit
      
      console.log(`Baseline memory: ${(baselineMemory / 1024 / 1024).toFixed(1)}MB, Setting very restrictive limit: ${(restrictiveLimit / 1024 / 1024).toFixed(1)}MB`);
      
      // Test with very restrictive limit (should fail immediately)
      await expect(analyzer.analyze(templatePath, {
        outputFormat: 'json',
        memoryLimit: restrictiveLimit
      })).rejects.toThrow(/Memory usage (already exceeds limit|exceeded)/);
      
      // Test with generous limit (should succeed)
      const result = await analyzer.analyze(templatePath, {
        outputFormat: 'json',
        memoryLimit: 256 * 1024 * 1024 // 256MB
      });
      
      expect(result.resources.length).toBeGreaterThan(300);
    });

    test('Should not have memory leaks in repeated operations', async () => {
      const templatePath = path.join(FIXTURES_PATH, 'web-app-complete.yaml');
      const iterations = 10;
      const memoryReadings: number[] = [];
      
      // Run multiple times and track memory
      for (let i = 0; i < iterations; i++) {
        if (global.gc) global.gc();
        
        await analyzer.analyze(templatePath, {
          outputFormat: 'json'
        });
        
        const memory = getMemoryUsage();
        memoryReadings.push(memory.heapUsed);
      }
      
      // Check for memory leak indicators
      const firstReading = memoryReadings[0];
      const lastReading = memoryReadings[memoryReadings.length - 1];
      const memoryGrowth = lastReading - firstReading;
      
      console.log('=== Memory Leak Test ===');
      console.log(`Initial Memory: ${firstReading.toFixed(2)}MB`);
      console.log(`Final Memory: ${lastReading.toFixed(2)}MB`);
      console.log(`Growth: ${memoryGrowth.toFixed(2)}MB over ${iterations} iterations`);
      console.log('=======================');
      
      // Memory growth should be minimal
      expect(memoryGrowth).toBeLessThan(50); // Less than 50MB growth
    });
  });

  describe('Output Generation Performance', () => {
    test('Should generate large JSON outputs efficiently', async () => {
      const templatePath = path.join(FIXTURES_PATH, 'large-template-500-resources.yaml');
      
      // Analyze first
      const analysisResult = await analyzer.analyze(templatePath, {
        outputFormat: 'json'
      });
      
      // Time JSON generation
      const jsonFormatter = new JSONOutputFormatter();
      const jsonStartTime = performance.now();
      const jsonOutput = await jsonFormatter.format(analysisResult);
      const jsonTime = performance.now() - jsonStartTime;
      
      // Check performance
      expect(jsonTime).toBeLessThan(2000); // 2 seconds for JSON
      expect(jsonOutput.length).toBeGreaterThan(100000); // Should be large output
      
      console.log(`JSON generation: ${jsonTime.toFixed(0)}ms for ${(jsonOutput.length / 1024).toFixed(0)}KB`);
      
      // Verify JSON is valid
      expect(() => JSON.parse(jsonOutput)).not.toThrow();
    });

    test('Should generate large HTML outputs efficiently', async () => {
      const templatePath = path.join(FIXTURES_PATH, 'large-template-500-resources.yaml');
      
      // Analyze first
      const analysisResult = await analyzer.analyze(templatePath, {
        outputFormat: 'html'
      });
      
      // Time HTML generation
      const htmlFormatter = new HTMLOutputFormatter();
      const htmlStartTime = performance.now();
      const htmlOutput = await htmlFormatter.format(analysisResult);
      const htmlTime = performance.now() - htmlStartTime;
      
      // Check performance
      expect(htmlTime).toBeLessThan(3000); // 3 seconds for HTML
      expect(htmlOutput.length).toBeGreaterThan(500000); // Should be large output
      
      console.log(`HTML generation: ${htmlTime.toFixed(0)}ms for ${(htmlOutput.length / 1024).toFixed(0)}KB`);
      
      // Verify HTML structure
      expect(htmlOutput).toContain('<!DOCTYPE html>');
      expect(htmlOutput).toContain('resource-card');
      expect(htmlOutput).toContain('searchInput');
    });
  });

  describe('Stress Testing', () => {
    test('Should handle rapid successive requests', async () => {
      const templatePath = path.join(FIXTURES_PATH, 'minimal-lambda.yaml');
      const requestCount = 20;
      
      const startTime = performance.now();
      
      // Fire off many requests simultaneously
      const promises = Array(requestCount).fill(null).map((_, index) => 
        analyzer.analyze(templatePath, {
          outputFormat: 'json',
          concurrency: 3
        })
      );
      
      const results = await Promise.all(promises);
      const totalTime = performance.now() - startTime;
      
      // All should succeed
      expect(results).toHaveLength(requestCount);
      results.forEach(result => {
        expect(result.resources).toHaveLength(1);
        expect(result.resources[0].resource_type).toBe('AWS::Lambda::Function');
      });
      
      console.log(`Processed ${requestCount} requests in ${totalTime.toFixed(0)}ms`);
      console.log(`Average time per request: ${(totalTime / requestCount).toFixed(0)}ms`);
    });

    test('Should handle mixed template sizes efficiently', async () => {
      const templates = [
        { name: 'minimal', path: path.join(FIXTURES_PATH, 'minimal-lambda.yaml'), expectedResources: 1 },
        { name: 'web-app', path: path.join(FIXTURES_PATH, 'web-app-complete.yaml'), expectedResources: 6 },
        { name: 'serverless', path: path.join(FIXTURES_PATH, 'serverless-application.yaml'), expectedResources: 3 },
        { name: 'large', path: path.join(FIXTURES_PATH, 'large-template-500-resources.yaml'), expectedResources: 300 }
      ];
      
      const results: Array<{
        name: string;
        resources: number;
        metrics: number;
        time: number;
        memory: number;
      }> = [];
      
      for (const template of templates) {
        const startTime = performance.now();
        const memBefore = getMemoryUsage();
        
        const result = await analyzer.analyze(template.path, {
          outputFormat: 'json',
          concurrency: 6
        });
        
        const time = performance.now() - startTime;
        const memAfter = getMemoryUsage();
        
        results.push({
          name: template.name,
          resources: result.resources.length,
          metrics: result.resources.reduce((sum, r) => sum + r.metrics.length, 0),
          time,
          memory: memAfter.heapUsed - memBefore.heapUsed
        });
        
        expect(result.resources.length).toBeGreaterThanOrEqual(template.expectedResources);
      }
      
      console.log('=== Mixed Template Performance ===');
      console.table(results);
      console.log('=================================');
    });
  });
});