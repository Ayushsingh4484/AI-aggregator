import React, { useState } from 'react';
import { Check, Copy, Terminal, Download } from 'lucide-react';

interface CodeBlockProps {
  language?: string;
  value: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language = 'text', value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = language === 'typescript' ? 'ts' : language === 'javascript' ? 'js' : language === 'python' ? 'py' : language === 'html' ? 'html' : language === 'css' ? 'css' : language === 'json' ? 'json' : 'txt';
    const blob = new Blob([value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code-snippet.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative my-4 rounded-xl border border-charcoal-700/60 bg-charcoal-950 overflow-hidden shadow-subtle group">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-charcoal-800/80 bg-charcoal-900/90 text-xs text-charcoal-400 select-none">
        <div className="flex items-center space-x-2">
          <Terminal className="w-3.5 h-3.5 text-primary" />
          <span className="font-mono uppercase tracking-wider text-[11px] font-semibold text-charcoal-300">
            {language}
          </span>
        </div>
        <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleDownload}
            title="Download snippet"
            className="p-1.5 hover:bg-charcoal-800 rounded-md text-charcoal-400 hover:text-charcoal-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 py-1 px-2.5 rounded-md hover:bg-charcoal-800 text-charcoal-300 hover:text-white transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] text-primary font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-[11px]">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Content */}
      <div className="p-4 overflow-x-auto text-[13px] font-mono leading-relaxed text-charcoal-200">
        <pre className="!bg-transparent !p-0 !m-0">
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
};
