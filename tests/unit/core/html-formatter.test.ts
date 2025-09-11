// HTMLOutputFormatter単体テスト
// CLAUDE.md準拠: No any types、TDD実践

import { HTMLOutputFormatter } from '../../../src/core/html-formatter';
import type { AnalysisResult } from '../../../src/types/metrics';

describe('HTMLOutputFormatter', () => {
  let formatter: HTMLOutputFormatter;
  let mockResult: AnalysisResult;

  beforeEach(() => {
    formatter = new HTMLOutputFormatter();
    
    // Mock analysis result
    mockResult = {
      metadata: {
        version: '1.0.0',
        generated_at: '2024-01-01T00:00:00Z',
        template_path: '/path/to/template.yaml',
        total_resources: 2,
        supported_resources: 2,
        processing_time_ms: 1234,
        parse_time_ms: 100,
        extract_time_ms: 200,
        generator_time_ms: 900,
        total_time_ms: 1234,
        memory_peak_mb: 100
      },
      resources: [
        {
          logical_id: 'MyDatabase',
          resource_type: 'AWS::RDS::DBInstance',
          resource_properties: {
            DBInstanceClass: 'db.t3.medium',
            Engine: 'mysql',
            MasterUserPassword: '[REDACTED]'
          },
          metrics: [
            {
              metric_name: 'CPUUtilization',
              namespace: 'AWS/RDS',
              unit: 'Percent',
              description: 'CPU使用率',
              statistic: 'Average',
              recommended_threshold: { warning: 70, critical: 90 },
              evaluation_period: 300,
              category: 'Performance',
              importance: 'High',
              dimensions: [{ name: 'DBInstanceIdentifier', value: 'MyDatabase' }]
            },
            {
              metric_name: 'ReadLatency',
              namespace: 'AWS/RDS',
              unit: 'Seconds',
              description: '読み取りレイテンシー',
              statistic: 'Average',
              recommended_threshold: { warning: 0.02, critical: 0.05 },
              evaluation_period: 300,
              category: 'Latency',
              importance: 'Medium',
              dimensions: [{ name: 'DBInstanceIdentifier', value: 'MyDatabase' }]
            }
          ]
        },
        {
          logical_id: 'MyFunction',
          resource_type: 'AWS::Lambda::Function',
          resource_properties: {
            Runtime: 'nodejs20.x',
            MemorySize: 512
          },
          metrics: [
            {
              metric_name: 'Errors',
              namespace: 'AWS/Lambda',
              unit: 'Count',
              description: 'エラー数',
              statistic: 'Sum',
              recommended_threshold: { warning: 5, critical: 10 },
              evaluation_period: 300,
              category: 'Error',
              importance: 'High',
              dimensions: [{ name: 'FunctionName', value: 'MyFunction' }]
            },
            {
              metric_name: 'Duration',
              namespace: 'AWS/Lambda',
              unit: 'Milliseconds',
              description: '実行時間',
              statistic: 'Average',
              recommended_threshold: { warning: 1000, critical: 3000 },
              evaluation_period: 300,
              category: 'Performance',
              importance: 'Low',
              dimensions: [{ name: 'FunctionName', value: 'MyFunction' }]
            }
          ]
        }
      ],
      unsupported_resources: ['UnsupportedResource1', 'UnsupportedResource2']
    };
  });

  describe('formatHTML', () => {
    test('should generate valid HTML structure', async () => {
      const html = await formatter.formatHTML(mockResult);

      // Basic HTML structure
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="ja">');
      expect(html).toContain('<head>');
      expect(html).toContain('<body>');
      expect(html).toContain('</html>');
      
      // Meta tags
      expect(html).toContain('<meta charset="UTF-8">');
      expect(html).toContain('<meta name="viewport"');
      
      // Title
      expect(html).toContain('<title>CloudWatch Metrics Report</title>');
    });

    test('should include all CSS styles', async () => {
      const html = await formatter.formatHTML(mockResult);

      // CSS should be embedded
      expect(html).toContain('<style>');
      expect(html).toContain('.container');
      expect(html).toContain('.resource-card');
      expect(html).toContain('.importance-high');
      expect(html).toContain('.importance-medium');
      expect(html).toContain('.importance-low');
      expect(html).toContain('.category-performance');
      expect(html).toContain('.category-error');
      expect(html).toContain('.category-latency');
      
      // Responsive styles
      expect(html).toContain('@media (max-width: 768px)');
    });

    test('should include JavaScript functionality', async () => {
      const html = await formatter.formatHTML(mockResult);

      // JavaScript should be embedded
      expect(html).toContain('<script>');
      expect(html).toContain('applyFilters');
      expect(html).toContain('searchInput');
      expect(html).toContain('importanceFilter');
      expect(html).toContain('categoryFilter');
      
      // Event listeners
      expect(html).toContain("addEventListener('input'");
      expect(html).toContain("addEventListener('change'");
      expect(html).toContain('toggleMetrics');
    });

    test('should display metadata correctly', async () => {
      const html = await formatter.formatHTML(mockResult);

      expect(html).toContain('Generated: ');
      expect(html).toContain('2024年1月1日');
      expect(html).toContain('Resources: 2/2');
      expect(html).toContain('Processing: 1234ms');
      expect(html).toContain('Memory: 100MB');
    });

    test('should render resource cards with metrics', async () => {
      const html = await formatter.formatHTML(mockResult);

      // Resource cards
      expect(html).toContain('MyDatabase');
      expect(html).toContain('AWS::RDS::DBInstance');
      expect(html).toContain('MyFunction');
      expect(html).toContain('AWS::Lambda::Function');
      
      // Metrics
      expect(html).toContain('CPUUtilization');
      expect(html).toContain('ReadLatency');
      expect(html).toContain('Errors');
      expect(html).toContain('Duration');
      
      // Thresholds
      expect(html).toContain('Warning: 70%');
      expect(html).toContain('Critical: 90%');
    });

    test('should apply importance styles', async () => {
      const html = await formatter.formatHTML(mockResult);

      expect(html).toContain('importance-high');
      expect(html).toContain('importance-medium');
      expect(html).toContain('importance-low');
    });

    test('should apply category badges', async () => {
      const html = await formatter.formatHTML(mockResult);

      expect(html).toContain('category-badge category-performance');
      expect(html).toContain('category-badge category-latency');
      expect(html).toContain('category-badge category-error');
    });

    test('should handle unsupported resources', async () => {
      const html = await formatter.formatHTML(mockResult);

      expect(html).toContain('Unsupported Resources');
      expect(html).toContain('UnsupportedResource1');
      expect(html).toContain('UnsupportedResource2');
      expect(html).toContain('2 resources were not supported');
    });

    test('should handle empty results', async () => {
      const emptyResult: AnalysisResult = {
        ...mockResult,
        resources: [],
        unsupported_resources: []
      };

      const html = await formatter.formatHTML(emptyResult);
      
      expect(html).toContain('No supported resources found');
      expect(html).not.toContain('Unsupported Resources');
    });

    test('should escape HTML in resource names', async () => {
      const resultWithHtml: AnalysisResult = {
        ...mockResult,
        resources: [{
          logical_id: '<script>alert("xss")</script>',
          resource_type: 'AWS::RDS::DBInstance',
          resource_properties: {},
          metrics: []
        }]
      };

      const html = await formatter.formatHTML(resultWithHtml);
      
      expect(html).not.toContain('<script>alert("xss")</script>');
      expect(html).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    test('should format numbers correctly', async () => {
      const html = await formatter.formatHTML(mockResult);

      // Thresholds
      expect(html).toContain('0.02s'); // ReadLatency warning
      expect(html).toContain('0.05s'); // ReadLatency critical
      expect(html).toContain('1,000ms'); // Duration warning
      expect(html).toContain('3,000ms'); // Duration critical
    });

    test('should include search and filter controls', async () => {
      const html = await formatter.formatHTML(mockResult);

      // Search input
      expect(html).toContain('<input type="text" id="searchInput"');
      expect(html).toContain('placeholder="🔍 Search metrics..."');
      
      // Importance filter
      expect(html).toContain('<select id="importanceFilter"');
      expect(html).toContain('<option value="">All Importance Levels</option>');
      expect(html).toContain('<option value="High">High</option>');
      
      // Category filter
      expect(html).toContain('<select id="categoryFilter"');
      expect(html).toContain('<option value="">All Categories</option>');
      expect(html).toContain('<option value="Performance">Performance</option>');
    });

    test('should handle metrics without dimensions', async () => {
      const resultNoDims: AnalysisResult = {
        ...mockResult,
        resources: [{
          logical_id: 'Test',
          resource_type: 'AWS::Lambda::Function',
          resource_properties: {},
          metrics: [{
            metric_name: 'TestMetric',
            namespace: 'AWS/Lambda',
            unit: 'Count',
            description: 'Test',
            statistic: 'Sum',
            recommended_threshold: { warning: 1, critical: 2 },
            evaluation_period: 300,
            category: 'Performance',
            importance: 'High'
          }]
        }]
      };

      const html = await formatter.formatHTML(resultNoDims);
      expect(html).toContain('TestMetric');
      // Should still render without errors
    });

    test('should complete within performance limits', async () => {
      const largeResult: AnalysisResult = {
        ...mockResult,
        resources: Array(100).fill(null).map((_, i) => ({
          logical_id: `Resource${i}`,
          resource_type: 'AWS::Lambda::Function',
          resource_properties: {},
          metrics: Array(20).fill(null).map((_, j) => ({
            metric_name: `Metric${j}`,
            namespace: 'AWS/Lambda',
            unit: 'Count',
            description: 'Test metric',
            statistic: 'Sum',
            recommended_threshold: { warning: 5, critical: 10 },
            evaluation_period: 300,
            category: 'Performance',
            importance: 'High',
            dimensions: []
          }))
        }))
      };

      const startTime = Date.now();
      await formatter.formatHTML(largeResult);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(3000); // 3 seconds max
    });
  });
});