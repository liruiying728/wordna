interface HistoryItem {
  word: string;
  result: any;
  timestamp: number;
}

const HISTORY_KEY = "wordna_search_history";
const EXPIRY_DAYS = 100;
const EXPIRY_MS = EXPIRY_DAYS * 24 * 60 * 60 * 1000;

export function saveToHistory(word: string, result: any) {
  try {
    const history = getHistory();
    const newItem: HistoryItem = {
      word: word.toLowerCase().trim(),
      result,
      timestamp: Date.now(),
    };

    // 移除重复项（如果有）
    const filteredHistory = history.filter(
      (item) => item.word !== newItem.word
    );

    // 添加新项到开头
    filteredHistory.unshift(newItem);

    // 清理过期项
    const now = Date.now();
    const validHistory = filteredHistory.filter(
      (item) => now - item.timestamp < EXPIRY_MS
    );

    // 保存（最多保留100条）
    const limitedHistory = validHistory.slice(0, 100);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(limitedHistory));
  } catch (error) {
    console.error("Failed to save history:", error);
  }
}

export function getHistory(): HistoryItem[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];

    const history: HistoryItem[] = JSON.parse(stored);
    const now = Date.now();

    // 清理过期项
    const validHistory = history.filter(
      (item) => now - item.timestamp < EXPIRY_MS
    );

    // 如果清理后有变化，更新存储
    if (validHistory.length !== history.length) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(validHistory));
    }

    return validHistory;
  } catch (error) {
    console.error("Failed to get history:", error);
    return [];
  }
}

export function getHistoryWords(): string[] {
  return getHistory().map((item) => item.word);
}

export function getCachedResult(word: string): any | null {
  try {
    const history = getHistory();
    const item = history.find(
      (item) => item.word === word.toLowerCase().trim()
    );
    return item ? item.result : null;
  } catch (error) {
    console.error("Failed to get cached result:", error);
    return null;
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error("Failed to clear history:", error);
  }
}

