// p-limitのモック実装
// 実際の並列処理制限はせず、すべてのタスクを即座に実行

const pLimit = (concurrency: number) => {
  // タスクを受け取って実行する関数を返す
  return <T extends (...args: unknown[]) => unknown>(fn: T): T => {
    // 関数を返すのではなく、関数をラップして実行可能にする
    return ((...args: Parameters<T>) => fn(...args)) as T;
  };
};

export default pLimit;