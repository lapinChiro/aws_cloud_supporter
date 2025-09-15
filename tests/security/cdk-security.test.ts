// CLAUDE.md準拠: Test-Driven Development (TDD) + セキュリティ重視
// tasks.md T-009: セキュリティ機能テスト（分割ファイル構成）
// このファイルは他の分割されたテストファイルをインポートします

// Import all split test files
import './cdk-security.sanitization.test';
import './cdk-security.validation.test';
import './cdk-security.generated-code.test';
import './cdk-security.edge-cases.test';