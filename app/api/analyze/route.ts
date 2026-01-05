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

    const prompt = `分析单词"${word.trim()}"的词根结构。返回JSON：

如果是词根：
{"isRoot":true,"rootWord":"${word.trim()}","rootInfo":{"partOfSpeech":"词性","phonetic":"音标","meaning":"中文意思","commonPhrases":[]},"derivedWords":[]}

如果不是词根：
{"isRoot":false,"rootWord":"词根","rootInfo":{"partOfSpeech":"词性","phonetic":"音标","meaning":"中文意思","commonPhrases":[]},"derivedWords":[{"word":"扩展词","prefixes":["前缀"],"suffixes":["后缀"],"partOfSpeech":"词性","phonetic":"音标","meaning":"中文意思"}]}

要求：只返回JSON，无其他文字。derivedWords包含常见扩展词。`;

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
        max_tokens: 2000, // 限制输出长度
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
    
    // 调试：记录 API 响应结构
    console.log("API Response structure:", JSON.stringify(data, null, 2));
    
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
      console.error("Content to parse:", jsonContent);
      console.error("Original content:", content.substring(0, 500));
      
      // 如果解析失败，尝试修复常见的 JSON 问题
      try {
        // 移除可能的尾随逗号
        let cleaned = jsonContent.replace(/,(\s*[}\]])/g, '$1');
        // 尝试找到完整的 JSON（如果被截断，尝试补全）
        const firstBrace = cleaned.indexOf("{");
        const lastBrace = cleaned.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          cleaned = cleaned.substring(firstBrace, lastBrace + 1);
          // 如果 JSON 看起来不完整，尝试补全
          if (!cleaned.endsWith("}")) {
            // 计算需要关闭的括号
            const openBraces = (cleaned.match(/\{/g) || []).length;
            const closeBraces = (cleaned.match(/\}/g) || []).length;
            const openBrackets = (cleaned.match(/\[/g) || []).length;
            const closeBrackets = (cleaned.match(/\]/g) || []).length;
            
            // 补全缺失的括号
            cleaned += "]".repeat(openBrackets - closeBrackets);
            cleaned += "}".repeat(openBraces - closeBraces);
          }
          result = JSON.parse(cleaned);
        } else {
          throw new Error("无法找到有效的JSON结构");
        }
      } catch (e2) {
        console.error("Second parse attempt failed:", e2);
        return NextResponse.json(
          { error: `无法解析API响应。请查看 Vercel 日志获取详细信息。` },
          { status: 500 }
        );
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

