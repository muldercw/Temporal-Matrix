
import React, { useState, useEffect, useRef } from 'react';
import { GeneratedName } from './types';
import { SPECIMENS } from './specimens';
import { generateMultiplePersonas, generatePersonaImage, urlToBase64 } from './geminiService';
import { Loader2, RefreshCcw, ShieldAlert, Clock, Database, User, Sparkles } from 'lucide-react';

interface MatrixItem extends GeneratedName {
  id: string;
  isGenerating: boolean;
  imageUrl: string;
  isStaged: boolean;
  isFallbackMode?: boolean;
}

const App: React.FC = () => {
  const [items, setItems] = useState<MatrixItem[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  // Initialize with staged content
  const initializeMatrix = () => {
    const initialItems: MatrixItem[] = SPECIMENS.map((spec) => ({
      id: spec.name,
      characterName: spec.name,
      title: spec.stagedTitle,
      description: spec.stagedDescription,
      imageUrl: spec.imageUrl, // Start with original image
      isGenerating: false,
      isStaged: true
    }));
    setItems(initialItems);
    setIsInitializing(false);
  };

  const startReconstruction = async () => {
    setError(null);
    
    // Set all to 'generating' state visually
    setItems(prev => prev.map(item => ({ ...item, isGenerating: true })));

    try {
      // Generate a fresh batch of metadata for all 10
      const newPersonas = await generateMultiplePersonas(SPECIMENS);
      
      // We iterate through our existing items and update them as AI content comes in
      newPersonas.forEach(async (newMeta) => {
        try {
          const charSpec = SPECIMENS.find(s => s.name === newMeta.characterName)!;
          const base64 = await urlToBase64(charSpec.imageUrl);
          
          const newImageUrl = await generatePersonaImage(
            newMeta.characterName, 
            newMeta.title, 
            newMeta.description, 
            base64
          );
          
          setItems(prev => prev.map(p => 
            p.characterName === newMeta.characterName 
              ? { 
                  ...p, 
                  title: newMeta.title, 
                  description: newMeta.description, 
                  imageUrl: newImageUrl, 
                  isGenerating: false, 
                  isStaged: false,
                  isFallbackMode: !base64 
                } 
              : p
          ));
        } catch (err) {
          console.error(`Temporal glitch for ${newMeta.title}:`, err);
          setItems(prev => prev.map(p => 
            p.characterName === newMeta.characterName ? { ...p, isGenerating: false } : p
          ));
        }
      });
    } catch (err) {
      console.error("Temporal rift detected:", err);
      setError("Synchronous update failed. The matrix is currently unstable.");
      setItems(prev => prev.map(item => ({ ...item, isGenerating: false })));
    }
  };

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      initializeMatrix();
      // Wait a small beat before starting the live generation to let UI settle
      setTimeout(startReconstruction, 1500);
    }
  }, []);

  return (
    <div className="h-screen bg-[#02040a] text-slate-100 font-sans selection:bg-slate-700 selection:text-white relative overflow-hidden flex flex-col">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-10%,_#0f172a_0%,_transparent_50%)] opacity-40"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-blue-950/10 rounded-full blur-[150px] animate-pulse"></div>
      </div>

      {/* Navigation Bar */}
      <header className="relative z-20 w-full px-6 py-3 flex items-center justify-between border-b border-slate-900/50 backdrop-blur-xl bg-black/40">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-9 h-9 border border-slate-700 bg-slate-900/40 text-blue-400 rounded-lg shadow-inner">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-md font-black tracking-tighter uppercase italic text-white leading-none">Temporal Matrix</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse"></span>
              <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-slate-500">Neural Sync: Live Data Stream</p>
            </div>
          </div>
        </div>

        <button 
          onClick={startReconstruction}
          disabled={items.some(i => i.isGenerating)}
          className="group relative flex items-center gap-3 px-5 py-2 bg-white text-black font-black uppercase text-[9px] tracking-[0.2em] hover:bg-blue-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-wait rounded shadow-lg overflow-hidden"
        >
          {items.some(i => i.isGenerating) ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCcw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-700" />
          )}
          <span>Generate New Batch</span>
        </button>
      </header>

      {/* Main Grid: All 10 items shown */}
      <main className="relative z-10 flex-1 flex flex-col px-4 py-4 min-h-0">
        {error && (
          <div className="mb-4 p-3 bg-red-950/20 border-l-4 border-red-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <p className="text-red-100 font-bold uppercase text-[9px] tracking-wider">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 flex-1 min-h-0">
          {items.map((item) => (
            <div key={item.id} className="relative group rounded-lg bg-slate-950 border border-slate-800/40 overflow-hidden transition-all duration-700 hover:border-white/20 hover:shadow-2xl flex flex-col">
              <div className="relative flex-1 min-h-0 overflow-hidden">
                <img 
                  src={item.imageUrl} 
                  alt={item.title} 
                  className={`w-full h-full object-cover transition-all duration-[3000ms] ${item.isStaged ? 'grayscale blur-[2px] opacity-40' : 'grayscale-0 blur-0 opacity-100'}`} 
                />
                
                {/* Status Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                
                {item.isGenerating && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-t-2 border-white/60 rounded-full animate-spin"></div>
                      <span className="text-[6px] font-black uppercase tracking-[0.3em] text-white/60">Recoding...</span>
                    </div>
                  </div>
                )}

                {item.isStaged && !item.isGenerating && (
                   <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-blue-600/20 backdrop-blur-md border border-blue-500/30 rounded text-[6px] font-black text-blue-400 uppercase tracking-widest">
                     Staged Data
                   </div>
                )}
                
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                     <span className="text-[7px] font-black text-white/80 px-1.5 py-0.5 uppercase tracking-widest leading-none bg-white/10 backdrop-blur-md rounded">
                       {item.characterName}
                     </span>
                     {!item.isStaged && (
                        <div className="p-0.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]">
                          <Sparkles className="w-2 h-2 text-white" />
                        </div>
                     )}
                  </div>
                  <h3 className="text-xs md:text-sm font-black text-white uppercase italic tracking-tighter leading-none mb-1">
                    {item.title}
                  </h3>
                </div>
              </div>

              {/* Description Panel (Visible on Hover) */}
              <div className="absolute inset-0 p-4 bg-black/90 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center text-center">
                 <p className="text-slate-300 text-[9px] leading-relaxed font-medium italic">
                   {item.description}
                 </p>
                 <div className="mt-4 pt-4 border-t border-slate-800">
                    <span className="text-[6px] text-slate-500 font-mono tracking-widest uppercase">Temporal Reconstruction {item.isStaged ? "Pending" : "Complete"}</span>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Global Specimen Library (Footer Dock) */}
      <section className="relative z-20 w-full px-4 pb-4 pt-2 bg-black/40 border-t border-slate-900/50 backdrop-blur-xl flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Database className="w-3 h-3 text-slate-600" />
          <h2 className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-600">Genetic Reference Database (All Specimens)</h2>
          <div className="h-[1px] flex-1 bg-slate-900/50"></div>
        </div>
        
        <div className="flex items-center justify-center gap-3 md:gap-8">
          {SPECIMENS.map((spec) => {
            const isGenerated = items.find(i => i.characterName === spec.name && !i.isStaged);
            return (
              <div key={spec.name} className="flex flex-col items-center gap-1 group transition-all">
                <div className={`relative w-8 h-8 md:w-10 md:h-10 rounded border transition-all overflow-hidden ${isGenerated ? 'border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'border-slate-800'}`}>
                  <img src={spec.imageUrl} alt={spec.name} className={`w-full h-full object-cover transition-all duration-500 ${isGenerated ? 'grayscale-0 opacity-100' : 'grayscale opacity-30'}`} />
                  {isGenerated && (
                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500 rounded-tl shadow-inner"></div>
                  )}
                </div>
                <span className={`text-[6px] font-black uppercase tracking-widest ${isGenerated ? 'text-blue-400' : 'text-slate-700'}`}>{spec.name}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Lab Branding */}
      <footer className="relative z-20 w-full bg-black py-1.5 px-6 border-t border-slate-900/50 flex justify-between items-center">
        <p className="text-[6px] text-slate-800 uppercase tracking-[1em] font-mono font-bold">
          Hawkins Lab // Neural Reality Pipeline
        </p>
        <div className="flex items-center gap-4">
          <span className="text-[6px] text-blue-900 font-bold uppercase tracking-widest">v4.6.0 Stable</span>
          <p className="text-[6px] text-slate-800 uppercase tracking-[0.3em] font-mono font-bold">
            Specimens: 10/10 Loaded
          </p>
        </div>
      </footer>

      <style>{`
        body {
          margin: 0;
          overflow: hidden;
          background: #02040a;
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default App;
