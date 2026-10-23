import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Tag,
  ArrowRight,
  Trash2,
  Copy,
  Check,
  X,
  Sparkles,
  Bot
} from 'lucide-react';
import { PromptTemplate } from '../types';

interface PromptLibraryProps {
  prompts: PromptTemplate[];
  onSelectPrompt: (promptText: string, modelRec?: string) => void;
  onCreatePrompt: (newPrompt: Partial<PromptTemplate>) => void;
  onDeletePrompt: (id: string) => void;
}

export const PromptLibraryView: React.FC<PromptLibraryProps> = ({
  prompts,
  onSelectPrompt,
  onCreatePrompt,
  onDeletePrompt,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // New prompt form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPromptText, setNewPromptText] = useState('');
  const [newCategory, setNewCategory] = useState('coding');
  const [newTags, setNewTags] = useState('Architecture, Best-Practices');

  const categories = ['all', 'coding', 'writing', 'research', 'brainstorming'];

  const filteredPrompts = prompts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPromptText.trim()) return;

    onCreatePrompt({
      title: newTitle.trim(),
      description: newDesc.trim(),
      prompt: newPromptText.trim(),
      category: newCategory,
      tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
    });

    setIsCreating(false);
    setNewTitle('');
    setNewDesc('');
    setNewPromptText('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-charcoal-900/60 overflow-y-auto p-4 md:p-8">
      <div className="max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20 mb-3">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Engineered Prompts</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Prompt Library
            </h2>
            <p className="text-xs md:text-sm text-charcoal-400 mt-1">
              Battle-tested prompt scaffolds for architecture, executive writing, and algorithmic reasoning.
            </p>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-semibold shadow-glow transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Custom Prompt</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-charcoal-500" />
            <input
              type="text"
              placeholder="Search prompts by title, description or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-charcoal-950 border border-charcoal-800 text-xs text-charcoal-200 placeholder-charcoal-500 focus:outline-none focus:border-primary"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                  selectedCategory === c
                    ? 'bg-charcoal-800 text-white border border-charcoal-700 shadow-subtle'
                    : 'bg-charcoal-950 text-charcoal-400 hover:text-charcoal-200 border border-charcoal-850'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Grid of Prompts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPrompts.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl bg-charcoal-950 border border-charcoal-800/80 hover:border-charcoal-700 p-5 shadow-elevated flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-charcoal-800 text-charcoal-300 border border-charcoal-700">
                    {p.category}
                  </span>
                  {p.modelRecommendation && (
                    <span className="flex items-center space-x-1 text-[10px] text-charcoal-400 font-mono">
                      <Bot className="w-3 h-3 text-primary" />
                      <span>{p.modelRecommendation}</span>
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-white mb-1.5 group-hover:text-primary transition-colors">
                  {p.title}
                </h3>
                <p className="text-xs text-charcoal-400 mb-3 leading-relaxed">
                  {p.description}
                </p>

                {/* Prompt Preview Snippet */}
                <div className="p-3 rounded-xl bg-charcoal-900 border border-charcoal-800/80 text-[11px] font-mono text-charcoal-300 line-clamp-3 mb-4 leading-relaxed">
                  {p.prompt}
                </div>

                {/* Tags */}
                {p.tags && p.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {p.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-charcoal-900 text-charcoal-400 border border-charcoal-800"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Action Bar */}
              <div className="pt-3 border-t border-charcoal-800/60 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCopy(p.id, p.prompt)}
                    className="p-1.5 rounded-lg text-charcoal-400 hover:text-white hover:bg-charcoal-900 transition-colors"
                    title="Copy prompt text"
                  >
                    {copiedId === p.id ? (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {p.id.startsWith('p-custom') && (
                    <button
                      onClick={() => onDeletePrompt(p.id)}
                      className="p-1.5 rounded-lg text-charcoal-400 hover:text-rose-400 hover:bg-charcoal-900 transition-colors"
                      title="Delete prompt"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => onSelectPrompt(p.prompt, p.modelRecommendation)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-semibold shadow-glow transition-all"
                >
                  <span>Use in Chat</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Create Modal */}
        {isCreating && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl bg-charcoal-900 border border-charcoal-700 shadow-elevated p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Create Custom Prompt Template</span>
                </h3>
                <button
                  onClick={() => setIsCreating(false)}
                  className="text-charcoal-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveNew} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-300 mb-1">
                    Title:
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Postgres Index Optimization"
                    className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-750 text-xs text-charcoal-100 focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-300 mb-1">
                    Description:
                  </label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Brief description of the template purpose"
                    className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-750 text-xs text-charcoal-100 focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal-300 mb-1">
                      Category:
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-750 text-xs text-charcoal-200 focus:outline-none focus:border-primary"
                    >
                      <option value="coding">Coding</option>
                      <option value="writing">Writing</option>
                      <option value="research">Research</option>
                      <option value="brainstorming">Brainstorming</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal-300 mb-1">
                      Tags (comma-separated):
                    </label>
                    <input
                      type="text"
                      value={newTags}
                      onChange={(e) => setNewTags(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-750 text-xs text-charcoal-100 focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-300 mb-1">
                    Prompt Text (supports {'{{variables}}'}):
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={newPromptText}
                    onChange={(e) => setNewPromptText(e.target.value)}
                    placeholder="Enter the template instructions..."
                    className="w-full p-3 rounded-xl bg-charcoal-950 border border-charcoal-750 text-xs text-charcoal-100 focus:outline-none focus:border-primary resize-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 rounded-xl text-xs text-charcoal-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-semibold shadow-glow"
                  >
                    Save Template
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
