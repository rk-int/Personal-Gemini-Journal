import { useState, useMemo } from 'react';
import { JournalEntry } from '../types';
import { MOOD_OPTIONS } from '../data/prompts';
import { Search, Plus, Trash2, Calendar, MessageSquare, Sparkles, Filter, ChevronRight, X } from 'lucide-react';

interface JournalHistorySidebarProps {
  entries: JournalEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onDeleteEntry: (entryId: string) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
}

export function JournalHistorySidebar({
  entries,
  selectedEntryId,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
  isOpen,
  onClose,
}: JournalHistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.summary && entry.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
        entry.messages.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (entry.tags && entry.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesMood = !selectedMoodFilter || entry.mood === selectedMoodFilter;

      return matchesSearch && matchesMood;
    });
  }, [entries, searchQuery, selectedMoodFilter]);

  const handleDelete = async (e: React.MouseEvent, entryId: string) => {
    e.stopPropagation();
    if (confirmDeleteId !== entryId) {
      setConfirmDeleteId(entryId);
      return;
    }

    try {
      setDeletingId(entryId);
      await onDeleteEntry(entryId);
    } catch (err) {
      console.error('Error deleting entry:', err);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-950/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-16 bottom-0 left-0 z-40 w-80 sm:w-88 bg-slate-50/70 border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-slate-900 text-sm">Past Reflections</h2>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {entries.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                id="sidebar-new-btn"
                onClick={onNewEntry}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition shadow-2xs"
                title="Create New Reflection"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 lg:hidden rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="sidebar-search-input"
              type="text"
              placeholder="Search reflections, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Mood Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
            <button
              onClick={() => setSelectedMoodFilter(null)}
              className={`px-2.5 py-1 rounded-md shrink-0 font-medium transition ${
                selectedMoodFilter === null
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMoodFilter(selectedMoodFilter === m.id ? null : m.id)}
                className={`px-2 py-1 rounded-md shrink-0 flex items-center gap-1 font-medium transition border ${
                  selectedMoodFilter === m.id
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-10 h-10 mx-auto rounded-full bg-slate-200/80 flex items-center justify-center text-slate-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-600">
                {entries.length === 0 ? 'No reflections yet.' : 'No matching entries found.'}
              </p>
              {entries.length === 0 && (
                <button
                  onClick={onNewEntry}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white transition shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Start First Reflection</span>
                </button>
              )}
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const isSelected = entry.id === selectedEntryId;
              const moodObj = MOOD_OPTIONS.find((m) => m.id === entry.mood);

              return (
                <div
                  key={entry.id}
                  id={`entry-card-${entry.id}`}
                  onClick={() => {
                    onSelectEntry(entry);
                    onClose();
                  }}
                  className={`group relative p-3.5 rounded-xl text-left cursor-pointer transition border ${
                    isSelected
                      ? 'bg-white border-slate-400 ring-1 ring-slate-300 shadow-xs'
                      : 'bg-white/90 hover:bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-xs font-semibold text-slate-900 line-clamp-1 group-hover:text-slate-950 transition">
                      {entry.title || 'Untitled Reflection'}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0">
                      {moodObj && (
                        <span className="text-xs" title={`Mood: ${moodObj.label}`}>
                          {moodObj.emoji}
                        </span>
                      )}
                      <button
                        onClick={(e) => handleDelete(e, entry.id)}
                        disabled={deletingId === entry.id}
                        className={`p-1 rounded-md transition ${
                          confirmDeleteId === entry.id
                            ? 'bg-red-100 text-red-700 opacity-100'
                            : 'text-slate-300 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100'
                        }`}
                        title={confirmDeleteId === entry.id ? 'Click again to confirm deletion' : 'Delete reflection'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {confirmDeleteId === entry.id && (
                    <div className="mb-2 p-1.5 bg-red-50 border border-red-200 rounded text-[10px] text-red-700 font-medium animate-in fade-in">
                      Click trash icon again to delete permanently
                    </div>
                  )}

                  {/* Snippet / Summary Preview */}
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-2">
                    {entry.summary ||
                      entry.messages[entry.messages.length - 1]?.content ||
                      'New reflection session...'}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(entry.updatedAt || entry.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {entry.messages.length} msg{entry.messages.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}
