
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
  const rootIndex = wordLower.indexOf(rootLower);

  if (rootIndex === -1) {
    // 如果找不到词根，直接返回原单词
    return <span>{word}</span>;
  }

  const parts: string[] = [];

  // 前缀部分（词根之前）
  if (rootIndex > 0) {
    const prefixText = word.substring(0, rootIndex);
    const prefixLower = prefixText.toLowerCase();

    // 尝试匹配前缀列表
    if (prefixes.length > 0) {
      // 从前往后匹配前缀
      let currentIndex = 0;
      
      while (currentIndex < prefixText.length) {
        let found = false;
        const remainingText = prefixLower.substring(currentIndex);
        
        // 尝试匹配每个前缀
        for (const prefix of prefixes) {
          const prefixKey = prefix.toLowerCase().replace(/^[-]+/, "").replace(/[-]+$/, "");
          
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
    } else {
      // 没有前缀列表，整个前缀作为一个部分
      parts.push(prefixText);
    }
  }

  // 词根部分
  const rootEndIndex = rootIndex + rootWord.length;
  if (parts.length > 0) {
    parts.push("·");
  }
  parts.push(word.substring(rootIndex, rootEndIndex));

  // 后缀部分（词根之后）
  if (rootEndIndex < word.length) {
    const suffixText = word.substring(rootEndIndex);
    const suffixLower = suffixText.toLowerCase();

    // 尝试匹配后缀列表
    if (suffixes.length > 0) {
      // 从前往后按顺序匹配后缀
      let currentIndex = 0;

      while (currentIndex < suffixText.length) {
        let found = false;
        const remainingText = suffixLower.substring(currentIndex);
        
        // 尝试匹配每个后缀
        for (const suffix of suffixes) {
          const suffixKey = suffix.toLowerCase().replace(/^[-]+/, "").replace(/[-]+$/, "");
          
          if (remainingText.startsWith(suffixKey)) {
            // 找到匹配的后缀
            parts.push("·");
            parts.push(word.substring(rootEndIndex + currentIndex, rootEndIndex + currentIndex + suffixKey.length));
            
            currentIndex += suffixKey.length;
            found = true;
            break;
          }
        }
        
        // 如果没有匹配到任何后缀，剩余部分作为一个整体
        if (!found) {
          parts.push("·");
          parts.push(word.substring(rootEndIndex + currentIndex));
          break;
        }
      }
    } else {
      // 没有后缀列表，整个后缀作为一个部分
      parts.push("·");
      parts.push(suffixText);
    }
  }

  return (
    <span>
      {parts.map((part, index) => (
        <span key={index}>
          {part}
        </span>
      ))}
    </span>
  );
}
