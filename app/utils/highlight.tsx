import affixesData from './affixes.json';

interface HighlightProps {
  word: string;
  rootWord: string;
  prefixes: string[];
  suffixes: string[];
}

export function HighlightWord({
  word,
  rootWord,
  prefixes,
  suffixes,
}: HighlightProps) {
  const wordLower = word.toLowerCase();
  const rootLower = rootWord.toLowerCase();

  // 找到词根在单词中的位置（不区分大小写）
  let rootIndex = wordLower.indexOf(rootLower);
  let matchedRoot = rootLower; // 实际匹配到的词根（可能是变体）
  
  // 如果找不到完整词根，尝试匹配词根的前缀变体（比如 "image" -> "imag"）
  if (rootIndex === -1 && rootLower.length > 3) {
    // 尝试从词根末尾逐步缩短，找到匹配的部分
    for (let len = rootLower.length - 1; len >= 3; len--) {
      const rootVariant = rootLower.substring(0, len);
      const variantIndex = wordLower.indexOf(rootVariant);
      if (variantIndex !== -1) {
        rootIndex = variantIndex;
        matchedRoot = rootVariant; // 使用匹配到的变体
        break;
      }
    }
  }

  // 如果还是找不到词根，尝试使用前缀和后缀列表来分割
  if (rootIndex === -1) {
    // 如果前缀和后缀列表都为空，直接返回原单词
    if (prefixes.length === 0 && suffixes.length === 0) {
      return <span>{word}</span>;
    }
    
    // 尝试通过前缀和后缀来推断词根位置
    let inferredRootStart = 0;
    let inferredRootEnd = word.length;
    
    // 尝试匹配前缀
    if (prefixes.length > 0) {
      for (const prefix of prefixes) {
        const prefixKey = prefix.toLowerCase().replace(/^[-]+/, "").replace(/[-]+$/, "");
        if (wordLower.startsWith(prefixKey)) {
          inferredRootStart = prefixKey.length;
          break;
        }
      }
    }
    
    // 尝试匹配后缀
    if (suffixes.length > 0) {
      for (const suffix of suffixes) {
        const suffixKey = suffix.toLowerCase().replace(/^[-]+/, "").replace(/[-]+$/, "");
        if (wordLower.endsWith(suffixKey)) {
          inferredRootEnd = word.length - suffixKey.length;
          break;
        }
      }
    }
    
    // 如果推断出了词根范围，使用它
    if (inferredRootStart < inferredRootEnd) {
      rootIndex = inferredRootStart;
      matchedRoot = wordLower.substring(inferredRootStart, inferredRootEnd);
    } else {
      // 如果还是无法推断，直接返回原单词
      return <span>{word}</span>;
    }
  }

  const parts: string[] = [];

  // 前缀部分（词根之前）
  if (rootIndex > 0) {
    const prefixText = word.substring(0, rootIndex);
    const prefixLower = prefixText.toLowerCase();

    // 从清单文件中获取常见前缀
    const commonPrefixes = affixesData.prefixes;
    
    // 合并所有可能的前缀（API返回的 + 清单中的），去重并按长度排序
    const allPrefixes = new Set<string>();
    // 先添加API返回的前缀（优先级更高）
    prefixes.forEach(p => {
      const key = p.toLowerCase().replace(/^[-]+/, "").replace(/[-]+$/, "");
      if (key) allPrefixes.add(key);
    });
    // 再添加清单中的常见前缀
    commonPrefixes.forEach(p => allPrefixes.add(p));
    
    const sortedPrefixes = Array.from(allPrefixes).sort((a, b) => b.length - a.length);
    
    // 从前往后匹配前缀
    let currentIndex = 0;
    
    while (currentIndex < prefixText.length) {
      let found = false;
      const remainingText = prefixLower.substring(currentIndex);
      
      // 尝试匹配每个前缀，优先匹配长的
      for (const prefixKey of sortedPrefixes) {
        if (remainingText.startsWith(prefixKey)) {
          // 找到匹配的前缀
          if (currentIndex > 0) {
            parts.push("·");
          }
          const prefixStart = rootIndex - prefixText.length + currentIndex;
          parts.push(word.substring(prefixStart, prefixStart + prefixKey.length));
          currentIndex += prefixKey.length;
          found = true;
          break;
        }
      }
      
      // 如果没有匹配到任何前缀，剩余部分作为一个整体
      if (!found) {
        if (currentIndex > 0) {
          parts.push("·");
        }
        parts.push(word.substring(rootIndex - prefixText.length + currentIndex, rootIndex));
        break;
      }
    }
  }

  // 词根部分
  const rootEndIndex = rootIndex + matchedRoot.length;
  if (parts.length > 0) {
    parts.push("·");
  }
  parts.push(word.substring(rootIndex, rootEndIndex));

  // 后缀部分（词根之后）
  if (rootEndIndex < word.length) {
    const suffixText = word.substring(rootEndIndex);
    const suffixLower = suffixText.toLowerCase();

    // 从清单文件中获取常见后缀
    const commonSuffixes = affixesData.suffixes;
    
    // 合并所有可能的后缀（API返回的 + 清单中的），去重并按长度排序
    const allSuffixes = new Set<string>();
    // 先添加API返回的后缀（优先级更高）
    suffixes.forEach(s => {
      const key = s.toLowerCase().replace(/^[-]+/, "").replace(/[-]+$/, "");
      if (key) allSuffixes.add(key);
    });
    // 再添加清单中的常见后缀
    commonSuffixes.forEach(s => allSuffixes.add(s));
    
    const sortedSuffixes = Array.from(allSuffixes).sort((a, b) => b.length - a.length);
    
    // 从前往后按顺序匹配后缀
    let currentIndex = 0;

    while (currentIndex < suffixText.length) {
      let found = false;
      const remainingText = suffixLower.substring(currentIndex);
      
      // 尝试匹配每个后缀，优先匹配长的
      for (const suffixKey of sortedSuffixes) {
        if (remainingText.startsWith(suffixKey)) {
          // 找到匹配的后缀
          parts.push("·");
          parts.push(word.substring(rootEndIndex + currentIndex, rootEndIndex + currentIndex + suffixKey.length));
          currentIndex += suffixKey.length;
          found = true;
          break;
        }
      }
      
      // 如果没有匹配到任何后缀，尝试智能拆分
      if (!found) {
        // 尝试找到可能的拆分点（比如元音后的辅音）
        if (remainingText.length >= 2) {
          let splitPoint = -1;
          for (let i = 1; i < remainingText.length - 1; i++) {
            const char = remainingText[i];
            const prevChar = remainingText[i - 1];
            // 如果遇到元音后的辅音，可能是拆分点
            if (/[aeiou]/.test(prevChar) && /[bcdfghjklmnpqrstvwxyz]/.test(char)) {
              splitPoint = i;
              break;
            }
          }
          
          if (splitPoint > 0) {
            parts.push("·");
            parts.push(word.substring(rootEndIndex + currentIndex, rootEndIndex + currentIndex + splitPoint));
            currentIndex += splitPoint;
            found = true;
          } else {
            // 如果找不到拆分点，剩余部分作为一个整体
            parts.push("·");
            parts.push(word.substring(rootEndIndex + currentIndex));
            break;
          }
        } else {
          // 剩余部分太短，作为一个整体
          parts.push("·");
          parts.push(word.substring(rootEndIndex + currentIndex));
          break;
        }
      }
    }
  }

  return (
    <span>
      {parts.map((part, index) => (
        <span key={index}>
          {part === "·" ? (
            <span className="text-gray-400">{part}</span>
          ) : (
            part
          )}
        </span>
      ))}
    </span>
  );
}
