// tests/unit/cdk/template-official.test.ts (新規作成)
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import type * as sns from 'aws-cdk-lib/aws-sns';
import * as Handlebars from 'handlebars';

import { CDKOfficialHandlebarsHelpers } from '../../../src/templates/handlebars-official-helpers';

describe('CDK Official Handlebars Template', () => {
  beforeEach(() => {
    // ヘルパーを登録
    CDKOfficialHandlebarsHelpers.registerHelpers();
  });

  describe('Handlebars Helpers', () => {
    it('should render dimensions map correctly', () => {
      const dimensionsMap: cloudwatch.DimensionsMap = {
        DBInstanceIdentifier: 'test-db',
        ResourceId: 'test-resource'
      };

      const result = CDKOfficialHandlebarsHelpers.renderDimensionsMap(dimensionsMap);
      
      expect(result).toContain('DBInstanceIdentifier: "test-db"');
      expect(result).toContain('ResourceId: "test-resource"');
      expect(result).toMatch(/\{[\s\S]*\}/); // Contains curly braces
    });

    it('should render complete metric correctly', () => {
      const metricConfig = {
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        dimensionsMap: { DBInstanceIdentifier: 'test-db' },
        statistic: 'Average',
        period: { seconds: 300 }
      };

      const result = CDKOfficialHandlebarsHelpers.renderCompleteMetric(metricConfig);
      
      expect(result).toContain("new cloudwatch.Metric({");
      expect(result).toContain('metricName: "CPUUtilization"');
      expect(result).toContain('namespace: "AWS/RDS"');
      expect(result).toContain('statistic: "Average"');
      expect(result).toContain("cdk.Duration.seconds(300)");
    });

    it('should render TreatMissingData correctly', () => {
      const result = CDKOfficialHandlebarsHelpers.renderTreatMissingData(
        cloudwatch.TreatMissingData.NOT_BREACHING
      );
      
      expect(result).toBe('cloudwatch.TreatMissingData.NOT_BREACHING');
    });

    it('should render ComparisonOperator correctly', () => {
      const result = CDKOfficialHandlebarsHelpers.renderComparisonOperator(
        cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
      );
      
      expect(result).toBe('cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD');
    });

    it('should render TopicProps correctly', () => {
      const topicProps: sns.TopicProps = {
        topicName: 'alarm-notifications',
        displayName: 'Alarm Notifications'
      };

      const result = CDKOfficialHandlebarsHelpers.renderTopicProps(topicProps);
      
      expect(result).toContain('topicName: "alarm-notifications"');
      expect(result).toContain('displayName: "Alarm Notifications"');
      expect(result).toMatch(/\{[\s\S]*\}/); // Contains curly braces
    });

    it('should process metric for template correctly', () => {
      const metric = new cloudwatch.Metric({
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        dimensionsMap: { DBInstanceIdentifier: 'test-db' }
      });

      // 型アサーションを使用して型安全性を確保
      const result = CDKOfficialHandlebarsHelpers.processMetricForTemplate(metric) as {
        metricName: string;
        namespace: string;
        dimensionsMap: Record<string, string>;
        statistic: string;
        period: { seconds: number };
      };
      
      // MetricConfigの実際の構造をログ出力して確認
      console.log('Processed metric result:', result);
      
      // より具体的なアサーションを使用
      expect(typeof result.metricName).toBe('string');
      expect(typeof result.namespace).toBe('string');
      expect(typeof result.dimensionsMap).toBe('object');
      expect(typeof result.statistic).toBe('string');
      expect(typeof result.period).toBe('object');
      expect(typeof result.period.seconds).toBe('number');
      
      // 具体的な値もテスト
      expect(result.metricName).toBe('CPUUtilization');
      expect(result.namespace).toBe('AWS/RDS');
      expect(result.dimensionsMap).toEqual({ DBInstanceIdentifier: 'test-db' });
    });
  });

  describe('Template Integration', () => {
    it('should render basic template with official types', () => {
      const templateSource = `
{{#if snsConfiguration}}
SNS Topic: {{snsConfiguration.variableName}}
{{/if}}
{{#each alarms}}
Alarm: {{constructId}}
Metric: {{renderCompleteMetric metricForTemplate}}
{{/each}}
`;

      const template = Handlebars.compile(templateSource);
      const templateData = {
        alarms: [{
          constructId: 'TestAlarm',
          metricForTemplate: {
            metricName: 'CPUUtilization',
            namespace: 'AWS/RDS',
            dimensionsMap: { DBInstanceIdentifier: 'test' },
            statistic: 'Average',
            period: { seconds: 300 }
          }
        }],
        snsConfiguration: {
          variableName: 'alarmTopic'
        }
      };

      const result = template(templateData);
      
      expect(result).toContain('SNS Topic: alarmTopic');
      expect(result).toContain('Alarm: TestAlarm');
      expect(result).toContain('new cloudwatch.Metric({');
    });
  });
});