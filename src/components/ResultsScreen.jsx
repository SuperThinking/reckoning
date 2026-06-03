import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Eye,
  GitPullRequest,
  MessageSquare,
  Settings,
  Trash2,
} from 'lucide-react';
import { Button, Logo } from './ui.jsx';
import { storage, STORAGE_KEYS } from '../lib/storage.js';
import { ContributionCard } from './results/ContributionCard.jsx';
import { SummaryPanel } from './results/SummaryPanel.jsx';
import { QAPanel } from './results/QAPanel.jsx';
import { AiSettingsModal } from './results/AiSettingsModal.jsx';
import { ExportBar } from './results/ExportBar.jsx';
import {
  FilterBar,
  applyFilters,
  defaultFilterState,
} from './results/FilterBar.jsx';

export default function ResultsScreen({ creds, data, range, onReset, onBack, onUpdateCreds }) {
  const [activeTab, setActiveTab] = useState('contributed');
  const [summaryCache, setSummaryCache] = useState({});
  const [showQA, setShowQA] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [annotations, setAnnotations] = useState(() =>
    storage.getJSON(STORAGE_KEYS.annotations, {})
  );
  const [filters, setFilters] = useState({
    contributed: defaultFilterState(),
    reviewed: defaultFilterState(),
    issues: defaultFilterState(),
  });

  const updateAnnotation = (url, text) => {
    setAnnotations((prev) => {
      const next = { ...prev };
      if (text) next[url] = text;
      else delete next[url];
      storage.setJSON(STORAGE_KEYS.annotations, next, creds.persist);
      return next;
    });
  };

  const tabs = [
    {
      key: 'contributed',
      label: 'Contributed',
      icon: GitPullRequest,
      items: data.authored,
      hint: 'PRs you authored',
    },
    {
      key: 'reviewed',
      label: 'Reviewed',
      icon: Eye,
      items: data.reviewed,
      hint: 'PRs you reviewed or commented on',
    },
    {
      key: 'issues',
      label: 'Issues',
      icon: AlertCircle,
      items: data.issues,
      hint: 'Issues you opened or participated in',
    },
  ];

  const activeTabData = tabs.find((t) => t.key === activeTab);
  const allActiveItems = activeTabData.items;
  const activeFilter = filters[activeTab];
  const activeItems = useMemo(
    () => applyFilters(allActiveItems, activeFilter),
    [allActiveItems, activeFilter]
  );

  const setActiveFilter = (next) => setFilters({ ...filters, [activeTab]: next });

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <div className="flex items-center justify-between mb-8">
        <Logo />
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setShowSettings(true)}>
            <Settings className="w-4 h-4" /> AI settings
          </Button>
          <Button variant="ghost" onClick={onBack}>
            ← New search
          </Button>
          <Button variant="danger" onClick={onReset}>
            <Trash2 className="w-4 h-4" /> Clear &amp; restart
          </Button>
        </div>
      </div>

      <AiSettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        creds={creds}
        onUpdateCreds={onUpdateCreds}
      />

      <div className="mb-8">
        <div className="text-xs uppercase tracking-widest text-stone-500 mb-2">Window</div>
        <h1 className="font-serif text-4xl text-stone-900 tracking-tight">
          {new Date(range.fromDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}{' '}
          <span className="text-stone-400">→</span>{' '}
          {new Date(range.toDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </h1>
        <div className="mt-2 text-stone-600">
          For <span className="font-mono">{creds.username}</span>
          {range.repos.length > 0 && (
            <> in {range.repos.length} repo{range.repos.length === 1 ? '' : 's'}</>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          const filteredCount = applyFilters(t.items, filters[t.key]).length;
          const showFilteredCount = filteredCount !== t.items.length;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`text-left p-4 border transition-all ${
                isActive
                  ? 'bg-stone-900 text-amber-50 border-stone-900'
                  : 'bg-white text-stone-900 border-stone-200 hover:border-stone-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-stone-500'}`} />
                <span
                  className={`text-3xl font-serif ${isActive ? 'text-amber-100' : 'text-stone-900'}`}
                >
                  {showFilteredCount ? (
                    <>
                      {filteredCount}
                      <span
                        className={`text-base ml-1 ${isActive ? 'text-amber-200/60' : 'text-stone-400'}`}
                      >
                        / {t.items.length}
                      </span>
                    </>
                  ) : (
                    t.items.length
                  )}
                </span>
              </div>
              <div
                className={`text-sm font-semibold uppercase tracking-wider ${
                  isActive ? 'text-amber-200' : 'text-stone-700'
                }`}
              >
                {t.label}
              </div>
              <div className={`text-xs mt-0.5 ${isActive ? 'text-amber-100/70' : 'text-stone-500'}`}>
                {t.hint}
              </div>
            </button>
          );
        })}
      </div>

      {creds.aiKey && (
        <div className="mb-4">
          <Button variant="secondary" onClick={() => setShowQA(!showQA)}>
            <MessageSquare className="w-4 h-4" /> {showQA ? 'Hide' : 'Ask'} questions across all data
          </Button>
        </div>
      )}
      {showQA && (
        <div className="mb-6">
          <QAPanel creds={creds} allData={data} annotations={annotations} />
        </div>
      )}

      <FilterBar
        items={allActiveItems}
        filter={activeFilter}
        setFilter={setActiveFilter}
        tabKey={activeTab}
      />

      <div className="mb-6">
        <SummaryPanel
          creds={creds}
          items={activeItems}
          viewType={activeTab}
          summaryCache={summaryCache}
          setSummaryCache={setSummaryCache}
          annotations={annotations}
        />
      </div>

      <div className="mb-3 text-xs text-stone-500 flex items-center flex-wrap">
        <span>
          Showing <span className="font-semibold text-stone-700">{activeItems.length}</span>
          {activeItems.length !== allActiveItems.length && <> of {allActiveItems.length}</>}{' '}
          item{activeItems.length === 1 ? '' : 's'}
        </span>
        <ExportBar
          username={creds.username}
          items={activeItems}
          viewType={activeTab}
          annotations={annotations}
        />
      </div>

      <div className="space-y-2">
        {activeItems.length === 0 ? (
          <div className="text-center py-12 text-stone-500">
            {allActiveItems.length === 0
              ? 'No items found in this window.'
              : 'No items match the current filters.'}
          </div>
        ) : (
          activeItems.map((item) => (
            <ContributionCard
              key={item.id}
              item={item}
              type={activeTab}
              note={annotations[item.url] || ''}
              onChangeNote={(text) => updateAnnotation(item.url, text)}
            />
          ))
        )}
      </div>
    </div>
  );
}
