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

    const prompt = `你是一个英语词根分析专家。请分析单词 "${word.trim()}"。

要求：
1. 首先判断这个单词是否是词根（root word）
2. 如果是词根，返回JSON格式：
{
  "isRoot": true,
  "rootWord": "${word.trim()}",
  "rootInfo": {
    "partOfSpeech": "词性（如：noun, verb, adjective等）",
    "phonetic": "音标",
    "meaning": "中文意思",
    "commonPhrases": []
  },
  "derivedWords": []
}

3. 如果不是词根，返回JSON格式：
{
  "isRoot": false,
  "rootWord": "词根单词",
  "rootInfo": {
    "partOfSpeech": "词性",
    "phonetic": "音标",
    "meaning": "中文意思",
    "commonPhrases": []
  },
  "derivedWords": [
    {
      "word": "扩展词1",
      "prefixes": ["前缀1"],
      "suffixes": ["后缀1"],
      "partOfSpeech": "词性",
      "phonetic": "音标",
      "meaning": "中文意思"
    }
  ]
}

重要提示：
- derivedWords应该包含基于该词根的所有常见扩展词（加前缀、后缀、或复合前缀后缀）
- 必须严格返回纯JSON格式，不要包含任何markdown代码块标记，不要有任何其他文字说明
- 确保所有字段都有值，数组可以为空但不能缺失
- JSON必须是有效的，可以被直接解析`;

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
        temperature: 0.3,
      }),
    });

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
    const errorMessage = error instanceof Error ? error.message : "分析失败，请稍后重试";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

