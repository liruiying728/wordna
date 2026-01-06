"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import affixesData from "../utils/affixes.json";
import { getHistoryWords, getCachedResult, clearHistory } from "../utils/history";

// 前后缀解释映射（前缀优先，如果同时是前缀和后缀，使用前缀解释）
const affixMeanings: Record<string, string> = {
  // 前缀
  "a": "不，无，非",
  "ab": "离开，脱离",
  "abs": "离开，脱离",
  "ac": "朝向，接近",
  "ad": "朝向，接近",
  "af": "朝向，接近",
  "ag": "朝向，接近",
  "al": "朝向，接近",
  "am": "朝向，接近",
  "an": "不，无",
  "ana": "向上，向后",
  "ante": "在...之前",
  "anti": "反对，对抗",
  "ap": "朝向，接近",
  "apo": "离开，远离",
  "ar": "朝向，接近",
  "as": "朝向，接近",
  "at": "朝向，接近",
  "auto": "自己，自动",
  "be": "使...，完全",
  "bi": "二，双",
  "by": "在旁边，次要",
  "cata": "向下，完全",
  "circum": "围绕，周围",
  "co": "共同，一起",
  "col": "共同，一起",
  "com": "共同，一起",
  "con": "共同，一起",
  "contra": "反对，相反",
  "cor": "共同，一起",
  "counter": "反对，相反",
  "de": "向下，离开，去除",
  "deca": "十",
  "deci": "十分之一",
  "di": "二，双",
  "dia": "通过，横跨",
  "dif": "分开，不同",
  "dis": "不，分开，去除",
  "dys": "坏的，困难的",
  "e": "出，向外",
  "ec": "出，向外",
  "ef": "出，向外",
  "em": "使...，进入",
  "en": "使...，进入",
  "endo": "内部，内部",
  "epi": "在...之上，在...周围",
  "equi": "相等",
  "eu": "好，良好",
  "ex": "出，向外，前任",
  "exo": "外部，向外",
  "extra": "超出，额外",
  "fore": "在...之前",
  "for": "禁止，阻止",
  "hemi": "半",
  "hexa": "六",
  "homo": "相同，同",
  "hyper": "超过，过度",
  "hypo": "在...之下，不足",
  "il": "不，非",
  "im": "不，非，进入",
  "in": "不，非，进入",
  "infra": "在...之下",
  "inter": "在...之间，相互",
  "intra": "内部，在内",
  "intro": "向内，进入",
  "ir": "不，非",
  "iso": "相等，相同",
  "kilo": "千",
  "macro": "大的，宏观",
  "mal": "坏的，不良",
  "mega": "大的，百万",
  "meta": "变化，超越",
  "micro": "小的，微观",
  "mid": "中间",
  "milli": "千分之一",
  "mini": "小的，迷你",
  "mis": "错误，不良",
  "mono": "一，单",
  "multi": "多，多个",
  "neo": "新的",
  "non": "不，非",
  "ob": "反对，朝向",
  "oc": "反对，朝向",
  "octa": "八",
  "of": "反对，朝向",
  "om": "全部，所有",
  "omni": "全部，所有",
  "op": "反对，朝向",
  "out": "出，向外，超过",
  "over": "超过，过度，在...之上",
  "pan": "全部，所有",
  "para": "旁边，相似，保护",
  "penta": "五",
  "per": "通过，完全",
  "peri": "周围，围绕",
  "poly": "多，多个",
  "post": "在...之后",
  "pre": "在...之前",
  "pro": "向前，支持，代替",
  "proto": "第一，原始",
  "pseudo": "假的，伪",
  "quad": "四",
  "quasi": "类似，准",
  "re": "再次，回，反对",
  "retro": "向后，追溯",
  "se": "分开，离开",
  "semi": "半",
  "sub": "在...之下，次要",
  "super": "超过，在...之上",
  "sur": "在...之上，超过",
  "syn": "共同，一起",
  "sys": "共同，一起",
  "tele": "远距离",
  "tetra": "四",
  "trans": "横跨，转变",
  "tri": "三",
  "ultra": "超过，极端",
  "un": "不，非，相反",
  "under": "在...之下，不足",
  "uni": "一，单",
  "up": "向上，提高",
  
  // 后缀（如果前缀中已有，则跳过，使用前缀解释）
  "able": "能够...的，可...的",
  "ably": "能够...地",
  "ace": "状态，性质",
  "acious": "具有...性质的",
  "acity": "状态，性质",
  "acle": "小的事物",
  "acy": "状态，性质",
  "ade": "动作，结果",
  "age": "状态，行为，集合",
  "aholic": "沉迷于...的人",
  "ality": "状态，性质",
  "ally": "方式，程度",
  "ance": "状态，行为",
  "ancy": "状态，性质",
  "ane": "化学物质",
  "ant": "做...的人/物，...的",
  "ard": "做...的人（贬义）",
  "arian": "支持...的人",
  "arium": "场所，容器",
  "ary": "与...有关的，场所",
  "ate": "使...，成为...，盐",
  "ated": "被...的",
  "ation": "动作，状态",
  "ative": "具有...性质的",
  "ator": "做...的人/物",
  "ble": "能够...的",
  "bule": "小的事物",
  "cide": "杀，杀...的人",
  "cracy": "统治，政府",
  "crat": "支持...统治的人",
  "cule": "小的事物",
  "cy": "状态，性质",
  "dom": "状态，领域",
  "ed": "过去式，被...的",
  "ee": "受...的人",
  "eer": "从事...的人",
  "el": "小的事物",
  "ella": "小的事物",
  "elle": "小的事物",
  "ence": "状态，性质",
  "ency": "状态，性质",
  "ene": "化学物质",
  "ent": "做...的人/物，...的",
  "eous": "具有...性质的",
  "er": "做...的人/物，更...",
  "ern": "方向，位置",
  "ery": "行为，场所，集合",
  "es": "复数，第三人称单数",
  "ese": "属于...的，...的语言",
  "esque": "像...的",
  "ess": "女性，雌性",
  "est": "最...",
  "et": "小的事物",
  "ette": "小的事物，女性",
  "ety": "状态，性质",
  "fic": "使...，产生...",
  "fication": "使...化",
  "fier": "使...的人/物",
  "fold": "倍，重",
  "ful": "充满...的，...的量",
  "fy": "使...，成为...",
  "gon": "角，边",
  "gram": "写，记录",
  "graph": "写，记录，仪器",
  "graphy": "写，记录，学科",
  "hood": "状态，身份",
  "ia": "状态，疾病",
  "ial": "与...有关的",
  "ian": "属于...的，...的人",
  "iana": "收集，相关",
  "ible": "能够...的，可...的",
  "ic": "与...有关的",
  "ical": "与...有关的",
  "ically": "方式，程度",
  "ice": "状态，性质",
  "ician": "专家，从事...的人",
  "icity": "状态，性质",
  "ics": "学科，技术",
  "id": "具有...性质的",
  "ide": "化学物质",
  "ie": "小的事物，爱称",
  "ier": "做...的人/物",
  "ify": "使...，成为...",
  "ile": "能够...的，与...有关的",
  "ility": "状态，性质",
  "ina": "小的事物，女性",
  "ine": "属于...的，化学物质",
  "ing": "进行时，动作，结果",
  "ion": "动作，状态",
  "ious": "具有...性质的",
  "ise": "使...，成为...",
  "ish": "像...的，稍微...",
  "ism": "主义，学说，行为",
  "ist": "支持...的人，专家",
  "ite": "属于...的，...的人",
  "ition": "动作，状态",
  "itive": "具有...性质的",
  "itor": "做...的人/物",
  "ity": "状态，性质",
  "ium": "场所，元素",
  "ive": "具有...性质的",
  "ivity": "状态，性质",
  "ize": "使...，成为...",
  "izer": "使...的人/物",
  "kin": "小的事物",
  "less": "没有...的",
  "let": "小的事物",
  "like": "像...的",
  "ling": "小的事物，年轻的人",
  "log": "说，研究",
  "loger": "研究...的人",
  "logist": "研究...的专家",
  "logy": "学科，研究",
  "ly": "方式，程度",
  "ment": "行为，结果，状态",
  "meter": "测量，仪器",
  "metry": "测量，学科",
  "most": "最...",
  "ness": "状态，性质",
  "nik": "与...有关的人",
  "o": "化学物质，音乐",
  "oid": "像...的",
  "ology": "学科，研究",
  "oma": "肿瘤，肿块",
  "on": "粒子，单位",
  "or": "做...的人/物",
  "ory": "与...有关的，场所",
  "ose": "具有...性质的",
  "osis": "状态，过程",
  "osity": "状态，性质",
  "ot": "小的事物",
  "ote": "具有...性质的",
  "ous": "具有...性质的",
  "phile": "喜欢...的人",
  "phobe": "害怕...的人",
  "phobia": "恐惧症",
  "phone": "声音，电话",
  "phony": "声音，假的",
  "ple": "倍，重",
  "plegia": "瘫痪",
  "plegic": "瘫痪的",
  "ry": "行为，场所，集合",
  "scape": "景色，场景",
  "scope": "看，仪器",
  "scopy": "看，检查",
  "ship": "状态，身份，技能",
  "sion": "动作，状态",
  "sis": "状态，过程",
  "some": "产生...的，...的",
  "ster": "做...的人",
  "th": "状态，性质，序数",
  "tion": "动作，状态",
  "tious": "具有...性质的",
  "tive": "具有...性质的",
  "tory": "与...有关的，场所",
  "tude": "状态，程度",
  "ty": "状态，性质",
  "ual": "与...有关的",
  "ular": "与...有关的",
  "ule": "小的事物",
  "ulent": "充满...的",
  "ulous": "具有...性质的",
  "um": "场所，元素",
  "ure": "动作，结果",
  "uria": "尿液，疾病",
  "us": "具有...性质的",
  "ute": "具有...性质的",
  "ward": "朝向...",
  "wards": "朝向...",
  "ware": "物品，软件",
  "ways": "方式，方向",
  "wise": "方式，方向",
  "y": "具有...性质的，状态",
  "yer": "做...的人"
};

