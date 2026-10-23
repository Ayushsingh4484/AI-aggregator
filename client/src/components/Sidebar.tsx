import React, { useState } from 'react';
import {
  MessageSquare,
  Layers,
  Compass,
  Wrench,
  BookOpen,
  BarChart3,
  Settings,
  Plus,
  Search,
  Pin,
  Trash2,
  Edit2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Sparkles,
  Download
} from 'lucide-react';
import { Conversation, ActiveView } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  activeView: ActiveView;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onSelectView: (view: ActiveView) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePinConversation: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  activeView,
  onSelectConversation,
  onNewChat,
  onSelectView,
  onDeleteConversation,
  onRenameConversation,
  onTogglePinConversation,
  isCollapsed,
  onToggleCollapse,
  isDarkMode,
  onToggleTheme,
  onOpenSettings,
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleExportConversation = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    const markdown = `# ${conv.title}\n\n*Created on ${new Date(conv.createdAt).toLocaleString()}*\n\n` +
      conv.messages.map(m => `### ${m.role === 'user' ? 'You' : m.modelId || 'Assistant'}\n\n${m.content}\n\n`).join('---\n\n');
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conv.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Group conversations by timeframe
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const filtered = conversations.filter(c =>
    c.title.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const pinnedList = filtered.filter(c => c.pinned);
  const unpinned = filtered.filter(c => !c.pinned);

  const todayList = unpinned.filter(c => now - c.updatedAt < oneDay);
  const yesterdayList = unpinned.filter(c => now - c.updatedAt >= oneDay && now - c.updatedAt < 2 * oneDay);
  const pastWeekList = unpinned.filter(c => now - c.updatedAt >= 2 * oneDay && now - c.updatedAt < 7 * oneDay);
  const olderList = unpinned.filter(c => now - c.updatedAt >= 7 * oneDay);

  const navItems = [
    { id: 'chat', label: 'Unified Chat', icon: MessageSquare },
    { id: 'compare', label: 'Compare AI Arena', icon: Layers, badge: 'Arena' },
    { id: 'router', label: 'Smart Model Router', icon: Compass },
    { id: 'workspaces', label: 'Specialized Studios', icon: Wrench },
    { id: 'prompts', label: 'Prompt Library', icon: BookOpen },
    { id: 'analytics', label: 'Usage & Costs', icon: BarChart3 },
  ];

  if (isCollapsed) {
    return (
      <aside className="w-16 h-screen flex flex-col justify-between items-center py-4 bg-charcoal-950 border-r border-charcoal-800/80 select-none z-30">
        <div className="flex flex-col items-center space-y-4">
          <div
            onClick={onToggleCollapse}
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-emerald-400 flex items-center justify-center text-white font-bold cursor-pointer shadow-glow"
            title="Expand Sidebar"
          >
            <Sparkles className="w-5 h-5" />
          </div>

          <button
            onClick={onNewChat}
            className="w-10 h-10 rounded-xl bg-primary hover:bg-primary-dark text-white flex items-center justify-center transition-colors shadow-subtle"
            title="New Chat (Ctrl+N)"
          >
            <Plus className="w-5 h-5" />
          </button>

          <div className="w-8 h-[1px] bg-charcoal-800 my-2" />

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id as ActiveView)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  isActive
                    ? 'bg-charcoal-800 text-primary border border-charcoal-700'
                    : 'text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-900'
                }`}
                title={item.label}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>

        <div className="flex flex-col items-center space-y-3">
          <button
            onClick={onToggleTheme}
            className="w-10 h-10 rounded-xl text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-900 flex items-center justify-center transition-colors"
            title="Toggle Light / Dark Mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={onOpenSettings}
            className="w-10 h-10 rounded-xl text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-900 flex items-center justify-center transition-colors"
            title="Settings & API Keys"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={onToggleCollapse}
            className="w-8 h-8 rounded-lg text-charcoal-500 hover:text-charcoal-300 flex items-center justify-center transition-colors"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  const renderGroup = (title: string, list: Conversation[]) => {
    if (list.length === 0) return null;
    return (
      <div className="mb-4">
        <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-charcoal-500">
          {title}
        </div>
        <div className="space-y-0.5">
          {list.map((c) => {
            const isSelected = activeConversationId === c.id && activeView === 'chat';
            const isEditing = editingId === c.id;

            return (
              <div
                key={c.id}
                onClick={() => {
                  onSelectConversation(c.id);
                  onSelectView('chat');
                }}
                className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-charcoal-800/90 text-white font-medium border border-charcoal-700/60 shadow-subtle'
                    : 'text-charcoal-300 hover:bg-charcoal-900 hover:text-charcoal-100'
                }`}
              >
                {isEditing ? (
                  <div className="flex items-center space-x-1.5 w-full">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 bg-charcoal-950 border border-primary px-2 py-0.5 rounded text-xs text-white focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={(e) => handleSaveRename(c.id, e)}
                      className="p-1 hover:text-emerald-400"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(null);
                      }}
                      className="p-1 hover:text-rose-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-2 truncate pr-2 flex-1">
                      {c.pinned && <Pin className="w-3 h-3 text-primary flex-shrink-0 fill-primary/30" />}
                      <span className="truncate">{c.title}</span>
                    </div>

                    {/* Action buttons on hover */}
                    <div className="hidden group-hover:flex items-center space-x-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePinConversation(c.id);
                        }}
                        title={c.pinned ? 'Unpin' : 'Pin to top'}
                        className="p-1 hover:bg-charcoal-700/70 rounded text-charcoal-400 hover:text-primary transition-colors"
                      >
                        <Pin className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleStartRename(c, e)}
                        title="Rename"
                        className="p-1 hover:bg-charcoal-700/70 rounded text-charcoal-400 hover:text-charcoal-200 transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleExportConversation(c, e)}
                        title="Export Markdown"
                        className="p-1 hover:bg-charcoal-700/70 rounded text-charcoal-400 hover:text-charcoal-200 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this conversation?')) {
                            onDeleteConversation(c.id);
                          }
                        }}
                        title="Delete"
                        className="p-1 hover:bg-charcoal-700/70 rounded text-charcoal-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <aside className="w-64 h-screen flex flex-col justify-between bg-charcoal-950 border-r border-charcoal-800/80 select-none z-30 transition-all">
      {/* Top Section */}
      <div className="p-3 border-b border-charcoal-800/60">
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-emerald-400 flex items-center justify-center text-white shadow-glow">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white flex items-center space-x-1">
                <span>gamoraAI</span>
                <span className="text-[10px] text-primary font-mono px-1.5 py-0.2 bg-primary/10 rounded">Omni</span>
              </div>
              <div className="text-[10px] text-charcoal-400">All AI in One Place</div>
            </div>
          </div>
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-800/60 transition-colors"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-charcoal-900 hover:bg-charcoal-850 border border-charcoal-750 text-white text-xs font-semibold transition-all shadow-subtle group hover:border-primary/40"
        >
          <div className="flex items-center space-x-2">
            <Plus className="w-4 h-4 text-primary group-hover:rotate-90 transition-transform" />
            <span>New Chat</span>
          </div>
          <span className="text-[10px] text-charcoal-400 font-mono bg-charcoal-800 px-1.5 py-0.5 rounded">
            Ctrl+N
          </span>
        </button>

        {/* Main View Navigation */}
        <div className="mt-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id as ActiveView)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-charcoal-800/90 text-primary border border-charcoal-700/60'
                    : 'text-charcoal-300 hover:bg-charcoal-900/80 hover:text-charcoal-100'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className="w-4 h-4 text-charcoal-400 group-hover:text-primary" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/20 text-primary font-mono font-semibold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversations History Section */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Search Input */}
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-charcoal-500" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-charcoal-900 border border-charcoal-800 text-[11px] text-charcoal-200 placeholder-charcoal-500 focus:outline-none focus:border-primary"
          />
        </div>

        {/* Groups */}
        {renderGroup('Pinned', pinnedList)}
        {renderGroup('Today', todayList)}
        {renderGroup('Yesterday', yesterdayList)}
        {renderGroup('Previous 7 Days', pastWeekList)}
        {renderGroup('Older', olderList)}

        {filtered.length === 0 && (
          <div className="text-center py-8 text-xs text-charcoal-500">
            {searchFilter ? 'No matching conversations' : 'No conversations yet'}
          </div>
        )}
      </div>

      {/* Footer Profile & Settings */}
      <div className="p-3 border-t border-charcoal-800/80 bg-charcoal-950">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-charcoal-800 border border-charcoal-700 flex items-center justify-center text-xs font-semibold text-charcoal-300">
              U
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-charcoal-200 truncate">Workspace User</div>
              <div className="text-[10px] text-charcoal-400">Personal Pro Tier</div>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-900 transition-colors"
              title="Toggle Light / Dark Mode"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-900 transition-colors"
              title="Settings & API Keys"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
