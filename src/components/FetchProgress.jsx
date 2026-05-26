import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Logo } from './ui.jsx';

const phases = [
  { key: 'authored', label: 'Authored PRs' },
  { key: 'reviewed', label: 'Reviewed PRs' },
  { key: 'commented', label: 'Commented PRs' },
  { key: 'issues', label: 'Issues' },
];

export default function FetchProgress({ progress }) {
  const currentIdx = phases.findIndex((p) => p.key === progress.phase);

  return (
    <div className="max-w-2xl mx-auto py-20 px-6 text-center">
      <Logo />
      <div className="mt-12">
        <Loader2 className="w-12 h-12 animate-spin mx-auto text-amber-600" />
        <h2 className="font-serif text-3xl mt-6 text-stone-900">Gathering the evidence…</h2>
        <p className="text-stone-600 mt-2">{progress.label || 'Starting…'}</p>
      </div>
      <div className="mt-10 text-left space-y-2">
        {phases.map((p, idx) => {
          const isCurrent = currentIdx === idx;
          const isPast = currentIdx > idx;
          return (
            <div
              key={p.key}
              className={`flex items-center justify-between px-4 py-2 border ${
                isCurrent
                  ? 'border-amber-400 bg-amber-50'
                  : isPast
                  ? 'border-stone-300 bg-stone-100 text-stone-500'
                  : 'border-stone-200 bg-stone-50 text-stone-400'
              }`}
            >
              <div className="flex items-center gap-2 text-sm">
                {isPast ? (
                  <Check className="w-4 h-4 text-stone-500" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <div className="w-4 h-4 border border-current rounded-full" />
                )}
                {p.label}
              </div>
              {isCurrent && progress.fetched != null && (
                <div className="text-xs font-mono">
                  {progress.fetched} / {progress.total}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {progress.rateLimit && (
        <div className="mt-6 text-xs text-stone-500">
          GitHub rate limit: {progress.rateLimit.remaining} / {progress.rateLimit.limit} remaining
        </div>
      )}
    </div>
  );
}
