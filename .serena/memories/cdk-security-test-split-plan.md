# CDK Security Test File Split Plan

## 現在の状況
- cdk-security.test.ts: 433行（エラー）
- 9つのdescribeブロックに分かれている

## 分割計画
1. **cdk-security.sanitization.test.ts**
   - Sensitive Data Sanitization (11-119行)
   
2. **cdk-security.validation.test.ts**
   - Input Validation - Path Traversal Prevention (121-171行)
   - SNS ARN Validation (173-206行)
   - Stack Name Validation (208-241行)
   - Template Size Validation (243-269行)
   
3. **cdk-security.generated-code.test.ts**
   - Generated Code Security Validation (271-312行)
   - Comprehensive Option Validation (314-349行)
   
4. **cdk-security.edge-cases.test.ts**
   - Sanitization Reporting (351-381行)
   - Security Edge Cases (383-441行)

## 期待される結果
- 各ファイルは150-200行程度に収まる
- テストの論理的なグループ化が改善される
- 保守性が向上する