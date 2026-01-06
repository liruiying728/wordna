"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  saveToHistory,
  getHistoryWords,
  getCachedResult,
  clearHistory,
} from "./utils/history";
import { HighlightWord } from "./utils/highlight";
import { abbreviatePartOfSpeech } from "./utils/partOfSpeech";

interface RootInfo {
  partOfSpeech: string;
  phonetic: string;
  meaning: string;
  commonPhrases: string[];
}

interface DerivedWord {
  word: string;
  prefixes: string[];
  suffixes: string[];
  partOfSpeech: string;
  phonetic: string;
  meaning: string;
}

interface AnalysisResult {
  isRoot: boolean;
  rootWord: string;
  rootInfo: RootInfo;
  derivedWords: DerivedWord[];
}

export default function Home() {
  const [word, setWord] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyWords, setHistoryWords] = useState<string[]>([]);
  const [searchWord, setSearchWord] = useState<string>("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 自动搜索函数
  const handleAutoSearch = useCallback(async (searchWordValue: string) => {
    if (!isClient) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ word: searchWordValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "分析失败");
      }

      // 只在客户端保存历史记录
      if (typeof window !== "undefined") {
        saveToHistory(searchWordValue, data);
        setHistoryWords(getHistoryWords());
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "分析失败，请稍后重试");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [isClient]);

  // 标记为客户端组件（延迟执行，避免 SSR 问题）
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
      setMounted(true);
    }
  }, []);

  // 加载历史记录和 URL 参数（只在客户端执行）
  useEffect(() => {
    // 确保只在客户端执行
    if (!isClient || typeof window === "undefined") return;
    
    setHistoryWords(getHistoryWords());
    
    // 检查 URL 参数
    try {
      const params = new URLSearchParams(window.location.search);
      
      if (params.get("showHistory") === "true") {
        setShowHistory(true);
      }
      
      // 如果有 word 参数，自动搜索
      const wordParam = params.get("word");
      if (wordParam) {
        setWord(wordParam);
        const searchWordValue = wordParam.toLowerCase();
        setSearchWord(searchWordValue);
        const cachedResult = getCachedResult(searchWordValue);
        if (cachedResult) {
          setResult(cachedResult);
          setError(null);
        } else {
          // 如果没有缓存，自动提交搜索
          handleAutoSearch(searchWordValue);
        }
      }
    } catch (error) {
      console.error("Error reading URL parameters:", error);
    }
  }, [isClient, handleAutoSearch]);

  // 当加载时禁止页面滚动
  // 控制 body 滚动（只在客户端执行）
  useEffect(() => {
    if (!isClient || typeof window === "undefined" || typeof document === "undefined") return;
    
    if (loading) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // 清理函数
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = 'unset';
      }
    };
  }, [isClient, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || loading || !isClient) return; // 防止重复提交，确保在客户端

    const searchWordValue = word.trim().toLowerCase();
    setSearchWord(searchWordValue);

    // 检查缓存（只在客户端）
    if (typeof window !== "undefined") {
      const cachedResult = getCachedResult(searchWordValue);
      if (cachedResult) {
        setResult(cachedResult);
        setError(null);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ word: searchWordValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "分析失败");
      }

      // 保存到历史记录（只在客户端）
      if (typeof window !== "undefined") {
        saveToHistory(searchWordValue, data);
        setHistoryWords(getHistoryWords());
      }
      setResult(data);
    } catch (err) {
      // 处理网络错误
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError("网络请求失败，请检查网络连接后重试");
      } else {
        setError(err instanceof Error ? err.message : "分析失败，请稍后重试");
      }
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = (historyWord: string) => {
    if (!isClient) return;
    setWord(historyWord);
    setSearchWord(historyWord.toLowerCase());
    if (typeof window !== "undefined") {
      const cachedResult = getCachedResult(historyWord);
      if (cachedResult) {
        setResult(cachedResult);
        setError(null);
      }
    }
    setShowHistory(false);
  };

  const handleClearHistory = () => {
    if (typeof window !== "undefined" && confirm("确定要清空所有历史记录吗？")) {
      clearHistory();
      setHistoryWords([]);
    }
  };

  // 过滤扩展词汇，排除被搜索的词，最多显示20个
  const filteredDerivedWords = result
    ? result.derivedWords
        .filter((derived) => derived.word.toLowerCase() !== searchWord.toLowerCase())
        .slice(0, 20)
    : [];

  // 在服务端渲染时返回空内容，避免序列化问题
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" suppressHydrationWarning>
      {/* Fixed Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: WorDNA Logo */}
            <Link 
              href="/" 
              className="text-xl sm:text-2xl font-bold text-gray-900 flex-shrink-0"
              onClick={() => {
                // 清除搜索结果，返回首页
                setResult(null);
                setWord("");
                setSearchWord("");
                setError(null);
              }}
            >
              WorDNA
            </Link>

            {/* Center: Search Box (only when there's a result) */}
            {result && (
              <form onSubmit={handleSubmit} className="flex-1 max-w-2xl mx-2 sm:mx-4 flex gap-2">
                <input
                  type="text"
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  placeholder="输入一个单词..."
                  className="flex-1 min-w-0 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !word.trim()}
                  className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors text-sm whitespace-nowrap"
                >
                  {loading ? "分析中..." : "分析"}
                </button>
              </form>
            )}

            {/* Right: Desktop Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/affixes"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium text-sm sm:text-base"
              >
                前后缀清单
              </Link>
              <button
                type="button"
                onClick={() => setShowHistory(true)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors text-sm sm:text-base whitespace-nowrap"
              >
                历史记录
              </button>
            </div>

            {/* Mobile: Hamburger Menu */}
            <div className="md:hidden">
              <button
                type="button"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 text-gray-700 hover:text-gray-900"
                aria-label="菜单"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {showMobileMenu ? (
                    <path d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {showMobileMenu && (
            <div className="md:hidden border-t border-gray-200 py-2">
              <Link
                href="/affixes"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                前后缀清单
              </Link>
              <button
                type="button"
                onClick={() => {
                  setShowHistory(true);
                  setShowMobileMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                历史记录
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Default Page Content (no result) */}
      {!result && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center w-full max-w-2xl px-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
              WorDNA 词根分析工具
            </h1>
            <p className="text-gray-600 text-base sm:text-lg mb-8">
              分析其词根及扩展词汇，加深理解，加速记忆
            </p>
            {/* Search Box */}
            <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3">
              <input
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="输入一个单词..."
                className="flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base lg:text-lg"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !word.trim()}
                className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors text-xs sm:text-sm lg:text-base whitespace-nowrap flex-shrink-0"
              >
                {loading ? "分析中..." : "分析"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowHistory(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">搜索历史</h2>
              <div className="flex gap-2">
                {historyWords.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    清空
                  </button>
                )}
                <button
                  onClick={() => setShowHistory(false)}
                  className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {historyWords.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无搜索历史</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {historyWords.map((historyWord, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleHistoryClick(historyWord)}
                      className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors text-sm sm:text-base"
                    >
                      {historyWord}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content Area - 有结果时显示 */}
      {result && (
        <div className="pt-24 pb-12 relative">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}


            <div className="space-y-8">
              {/* 1. 被搜索单词的词汇卡片（优先展示） */}
              {(searchWord || result.rootWord) && (
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-4">
                    搜索词汇
                  </h3>
                  <div className="space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {searchWord || result.rootWord}
                    </h2>
                    {/* 如果是词根，使用rootInfo；否则从扩展词汇中查找 */}
                    {result.isRoot ? (
                      <>
                        <div className="text-sm sm:text-base text-gray-700">
                          {abbreviatePartOfSpeech(result.rootInfo.partOfSpeech)}
                        </div>
                        <div className="text-sm sm:text-base text-gray-700">
                          {result.rootInfo.phonetic}
                        </div>
                        <div className="text-sm sm:text-base text-gray-700">
                          {result.rootInfo.meaning}
                        </div>
                      </>
                    ) : (
                      (() => {
                        const wordToSearch = searchWord || result.rootWord;
                        const searchedWordInfo = result.derivedWords.find(
                          (d) => d.word.toLowerCase() === wordToSearch.toLowerCase()
                        );
                        if (searchedWordInfo) {
                          return (
                            <>
                              <div className="text-sm sm:text-base text-gray-700">
                                {abbreviatePartOfSpeech(searchedWordInfo.partOfSpeech)}
                              </div>
                              <div className="text-sm sm:text-base text-gray-700">
                                {searchedWordInfo.phonetic}
                              </div>
                              <div className="text-sm sm:text-base text-gray-700">
                                {searchedWordInfo.meaning}
                              </div>
                            </>
                          );
                        }
                        return null;
                      })()
                    )}
                  </div>
                </div>
              )}

              {/* 2. 词根信息（如果被搜索的词不是词根，才单独显示词根） */}
              {!result.isRoot && (
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-4">
                    词根
                  </h3>
                  <div className="space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {result.rootWord}
                    </h2>
                    <div className="text-sm sm:text-base text-gray-700">
                      {abbreviatePartOfSpeech(result.rootInfo.partOfSpeech)}
                    </div>
                    <div className="text-sm sm:text-base text-gray-700">
                      {result.rootInfo.phonetic}
                    </div>
                    <div className="text-sm sm:text-base text-gray-700">
                      {result.rootInfo.meaning}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. 扩展词汇（排除被搜索的词，最多20个） */}
              {filteredDerivedWords.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
                    扩展词汇
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {filteredDerivedWords.map((derived, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="space-y-1">
                          <h4 className="text-xl sm:text-2xl font-semibold">
                            <HighlightWord
                              word={derived.word}
                              rootWord={result.rootWord}
                              prefixes={derived.prefixes}
                              suffixes={derived.suffixes}
                            />
                          </h4>
                          <div className="text-sm sm:text-base text-gray-700">
                            {abbreviatePartOfSpeech(derived.partOfSpeech)}
                          </div>
                          <div className="text-sm sm:text-base text-gray-700">
                            {derived.phonetic}
                          </div>
                          <div className="text-sm sm:text-base text-gray-700">
                            {derived.meaning}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* 全屏加载遮罩 - 覆盖整个页面 */}
      {loading && (
        <div className="fixed inset-0 bg-white bg-opacity-95 z-[9999] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">正在分析中...</p>
          </div>
        </div>
      )}

      {/* 错误信息（没有结果时） */}
      {error && !result && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        </div>
      )}
    </div>
  );
}
