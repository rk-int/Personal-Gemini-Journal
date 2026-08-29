import { ReflectionPrompt } from '../types';

export const REFLECTION_PROMPTS: ReflectionPrompt[] = [
  {
    id: 'daily-clarity',
    category: 'Daily Mindset',
    title: 'Daily Clarity Check-in',
    prompt: 'What was the most meaningful event of today, and what underlying emotions or realizations did it evoke in you?',
    suggestedMode: 'reflective',
  },
  {
    id: 'socratic-decision',
    category: 'Decision Making',
    title: 'Unpacking an Ambiguity',
    prompt: "I am facing a decision where I feel torn. Help me dissect the core assumptions and unspoken fears behind each option.",
    suggestedMode: 'socratic',
  },
  {
    id: 'creative-brainstorm',
    category: 'Ideation',
    title: 'Creative Possibilities',
    prompt: 'I want to brainstorm innovative approaches for a project or habit I want to start. Let us explore unconventional perspectives.',
    suggestedMode: 'brainstorm',
  },
  {
    id: 'action-catalyst',
    category: 'Productivity',
    title: 'Translating Overwhelm into Micro-steps',
    prompt: 'I feel overwhelmed by a long list of responsibilities. Help me prioritize the single highest-leverage first step.',
    suggestedMode: 'action',
  },
  {
    id: 'gratitude-savoring',
    category: 'Wellbeing',
    title: 'Gratitude & Savoring',
    prompt: 'What are three quiet, overlooked moments from recent days that you genuinely appreciate, and why?',
    suggestedMode: 'gratitude',
  },
];

export const MOOD_OPTIONS = [
  { id: 'Reflective', label: 'Reflective', emoji: '🪞', color: 'bg-stone-100 text-stone-800 border-stone-300' },
  { id: 'Inspired', label: 'Inspired', emoji: '✨', color: 'bg-amber-50 text-amber-900 border-amber-200' },
  { id: 'Contemplative', label: 'Contemplative', emoji: '💭', color: 'bg-indigo-50 text-indigo-900 border-indigo-200' },
  { id: 'Grateful', label: 'Grateful', emoji: '🌱', color: 'bg-emerald-50 text-emerald-900 border-emerald-200' },
  { id: 'Determined', label: 'Determined', emoji: '🔥', color: 'bg-orange-50 text-orange-900 border-orange-200' },
  { id: 'Peaceful', label: 'Peaceful', emoji: '🌊', color: 'bg-sky-50 text-sky-900 border-sky-200' },
];

export const REFLECTION_MODES: {
  id: 'reflective' | 'socratic' | 'brainstorm' | 'action' | 'gratitude';
  name: string;
  desc: string;
  badge: string;
}[] = [
  {
    id: 'reflective',
    name: 'Thought Partner',
    desc: 'Empathetic, deep reflection and validating perspective.',
    badge: 'Empathetic',
  },
  {
    id: 'socratic',
    name: 'Socratic Inquiry',
    desc: 'Probes deeper assumptions with incisive self-discovery questions.',
    badge: 'Probing',
  },
  {
    id: 'brainstorm',
    name: 'Creative Catalyst',
    desc: 'Fresh angles, creative brainstorming, and divergent thinking.',
    badge: 'Creative',
  },
  {
    id: 'action',
    name: 'Action Coach',
    desc: 'Translates introspection into clear, actionable micro-steps.',
    badge: 'Action-Oriented',
  },
  {
    id: 'gratitude',
    name: 'Gratitude Savoring',
    desc: 'Mindful savoring and deep appreciation for life experiences.',
    badge: 'Mindful',
  },
];
