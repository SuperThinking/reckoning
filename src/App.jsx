import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import SetupScreen from './components/SetupScreen.jsx';
import FilterScreen from './components/FilterScreen.jsx';
import FetchProgress from './components/FetchProgress.jsx';
import ResultsScreen from './components/ResultsScreen.jsx';
import { storage } from './lib/storage.js';
import { fetchContributions } from './lib/github.js';

export default function App() {
  const [screen, setScreen] = useState('setup'); // setup | filter | fetching | results
  const [creds, setCreds] = useState(null);
  const [range, setRange] = useState(null);
  const [data, setData] = useState(null);
  const [progress, setProgress] = useState({});
  const [fetchError, setFetchError] = useState('');

  const handleFetch = async (rangeData) => {
    setRange(rangeData);
    setScreen('fetching');
    setFetchError('');
    try {
      const result = await fetchContributions({
        token: creds.token,
        username: creds.username,
        fromDate: rangeData.fromDate,
        toDate: rangeData.toDate,
        repos: rangeData.repos,
        onProgress: setProgress,
      });
      setData(result);
      setScreen('results');
    } catch (e) {
      setFetchError(e.message);
      setScreen('filter');
    }
  };

  const reset = () => {
    storage.clearAll();
    setCreds(null);
    setData(null);
    setRange(null);
    setScreen('setup');
  };

  return (
    <div className="min-h-screen">
      {screen === 'setup' && (
        <SetupScreen
          onComplete={(c) => {
            setCreds(c);
            setScreen('filter');
          }}
        />
      )}
      {screen === 'filter' && creds && (
        <>
          {fetchError && (
            <div className="max-w-3xl mx-auto pt-6 px-6">
              <div className="p-4 border border-red-300 bg-red-50 text-red-800 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>{fetchError}</div>
              </div>
            </div>
          )}
          <FilterScreen creds={creds} onBack={() => setScreen('setup')} onFetch={handleFetch} />
        </>
      )}
      {screen === 'fetching' && <FetchProgress progress={progress} />}
      {screen === 'results' && data && (
        <ResultsScreen
          creds={creds}
          data={data}
          range={range}
          onReset={reset}
          onBack={() => setScreen('filter')}
          onUpdateCreds={(next) => setCreds({ ...creds, ...next })}
        />
      )}
    </div>
  );
}
