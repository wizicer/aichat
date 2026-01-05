import type { AIProvider, AIResponse, Settings, Character, Message, LoreBook } from '@/types';

// Provider configurations
export const AI_PROVIDERS: Record<AIProvider, {
  name: string;
  defaultEndpoint: string;
  models: string[];
}> = {
  openai: {
    name: 'OpenAI (ChatGPT)',
    defaultEndpoint: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
  },
  gemini: {
    name: 'Google Gemini',
    defaultEndpoint: 'https://generativelanguage.googleapis.com/v1beta',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp']
  },
  deepseek: {
    name: 'DeepSeek',
    defaultEndpoint: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-reasoner']
  },
  moonshot: {
    name: 'Moonshot (月之暗面)',
    defaultEndpoint: 'https://api.moonshot.cn/v1',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k']
  },
  custom: {
    name: '自定义',
    defaultEndpoint: '',
    models: []
  }
};

// Build system prompt for character
function buildSystemPrompt(character: Character, loreBooks: LoreBook[]): string {
  let prompt = `你是${character.name}。${character.persona}\n\n`;
  
  // Add enabled lore book entries
  const enabledLore = loreBooks.filter(l => l.enabled).sort((a, b) => b.priority - a.priority);
  if (enabledLore.length > 0) {
    prompt += '【世界观设定】\n';
    for (const lore of enabledLore) {
      prompt += `${lore.name}：${lore.content}\n`;
    }
    prompt += '\n';
  }

  prompt += `请根据你的人设进行对话。你可以回复普通文本消息，也可以发起"现实"互动。

如果要发起现实互动（类似互动小说的场景），请使用以下JSON格式回复：
\`\`\`json
{
  "type": "reality",
  "title": "场景标题",
  "paragraph": "场景描述内容",
  "choices": [
    {"id": "1", "label": "选项1"},
    {"id": "2", "label": "选项2"}
  ]
}
\`\`\`

如果只是普通对话，请直接回复文字内容，不需要JSON格式。`;

  return prompt;
}

// Build messages array for API call
function buildMessages(
  systemPrompt: string,
  messages: Message[],
  maxHistory: number = 20
): { role: string; content: string }[] {
  const result: { role: string; content: string }[] = [
    { role: 'system', content: systemPrompt }
  ];

  // Get recent messages (exclude system messages)
  const recentMessages = messages
    .filter(m => m.sender !== 'system' && m.type === 'text')
    .slice(-maxHistory);

  for (const msg of recentMessages) {
    result.push({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content
    });
  }

  return result;
}

// Parse AI response
function parseAIResponse(content: string): AIResponse {
  // Try to extract JSON from response
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.type === 'reality' && parsed.title && parsed.paragraph && parsed.choices) {
        return {
          type: 'reality',
          title: parsed.title,
          paragraph: parsed.paragraph,
          choices: parsed.choices
        };
      }
    } catch {
      // Not valid JSON, treat as text
    }
  }

  // Try direct JSON parse
  try {
    const parsed = JSON.parse(content);
    if (parsed.type === 'reality' && parsed.title && parsed.paragraph && parsed.choices) {
      return {
        type: 'reality',
        title: parsed.title,
        paragraph: parsed.paragraph,
        choices: parsed.choices
      };
    }
  } catch {
    // Not valid JSON, treat as text
  }

  return {
    type: 'text',
    content: content
  };
}

// Call OpenAI-compatible API (works for OpenAI, DeepSeek, Moonshot)
async function callOpenAICompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  const response = await fetch(`${endpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.8,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API调用失败: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Call Gemini API
async function callGemini(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  // Convert messages to Gemini format
  const systemInstruction = messages.find(m => m.role === 'system')?.content || '';
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

  const response = await fetch(
    `${endpoint}/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        contents,
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2000
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API调用失败: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Main AI service
export const aiService = {
  // Send message and get AI response
  async chat(
    settings: Settings,
    character: Character,
    messages: Message[],
    loreBooks: LoreBook[]
  ): Promise<AIResponse> {
    if (!settings.apiKey) {
      throw new Error('请先在设置中配置API密钥');
    }

    const systemPrompt = buildSystemPrompt(character, loreBooks);
    const apiMessages = buildMessages(systemPrompt, messages);

    let responseText: string;

    if (settings.provider === 'gemini') {
      responseText = await callGemini(
        settings.apiEndpoint,
        settings.apiKey,
        settings.model,
        apiMessages
      );
    } else {
      // OpenAI-compatible API (OpenAI, DeepSeek, Moonshot, Custom)
      responseText = await callOpenAICompatible(
        settings.apiEndpoint,
        settings.apiKey,
        settings.model,
        apiMessages
      );
    }

    return parseAIResponse(responseText);
  },

  // Continue reality story
  async continueReality(
    settings: Settings,
    character: Character,
    realityTitle: string,
    paragraphs: { content: string; chosenLabel?: string }[],
    loreBooks: LoreBook[]
  ): Promise<AIResponse> {
    if (!settings.apiKey) {
      throw new Error('请先在设置中配置API密钥');
    }

    // Build context for reality continuation
    let context = `你是${character.name}。${character.persona}\n\n`;
    
    // Add lore books
    const enabledLore = loreBooks.filter(l => l.enabled).sort((a, b) => b.priority - a.priority);
    if (enabledLore.length > 0) {
      context += '【世界观设定】\n';
      for (const lore of enabledLore) {
        context += `${lore.name}：${lore.content}\n`;
      }
      context += '\n';
    }

    context += `你正在与用户进行一个名为"${realityTitle}"的互动叙事。\n\n`;
    context += '【之前的剧情】\n';
    for (const p of paragraphs) {
      context += p.content + '\n';
      if (p.chosenLabel) {
        context += `[用户选择了: ${p.chosenLabel}]\n`;
      }
    }

    context += `\n请根据用户的选择继续故事。使用以下JSON格式回复：
\`\`\`json
{
  "type": "reality",
  "title": "${realityTitle}",
  "paragraph": "继续的剧情内容",
  "choices": [
    {"id": "1", "label": "选项1"},
    {"id": "2", "label": "选项2"}
  ]
}
\`\`\`

如果故事应该结束，可以不提供choices数组或提供空数组。`;

    const apiMessages = [
      { role: 'system', content: context },
      { role: 'user', content: '请继续故事' }
    ];

    let responseText: string;

    if (settings.provider === 'gemini') {
      responseText = await callGemini(
        settings.apiEndpoint,
        settings.apiKey,
        settings.model,
        apiMessages
      );
    } else {
      responseText = await callOpenAICompatible(
        settings.apiEndpoint,
        settings.apiKey,
        settings.model,
        apiMessages
      );
    }

    return parseAIResponse(responseText);
  },

  // Test API connection
  async testConnection(settings: Settings): Promise<{ success: boolean; message: string }> {
    try {
      const testMessages = [
        { role: 'system', content: '你是一个助手。' },
        { role: 'user', content: '请回复"连接成功"四个字。' }
      ];

      let responseText: string;

      if (settings.provider === 'gemini') {
        responseText = await callGemini(
          settings.apiEndpoint,
          settings.apiKey,
          settings.model,
          testMessages
        );
      } else {
        responseText = await callOpenAICompatible(
          settings.apiEndpoint,
          settings.apiKey,
          settings.model,
          testMessages
        );
      }

      return {
        success: true,
        message: `连接成功！AI回复：${responseText.slice(0, 50)}${responseText.length > 50 ? '...' : ''}`
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '连接失败'
      };
    }
  }
};
