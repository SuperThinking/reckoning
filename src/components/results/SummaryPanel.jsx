import React, { useEffect, useState } from 'react';
import { Check, Copy, Loader2, Sparkles } from 'lucide-react';
import { Button, Markdown } from '../ui.jsx';
import { callAI } from '../../lib/ai.js';
import { buildSummaryPrompt } from './feedbackData.js';

export function SummaryPanel({
  creds,
  items,
  viewType,
  summaryCache,
  setSummaryCache,
  annotations,
}) {
  const [summary, setSummary] = useState(summaryCache[viewType] || '');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSummary(summaryCache[viewType] || '');
    setError('');
  }, [viewType, summaryCache]);

  const generate = async () => {
    if (!creds.aiKey) {
      setError(
        'No AI key provided. Add one via the AI settings button in the header — or use the “Take it elsewhere” links below to paste your data into ChatGPT/Claude/Gemini directly.'
      );
      return;
    }
    setGenerating(true);
    setError('');
    try {
      const system =
        "You are an engineering career assistant. You're helping a software engineer summarize their GitHub activity into a self-review for a performance feedback cycle. Be specific, factual, and use the engineer's own framing — never inflate or invent. Output well-structured markdown.";
      const prompt = buildSummaryPrompt({
        viewType,
        username: creds.username,
        items,
        annotations,
      });
      const result = await callAI({
        provider: creds.aiProvider,
        apiKey: creds.aiKey,
        system,
        prompt,
      });
      setSummary(result);
      setSummaryCache({ ...summaryCache, [viewType]: result });
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="border border-amber-300 bg-amber-50">
      <div className="px-4 py-3 border-b border-amber-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-700" />
          <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wider">
            AI Summary [BETA]
          </h3>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {summary && (
            <Button variant="ghost" onClick={copy} className="!py-1 !px-2 text-xs">
              {copied ? (
                <>
                  <Check className="w-3 h-3" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copy summary
                </>
              )}
            </Button>
          )}
          <Button
            variant="primary"
            onClick={generate}
            disabled={generating || items.length === 0}
            className="!py-1 !px-3 text-xs"
          >
            {generating ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" /> Generating…
              </>
            ) : summary ? (
              'Regenerate'
            ) : (
              'Generate'
            )}
          </Button>
        </div>
      </div>
      <div className="p-4">
        {error && <div className="text-sm text-red-700 mb-2">{error}</div>}
        {!summary && !error && !generating && (
          <p className="text-sm text-stone-600">
            {creds.aiKey
              ? `Generate a structured self-review section from these ${items.length} item${
                  items.length === 1 ? '' : 's'
                }. Add impact notes to individual items to give the AI more to work with.`
              : 'No AI key? Use the “Take it elsewhere” links below to paste your data into ChatGPT/Claude/Gemini directly — or add an AI key via “AI settings” for in-app summaries.'}
          </p>
        )}
        {generating && (
          <div className="text-sm text-stone-600">Working through your contributions…</div>
        )}
        {summary && <Markdown>{summary}</Markdown>}
      </div>
    </div>
  );
}
