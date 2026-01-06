import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_URL = "https://api.ohmygpt.com/v1/chat/completions";

export async function POST(request: NextRequest) {
  try {
    // 在运行时读取环境变量
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      console.error("GEMINI_API_KEY environment variable is not set");
      return NextResponse.json(
        { error: "API配置错误，请检查环境变量 GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const { word } = await request.json();

    if (!word || typeof word !== "string" || word.trim().length === 0) {
      return NextResponse.json(
        { error: "请输入有效的单词" },
        { status: 400 }
      );
    }

    const prompt = `分析单词"${word.trim()}"的词根结构。只返回JSON，不要任何其他文字或解释。

格式：
如果是词根：{"isRoot":true,"rootWord":"${word.trim()}","rootInfo":{"partOfSpeech":"词性","phonetic":"音标","meaning":"中文意思","commonPhrases":[]},"derivedWords":[]}
如果不是词根：{"isRoot":false,"rootWord":"词根","rootInfo":{"partOfSpeech":"词性","phonetic":"音标","meaning":"中文意思","commonPhrases":[]},"derivedWords":[{"word":"扩展词","prefixes":["前缀"],"suffixes":["后缀"],"partOfSpeech":"词性","phonetic":"音标","meaning":"中文意思"}]}

要求：
1. 只返回纯JSON，不要代码块标记
2. derivedWords最多20个，必须包含被搜索的单词（如果不是词根）
3. 确保JSON完整且格式正确，可以解析
4. 使用双引号，不要单引号
5. 不要尾随逗号`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gemini-3-flash-preview",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2, // 降低 temperature 可以加快响应
        max_tokens: 5000, // 增加输出长度，确保能返回完整的20个扩展词汇
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      let errorMessage = "API调用失败，请稍后重试";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.error || errorMessage;
      } catch (e) {
        // 如果无法解析错误，使用原始错误文本
        errorMessage = errorText || errorMessage;
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // 尝试多种可能的响应格式
    let content = "";
    if (data.choices?.[0]?.message?.content) {
      content = data.choices[0].message.content;
    } else if (data.content) {
      content = data.content;
    } else if (data.text) {
      content = data.text;
    } else if (data.message?.content) {
      content = data.message.content;
    } else {
      // 如果都没有，记录完整响应用于调试
      console.error("Unexpected API response format:", JSON.stringify(data, null, 2));
      return NextResponse.json(
        { error: "API返回格式异常，请检查日志" },
        { status: 500 }
      );
    }

    if (!content || content.trim().length === 0) {
      console.error("Empty content from API:", JSON.stringify(data, null, 2));
      return NextResponse.json(
        { error: "API返回内容为空" },
        { status: 500 }
      );
    }

    // 尝试从响应中提取JSON
    let jsonContent = content.trim();
    
    // 如果响应包含代码块，提取其中的JSON（支持多种格式）
    // 匹配 ```json ... ``` 或 ``` ... ```，使用非贪婪匹配
    const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonContent = jsonMatch[1].trim();
    }
    
    // 如果还是没有找到，尝试查找第一个 { 到最后一个 } 之间的内容
    if (!jsonContent.startsWith("{")) {
      const firstBrace = jsonContent.indexOf("{");
      const lastBrace = jsonContent.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonContent = jsonContent.substring(firstBrace, lastBrace + 1);
      }
    }

    // 尝试解析JSON
    let result;
    try {
      result = JSON.parse(jsonContent);
    } catch (e) {
      console.error("JSON parse error:", e);
      console.error("Content length:", jsonContent.length);
      console.error("Content to parse (first 1000 chars):", jsonContent.substring(0, 1000));
      console.error("Content to parse (last 500 chars):", jsonContent.substring(Math.max(0, jsonContent.length - 500)));
      
      // 如果解析失败，尝试修复常见的 JSON 问题
      try {
        let cleaned = jsonContent;
        
        // 修复单引号（如果有）
        cleaned = cleaned.replace(/'/g, '"');
        
        // 尝试找到完整的 JSON
        const firstBrace = cleaned.indexOf("{");
        let lastBrace = cleaned.lastIndexOf("}");
        
        // 如果最后一个}后面还有内容，可能是JSON被截断了
        // 尝试找到最后一个完整的结构
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          // 检查是否在字符串中（简单检查）
          let braceCount = 0;
          let inString = false;
          let escapeNext = false;
          let actualLastBrace = -1;
          
          for (let i = firstBrace; i < cleaned.length; i++) {
            const char = cleaned[i];
            if (escapeNext) {
              escapeNext = false;
              continue;
            }
            if (char === '\\') {
              escapeNext = true;
              continue;
            }
            if (char === '"') {
              inString = !inString;
              continue;
            }
            if (!inString) {
              if (char === '{') braceCount++;
              if (char === '}') {
                braceCount--;
                if (braceCount === 0) {
                  actualLastBrace = i;
                }
              }
            }
          }
          
          // 如果找到了完整的JSON结构
          if (actualLastBrace !== -1) {
            cleaned = cleaned.substring(firstBrace, actualLastBrace + 1);
          } else {
            // 使用原来的方法
            cleaned = cleaned.substring(firstBrace, lastBrace + 1);
            
            // 如果 JSON 看起来不完整，尝试补全
            if (!cleaned.endsWith("}")) {
              // 计算需要关闭的括号
              const openBraces = (cleaned.match(/\{/g) || []).length;
              const closeBraces = (cleaned.match(/\}/g) || []).length;
              const openBrackets = (cleaned.match(/\[/g) || []).length;
              const closeBrackets = (cleaned.match(/\]/g) || []).length;
              
              // 补全缺失的括号
              cleaned += "]".repeat(Math.max(0, openBrackets - closeBrackets));
              cleaned += "}".repeat(Math.max(0, openBraces - closeBraces));
            }
          }
          
          // 移除可能的尾随逗号（多次尝试）
          for (let i = 0; i < 5; i++) {
            cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
          }
          
          // 如果 JSON 被截断，尝试智能补全
          if (!cleaned.endsWith("}")) {
            // 检查是否在 derivedWords 数组中
            const derivedWordsMatch = cleaned.match(/"derivedWords"\s*:\s*\[/);
            if (derivedWordsMatch) {
              // 找到最后一个完整的对象
              let lastCompleteObject = cleaned.lastIndexOf("}");
              if (lastCompleteObject > 0) {
                // 检查是否在数组中
                const beforeLastObject = cleaned.substring(0, lastCompleteObject);
                const openBrackets = (beforeLastObject.match(/\[/g) || []).length;
                const closeBrackets = (beforeLastObject.match(/\]/g) || []).length;
                
                // 如果数组没有关闭，补全
                if (openBrackets > closeBrackets) {
                  cleaned = cleaned.substring(0, lastCompleteObject + 1);
                  // 移除可能的尾随逗号
                  cleaned = cleaned.replace(/,\s*$/, "");
                  cleaned += "]";
                }
              }
            }
            
            // 计算需要关闭的括号
            const openBraces = (cleaned.match(/\{/g) || []).length;
            const closeBraces = (cleaned.match(/\}/g) || []).length;
            const openBrackets = (cleaned.match(/\[/g) || []).length;
            const closeBrackets = (cleaned.match(/\]/g) || []).length;
            
            // 补全缺失的括号
            cleaned += "]".repeat(Math.max(0, openBrackets - closeBrackets));
            cleaned += "}".repeat(Math.max(0, openBraces - closeBraces));
          }
          
          // 再次移除尾随逗号
          for (let i = 0; i < 5; i++) {
            cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
          }
          
          result = JSON.parse(cleaned);
          console.log("Successfully parsed after cleaning");
          
          // 验证结果结构
          if (!result.isRoot && result.derivedWords && !Array.isArray(result.derivedWords)) {
            result.derivedWords = [];
          }
        } else {
          throw new Error("无法找到有效的JSON结构");
        }
      } catch (e2) {
        console.error("Second parse attempt failed:", e2);
        console.error("Failed content (first 1000 chars):", jsonContent.substring(0, 1000));
        console.error("Failed content (last 500 chars):", jsonContent.substring(Math.max(0, jsonContent.length - 500)));
        console.error("Original content (first 500 chars):", content.substring(0, 500));
        
        // 最后一次尝试：尝试提取部分有效的 JSON
        try {
          const firstBrace = jsonContent.indexOf("{");
          if (firstBrace !== -1) {
            // 尝试找到最后一个完整的 derivedWords 对象
            const derivedWordsPattern = /"derivedWords"\s*:\s*\[([\s\S]*?)(\]|$)/;
            const match = jsonContent.match(derivedWordsPattern);
            
            if (match) {
              // 找到最后一个完整的对象
              let partialJson = jsonContent.substring(firstBrace);
              // 如果数组没有关闭，尝试关闭它
              if (!partialJson.includes('"derivedWords"') || !partialJson.match(/"derivedWords"\s*:\s*\[[\s\S]*\]/)) {
                // 找到最后一个完整的对象并关闭数组
                const lastCompleteObj = partialJson.lastIndexOf("}");
                if (lastCompleteObj > 0) {
                  partialJson = partialJson.substring(0, lastCompleteObj + 1);
                  // 尝试补全 derivedWords 数组
                  if (partialJson.includes('"derivedWords"') && !partialJson.match(/"derivedWords"\s*:\s*\[[\s\S]*\]/)) {
                    const beforeDerived = partialJson.substring(0, partialJson.indexOf('"derivedWords"'));
                    const afterDerived = partialJson.substring(partialJson.indexOf('"derivedWords"'));
                    const lastObj = afterDerived.lastIndexOf("}");
                    if (lastObj > 0) {
                      partialJson = beforeDerived + afterDerived.substring(0, lastObj + 1).replace(/,\s*$/, "") + "]";
                    }
                  }
                  partialJson += "}";
                  
                  // 移除尾随逗号
                  partialJson = partialJson.replace(/,(\s*[}\]])/g, '$1');
                  result = JSON.parse(partialJson);
                  console.log("Successfully parsed partial JSON");
                }
              }
            }
          }
        } catch (e3) {
          console.error("Third parse attempt failed:", e3);
          return NextResponse.json(
            { 
              error: `无法解析API响应。JSON可能被截断或格式错误。原始内容预览: ${content.substring(0, 200)}...` 
            },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error analyzing word:", error);
    
    // 处理超时错误
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: "请求超时，请稍后重试" },
        { status: 504 }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : "分析失败，请稍后重试";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

