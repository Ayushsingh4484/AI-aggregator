import React, { useState } from 'react';
import {
  Code2,
  PenTool,
  SearchCheck,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
  Bot,
  Zap,
  Check,
  Terminal,
  Shield,
  FileText
} from 'lucide-react';
import { AIModelInfo } from '../types';

interface WorkspacesViewProps {
  models: AIModelInfo[];
  onLaunchTask: (prompt: string, modelId: string, systemPrompt?: string) => void;
}

export const WorkspacesView: React.FC<WorkspacesViewProps> = ({ models, onLaunchTask }) => {
  const [activeTab, setActiveTab] = useState<'code' | 'writer' | 'research' | 'summarizer'>('code');

  // Code Studio States
  const [codeSnippet, setCodeSnippet] = useState(`function processData(items) {
  let results = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < items.length; j++) {
      if (items[i].id === items[j].parentId) {
        results.push({ parent: items[i], child: items[j] });
      }
    }
  }
  return results;
}`);
  const [codeTask, setCodeTask] = useState<'review' | 'optimize' | 'tests' | 'refactor'>('optimize');
  const [codeLang, setCodeLang] = useState('TypeScript');

  // Writer States
  const [writerTopic, setWriterTopic] = useState('Announcing our high-throughput AI model routing engine');
  const [writerFormat, setWriterFormat] = useState<'blog' | 'exec' | 'announcement' | 'linkedin'>('announcement');
  const [writerTone, setWriterTone] = useState('Authoritative & Engineering-focused');

  // Research States
  const [researchTopic, setResearchTopic] = useState('Test-time compute scaling in modern LLMs (DeepSeek R1 and OpenAI o1)');
  const [researchDepth, setResearchDepth] = useState<'overview' | 'deep' | 'comparative'>('deep');

  // Summarizer States
  const [docContent, setDocContent] = useState('');
  const [summaryFormat, setSummaryFormat] = useState<'exec' | 'bullets' | 'action_items'>('action_items');

  const handleLaunchCode = () => {
    let prompt = '';
    const recommendedModel = 'claude-3-5-sonnet';
    const systemPrompt = `You are a Principal Software Architect specializing in ${codeLang}. Provide production-grade, cleanly structured solutions with zero hallucination.`;

    if (codeTask === 'review') {
      prompt = `Perform an in-depth security, architectural, and edge-case code review of this ${codeLang} code. Identify any security risks, memory leaks, or unhandled errors, then provide a refactored version:\n\n\`\`\`${codeLang.toLowerCase()}\n${codeSnippet}\n\`\`\``;
    } else if (codeTask === 'optimize') {
      prompt = `Analyze the time and space complexity (Big-O) of this ${codeLang} code. Identify the algorithmic bottleneck, prove the current complexity, and rewrite it with mathematically optimal time complexity:\n\n\`\`\`${codeLang.toLowerCase()}\n${codeSnippet}\n\`\`\``;
    } else if (codeTask === 'tests') {
      prompt = `Write a comprehensive, production-ready unit test suite covering edge cases, null checks, high loads, and boundary conditions for this ${codeLang} code:\n\n\`\`\`${codeLang.toLowerCase()}\n${codeSnippet}\n\`\`\``;
    } else {
      prompt = `Refactor this ${codeLang} code following modern clean code design patterns and idiomatic practices:\n\n\`\`\`${codeLang.toLowerCase()}\n${codeSnippet}\n\`\`\``;
    }

    onLaunchTask(prompt, recommendedModel, systemPrompt);
  };

  const handleLaunchWriter = () => {
    const recommendedModel = 'claude-3-5-sonnet';
    const systemPrompt = `You are a world-class technology author and communicator writing in a ${writerTone} tone. Avoid generic AI corporate tropes. Write with punch, clarity, and rhythm.`;
    const prompt = `Write a comprehensive ${writerFormat} on: "${writerTopic}".\nTone: ${writerTone}.\nEnsure clear narrative progression, concrete examples, and an impactful conclusion.`;
    onLaunchTask(prompt, recommendedModel, systemPrompt);
  };

  const handleLaunchResearch = () => {
    const recommendedModel = 'gemini-1-5-pro';
    const systemPrompt = `You are an elite research scientist. Synthesize complex technical papers and market dynamics with rigorous analysis and cited perspectives.`;
    const prompt = `Conduct a comprehensive, multi-angle research report on: "${researchTopic}".\nDepth: ${researchDepth}.\nBreak down: 1) Executive Summary, 2) Core Technical Mechanics & Breakthroughs, 3) Comparative Trade-offs vs Alternatives, 4) Current Industry Adoption, 5) Future Outlook.`;
    onLaunchTask(prompt, recommendedModel, systemPrompt);
  };

  const handleLaunchSummarizer = () => {
    const text = docContent.trim() || 'No document text entered. Please summarize standard cloud architecture principles.';
    const recommendedModel = 'gpt-4o';
    const prompt = `Read and synthesize the following document into a structured ${summaryFormat}:\n\n${text}`;
    onLaunchTask(prompt, recommendedModel);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-charcoal-900/60 overflow-y-auto p-4 md:p-8">
      <div className="max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dedicated AI Workspaces</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Specialized AI Studios
          </h2>
          <p className="text-xs md:text-sm text-charcoal-400 mt-1">
            Purpose-built environments pre-configured with prompt scaffolds and model pairings.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center space-x-2 border-b border-charcoal-800 pb-3 mb-6 overflow-x-auto">
          {[
            { id: 'code', label: 'Code Architect', icon: Code2, model: 'Claude 3.5 Sonnet' },
            { id: 'writer', label: 'Content Crafter', icon: PenTool, model: 'Claude 3.5 Sonnet' },
            { id: 'research', label: 'Deep Researcher', icon: SearchCheck, model: 'Gemini 1.5 Pro' },
            { id: 'summarizer', label: 'Document Summarizer', icon: FileSpreadsheet, model: 'GPT-4o' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-charcoal-800 text-white border border-charcoal-700 shadow-subtle'
                    : 'text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-charcoal-500'}`} />
                <span>{tab.label}</span>
                <span className="text-[10px] text-charcoal-500 font-mono hidden sm:inline">
                  ({tab.model})
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Code Architect */}
        {activeTab === 'code' && (
          <div className="rounded-2xl bg-charcoal-950 border border-charcoal-800 p-5 shadow-elevated space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-charcoal-800/80">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-primary" />
                  <span>Code Architect & Complexity Optimizer</span>
                </h3>
                <p className="text-xs text-charcoal-400 mt-0.5">
                  Powered by Claude 3.5 Sonnet & DeepSeek R1 for algorithmic precision.
                </p>
              </div>

              {/* Language Selector */}
              <select
                value={codeLang}
                onChange={(e) => setCodeLang(e.target.value)}
                className="bg-charcoal-900 border border-charcoal-750 text-xs text-charcoal-200 px-3 py-1.5 rounded-xl focus:outline-none focus:border-primary"
              >
                {['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'SQL', 'C++'].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* Task Type Pills */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'optimize', label: 'Big-O Complexity Optimization' },
                { id: 'review', label: 'Security & Edge-Case Audit' },
                { id: 'tests', label: 'Unit & Integration Test Suite' },
                { id: 'refactor', label: 'Clean Architecture Refactoring' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setCodeTask(t.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    codeTask === t.id
                      ? 'bg-primary text-white'
                      : 'bg-charcoal-900 text-charcoal-400 hover:text-charcoal-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Code Textarea */}
            <div>
              <label className="block text-[11px] font-semibold text-charcoal-400 uppercase tracking-wider mb-1.5">
                Target Source Code:
              </label>
              <textarea
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                rows={10}
                className="w-full bg-charcoal-900 font-mono text-xs text-charcoal-200 p-4 rounded-xl border border-charcoal-800 focus:outline-none focus:border-primary resize-none leading-relaxed"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleLaunchCode}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-semibold shadow-glow transition-all"
              >
                <span>Execute Code Architecture Analysis</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Content Crafter */}
        {activeTab === 'writer' && (
          <div className="rounded-2xl bg-charcoal-950 border border-charcoal-800 p-5 shadow-elevated space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <PenTool className="w-4 h-4 text-primary" />
                <span>Long-Form Content Crafter</span>
              </h3>
              <p className="text-xs text-charcoal-400 mt-0.5">
                Writes with natural cadence, depth, and punch—without generic corporate clichés.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1.5">
                Core Topic or Narrative Premise:
              </label>
              <input
                type="text"
                value={writerTopic}
                onChange={(e) => setWriterTopic(e.target.value)}
                className="w-full bg-charcoal-900 rounded-xl border border-charcoal-750 px-3.5 py-2 text-xs text-charcoal-100 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-300 mb-1.5">
                  Format Type:
                </label>
                <select
                  value={writerFormat}
                  onChange={(e) => setWriterFormat(e.target.value as any)}
                  className="w-full bg-charcoal-900 rounded-xl border border-charcoal-750 px-3 py-2 text-xs text-charcoal-200 focus:outline-none focus:border-primary"
                >
                  <option value="announcement">Product Launch Announcement</option>
                  <option value="blog">Technical Engineering Blog Post</option>
                  <option value="exec">Executive Strategic Brief</option>
                  <option value="linkedin">Thought Leadership Post</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-300 mb-1.5">
                  Tone & Perspective:
                </label>
                <input
                  type="text"
                  value={writerTone}
                  onChange={(e) => setWriterTone(e.target.value)}
                  className="w-full bg-charcoal-900 rounded-xl border border-charcoal-750 px-3 py-2 text-xs text-charcoal-100 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleLaunchWriter}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-semibold shadow-glow transition-all"
              >
                <span>Generate Content Draft</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Deep Research Synthesizer */}
        {activeTab === 'research' && (
          <div className="rounded-2xl bg-charcoal-950 border border-charcoal-800 p-5 shadow-elevated space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <SearchCheck className="w-4 h-4 text-primary" />
                <span>Deep Research Synthesizer</span>
              </h3>
              <p className="text-xs text-charcoal-400 mt-0.5">
                Leverages Gemini 1.5 Pro's 2,000,000 token context window for comprehensive cross-field inquiry.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1.5">
                Research Inquiry or Problem Statement:
              </label>
              <textarea
                value={researchTopic}
                onChange={(e) => setResearchTopic(e.target.value)}
                rows={3}
                className="w-full bg-charcoal-900 rounded-xl border border-charcoal-750 p-3 text-xs text-charcoal-100 focus:outline-none focus:border-primary resize-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1.5">
                Depth of Synthesis:
              </label>
              <div className="flex gap-2">
                {[
                  { id: 'deep', label: 'Full State-of-the-Art Dossier' },
                  { id: 'comparative', label: 'Comparative Trade-offs & Benchmarks' },
                  { id: 'overview', label: 'High-Level Strategic Survey' },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setResearchDepth(d.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      researchDepth === d.id
                        ? 'bg-primary text-white'
                        : 'bg-charcoal-900 text-charcoal-400 hover:text-charcoal-200'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleLaunchResearch}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-semibold shadow-glow transition-all"
              >
                <span>Synthesize Research Dossier</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Document Summarizer */}
        {activeTab === 'summarizer' && (
          <div className="rounded-2xl bg-charcoal-950 border border-charcoal-800 p-5 shadow-elevated space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                <span>Document & Notes Summarizer</span>
              </h3>
              <p className="text-xs text-charcoal-400 mt-0.5">
                Condenses dense transcripts, whitepapers, or meeting notes into actionable summaries.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1.5">
                Paste Document or Transcript:
              </label>
              <textarea
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                placeholder="Paste contract, meeting notes, project requirements or report here..."
                rows={8}
                className="w-full bg-charcoal-900 rounded-xl border border-charcoal-750 p-3 text-xs text-charcoal-100 focus:outline-none focus:border-primary resize-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1.5">
                Desired Output Format:
              </label>
              <div className="flex gap-2">
                {[
                  { id: 'action_items', label: 'Action Items & Owners' },
                  { id: 'exec', label: 'Executive TL;DR' },
                  { id: 'bullets', label: 'Key Technical Takeaways' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSummaryFormat(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      summaryFormat === f.id
                        ? 'bg-primary text-white'
                        : 'bg-charcoal-900 text-charcoal-400 hover:text-charcoal-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleLaunchSummarizer}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-semibold shadow-glow transition-all"
              >
                <span>Summarize Document</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
