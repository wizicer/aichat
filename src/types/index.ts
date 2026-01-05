// Chat session
export interface Chat {
  id: string;
  characterId: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
  pinned: boolean;
  muted: boolean;
}

// Chat message
export interface Message {
  id: string;
  chatId: string;
  sender: 'user' | 'ai' | 'system';
  type: 'text' | 'image' | 'voice' | 'redpacket' | 'location' | 'link' | 'system' | 'reality';
  content: string;
  metadata?: MessageMetadata;
  recalled: boolean;
  timestamp: number;
}

export interface MessageMetadata {
  // Image message
  imageUrl?: string;
  // Voice message
  duration?: number;
  voiceUrl?: string;
  // Red packet
  redpacketId?: string;
  redpacketAmount?: number;
  redpacketMessage?: string;
  redpacketClaimed?: boolean;
  // Location
  locationName?: string;
  locationAddress?: string;
  latitude?: number;
  longitude?: number;
  // Link
  linkUrl?: string;
  linkTitle?: string;
  linkDescription?: string;
  linkImage?: string;
  // Reality card
  realityId?: string;
}

// Character card
export interface Character {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  persona: string;
  createdAt: number;
  updatedAt: number;
}

// Moments (朋友圈)
export interface Moment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  images: string[];
  likes: string[];
  comments: MomentComment[];
  timestamp: number;
}

export interface MomentComment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  replyTo?: string;
  timestamp: number;
}

// Lore book (世界书)
export interface LoreBook {
  id: string;
  name: string;
  content: string;
  category: string;
  priority: number;
  enabled: boolean;
}

// Reality card
export interface Reality {
  id: string;
  chatId: string;
  status: 'pending' | 'active' | 'ended';
  title: string;
  paragraphs: RealityParagraph[];
  summary?: string;
  createdAt: number;
}

export interface RealityParagraph {
  id: string;
  content: string;
  choices?: RealityChoice[];
  chosenId?: string;
}

export interface RealityChoice {
  id: string;
  label: string;
}

// User settings
export interface Settings {
  id: string;
  provider: AIProvider;
  apiEndpoint: string;
  apiKey: string;
  model: string;
  darkMode: boolean;
  fontSize: number;
  notifications: boolean;
  debugMode: boolean;
}

// User profile
export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  balance: number;
}

// Wallet transaction
export interface Transaction {
  id: string;
  type: 'receive' | 'send';
  amount: number;
  description: string;
  relatedId?: string;
  timestamp: number;
}

// AI Provider types
export type AIProvider = 'openai' | 'gemini' | 'deepseek' | 'moonshot' | 'custom';

export interface AIProviderConfig {
  id: AIProvider;
  name: string;
  defaultEndpoint: string;
  models: string[];
}

// AI Response types
export interface AITextResponse {
  type: 'text';
  content: string;
}

export interface AIRealityResponse {
  type: 'reality';
  title: string;
  paragraph: string;
  choices: RealityChoice[];
}

export type AIResponse = AITextResponse | AIRealityResponse;

// Debug info for AI responses (in-memory only)
export interface AIDebugInfo {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  prompt: { role: string; content: string }[];
  rawResponse: string;
  timestamp: number;
}

// Extended AI response with debug info
export interface AIResponseWithDebug {
  response: AIResponse;
  debug?: AIDebugInfo;
}

// Predefined character templates
export interface CharacterTemplate {
  name: string;
  avatar: string;
  bio: string;
  persona: string;
}

// Predefined lore templates
export interface LoreTemplate {
  name: string;
  content: string;
  category: string;
  priority: number;
}

// Token usage tracking (persistent)
export interface TokenUsage {
  id: string;
  characterId: string;  // Character ID or 'system' for non-character usage
  characterName: string;
  provider: AIProvider;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  timestamp: number;
}

// Aggregated token stats
export interface TokenStats {
  characterId: string;
  characterName: string;
  provider: AIProvider;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  requestCount: number;
}
