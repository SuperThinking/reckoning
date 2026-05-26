import React, { useState } from 'react';
import { AlertCircle, Database, Eye, EyeOff, Loader2, Trash2, ChevronRight } from 'lucide-react';
import { Button, Input, Logo, Section, Select } from './ui.jsx';
import { storage, STORAGE_KEYS } from '../lib/storage.js';
import { validateToken } from '../lib/github.js';
import { PROVIDER_LABELS, PROVIDER_KEY_PLACEHOLDERS } from '../lib/ai.js';

export default function SetupScreen({ onComplete }) {
  const [username, setUsername] = useState(storage.get(STORAGE_KEYS.username));
  const [token, setToken] = useState(storage.get(STORAGE_KEYS.ghToken));
  const [aiProvider, setAiProvider] = useState(storage.get(STORAGE_KEYS.aiProvider) || 'anthropic');
  const [aiKey, setAiKey] = useState(storage.get(STORAGE_KEYS.aiKey));
  const [persist, setPersist] = useState(storage.get(STORAGE_KEYS.persist) === 'true');
  const [showToken, setShowToken] = useState(false);
  const [showAiKey, setShowAiKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setValidating(true);
    try {
      const user = await validateToken(token);
      const finalUsername = username.trim() || user.login;
      storage.set(STORAGE_KEYS.ghToken, token, persist);
      storage.set(STORAGE_KEYS.username, finalUsername, persist);
      storage.set(STORAGE_KEYS.aiProvider, aiProvider, persist);
      if (aiKey) storage.set(STORAGE_KEYS.aiKey, aiKey, persist);
      storage.set(STORAGE_KEYS.persist, persist ? 'true' : 'false', persist);
      onComplete({ token, username: finalUsername, aiProvider, aiKey, persist });
    } catch (err) {
      setError(err.message);
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <div className="mb-10">
        <Logo />
      </div>

      <div className="mb-10">
        <h1 className="font-serif text-5xl text-stone-900 leading-tight tracking-tight">
          What did you<br />
          <span className="italic text-amber-600">actually</span> do this year?
        </h1>
        <p className="mt-4 text-stone-600 text-lg max-w-xl leading-relaxed">
          Pull every PR you touched, every issue you fought through, every review you shipped — then
          turn the raw history into a feedback-cycle narrative.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Section className="p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-stone-900 text-amber-50 flex items-center justify-center text-xs font-bold">
              1
            </div>
            <h2 className="text-sm uppercase tracking-widest text-stone-700 font-semibold">
              GitHub Access
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Username"
              placeholder="octocat"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              hint="Leave blank to use the token's owner"
            />
            <div>
              <div className="text-xs uppercase tracking-wider text-stone-600 mb-1.5 font-medium">
                Personal Access Token
              </div>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  placeholder="ghp_… or github_pat_…"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  className="w-full px-3 py-2 pr-10 bg-white border border-stone-300 text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-900"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-xs text-stone-500 mt-1">
                Needs <code className="bg-stone-200 px-1 py-0.5">repo</code> +{' '}
                <code className="bg-stone-200 px-1 py-0.5">read:org</code> scopes.{' '}
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo,read:org,read:user&description=Reckoning%20Feedback%20Companion"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-700 underline"
                >
                  Create one →
                </a>
              </div>
              <div className="mt-2 px-2.5 py-2 border border-amber-300 bg-amber-50 text-[11px] text-stone-800 leading-relaxed">
                <strong className="text-amber-800">Important — SSO orgs:</strong> after creating
                the token, go back to the{' '}
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-700 underline"
                >
                  tokens page
                </a>
                , click <em>Configure SSO</em> next to your token, and authorize each org you
                belong to. Org repos are silently excluded from results until you do this.
              </div>
            </div>
          </div>
        </Section>

        <Section className="p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-stone-900 text-amber-50 flex items-center justify-center text-xs font-bold">
              2
            </div>
            <h2 className="text-sm uppercase tracking-widest text-stone-700 font-semibold">
              AI Provider{' '}
              <span className="text-stone-400 normal-case tracking-normal text-xs ml-1">
                (optional, for summaries)
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select label="Provider" value={aiProvider} onChange={(e) => setAiProvider(e.target.value)}>
              {Object.entries(PROVIDER_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
            <div className="md:col-span-2">
              <div className="text-xs uppercase tracking-wider text-stone-600 mb-1.5 font-medium">
                API Key
              </div>
              <div className="relative">
                <input
                  type={showAiKey ? 'text' : 'password'}
                  placeholder={PROVIDER_KEY_PLACEHOLDERS[aiProvider]}
                  value={aiKey}
                  onChange={(e) => setAiKey(e.target.value)}
                  className="w-full px-3 py-2 pr-10 bg-white border border-stone-300 text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowAiKey(!showAiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-900"
                >
                  {showAiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-xs text-stone-500 mt-1">
                Skip this to use the app without AI summarization.
              </div>
            </div>
          </div>
        </Section>

        <Section className="p-6 mb-6 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <Database className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-stone-900 mb-1">How your keys are handled</h3>
              <ul className="text-xs text-stone-700 space-y-1 leading-relaxed">
                <li>
                  • All requests go directly from your browser to GitHub and your AI provider. No
                  backend, no logging, no telemetry.
                </li>
                <li>
                  • Keys stay in <code className="bg-amber-200 px-1">sessionStorage</code> (cleared
                  when tab closes) unless you opt into persistent storage below.
                </li>
                <li>
                  • Use the <strong>Clear data</strong> button anytime to wipe everything.
                </li>
              </ul>
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={persist}
                  onChange={(e) => setPersist(e.target.checked)}
                  className="w-4 h-4 accent-stone-900"
                />
                <span className="text-sm text-stone-800">
                  Remember on this device (use localStorage instead of session)
                </span>
              </label>
            </div>
          </div>
        </Section>

        {error && (
          <div className="mb-4 p-4 border border-red-300 bg-red-50 text-red-800 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              storage.clearAll();
              setUsername('');
              setToken('');
              setAiKey('');
            }}
          >
            <Trash2 className="w-4 h-4" /> Clear stored data
          </Button>
          <Button variant="primary" type="submit" disabled={validating || !token}>
            {validating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Validating…
              </>
            ) : (
              <>
                Continue <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
