// CLAUDE.md準拠ResourceExtractorテストヘルパー検証
import { readFileSync } from 'fs';
import path from 'path';

import type { CloudFormationTemplate } from '../../../src/types/cloudformation';

import { createExtractionTestFixtures, setupTempDir } from './extractor.test-helpers';

describe('テストヘルパー準備（RED段階）', () => {
  let tempDir: string;

  beforeAll(() => {
    tempDir = setupTempDir();
    // テストフィクスチャー作成
    createExtractionTestFixtures(tempDir);
  });

  // テストフィクスチャー作成確認
  it('should create mixed resources test fixture', () => {
    const mixedPath = path.join(tempDir, 'mixed-resources.json');
    const content = JSON.parse(readFileSync(mixedPath, 'utf8')) as CloudFormationTemplate;
    
    expect(content.Resources).toBeDefined();
    expect(Object.keys(content.Resources)).toHaveLength(14);
  });

  it('should create large resources test fixture', () => {
    const largePath = path.join(tempDir, 'large-resources-500.json');
    const content = JSON.parse(readFileSync(largePath, 'utf8')) as CloudFormationTemplate;
    
    expect(content.Resources).toBeDefined();
    expect(Object.keys(content.Resources)).toHaveLength(500);
  });

  it('should create ECS test cases fixture', () => {
    const ecsPath = path.join(tempDir, 'ecs-test.json');
    const content = JSON.parse(readFileSync(ecsPath, 'utf8')) as CloudFormationTemplate;
    
    expect(content.Resources.FargateService).toBeDefined();
    expect(content.Resources.EC2Service).toBeDefined();
    expect(content.Resources.FargateSpotService).toBeDefined();
  });

  it('should create Load Balancer test cases fixture', () => {
    const lbPath = path.join(tempDir, 'loadbalancer-test.json');
    const content = JSON.parse(readFileSync(lbPath, 'utf8')) as CloudFormationTemplate;
    
    expect(content.Resources.ApplicationLB).toBeDefined();
    expect(content.Resources.NetworkLB).toBeDefined();
    expect(content.Resources.DefaultLB).toBeDefined();
  });
});