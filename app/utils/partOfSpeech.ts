// 词性简写映射
const partOfSpeechMap: Record<string, string> = {
  // 名词
  noun: "n",
  nouns: "n",
  // 动词
  verb: "v",
  verbs: "v",
  // 形容词
  adjective: "adj",
  adjectives: "adj",
  adj: "adj",
  // 副词
  adverb: "adv",
  adverbs: "adv",
  adv: "adv",
  // 代词
  pronoun: "pron",
  pronouns: "pron",
  pron: "pron",
  // 介词
  preposition: "prep",
  prepositions: "prep",
  prep: "prep",
  // 连词
  conjunction: "conj",
  conjunctions: "conj",
  conj: "conj",
  // 感叹词
  interjection: "interj",
  interjections: "interj",
  interj: "interj",
  // 数词
  numeral: "num",
  numerals: "num",
  num: "num",
  // 冠词
  article: "art",
  articles: "art",
  art: "art",
};

/**
 * 将词性转换为简写形式
 * @param partOfSpeech 词性（如 "adjective", "noun" 等）
 * @returns 简写形式（如 "adj", "n" 等），如果无法识别则返回原值
 */
export function abbreviatePartOfSpeech(partOfSpeech: string): string {
  if (!partOfSpeech) return partOfSpeech;
  
  const normalized = partOfSpeech.toLowerCase().trim();
  
  // 直接匹配
  if (partOfSpeechMap[normalized]) {
    return partOfSpeechMap[normalized];
  }
  
  // 尝试匹配包含的情况（如 "adjective" 包含 "adj"）
  for (const [key, value] of Object.entries(partOfSpeechMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  
  // 如果无法识别，返回原值
  return partOfSpeech;
}

