import type { AIProvider, AIResponse, AIResponseWithDebug, AIDebugInfo, Settings, Character, Message, LoreBook, CharacterTemplate, LoreTemplate } from '@/types';
import { db } from '@/services/db';

// Record token usage to database
async function recordTokenUsage(
  characterId: string,
  characterName: string,
  provider: AIProvider,
  promptTokens: number,
  completionTokens: number,
  totalTokens: number
): Promise<void> {
  try {
    await db.tokenUsage.add({
      id: crypto.randomUUID(),
      characterId,
      characterName,
      provider,
      promptTokens,
      completionTokens,
      totalTokens,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Failed to record token usage:', error);
  }
}

// Predefined character templates
export const PREDEFINED_CHARACTERS: CharacterTemplate[] = [
  {
    name: '小助手',
    avatar: '',
    bio: '你的AI助手',
    persona: '你是一个友好、热情的AI助手。你说话温和有礼，善于倾听和理解用户的需求。你会用轻松幽默的方式与用户交流，同时保持专业和有帮助。'
  },
  {
    name: '猫娘',
    avatar: '',
    bio: '喵~',
    persona: '你是一只可爱的猫娘，名叫小喵。你说话时会加上"喵"作为语气词，性格活泼可爱，喜欢撒娇。你对主人非常忠诚，喜欢被摸头和吃小鱼干。你会用可爱的方式表达情感，比如开心时说"喵呜~"，难过时说"呜喵..."。'
  },
  {
    name: '冷酷总裁',
    avatar: '',
    bio: '商业帝国的主人',
    persona: '你是一位年轻有为的商业总裁，外表冷酷但内心温柔。你说话简洁有力，不喜欢废话。你工作能力出众，对下属严格但公正。在喜欢的人面前，你会不自觉地流露出关心和温柔的一面。'
  },
  {
    name: '温柔学姐',
    avatar: '',
    bio: '大学文学社社长',
    persona: '你是大学文学社的社长，一位温柔知性的学姐。你说话轻声细语，喜欢用文学典故和诗词。你对学弟学妹们很照顾，总是耐心地解答问题。你热爱阅读和写作，梦想成为一名作家。'
  },
  {
    name: '中二少年',
    avatar: '',
    bio: '被封印的魔王',
    persona: '你是一个中二病少年，自称是被封印的魔王。你说话夸张，喜欢用各种中二台词，比如"我的右手又在疼了"、"黑暗力量觉醒吧"。你其实是个善良的人，只是喜欢幻想自己是动漫中的角色。'
  }
];

// Predefined lore templates
export const PREDEFINED_LORE: LoreTemplate[] = [
  {
    name: '现代都市',
    content: '故事发生在现代都市，有高楼大厦、繁华街道、便利店、咖啡厅等现代场景。角色们使用手机、电脑等现代科技产品。',
    category: '世界观',
    priority: 10
  },
  {
    name: '魔法学院',
    content: '这是一所魔法学院，学生们学习各种魔法。有元素魔法、治愈魔法、召唤魔法等。学院有图书馆、魔法训练场、宿舍等设施。',
    category: '世界观',
    priority: 10
  },
  {
    name: '末世废土',
    content: '这是一个后末日世界，文明崩塌，资源匮乏。幸存者们在废墟中求生，需要面对变异生物和其他幸存者的威胁。',
    category: '世界观',
    priority: 10
  },
  {
    name: '古代东方',
    content: '故事背景是古代东方，有皇宫、江湖、茶馆、客栈等场景。人们穿着古装，使用银两交易，有武林高手和江湖门派。',
    category: '世界观',
    priority: 10
  },
  {
    name: '亲密关系',
    content: '角色与用户是亲密的关系，可以是恋人、好友或家人。角色会主动关心用户，记住用户的喜好，在交流中表达情感。',
    category: '人物',
    priority: 5
  }
];

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

  // Get recent messages (include system messages for reality summaries, exclude reality invites)
  const recentMessages = messages
    .filter(m => m.type !== 'reality')
    .slice(-maxHistory);

  for (const msg of recentMessages) {
    // System messages (reality summaries) are added as assistant context
    if (msg.sender === 'system') {
      result.push({
        role: 'assistant',
        content: msg.content
      });
    } else {
      result.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    }
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

// API response with usage info
interface OpenAIResponse {
  choices: { message: { content: string } }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface GeminiResponse {
  candidates: { content: { parts: { text: string }[] } }[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

// Call OpenAI-compatible API (works for OpenAI, DeepSeek, Moonshot)
async function callOpenAICompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[]
): Promise<{ content: string; usage?: { prompt: number; completion: number; total: number } }> {
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

  const data: OpenAIResponse = await response.json();
  return {
    content: data.choices[0].message.content,
    usage: data.usage ? {
      prompt: data.usage.prompt_tokens,
      completion: data.usage.completion_tokens,
      total: data.usage.total_tokens
    } : undefined
  };
}

// Call Gemini API
async function callGemini(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[]
): Promise<{ content: string; usage?: { prompt: number; completion: number; total: number } }> {
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

  const data: GeminiResponse = await response.json();
  return {
    content: data.candidates[0].content.parts[0].text,
    usage: data.usageMetadata ? {
      prompt: data.usageMetadata.promptTokenCount,
      completion: data.usageMetadata.candidatesTokenCount,
      total: data.usageMetadata.totalTokenCount
    } : undefined
  };
}

// Main AI service
export const aiService = {
  // Send message and get AI response
  async chat(
    settings: Settings,
    character: Character,
    messages: Message[],
    loreBooks: LoreBook[],
    includeDebug: boolean = false
  ): Promise<AIResponseWithDebug> {
    if (!settings.apiKey) {
      throw new Error('请先在设置中配置API密钥');
    }

    const systemPrompt = buildSystemPrompt(character, loreBooks);
    const apiMessages = buildMessages(systemPrompt, messages);

    let result: { content: string; usage?: { prompt: number; completion: number; total: number } };

    if (settings.provider === 'gemini') {
      result = await callGemini(
        settings.apiEndpoint,
        settings.apiKey,
        settings.model,
        apiMessages
      );
    } else {
      // OpenAI-compatible API (OpenAI, DeepSeek, Moonshot, Custom)
      result = await callOpenAICompatible(
        settings.apiEndpoint,
        settings.apiKey,
        settings.model,
        apiMessages
      );
    }

    let response = parseAIResponse(result.content);
    
    // Ensure there's always an 'end' option in reality responses
    if (response.type === 'reality' && response.choices) {
      const hasEndOption = response.choices.some(c => c.id === 'end');
      if (!hasEndOption) {
        response.choices.push({ id: 'end', label: '结束互动，返回聊天' });
      }
    }
    
    // Record token usage
    const promptTokens = result.usage?.prompt || 0;
    const completionTokens = result.usage?.completion || 0;
    const totalTokens = result.usage?.total || 0;
    
    if (totalTokens > 0) {
      await recordTokenUsage(
        character.id,
        character.name,
        settings.provider,
        promptTokens,
        completionTokens,
        totalTokens
      );
    }
    
    // Build debug info if requested
    let debug: AIDebugInfo | undefined;
    if (includeDebug) {
      debug = {
        promptTokens,
        completionTokens,
        totalTokens,
        prompt: apiMessages,
        rawResponse: result.content,
        timestamp: Date.now()
      };
    }

    return { response, debug };
  },

  // Generate a reality card suggestion based on conversation
  async suggestReality(
    settings: Settings,
    character: Character,
    messages: Message[],
    loreBooks: LoreBook[],
    includeDebug: boolean = false
  ): Promise<AIResponseWithDebug> {
    if (!settings.apiKey) {
      throw new Error('请先在设置中配置API密钥');
    }

    // Build special prompt for reality suggestion
    let prompt = `你是${character.name}。${character.persona}\n\n`;
    
    const enabledLore = loreBooks.filter(l => l.enabled).sort((a, b) => b.priority - a.priority);
    if (enabledLore.length > 0) {
      prompt += '【世界观设定】\n';
      for (const lore of enabledLore) {
        prompt += `${lore.name}：${lore.content}\n`;
      }
      prompt += '\n';
    }

    prompt += `请根据之前的对话内容，创建一个有趣的互动场景（现实）。这个场景应该：
1. 与当前对话主题相关
2. 有引人入胜的开场描述
3. 提供3-5个有意义的选择，让用户有更丰富的体验
4. 最后一个选择应该是自然地结束这个场景的方式（不要生硬地说"结束互动"，而是用符合场景的说法）

请使用以下JSON格式回复：
\`\`\`json
{
  "type": "reality",
  "title": "场景标题",
  "paragraph": "场景描述内容（100-200字）",
  "choices": [
    {"id": "1", "label": "选项1"},
    {"id": "2", "label": "选项2"},
    {"id": "3", "label": "选项3"},
    {"id": "4", "label": "选项4（可选）"},
    {"id": "end", "label": "用符合场景的自然方式表达离开/结束，例如：'告别离开'、'婉拒邀请'、'回到现实'等"}
  ]
}
\`\`\`

重要：
- choices数组必须包含3-5个选项
- 最后一个选项的id必须是"end"，但label要自然地融入场景，不要生硬
- 每个选项都应该有明确的行动导向`;

    // Build messages with conversation history
    const apiMessages: { role: string; content: string }[] = [
      { role: 'system', content: prompt }
    ];

    // Add recent conversation for context
    const recentMessages = messages
      .filter(m => m.sender !== 'system' && m.type === 'text')
      .slice(-10);

    for (const msg of recentMessages) {
      apiMessages.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    }

    apiMessages.push({
      role: 'user',
      content: '请根据我们的对话，创建一个互动场景。'
    });

    let result: { content: string; usage?: { prompt: number; completion: number; total: number } };

    if (settings.provider === 'gemini') {
      result = await callGemini(
        settings.apiEndpoint,
        settings.apiKey,
        settings.model,
        apiMessages
      );
    } else {
      result = await callOpenAICompatible(
        settings.apiEndpoint,
        settings.apiKey,
        settings.model,
        apiMessages
      );
    }

    let response = parseAIResponse(result.content);
    
    // Ensure there's always an 'end' option in reality responses
    if (response.type === 'reality' && response.choices) {
      const hasEndOption = response.choices.some(c => c.id === 'end');
      if (!hasEndOption) {
        response.choices.push({ id: 'end', label: '结束互动，返回聊天' });
      }
    }
    
    // Record token usage
    const promptTokens = result.usage?.prompt || 0;
    const completionTokens = result.usage?.completion || 0;
    const totalTokens = result.usage?.total || 0;
    
    if (totalTokens > 0) {
      await recordTokenUsage(
        character.id,
        character.name,
        settings.provider,
        promptTokens,
        completionTokens,
        totalTokens
      );
    }
    
    let debug: AIDebugInfo | undefined;
    if (includeDebug) {
      debug = {
        promptTokens,
        completionTokens,
        totalTokens,
        prompt: apiMessages,
        rawResponse: result.content,
        timestamp: Date.now()
      };
    }

    return { response, debug };
  },

  // Continue reality story
  async continueReality(
    settings: Settings,
    character: Character,
    realityTitle: string,
    paragraphs: { content: string; chosenLabel?: string }[],
    loreBooks: LoreBook[],
    includeDebug: boolean = false
  ): Promise<AIResponseWithDebug> {
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
    {"id": "2", "label": "选项2"},
    {"id": "3", "label": "选项3"},
    {"id": "4", "label": "选项4（可选）"},
    {"id": "end", "label": "用符合场景的自然方式表达离开/结束"}
  ]
}
\`\`\`

重要：
- 提供3-5个选项让用户有更丰富的体验
- 最后一个选项的id必须是"end"，但label要自然地融入场景（如"告别离开"、"回到日常"等），不要生硬
- 如果故事自然结束，可以只提供一个自然的end选项`;

    const apiMessages = [
      { role: 'system', content: context },
      { role: 'user', content: '请继续故事' }
    ];

    let result: { content: string; usage?: { prompt: number; completion: number; total: number } };

    if (settings.provider === 'gemini') {
      result = await callGemini(
        settings.apiEndpoint,
        settings.apiKey,
        settings.model,
        apiMessages
      );
    } else {
      result = await callOpenAICompatible(
        settings.apiEndpoint,
        settings.apiKey,
        settings.model,
        apiMessages
      );
    }

    let response = parseAIResponse(result.content);
    
    // Ensure there's always an 'end' option in reality responses
    if (response.type === 'reality' && response.choices) {
      const hasEndOption = response.choices.some(c => c.id === 'end');
      if (!hasEndOption) {
        response.choices.push({ id: 'end', label: '结束互动，返回聊天' });
      }
    }
    
    // Record token usage
    const promptTokens = result.usage?.prompt || 0;
    const completionTokens = result.usage?.completion || 0;
    const totalTokens = result.usage?.total || 0;
    
    if (totalTokens > 0) {
      await recordTokenUsage(
        character.id,
        character.name,
        settings.provider,
        promptTokens,
        completionTokens,
        totalTokens
      );
    }
    
    let debug: AIDebugInfo | undefined;
    if (includeDebug) {
      debug = {
        promptTokens,
        completionTokens,
        totalTokens,
        prompt: apiMessages,
        rawResponse: result.content,
        timestamp: Date.now()
      };
    }

    return { response, debug };
  },

  // Test API connection
  async testConnection(settings: Settings): Promise<{ success: boolean; message: string }> {
    try {
      const testMessages = [
        { role: 'system', content: '你是一个助手。' },
        { role: 'user', content: '请回复"连接成功"四个字。' }
      ];

      let result: { content: string };
      if (settings.provider === 'gemini') {
        result = await callGemini(
          settings.apiEndpoint,
          settings.apiKey,
          settings.model,
          testMessages
        );
      } else {
        result = await callOpenAICompatible(
          settings.apiEndpoint,
          settings.apiKey,
          settings.model,
          testMessages
        );
      }

      return {
        success: true,
        message: `连接成功！AI回复：${result.content.slice(0, 50)}${result.content.length > 50 ? '...' : ''}`
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '连接失败'
      };
    }
  },

  // Generate summary for ended reality
  async summarizeReality(
    settings: Settings,
    character: Character,
    realityTitle: string,
    paragraphs: { content: string; chosenLabel?: string }[]
  ): Promise<string> {
    if (!settings.apiKey) {
      throw new Error('请先在设置中配置API密钥');
    }

    const context = `你是${character.name}。请为以下互动场景生成一个简洁的总结（50-100字），用于后续对话的上下文参考。

场景标题：${realityTitle}

剧情经过：
${paragraphs.map((p, i) => {
  let text = `${i + 1}. ${p.content}`;
  if (p.chosenLabel) {
    text += `\n   [用户选择: ${p.chosenLabel}]`;
  }
  return text;
}).join('\n\n')}

请用第一人称（我）的视角，简洁地总结这段经历的关键内容和结果。只需要总结内容，不要有任何前缀或解释。`;

    const apiMessages = [
      { role: 'system', content: context },
      { role: 'user', content: '请生成总结' }
    ];

    let result: { content: string; usage?: { prompt: number; completion: number; total: number } };

    if (settings.provider === 'gemini') {
      result = await callGemini(
        settings.apiEndpoint,
        settings.apiKey,
        settings.model,
        apiMessages
      );
    } else {
      result = await callOpenAICompatible(
        settings.apiEndpoint,
        settings.apiKey,
        settings.model,
        apiMessages
      );
    }

    // Record token usage
    const promptTokens = result.usage?.prompt || 0;
    const completionTokens = result.usage?.completion || 0;
    const totalTokens = result.usage?.total || 0;
    
    if (totalTokens > 0) {
      await recordTokenUsage(
        character.id,
        character.name,
        settings.provider,
        promptTokens,
        completionTokens,
        totalTokens
      );
    }

    return result.content.trim();
  }
};
