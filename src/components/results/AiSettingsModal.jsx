import React, { useEffect, useState } from 'react';
import { Eye as EyeShown, EyeOff } from 'lucide-react';
import { Button, Modal } from '../ui.jsx';
import { PROVIDER_KEY_PLACEHOLDERS, PROVIDER_LABELS } from '../../lib/ai.js';
import { storage, STORAGE_KEYS } from '../../lib/storage.js';

export function AiSettingsModal({ open, onClose, creds, onUpdateCreds }) {
  const [provider, setProvider] = useState(creds.aiProvider || 'anthropic');
  const [key, setKey] = useState(creds.aiKey || '');
  const [persist, setPersist] = useState(creds.persist);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (open) {
      setProvider(creds.aiProvider || 'anthropic');
      setKey(creds.aiKey || '');
      setPersist(creds.persist);
    }
  }, [open, creds.aiProvider, creds.aiKey, creds.persist]);

  const save = () => {
    storage.set(STORAGE_KEYS.aiProvider, provider, persist);
    storage.set(STORAGE_KEYS.aiKey, key || '', persist);
    storage.set(STORAGE_KEYS.persist, persist ? 'true' : 'false', persist);
    onUpdateCreds({ aiProvider: provider, aiKey: key, persist });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div>
          <div className="text-xs uppercase tracking-wider text-stone-500 mb-1">Settings</div>
          <div className="font-serif text-lg text-stone-900">AI provider &amp; key</div>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-stone-600 mb-1.5 font-medium">
            Provider
          </div>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-stone-300 text-stone-900 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 text-sm"
          >
            {Object.entries(PROVIDER_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-stone-600 mb-1.5 font-medium">
            API key
          </div>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              placeholder={PROVIDER_KEY_PLACEHOLDERS[provider]}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-3 py-2 pr-10 bg-white border border-stone-300 text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 text-sm font-mono"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-900"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <EyeShown className="w-4 h-4" />}
            </button>
          </div>
          <div className="text-xs text-stone-500 mt-1">
            Leave blank to disable AI features. Switching providers? Paste the new key here.
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={persist}
            onChange={(e) => setPersist(e.target.checked)}
            className="w-4 h-4 accent-stone-900"
          />
          <span className="text-sm text-stone-800">
            Remember on this device (localStorage instead of session)
          </span>
        </label>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
