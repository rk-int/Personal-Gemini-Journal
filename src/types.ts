export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
}

export type ReflectionMode = 'reflective' | 'socratic' | 'brainstorm' | 'action' | 'gratitude';

export interface JournalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  modelUsed?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  mood: string;
  mode: ReflectionMode;
  messages: JournalMessage[];
  summary?: string;
  takeaways?: string[];
  actionItems?: string[];
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ReflectionPrompt {
  id: string;
  category: string;
  title: string;
  prompt: string;
  suggestedMode: ReflectionMode;
}
