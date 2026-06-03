import React, { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import {
  buildExportMarkdown,
  compactItem,
  downloadFile,
} from './feedbackData.js';

export function ExportBar({ username, items, viewType, annotations }) {
  const [copied, setCopied] = useState(false);

  const exportMarkdown = () => {
    const md = buildExportMarkdown({ viewType, username, items, annotations });
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const exportJSON = () => {
    const data = {
      view: viewType,
      username,
      generatedAt: new Date().toISOString(),
      items: items.map((i) => compactItem(i, annotations)),
    };
    downloadFile(
      `reckoning-${viewType}-${username}-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(data, null, 2),
      'application/json'
    );
  };

  const disabled = items.length === 0;

  return (
    <div className="inline-flex items-center gap-1 ml-3">
      <span className="text-stone-300">·</span>
      <span className="text-stone-500 ml-1 mr-1">Take it elsewhere:</span>
      <button
        type="button"
        onClick={exportMarkdown}
        disabled={disabled}
        title="Copy a structured markdown prompt for ChatGPT/Claude/Gemini"
        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-stone-700 hover:text-stone-900 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {copied ? (
          <>
            <Check className="w-3 h-3" /> Copied
          </>
        ) : (
          <>
            <Copy className="w-3 h-3" /> Copy as markdown
          </>
        )}
      </button>
      <span className="text-stone-300">·</span>
      <button
        type="button"
        onClick={exportJSON}
        disabled={disabled}
        title="Download structured JSON of this view"
        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-stone-700 hover:text-stone-900 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Download className="w-3 h-3" /> Download JSON
      </button>
    </div>
  );
}
