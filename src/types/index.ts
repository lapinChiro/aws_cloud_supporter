// CLAUDE.md準拠: 型定義とエクスポート
// 共通型定義のエクスポート
export type * from './common';
export * from './cloudformation';
export type * from './metrics';

// アラーム生成制限の定数定義
export const DEFAULT_MAX_ALARMS_PER_RESOURCE = 20;

// 環境変数からカスタム上限値を取得するヘルパー関数
export function getMaxAlarmsPerResource(): number {
  const envValue = process.env.MAX_ALARMS_PER_RESOURCE;
  if (envValue) {
    const parsed = parseInt(envValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return DEFAULT_MAX_ALARMS_PER_RESOURCE;
}