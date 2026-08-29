import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { JournalEntry, JournalMessage, ReflectionMode } from '../types';
import { MOOD_OPTIONS, REFLECTION_MODES, REFLECTION_PROMPTS } from '../data/prompts';
import {
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Download,
  AlertCircle,
  RefreshCw,
  Lightbulb,
  CheckCircle2,
  Layers,
  Tag,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Menu,
} from 'lucide-react';

interface JournalEditorProps {
  entry: JournalEntry;
  onUpdateEntry: (updatedEntry: JournalEntry) => Promise<void>;
  onToggleSidebar: () => void;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  onRetrySave: () => void;
}

export function JournalEditor({
  entry,
  onUpdateEntry,
  onToggleSidebar,
  saveStatus,
  onRetrySave,
}: JournalEditorProps) {
  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [showPromptsDrawer, setShowPromptsDrawer] = useState(false);
  const [showSummarySection, setShowSummarySection] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-scroll when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entry.messages, isGenerating]);

  // Clean speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleTitleChange = async (newTitle: string) => {
    const updated: JournalEntry = {
      ...entry,
      title: newTitle,
    };
    await onUpdateEntry(updated);
  };

  const handleMoodSelect = async (newMood: string) => {
    const updated: JournalEntry = {
      ...entry,
      mood: newMood,
    };
    await onUpdateEntry(updated);
  };

  const handleModeSelect = async (newMode: ReflectionMode) => {
    const updated: JournalEntry = {
      ...entry,
      mode: newMode,
    };
    await onUpdateEntry(updated);
  };

  // Send message to Gemini chat API
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputPrompt).trim();
    if (!textToSend || isGenerating) return;

    setErrorMessage(null);
    const userMessage: JournalMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    const newMessages = [...entry.messages, userMessage];

    // Optimistically update entry with user message
    const updatedEntryWithUser: JournalEntry = {
      ...entry,
      title: entry.title === 'New Reflection' && entry.messages.length === 0 ? textToSend.slice(0, 45) : entry.title,
      messages: newMessages,
    };

    try {
      await onUpdateEntry(updatedEntryWithUser);
      setInputPrompt('');
      setIsGenerating(true);

      // Call backend /api/chat endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          mode: entry.mode,
          reflectionTitle: updatedEntryWithUser.title,
          currentMood: entry.mood,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: JournalMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now(),
        modelUsed: data.modelUsed,
      };

      const finalUpdatedEntry: JournalEntry = {
        ...updatedEntryWithUser,
        messages: [...newMessages, assistantMessage],
      };

      await onUpdateEntry(finalUpdatedEntry);
    } catch (err: any) {
      console.error('Error generating reply from Gemini:', err);
      setErrorMessage(err.message || 'Failed to generate response. Please try again.');
    } finally {
      setIsGenerating(false);
      textareaRef.current?.focus();
    }
  };

  // Summarize the current conversation session
  const handleGenerateSummary = async () => {
    if (entry.messages.length === 0 || isSummarizing) return;

    try {
      setIsSummarizing(true);
      setErrorMessage(null);

      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: entry.messages.map((m) => ({ role: m.role, content: m.content })),
          title: entry.title,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to synthesize summary.');
      }

      const data = await response.json();
      const updated: JournalEntry = {
        ...entry,
        summary: data.summary,
        mood: data.mood || entry.mood,
        takeaways: data.takeaways || [],
        actionItems: data.actionItems || [],
        tags: data.tags || entry.tags || [],
      };

      await onUpdateEntry(updated);
      setShowSummarySection(true);
    } catch (err: any) {
      console.error('Error in summarization:', err);
      setErrorMessage(err.message || 'Failed to synthesize journal summary.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleSpeak = (text: string, id: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMessageId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);
    setSpeakingMessageId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleExportMarkdown = () => {
    const lines: string[] = [
      `# ${entry.title || 'Journal Reflection'}`,
      `**Date:** ${new Date(entry.createdAt).toLocaleDateString()} ${new Date(entry.createdAt).toLocaleTimeString()}`,
      `**Mood:** ${entry.mood}`,
      `**Mode:** ${entry.mode}`,
      '',
    ];

    if (entry.summary) {
      lines.push('## Reflection Summary');
      lines.push(entry.summary);
      lines.push('');
    }

    if (entry.takeaways && entry.takeaways.length > 0) {
      lines.push('### Key Takeaways');
      entry.takeaways.forEach((t) => lines.push(`- ${t}`));
      lines.push('');
    }

    if (entry.actionItems && entry.actionItems.length > 0) {
      lines.push('### Action Items');
      entry.actionItems.forEach((a) => lines.push(`- [ ] ${a}`));
      lines.push('');
    }

    lines.push('---');
    lines.push('## Conversation Transcript');
    lines.push('');

    entry.messages.forEach((m) => {
      const speaker = m.role === 'assistant' ? 'Gemini 3.6 Flash' : 'User';
      lines.push(`### ${speaker} (${new Date(m.timestamp).toLocaleTimeString()}):`);
      lines.push(m.content);
      lines.push('');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(entry.title || 'reflection').toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-white">
      {/* Top Bar: Title, Status, Action Buttons */}
      <div className="border-b border-slate-200 px-4 sm:px-6 py-3 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden"
            title="Open Reflections History"
          >
            <Menu className="w-5 h-5" />
          </button>

          <input
            id="journal-title-input"
            type="text"
            value={entry.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Reflection Title..."
            className="font-bold text-lg sm:text-xl text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-500 focus:outline-none px-1 py-0.5 w-full transition"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* Save Status Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border border-slate-200 bg-slate-50 shadow-2xs">
            {saveStatus === 'saving' && (
              <>
                <RefreshCw className="w-3 h-3 text-slate-500 animate-spin" />
                <span className="text-slate-500">Saving...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700">Saved to Firestore</span>
              </>
            )}
            {saveStatus === 'error' && (
              <button
                onClick={onRetrySave}
                className="flex items-center gap-1 text-red-600 hover:underline"
              >
                <AlertCircle className="w-3 h-3" />
                <span>Save Error (Retry)</span>
              </button>
            )}
            {saveStatus === 'idle' && (
              <span className="text-slate-400">Cloud Synced</span>
            )}
          </div>

          {/* Export Markdown */}
          <button
            id="journal-export-btn"
            onClick={handleExportMarkdown}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-200 bg-white transition shadow-2xs"
            title="Export as Markdown document"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export .md</span>
          </button>

          {/* AI Summarize Action */}
          <button
            id="journal-summarize-btn"
            onClick={handleGenerateSummary}
            disabled={entry.messages.length === 0 || isSummarizing}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition shadow-2xs disabled:opacity-40"
          >
            {isSummarizing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-700" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>{entry.summary ? 'Re-Synthesize' : 'Synthesize AI Insights'}</span>
          </button>
        </div>
      </div>

      {/* Mode & Mood Customizer Header */}
      <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        {/* Mood Selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-500 font-medium text-[11px] mr-1">Mood:</span>
          {MOOD_OPTIONS.map((m) => (
            <button
              key={m.id}
              onClick={() => handleMoodSelect(m.id)}
              className={`px-2 py-0.5 rounded-md flex items-center gap-1 text-[11px] font-medium transition border ${
                entry.mood === m.id
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 ring-1 ring-emerald-300 shadow-2xs font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        {/* AI Reflection Persona / Mode Selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-500 font-medium text-[11px] mr-1">Partner Mode:</span>
          {REFLECTION_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleModeSelect(mode.id)}
              title={mode.desc}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition border ${
                entry.mode === mode.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {mode.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Conversation & Content Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 bg-[#F8F9FA]">
        {/* Summary Card (If Present) */}
        {entry.summary && (
          <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-4 shadow-2xs animate-in fade-in max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                  AI Synthesis & Key Takeaways
                </h3>
              </div>
              <button
                onClick={() => setShowSummarySection(!showSummarySection)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                {showSummarySection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {showSummarySection && (
              <div className="space-y-3.5 pt-1 text-xs sm:text-sm text-slate-800 leading-relaxed">
                <p className="font-normal text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {entry.summary}
                </p>

                {entry.takeaways && entry.takeaways.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Key Revelations
                    </span>
                    <ul className="space-y-1 pl-4 list-disc text-slate-700">
                      {entry.takeaways.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {entry.actionItems && entry.actionItems.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Actionable Micro-Steps
                    </span>
                    <div className="space-y-1">
                      {entry.actionItems.map((a, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                    <Tag className="w-3 h-3 text-slate-500" />
                    {entry.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Message Stream */}
        {entry.messages.length === 0 ? (
          <div className="max-w-2xl mx-auto py-10 text-center space-y-6">
            <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-2xl text-slate-900">Begin Your Reflection</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Write down what is on your mind, explore a challenge, or click an inspirational prompt below.
              </p>
            </div>

            {/* Prompt Starter Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {REFLECTION_PROMPTS.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setInputPrompt(p.prompt);
                    handleModeSelect(p.suggestedMode);
                  }}
                  className="p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-left transition group space-y-1 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                      {p.category}
                    </span>
                    <span className="text-[10px] text-slate-400 group-hover:text-slate-700">Use Prompt →</span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900">{p.title}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{p.prompt}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {entry.messages.map((message) => {
              const isUser = message.role === 'user';
              const isSpeaking = speakingMessageId === message.id;

              return (
                <div
                  key={message.id}
                  className={`flex items-start gap-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-2xs ${
                      isUser
                        ? 'bg-slate-900 text-white font-medium text-xs'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble Container */}
                  <div className={`space-y-1 max-w-[85%] sm:max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 px-1 text-[10px] text-slate-400">
                      <span className="font-semibold text-slate-600">
                        {isUser ? 'You' : 'ReflectAI (Gemini 3.6 Flash)'}
                      </span>
                      <span>•</span>
                      <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {message.modelUsed && (
                        <span className="font-mono bg-slate-100 text-slate-600 px-1 rounded text-[9px]">
                          {message.modelUsed}
                        </span>
                      )}
                    </div>

                    <div
                      className={`p-4 rounded-xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                        isUser
                          ? 'bg-slate-900 text-white rounded-tr-none'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none prose prose-slate max-w-none'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <div className="markdown-body">
                          <Markdown>{message.content}</Markdown>
                        </div>
                      )}
                    </div>

                    {/* Action Bar for Message */}
                    <div className="flex items-center gap-2 px-1 pt-0.5">
                      <button
                        onClick={() => handleCopyMessage(message.content, message.id)}
                        className="text-[10px] text-slate-400 hover:text-slate-700 flex items-center gap-1 transition"
                        title="Copy message"
                      >
                        {copiedMessageId === message.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      {!isUser && 'speechSynthesis' in window && (
                        <button
                          onClick={() => handleSpeak(message.content, message.id)}
                          className={`text-[10px] flex items-center gap-1 transition ${
                            isSpeaking ? 'text-emerald-600 font-semibold' : 'text-slate-400 hover:text-slate-700'
                          }`}
                          title="Listen to reflection"
                        >
                          {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                          <span>{isSpeaking ? 'Stop Reading' : 'Listen'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Generating Indicator */}
            {isGenerating && (
              <div className="flex items-start gap-3.5 max-w-4xl mx-auto animate-in fade-in">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 text-slate-500 text-xs flex items-center gap-2 rounded-tl-none shadow-2xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                  <span>Gemini is reflecting on your thoughts...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom Composer Area */}
      <div className="border-t border-slate-200 bg-white p-3 sm:p-4 space-y-2 shrink-0">
        {errorMessage && (
          <div className="max-w-4xl mx-auto p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => handleSendMessage()}
              className="px-2 py-0.5 bg-red-100 hover:bg-red-200 text-red-800 font-semibold rounded text-[11px]"
            >
              Retry
            </button>
          </div>
        )}

        {/* Prompt Inspiration Drawer Toggle */}
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs text-slate-500 px-1">
          <button
            onClick={() => setShowPromptsDrawer(!showPromptsDrawer)}
            className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 hover:text-slate-900 transition"
          >
            <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
            <span>{showPromptsDrawer ? 'Hide Inspiration Prompts' : 'Need inspiration? Browse Prompts'}</span>
          </button>

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Press <kbd className="font-mono bg-slate-100 border border-slate-200 px-1 rounded text-[10px]">⌘</kbd> + <kbd className="font-mono bg-slate-100 border border-slate-200 px-1 rounded text-[10px]">Enter</kbd> to reflect
          </span>
        </div>

        {/* Inspiration Prompts Carousel Drawer */}
        {showPromptsDrawer && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 animate-in fade-in">
            {REFLECTION_PROMPTS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setInputPrompt(p.prompt);
                  handleModeSelect(p.suggestedMode);
                  setShowPromptsDrawer(false);
                }}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-white border border-slate-200 text-left transition"
              >
                <p className="text-[10px] font-semibold text-emerald-700">{p.title}</p>
                <p className="text-[11px] text-slate-600 line-clamp-1">{p.prompt}</p>
              </button>
            ))}
          </div>
        )}

        {/* Text Input Box */}
        <div className="max-w-4xl mx-auto flex items-end gap-2 bg-slate-50 rounded-xl border border-slate-200 focus-within:border-slate-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-200 p-2 transition">
          <textarea
            id="journal-composer-textarea"
            ref={textareaRef}
            rows={2}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Share your thoughts, experiences, or dilemmas with your ${
              REFLECTION_MODES.find((m) => m.id === entry.mode)?.name || 'Thought Partner'
            }...`}
            className="flex-1 bg-transparent border-0 resize-none text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none px-2 py-1 max-h-32"
          />

          <button
            id="journal-send-btn"
            onClick={() => handleSendMessage()}
            disabled={!inputPrompt.trim() || isGenerating}
            className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition disabled:opacity-30 disabled:hover:bg-slate-900 shadow-2xs shrink-0"
            title="Send Reflection to Gemini"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
