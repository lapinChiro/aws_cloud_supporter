// CLAUDE.md準拠: 単一責任原則・No any types・SOLID設計
// T-016: HTMLフォーマッター実装 - スクリプトアセット

/**
 * 組み込みJavaScript（T-014準拠完全版）
 * インタラクティブフィルタ・検索・トグル機能実装
 */
export function getEmbeddedJS(): string {
  return `
      console.log('🔍 CloudWatch Metrics Report initialized');
      
      // グローバル状態管理
      let currentFilters = {
          search: '',
          importance: '',
          category: ''
      };
      
      // DOM要素の初期化
      document.addEventListener('DOMContentLoaded', function() {
          initializeEventListeners();
          initializeStatistics();
          console.log('✅ Interactive features enabled');
      });
      
      /**
       * イベントリスナーの初期化
       */
      function initializeEventListeners() {
          // 検索フィルタ
          const searchInput = document.getElementById('searchInput');
          if (searchInput) {
              searchInput.addEventListener('input', function(e) {
                  currentFilters.search = e.target.value.toLowerCase();
                  applyFilters();
              });
          }
          
          // 重要度フィルタ
          const importanceFilter = document.getElementById('importanceFilter');
          if (importanceFilter) {
              importanceFilter.addEventListener('change', function(e) {
                  currentFilters.importance = e.target.value;
                  applyFilters();
              });
          }
          
          // カテゴリフィルタ  
          const categoryFilter = document.getElementById('categoryFilter');
          if (categoryFilter) {
              categoryFilter.addEventListener('change', function(e) {
                  currentFilters.category = e.target.value;
                  applyFilters();
              });
          }
          
          // ESCキーでフィルタリセット
          document.addEventListener('keydown', function(e) {
              if (e.key === 'Escape') {
                  resetFilters();
              }
          });
      }
      
      /**
       * フィルタリングの適用
       */
      function applyFilters() {
          const resourceCards = document.querySelectorAll('.resource-card');
          let visibleResources = 0;
          let visibleMetrics = 0;
          
          resourceCards.forEach(card => {
              const resourceId = card.dataset.resourceId || '';
              const resourceType = card.dataset.resourceType || '';
              let hasVisibleMetrics = false;
              
              // リソース名・タイプでの検索フィルタ
              const matchesSearch = !currentFilters.search || 
                  resourceId.toLowerCase().includes(currentFilters.search) ||
                  resourceType.toLowerCase().includes(currentFilters.search);
              
              // メトリクスフィルタリング
              const metricCards = card.querySelectorAll('.metric-card');
              metricCards.forEach(metricCard => {
                  const metricName = metricCard.dataset.metricName || '';
                  const importance = metricCard.dataset.importance || '';
                  const category = metricCard.dataset.category || '';
                  
                  const matchesMetricSearch = !currentFilters.search || 
                      metricName.toLowerCase().includes(currentFilters.search);
                  
                  const matchesImportance = !currentFilters.importance || 
                      importance === currentFilters.importance;
                  
                  const matchesCategory = !currentFilters.category || 
                      category === currentFilters.category;
                  
                  const isVisible = matchesSearch && matchesMetricSearch && 
                      matchesImportance && matchesCategory;
                  
                  metricCard.style.display = isVisible ? 'block' : 'none';
                  
                  if (isVisible) {
                      hasVisibleMetrics = true;
                      visibleMetrics++;
                  }
              });
              
              // リソースカード全体の表示/非表示
              card.style.display = (matchesSearch && hasVisibleMetrics) ? 'block' : 'none';
              if (matchesSearch && hasVisibleMetrics) {
                  visibleResources++;
              }
          });
          
          // 統計情報の更新
          updateFilterStatistics(visibleResources, visibleMetrics);
          
          // アニメーション効果
          addFilterAnimation();
      }
      
      /**
       * メトリクストグル機能
       */
      function toggleMetrics(resourceId) {
          const metricsContent = document.getElementById('metrics-' + resourceId);
          const toggleIcon = document.querySelector('[onclick="toggleMetrics(\\''+resourceId+'\\')"] .toggle-icon');
          
          if (metricsContent && toggleIcon) {
              const isVisible = metricsContent.style.display !== 'none';
              
              if (isVisible) {
                  metricsContent.style.display = 'none';
                  toggleIcon.textContent = '▶';
                  toggleIcon.style.transform = 'rotate(-90deg)';
              } else {
                  metricsContent.style.display = 'block';
                  toggleIcon.textContent = '▼';
                  toggleIcon.style.transform = 'rotate(0deg)';
              }
          }
      }
      
      /**
       * フィルタのリセット
       */
      function resetFilters() {
          currentFilters = { search: '', importance: '', category: '' };
          
          const searchInput = document.getElementById('searchInput');
          const importanceFilter = document.getElementById('importanceFilter');
          const categoryFilter = document.getElementById('categoryFilter');
          
          if (searchInput) searchInput.value = '';
          if (importanceFilter) importanceFilter.value = '';
          if (categoryFilter) categoryFilter.value = '';
          
          applyFilters();
          console.log('🔄 Filters reset');
      }
      
      /**
       * 統計情報の初期化
       */
      function initializeStatistics() {
          const resourceCards = document.querySelectorAll('.resource-card');
          const totalMetrics = document.querySelectorAll('.metric-card').length;
          
          console.log(\`📊 Loaded \${resourceCards.length} resources with \${totalMetrics} metrics\`);
      }
      
      /**
       * フィルタリング結果の統計更新
       */
      function updateFilterStatistics(visibleResources, visibleMetrics) {
          // フィルタ結果を画面に表示（オプション）
          let statusElement = document.getElementById('filter-status');
          if (!statusElement) {
              statusElement = document.createElement('div');
              statusElement.id = 'filter-status';
              statusElement.style.cssText = \`
                  position: fixed;
                  top: 20px;
                  right: 20px;
                  background: rgba(102, 126, 234, 0.9);
                  color: white;
                  padding: 8px 16px;
                  border-radius: 6px;
                  font-size: 0.9rem;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                  transition: opacity 0.3s ease;
                  z-index: 1000;
              \`;
              document.body.appendChild(statusElement);
          }
          
          const hasActiveFilters = currentFilters.search || 
              currentFilters.importance || currentFilters.category;
          
          if (hasActiveFilters) {
              statusElement.textContent = \`📊 \${visibleResources} resources, \${visibleMetrics} metrics\`;
              statusElement.style.opacity = '1';
          } else {
              statusElement.style.opacity = '0';
          }
      }
      
      /**
       * フィルタアニメーション効果
       */
      function addFilterAnimation() {
          const visibleCards = document.querySelectorAll('.metric-card[style*="display: block"], .metric-card:not([style*="display: none"])');
          visibleCards.forEach((card, index) => {
              card.style.animation = 'none';
              setTimeout(() => {
                  card.style.animation = \`fadeInUp 0.3s ease forwards \${index * 0.05}s\`;
              }, 10);
          });
      }
      
      /**
       * キーボードショートカット
       */
      document.addEventListener('keydown', function(e) {
          // Ctrl+F でサーチにフォーカス
          if (e.ctrlKey && e.key === 'f') {
              e.preventDefault();
              const searchInput = document.getElementById('searchInput');
              if (searchInput) {
                  searchInput.focus();
                  searchInput.select();
              }
          }
          
          // Ctrl+R でフィルタリセット
          if (e.ctrlKey && e.key === 'r') {
              e.preventDefault();
              resetFilters();
          }
      });
      
      // CSSアニメーション定義
      const style = document.createElement('style');
      style.textContent = \`
          @keyframes fadeInUp {
              from {
                  opacity: 0;
                  transform: translateY(10px);
              }
              to {
                  opacity: 1;
                  transform: translateY(0);
              }
          }
          
          @keyframes fadeInOut {
              0%, 100% { opacity: 0; }
              10%, 90% { opacity: 1; }
          }
      \`;
      document.head.appendChild(style);
      
      // グローバル関数として公開（HTML内から呼び出し可能）
      window.toggleMetrics = toggleMetrics;
      window.resetFilters = resetFilters;
      
      console.log('🎯 Interactive CloudWatch Metrics Report ready!');
  `;
}