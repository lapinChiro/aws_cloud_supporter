// CLAUDE.md準拠: 単一責任原則・No any types・SOLID設計
// T-016: HTMLフォーマッター実装 - スタイルアセット

import type { IHTMLAssetProvider } from '../interfaces';

import { getEmbeddedJS } from './scripts';

/**
 * HTMLアセット提供クラス
 * Single Responsibility: CSS/JSアセット管理のみ
 */
export class HTMLAssetProvider implements IHTMLAssetProvider {
  /**
   * 組み込みCSS（外部依存なし・T-014準拠完全版）
   * レスポンシブ・重要度色分け・インタラクティブ対応
   */
  getEmbeddedCSS(): string {
    return `
        /* ベース設定 */
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; 
          line-height: 1.6; 
          color: #333; 
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
        }
        
        /* コンテナ・レイアウト */
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
        
        /* ヘッダーセクション */
        .header { 
          background: white; 
          border-radius: 12px; 
          padding: 32px; 
          margin-bottom: 24px; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
          border-left: 4px solid #667eea;
        }
        .header h1 { 
          font-size: 2.5rem; 
          margin-bottom: 16px; 
          color: #2d3748; 
          font-weight: 700;
        }
        .metadata { display: flex; gap: 16px; flex-wrap: wrap; align-items: center; }
        .badge { 
          padding: 8px 16px; 
          border-radius: 25px; 
          font-size: 0.9rem; 
          font-weight: 500;
          transition: transform 0.2s ease;
          background: #e3f2fd; 
          color: #1565c0; 
        }
        .badge:hover { transform: translateY(-1px); }
        
        /* 重要度別バッジカラー */
        .badge.high-importance { background: #ffebee; color: #c62828; }
        .badge.medium-importance { background: #fff3e0; color: #ef6c00; }
        .badge.low-importance { background: #e8f5e8; color: #2e7d32; }
        .badge.metrics-count { background: #f3e5f5; color: #7b1fa2; }
        
        /* コントロールセクション */
        .controls { 
          display: flex; 
          gap: 16px; 
          margin-bottom: 24px; 
          flex-wrap: wrap;
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .search-input, .filter-select { 
          padding: 12px 16px; 
          border: 2px solid #e2e8f0; 
          border-radius: 8px; 
          font-size: 1rem;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .search-input:focus, .filter-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        .search-input { flex: 1; min-width: 250px; }
        .filter-select { min-width: 180px; }
        
        /* リソースカード */
        .resource-card { 
          background: white; 
          border-radius: 12px; 
          margin-bottom: 24px; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.08); 
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .resource-card:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 8px 25px rgba(0,0,0,0.15); 
        }
        
        /* リソースヘッダー */
        .resource-header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px; 
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .resource-title-section { flex: 1; }
        .resource-title { 
          font-size: 1.4rem; 
          font-weight: 600; 
          margin-bottom: 4px;
        }
        .resource-type { 
          font-size: 0.9rem; 
          opacity: 0.9;
          margin-bottom: 12px;
        }
        .resource-metrics-count { display: flex; gap: 8px; flex-wrap: wrap; }
        .resource-metrics-count .badge { font-size: 0.8rem; padding: 4px 10px; }
        
        /* トグルボタン */
        .toggle-button { 
          cursor: pointer; 
          padding: 8px; 
          border-radius: 6px; 
          transition: background-color 0.2s ease;
          user-select: none;
        }
        .toggle-button:hover { background-color: rgba(255,255,255,0.1); }
        .toggle-icon { 
          font-size: 1.2rem; 
          transition: transform 0.3s ease;
        }
        
        /* リソースコンテンツ */
        .resource-content { 
          padding: 20px;
          transition: max-height 0.3s ease;
        }
        
        /* メトリクスグリッド */
        .metrics-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); 
          gap: 16px; 
        }
        
        /* メトリクスカード */
        .metric-card { 
          background: #fafafa; 
          border-radius: 8px; 
          padding: 16px;
          border-left: 4px solid #e2e8f0;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .metric-card:hover { 
          transform: translateY(-1px); 
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        /* 重要度別メトリクスカラー */
        .metric-card.importance-high { border-left-color: #e53e3e; background: #fdf2f2; }
        .metric-card.importance-medium { border-left-color: #dd6b20; background: #fef5e7; }
        .metric-card.importance-low { border-left-color: #38a169; background: #f0fff4; }
        
        /* カテゴリ別アクセント */
        .metric-card.category-performance { border-top: 2px solid #3182ce; }
        .metric-card.category-error { border-top: 2px solid #e53e3e; }
        .metric-card.category-saturation { border-top: 2px solid #d69e2e; }
        .metric-card.category-latency { border-top: 2px solid #9f7aea; }
        
        /* メトリクスヘッダー */
        .metric-header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 12px; 
        }
        .metric-name { 
          font-size: 1.1rem; 
          font-weight: 600; 
          color: #2d3748; 
        }
        .metric-importance { 
          padding: 4px 10px; 
          border-radius: 15px; 
          font-size: 0.8rem; 
          font-weight: 600;
          text-transform: uppercase;
        }
        .metric-importance.importance-high { background: #feb2b2; color: #c53030; }
        .metric-importance.importance-medium { background: #fbd38d; color: #c05621; }
        .metric-importance.importance-low { background: #9ae6b4; color: #276749; }
        
        /* カテゴリバッジ */
        .metric-badges { display: flex; gap: 8px; align-items: center; }
        .category-badge { 
          padding: 3px 8px; 
          border-radius: 12px; 
          font-size: 0.75rem; 
          font-weight: 500;
          text-transform: capitalize;
        }
        .category-badge.category-performance { background: #bee3f8; color: #2b6cb0; }
        .category-badge.category-error { background: #fed7d7; color: #c53030; }
        .category-badge.category-latency { background: #e9d8fd; color: #805ad5; }
        .category-badge.category-saturation { background: #feebc8; color: #c05621; }
        
        /* メトリクス説明 */
        .metric-description { 
          color: #4a5568; 
          margin-bottom: 16px; 
          font-size: 0.95rem;
          line-height: 1.5;
        }
        
        /* メトリクス詳細情報 */
        .metric-details { margin-bottom: 16px; }
        .metric-info { 
          display: flex; 
          justify-content: space-between; 
          padding: 6px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .metric-info:last-child { border-bottom: none; }
        .info-label { 
          font-weight: 500; 
          color: #4a5568; 
          font-size: 0.9rem;
        }
        .info-value { 
          color: #2d3748; 
          font-weight: 400;
          font-size: 0.9rem;
        }
        
        /* カテゴリ値の色分け */
        .info-value.category-performance { color: #3182ce; font-weight: 500; }
        .info-value.category-error { color: #e53e3e; font-weight: 500; }
        .info-value.category-saturation { color: #d69e2e; font-weight: 500; }
        .info-value.category-latency { color: #9f7aea; font-weight: 500; }
        
        /* しきい値セクション */
        .threshold-section { 
          background: white; 
          border-radius: 6px; 
          padding: 12px;
          margin-bottom: 12px;
        }
        .threshold-title { 
          font-weight: 600; 
          color: #2d3748; 
          margin-bottom: 8px;
          font-size: 0.9rem;
        }
        .threshold-values { display: flex; gap: 16px; flex-wrap: wrap; }
        .threshold-item { 
          display: flex; 
          align-items: center; 
          gap: 8px;
          padding: 6px 12px;
          border-radius: 6px;
        }
        .threshold-item.warning { background: #fef5e7; }
        .threshold-item.critical { background: #fdf2f2; }
        .threshold-label { 
          font-weight: 600; 
          font-size: 0.85rem;
        }
        .threshold-item.warning .threshold-label { color: #c05621; }
        .threshold-item.critical .threshold-label { color: #c53030; }
        .threshold-value { 
          font-weight: 500;
          font-size: 0.9rem;
          color: #2d3748;
        }
        
        /* ディメンションセクション */
        .dimensions-section { margin-top: 12px; }
        .dimensions-title { 
          font-weight: 600; 
          color: #4a5568; 
          margin-bottom: 6px;
          font-size: 0.85rem;
        }
        .dimensions-list { display: flex; gap: 8px; flex-wrap: wrap; }
        .dimension { 
          background: #e2e8f0; 
          color: #4a5568; 
          padding: 4px 8px; 
          border-radius: 4px; 
          font-size: 0.8rem;
          font-family: 'Monaco', 'Consolas', monospace;
        }
        
        /* サポート対象外セクション */
        .unsupported-section { 
          background: white; 
          border-radius: 12px; 
          padding: 24px; 
          margin-top: 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          border-left: 4px solid #ed8936;
        }
        .unsupported-section h2 {
          color: #c05621;
          margin-bottom: 16px;
          font-size: 1.3rem;
        }
        .unsupported-section ul {
          list-style: none;
          padding-left: 0;
        }
        .unsupported-section li {
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
          color: #4a5568;
        }
        .unsupported-section li:last-child { border-bottom: none; }
        
        /* レスポンシブデザイン */
        @media (max-width: 1024px) {
            .metrics-grid { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
            .container { padding: 16px; }
            .header { padding: 24px; }
            .header h1 { font-size: 2rem; }
        }
        
        @media (max-width: 768px) {
            .controls { flex-direction: column; }
            .search-input, .filter-select { width: 100%; }
            .metadata { flex-direction: column; gap: 8px; }
            .resource-header { flex-direction: column; align-items: flex-start; gap: 12px; }
            .metrics-grid { grid-template-columns: 1fr; }
            .threshold-values { flex-direction: column; gap: 8px; }
            .dimensions-list { flex-direction: column; }
        }
        
        @media (max-width: 480px) {
            .container { padding: 12px; }
            .header { padding: 16px; }
            .header h1 { font-size: 1.6rem; }
            .metric-header { flex-direction: column; align-items: flex-start; gap: 8px; }
            .resource-metrics-count { flex-direction: column; }
        }
        
        /* 印刷対応 */
        @media print {
            body { background: white; }
            .container { max-width: none; padding: 0; }
            .resource-card, .header { box-shadow: none; border: 1px solid #e2e8f0; }
            .toggle-button { display: none; }
        }
    `;
  }

  /**
   * 組み込みJavaScriptの取得
   * @returns JavaScript文字列
   */
  getEmbeddedJS(): string {
    return getEmbeddedJS();
  }
}