export default function AffixesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [historyWords, setHistoryWords] = useState<string[]>([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  
  // 标记为客户端组件（延迟执行，避免 SSR 问题）
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
      setMounted(true);
    }
  }, []);

  // 加载历史记录（只在客户端执行）
  useEffect(() => {
    if (!isClient || typeof window === "undefined") return;
    setHistoryWords(getHistoryWords());
  }, [isClient]);
  
  const handleHistoryWordClick = (historyWord: string) => {
    router.push(`/?word=${encodeURIComponent(historyWord)}`);
  };
  
  const handleClearHistory = () => {
    if (typeof window !== "undefined" && confirm("确定要清空所有历史记录吗？")) {
      clearHistory();
      setHistoryWords([]);
    }
  };

  // 合并前缀和后缀，添加类型标记
  // 如果同一个词既是前缀也是后缀，分别显示
  const prefixSet = new Set(affixesData.prefixes);
  const suffixSet = new Set(affixesData.suffixes);
  
  const allAffixes = [
    ...affixesData.prefixes.map(affix => ({ text: affix, type: "prefix" as const })),
    ...affixesData.suffixes
      .filter(affix => !prefixSet.has(affix)) // 如果前缀中已有，后缀中不重复添加
      .map(affix => ({ text: affix, type: "suffix" as const }))
  ];
  
  // 分别对前缀和后缀按字母排序
  const sortedPrefixes = allAffixes
    .filter(affix => affix.type === "prefix")
    .sort((a, b) => a.text.localeCompare(b.text));
  const sortedSuffixes = allAffixes
    .filter(affix => affix.type === "suffix")
    .sort((a, b) => a.text.localeCompare(b.text));

  // 过滤
  const filteredPrefixes = searchTerm
    ? sortedPrefixes.filter(affix => 
        affix.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (affixMeanings[affix.text] && affixMeanings[affix.text].includes(searchTerm))
      )
    : sortedPrefixes;
    
  const filteredSuffixes = searchTerm
    ? sortedSuffixes.filter(affix => 
        affix.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (affixMeanings[affix.text] && affixMeanings[affix.text].includes(searchTerm))
      )
    : sortedSuffixes;

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
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl sm:text-2xl font-bold text-gray-900 flex-shrink-0">
              WorDNA
            </Link>
            
            {/* Desktop: History Button */}
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={() => setShowHistory(true)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
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

      {/* Content */}
      <div className="pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            前后缀清单
          </h1>
          <p className="text-gray-600 text-base sm:text-lg mb-6">
            包含 400+ 常见前缀和后缀，按字母顺序排列
          </p>

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索前缀或后缀..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
          </div>

          {/* Affixes List */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="p-6">
              {/* Prefixes Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">前缀</h2>
                <div className="space-y-2">
                  {filteredPrefixes.map((affix, index) => (
                    <div key={index} className="flex items-start gap-4 py-2 border-b border-gray-100 last:border-0">
                      <span className="font-semibold text-gray-900 min-w-[80px]">
                        {affix.text}-
                      </span>
                      <span className="text-gray-600 flex-1">
                        {affixMeanings[affix.text] || "暂无解释"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suffixes Section */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">后缀</h2>
                <div className="space-y-2">
                  {filteredSuffixes.map((affix, index) => (
                    <div key={index} className="flex items-start gap-4 py-2 border-b border-gray-100 last:border-0">
                      <span className="font-semibold text-gray-900 min-w-[80px]">
                        -{affix.text}
                      </span>
                      <span className="text-gray-600 flex-1">
                        {affixMeanings[affix.text] || "暂无解释"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                      onClick={() => handleHistoryWordClick(historyWord)}
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
    </div>
  );
}

