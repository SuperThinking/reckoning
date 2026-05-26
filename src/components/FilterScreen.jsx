import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronRight, Filter, Search, X } from 'lucide-react';
import { Button, Input, Logo, Section } from './ui.jsx';
import { fetchUserRepos } from '../lib/github.js';

const fmt = (d) => d.toISOString().slice(0, 10);

export default function FilterScreen({ creds, onBack, onFetch }) {
  const today = new Date();
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(today.getMonth() - 6);

  const [fromDate, setFromDate] = useState(fmt(sixMonthsAgo));
  const [toDate, setToDate] = useState(fmt(today));
  const [repoQuery, setRepoQuery] = useState('');
  const [selectedRepos, setSelectedRepos] = useState([]);
  const [userRepos, setUserRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [customInput, setCustomInput] = useState('');

  useEffect(() => {
    setLoadingRepos(true);
    fetchUserRepos(creds.token, creds.username)
      .then(setUserRepos)
      .finally(() => setLoadingRepos(false));
  }, [creds.token, creds.username]);

  const filteredSuggestions = useMemo(() => {
    if (!repoQuery) return userRepos.filter((r) => !selectedRepos.includes(r)).slice(0, 8);
    return userRepos
      .filter(
        (r) => r.toLowerCase().includes(repoQuery.toLowerCase()) && !selectedRepos.includes(r)
      )
      .slice(0, 8);
  }, [repoQuery, userRepos, selectedRepos]);

  const presets = [
    { label: 'Last 3 months', months: 3 },
    { label: 'Last 6 months', months: 6 },
    { label: 'Last year', months: 12 },
    { label: 'YTD', custom: () => ({ from: `${today.getFullYear()}-01-01`, to: fmt(today) }) },
  ];

  const applyPreset = (preset) => {
    if (preset.custom) {
      const { from, to } = preset.custom();
      setFromDate(from);
      setToDate(to);
    } else {
      const from = new Date(today);
      from.setMonth(today.getMonth() - preset.months);
      setFromDate(fmt(from));
      setToDate(fmt(today));
    }
  };

  const addCustomRepo = () => {
    const v = customInput.trim();
    if (v.includes('/') && !selectedRepos.includes(v)) {
      setSelectedRepos([...selectedRepos, v]);
      setCustomInput('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <div className="mb-8 flex items-center justify-between">
        <Logo />
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
      </div>

      <h1 className="font-serif text-4xl text-stone-900 mb-2 tracking-tight">Define the window</h1>
      <p className="text-stone-600 mb-8">
        Pick a date range and optionally narrow to specific repositories.
      </p>

      <Section className="p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-stone-700" />
          <h2 className="text-sm uppercase tracking-widest text-stone-700 font-semibold">
            Time Window
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <Input label="From" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <Input label="To" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className="text-xs px-3 py-1 border border-stone-300 bg-white text-stone-700 hover:bg-stone-900 hover:text-amber-50 hover:border-stone-900 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </Section>

      <Section className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-stone-700" />
          <h2 className="text-sm uppercase tracking-widest text-stone-700 font-semibold">
            Repositories{' '}
            <span className="text-stone-400 normal-case tracking-normal text-xs ml-1">
              (optional)
            </span>
          </h2>
        </div>

        {selectedRepos.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedRepos.map((r) => (
              <span
                key={r}
                className="inline-flex items-center gap-1 px-2 py-1 bg-stone-900 text-amber-50 text-xs font-mono"
              >
                {r}
                <button
                  type="button"
                  onClick={() => setSelectedRepos(selectedRepos.filter((x) => x !== r))}
                  className="hover:text-amber-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder={loadingRepos ? 'Loading your repos…' : 'Search repos (owner/name)…'}
              value={repoQuery}
              onChange={(e) => {
                setRepoQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              disabled={loadingRepos}
              className="w-full pl-10 pr-3 py-2 bg-white border border-stone-300 text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:outline-none text-sm font-mono"
            />
          </div>
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full max-h-64 overflow-y-auto bg-white border border-stone-300 shadow-lg">
              {filteredSuggestions.map((r) => (
                <button
                  key={r}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSelectedRepos([...selectedRepos, r]);
                    setRepoQuery('');
                  }}
                  className="block w-full text-left px-3 py-2 text-sm font-mono hover:bg-stone-100 border-b border-stone-100 last:border-0"
                >
                  {r}
                </button>
              ))}
            </div>
          )}
          <div className="text-xs text-stone-500 mt-2">
            {selectedRepos.length === 0
              ? 'No filter — searches across all repos you have access to.'
              : `Filtering to ${selectedRepos.length} repo${selectedRepos.length === 1 ? '' : 's'}.`}
          </div>
        </div>

        <div className="text-xs text-stone-500 mt-3">
          Or add a repo by name (works for any repo, even if not in your recent activity):
        </div>
        <div className="flex gap-2 mt-1">
          <input
            type="text"
            placeholder="org/repo-name"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomRepo();
              }
            }}
            className="flex-1 px-3 py-1.5 bg-stone-100 border border-stone-200 text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:outline-none text-sm font-mono"
          />
          <Button
            variant="secondary"
            onClick={addCustomRepo}
            disabled={!customInput.includes('/')}
            className="!py-1.5"
          >
            Add
          </Button>
        </div>
      </Section>

      <div className="flex justify-end">
        <Button variant="primary" onClick={() => onFetch({ fromDate, toDate, repos: selectedRepos })}>
          Fetch contributions <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
