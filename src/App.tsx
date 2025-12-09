import React, { useState } from 'react';
import SnowOverlay from './components/SnowOverlay';
import InputForm from './components/InputForm';
import VerdictCard from './components/VerdictCard';
import { AppState, ScanInput } from './types';
import { judgeInput, generateToyOrCoal } from './services/geminiService';
import { fetchWikiContent } from './services/wikiService';
import { fetchGithubActivity } from './services/githubService';
import { fetchRedditActivity } from './services/redditService';
import { performDeepResearch } from './services/researchService';
import { downloadRepo } from './services/exportService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    status: 'idle',
    error: null,
    verdict: null,
    generatedImage: null,
  });

  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const handleScan = async (input: ScanInput) => {
    // Phase 1: Checking the List (Data Fetching)
    setState(prev => ({ ...prev, status: 'fetching_data', error: null, verdict: null, generatedImage: null }));
    
    try {
      let textToAnalyze = input.content;

      // 1. Fetch Data based on source
      if (input.type === 'wiki') {
        textToAnalyze = await fetchWikiContent(input.content);
      } else if (input.type === 'github') {
        textToAnalyze = await fetchGithubActivity(input.content);
      } else if (input.type === 'reddit') {
        textToAnalyze = await fetchRedditActivity(input.content);
      } else if (input.type === 'news') {
        textToAnalyze = await performDeepResearch(input.content);
      }

      // Phase 2: Checking it Twice (Gemini Judgment)
      setState(prev => ({ ...prev, status: 'judging' }));

      // 2. Get Verdict (Text)
      const verdict = await judgeInput(textToAnalyze);
      
      // Phase 3: Toy Shop (Image Gen)
      setState(prev => ({ 
        ...prev, 
        status: 'generating_image', 
        verdict: verdict 
      }));

      // 3. Generate Image
      const imageBase64 = await generateToyOrCoal(verdict.visual_prompt);
      
      setState(prev => ({ 
        ...prev, 
        status: 'complete', 
        generatedImage: imageBase64 
      }));

    } catch (err: any) {
      setState(prev => ({ 
        ...prev, 
        status: 'error', 
        error: err.message || "Something went wrong in the workshop." 
      }));
    }
  };

  const handleExportClick = () => {
    setShowExportModal(true);
    setExportPassword('');
    setPasswordError(false);
  };

  const handleUnlockSleigh = () => {
    if (exportPassword.toUpperCase() === 'HOHOHO') {
        downloadRepo();
        setShowExportModal(false);
    } else {
        setPasswordError(true);
    }
  };

  const isProcessing = state.status === 'fetching_data' || state.status === 'judging' || state.status === 'generating_image';

  return (
    <div className="min-h-screen relative overflow-x-hidden pb-20">
      <SnowOverlay />
      
      {/* Header */}
      <header className="relative z-10 pt-8 pb-4 text-center px-4">
        <h1 className="text-5xl md:text-7xl font-santa text-santa-red drop-shadow-[0_2px_2px_rgba(255,255,255,0.3)] mb-2">
          Santa's Little Helper
        </h1>
        <p className="text-slate-300 max-w-lg mx-auto mb-6">
          Powered by <strong>Gemini 2.5 Pro</strong> (Brain) & <strong>Nano Banana</strong> (Vision)
        </p>
        
        <button 
          onClick={handleExportClick}
          className="absolute top-8 right-8 text-xs bg-slate-800 hover:bg-slate-700 text-santa-gold px-3 py-1 rounded border border-santa-gold/30 transition-colors"
        >
          🎁 Steal Sleigh (Export)
        </button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4">
        <InputForm 
          onScan={handleScan} 
          disabled={isProcessing} 
        />

        {/* Status Messages */}
        {(state.status === 'fetching_data' || state.status === 'judging') && (
          <div className="text-center mt-12 animate-pulse">
            <p className="text-3xl font-santa text-white drop-shadow-lg">
              {state.status === 'fetching_data' ? 'Checking the List...' : 'Checking it twice...'}
            </p>
            <p className="text-sm text-slate-400 font-sans mt-2 uppercase tracking-widest">
              {state.status === 'fetching_data' 
                ? 'Gathering evidence from the archives...' 
                : 'Consulting with Santa...'}
            </p>
          </div>
        )}

        {state.error && (
          <div className="mt-8 max-w-2xl mx-auto bg-red-900/50 border border-red-500 text-red-100 p-4 rounded-lg text-center">
            <p className="font-bold">⚠️ Elves Encountered an Error</p>
            <p>{state.error}</p>
          </div>
        )}

        {/* Result */}
        {state.verdict && (
          <VerdictCard 
            verdict={state.verdict}
            imageUrl={state.generatedImage}
            loadingImage={state.status === 'generating_image'}
          />
        )}
      </main>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowExportModal(false)}></div>
            <div className="relative bg-slate-900 border-2 border-santa-gold rounded-xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                <h3 className="text-2xl font-santa text-santa-red mb-4 text-center">🎅 Secret Santa Access</h3>
                <p className="text-slate-300 mb-6 text-center text-sm">
                  Enter the secret password to steal the sleigh (source code).
                </p>
                
                <input 
                    type="password" 
                    value={exportPassword}
                    onChange={(e) => { setExportPassword(e.target.value); setPasswordError(false); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleUnlockSleigh()}
                    className="w-full bg-slate-800 border border-slate-600 rounded p-3 text-white focus:border-santa-gold outline-none mb-2 text-center tracking-widest"
                    placeholder="Enter Password..."
                    autoFocus
                />
                
                {passwordError && (
                  <p className="text-red-500 text-sm mb-4 text-center font-bold animate-pulse">
                    🚫 Incorrect Password! Only elves allowed.
                  </p>
                )}

                <div className="flex gap-4 mt-6">
                    <button 
                      onClick={() => setShowExportModal(false)} 
                      className="flex-1 py-3 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wide"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleUnlockSleigh} 
                      className="flex-1 bg-santa-gold text-santa-darkRed font-bold py-3 rounded hover:bg-yellow-400 transition-colors uppercase tracking-wide shadow-lg"
                    >
                      Unlock
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;