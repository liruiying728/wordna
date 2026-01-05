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
    const content = data.choices?.[0]?.message?.content || "";

    // 尝试从响应中提取JSON
    let jsonContent = content.trim();
    
    // 如果响应包含代码块，提取其中的JSON
    const jsonMatch = jsonContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1];
    }

    // 尝试解析JSON
    let result;
    try {
      result = JSON.parse(jsonContent);
    } catch (e) {
      // 如果解析失败，尝试查找第一个 { 到最后一个 } 之间的内容
      const firstBrace = jsonContent.indexOf("{");
      const lastBrace = jsonContent.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        result = JSON.parse(jsonContent.substring(firstBrace, lastBrace + 1));
      } else {
        throw new Error("无法解析API响应");
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

