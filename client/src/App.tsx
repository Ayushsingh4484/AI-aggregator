import React, { useState, useEffect, useRef } from 'react';
import {
  AIModelInfo,
  Conversation,
  ChatMessage,
  PromptTemplate,
  ProviderStatus,
  ActiveView,
  RouteRecommendation,
  DEFAULT_MODELS,
} from './types';
import { api } from './services/api';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { ChatView } from './components/ChatView';
import { CompareView } from './components/CompareView';
import { SmartRouterView } from './components/SmartRouterView';
import { WorkspacesView } from './components/WorkspacesView';
import { PromptLibraryView } from './components/PromptLibraryModal';
import { UsageDashboard } from './components/UsageDashboard';
import { SettingsModal } from './components/SettingsModal';

export function App() {
  const [models, setModels] = useState<AIModelInfo[]>(DEFAULT_MODELS);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('chat');

  const [selectedModelId, setSelectedModelId] = useState<string>('claude-3-5-sonnet');
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [isAutoRouteEnabled, setIsAutoRouteEnabled] = useState<boolean>(false);
  const [recommendedRoute, setRecommendedRoute] = useState<RouteRecommendation | null>(null);

  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingMessage, setStreamingMessage] = useState<{ content: string; thinking?: string } | null>(null);

  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [compareInitialPrompt, setCompareInitialPrompt] = useState<string>('');

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('omni_theme') !== 'light';
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('omni_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('omni_theme', 'light');
    }
  }, [isDarkMode]);

  // Initial Data Fetch
  useEffect(() => {
    const init = async () => {
      try {
        const [modelsRes, convsRes, statusRes, promptsRes] = await Promise.all([
          api.getModels().catch(() => []),
          api.getConversations().catch(() => []),
          api.getProviderStatus().catch(() => null),
          api.getPrompts().catch(() => []),
        ]);

        if (modelsRes.length > 0) {
          setModels(modelsRes);
          setSelectedModelId(modelsRes[0].id);
        }
        setConversations(convsRes);
        setProviderStatus(statusRes);
        setPrompts(promptsRes);

        if (convsRes.length > 0) {
          setActiveConversationId(convsRes[0].id);
          setSelectedModelId(convsRes[0].modelId || modelsRes[0]?.id || 'claude-3-5-sonnet');
          setSystemPrompt(convsRes[0].systemPrompt || '');
        }
      } catch (err) {
        console.error('Initialization error:', err);
      }
    };
    init();
  }, []);

  // Keyboard shortcut listener (Ctrl+N for new chat)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // Handlers
  const handleNewChat = async () => {
    if (isStreaming) {
      handleStopStreaming();
    }

    try {
      const newConv = await api.createConversation({
        title: 'New Conversation',
        modelId: selectedModelId,
        systemPrompt: systemPrompt,
      });
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      setActiveView('chat');
      setStreamingMessage(null);
    } catch (e) {
      console.error('Failed creating conversation:', e);
    }
  };

  const handleSelectConversation = async (id: string) => {
    setActiveConversationId(id);
    setActiveView('chat');
    try {
      const full = await api.getConversation(id);
      setConversations((prev) => prev.map((c) => (c.id === id ? full : c)));
      if (full.modelId) setSelectedModelId(full.modelId);
      if (full.systemPrompt !== undefined) setSystemPrompt(full.systemPrompt);
    } catch (e) {
      console.error('Failed fetching conversation details:', e);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        const remaining = conversations.filter((c) => c.id !== id);
        if (remaining.length > 0) {
          setActiveConversationId(remaining[0].id);
        } else {
          setActiveConversationId(null);
        }
      }
    } catch (e) {
      console.error('Delete conversation error:', e);
    }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      const updated = await api.updateConversation(id, { title: newTitle });
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: updated.title } : c)));
    } catch (e) {
      console.error('Rename conversation error:', e);
    }
  };

  const handleTogglePinConversation = async (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;
    try {
      const updated = await api.updateConversation(id, { pinned: !conv.pinned });
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, pinned: updated.pinned } : c)));
    } catch (e) {
      console.error('Pin conversation error:', e);
    }
  };

  const handleSendMessage = async (content: string, attachments?: any[], modelOverride?: string) => {
    let targetModelId = modelOverride || selectedModelId;

    // Smart auto-routing logic if enabled and no manual override
    if (isAutoRouteEnabled && !modelOverride) {
      try {
        const rec = await api.getRouteRecommendation(content);
        targetModelId = rec.recommendedModelId;
        setSelectedModelId(targetModelId);
        setRecommendedRoute(rec);
      } catch (e) {
        console.warn('Auto route fallback to current model', e);
      }
    }

    // Ensure we have an active conversation
    let currentConvId = activeConversationId;
    if (!currentConvId) {
      const newConv = await api.createConversation({
        title: content.slice(0, 36) + '...',
        modelId: targetModelId,
        systemPrompt,
      });
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      currentConvId = newConv.id;
    }

    // Append user message immediately
    const userMsgId = 'm-' + Date.now() + '-usr';
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content,
      timestamp: Date.now(),
      attachments,
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === currentConvId) {
          const isInitialTitle = c.title === 'New Conversation';
          return {
            ...c,
            title: isInitialTitle ? content.slice(0, 36) + '...' : c.title,
            updatedAt: Date.now(),
            messages: [...c.messages, userMessage],
          };
        }
        return c;
      })
    );

    // Setup streaming
    setIsStreaming(true);
    setStreamingMessage({ content: '', thinking: '' });

    abortControllerRef.current = new AbortController();

    const historyMessages = (
      conversations.find((c) => c.id === currentConvId)?.messages || []
    ).map((m) => ({ role: m.role, content: m.content }));

    historyMessages.push({ role: 'user', content });

    api.streamChat(
      {
        conversationId: currentConvId,
        modelId: targetModelId,
        messages: historyMessages,
        systemPrompt: systemPrompt || undefined,
        userMessageId: userMsgId,
      },
      {
        onToken: (tok) => {
          setStreamingMessage((prev) => ({
            content: (prev?.content || '') + tok,
            thinking: prev?.thinking,
          }));
        },
        onThinking: (thought) => {
          setStreamingMessage((prev) => ({
            content: prev?.content || '',
            thinking: (prev?.thinking || '') + thought,
          }));
        },
        onDone: (doneEvent) => {
          setIsStreaming(false);
          setStreamingMessage(null);

          const assistantMsg: ChatMessage = {
            id: 'm-' + Date.now() + '-asst',
            role: 'assistant',
            content: doneEvent.content,
            modelId: targetModelId,
            timestamp: Date.now(),
            metrics: doneEvent.metrics,
            thinking: doneEvent.thinking || undefined,
          };

          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === currentConvId) {
                return {
                  ...c,
                  updatedAt: Date.now(),
                  messages: [...c.messages, assistantMsg],
                };
              }
              return c;
            })
          );
        },
        onError: (err) => {
          console.error('Chat stream error:', err);
          setIsStreaming(false);
          setStreamingMessage(null);
        },
      },
      abortControllerRef.current.signal
    );
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  const handleForkWithModel = (modelId: string, originalPrompt: string) => {
    setSelectedModelId(modelId);
    handleSendMessage(originalPrompt, undefined, modelId);
  };

  const handleSendToCompare = (promptText: string) => {
    setCompareInitialPrompt(promptText);
    setActiveView('compare');
  };

  const handleSelectPromptFromLibrary = (promptText: string, modelRec?: string) => {
    if (modelRec && models.some((m) => m.id === modelRec)) {
      setSelectedModelId(modelRec);
    }
    setActiveView('chat');
    handleSendMessage(promptText, undefined, modelRec);
  };

  const handleLaunchStudioTask = (promptText: string, modelId: string, customSystemPrompt?: string) => {
    if (customSystemPrompt) {
      setSystemPrompt(customSystemPrompt);
    }
    setSelectedModelId(modelId);
    setActiveView('chat');
    handleSendMessage(promptText, undefined, modelId);
  };

  const handleExecuteRoutedPrompt = (promptText: string, modelId: string) => {
    setSelectedModelId(modelId);
    setActiveView('chat');
    handleSendMessage(promptText, undefined, modelId);
  };

  const handleCreatePrompt = async (newPrompt: Partial<PromptTemplate>) => {
    try {
      const created = await api.createPrompt(newPrompt);
      setPrompts((prev) => [created, ...prev]);
    } catch (e) {
      console.error('Error creating prompt template:', e);
    }
  };

  const handleDeletePrompt = async (id: string) => {
    try {
      await api.deletePrompt(id);
      setPrompts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error('Error deleting prompt template:', e);
    }
  };

  const refreshProviderStatus = async () => {
    try {
      const statusRes = await api.getProviderStatus();
      setProviderStatus(statusRes);
    } catch (e) {
      console.error('Status refresh error:', e);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-charcoal-950 text-charcoal-100 font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          activeView={activeView}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          onSelectView={setActiveView}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          onTogglePinConversation={handleTogglePinConversation}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </div>

      {/* Mobile Drawer Sidebar */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full bg-charcoal-950 z-10 shadow-2xl">
            <Sidebar
              conversations={conversations}
              activeConversationId={activeConversationId}
              activeView={activeView}
              onSelectConversation={(id) => {
                handleSelectConversation(id);
                setIsMobileSidebarOpen(false);
              }}
              onNewChat={() => {
                handleNewChat();
                setIsMobileSidebarOpen(false);
              }}
              onSelectView={(v) => {
                setActiveView(v);
                setIsMobileSidebarOpen(false);
              }}
              onDeleteConversation={handleDeleteConversation}
              onRenameConversation={handleRenameConversation}
              onTogglePinConversation={handleTogglePinConversation}
              isCollapsed={false}
              onToggleCollapse={() => setIsMobileSidebarOpen(false)}
              isDarkMode={isDarkMode}
              onToggleTheme={() => setIsDarkMode(!isDarkMode)}
              onOpenSettings={() => {
                setIsSettingsOpen(true);
                setIsMobileSidebarOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          activeView={activeView}
          models={models}
          selectedModelId={selectedModelId}
          onSelectModel={setSelectedModelId}
          providerStatus={providerStatus}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenCompare={() => setActiveView('compare')}
          isAutoRouteEnabled={isAutoRouteEnabled}
          onToggleAutoRoute={() => setIsAutoRouteEnabled(!isAutoRouteEnabled)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* View Switcher */}
        <main className="flex-1 flex overflow-hidden">
          {activeView === 'chat' && (
            <ChatView
              messages={activeConversation?.messages || []}
              models={models}
              selectedModelId={selectedModelId}
              onSelectModel={setSelectedModelId}
              onSendMessage={handleSendMessage}
              isStreaming={isStreaming}
              onStopStreaming={handleStopStreaming}
              streamingMessage={streamingMessage}
              onForkWithModel={handleForkWithModel}
              onSendToCompare={handleSendToCompare}
              isAutoRouteEnabled={isAutoRouteEnabled}
              systemPrompt={systemPrompt}
              onUpdateSystemPrompt={setSystemPrompt}
              recommendedRoute={recommendedRoute}
            />
          )}

          {activeView === 'compare' && (
            <CompareView
              models={models}
              initialPrompt={compareInitialPrompt}
            />
          )}

          {activeView === 'router' && (
            <SmartRouterView
              models={models}
              onExecutePrompt={handleExecuteRoutedPrompt}
            />
          )}

          {activeView === 'workspaces' && (
            <WorkspacesView
              models={models}
              onLaunchTask={handleLaunchStudioTask}
            />
          )}

          {activeView === 'prompts' && (
            <PromptLibraryView
              prompts={prompts}
              onSelectPrompt={handleSelectPromptFromLibrary}
              onCreatePrompt={handleCreatePrompt}
              onDeletePrompt={handleDeletePrompt}
            />
          )}

          {activeView === 'analytics' && <UsageDashboard />}

          {activeView === 'settings' && (
            <div className="flex-1 flex items-center justify-center p-4">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="px-6 py-3 rounded-2xl bg-primary hover:bg-primary-dark text-white font-semibold shadow-glow"
              >
                Open API Keys & Settings
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Global Settings & API Key Modal */}
      <SettingsModal
        isOpen={isSettingsOpen || activeView === 'settings'}
        onClose={() => {
          setIsSettingsOpen(false);
          if (activeView === 'settings') setActiveView('chat');
        }}
        providerStatus={providerStatus}
        onRefreshStatus={refreshProviderStatus}
      />
    </div>
  );
}

export default App;
