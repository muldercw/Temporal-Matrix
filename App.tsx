
import React, { useState, useEffect, useRef } from 'react';
import { GeneratedName, CharacterSpecimen } from './types';
import { SPECIMENS } from './specimens';
import { generateMultiplePersonas, generatePersonaImage } from './geminiService';
import { urlToData } from './utils';
import { ShieldAlert, Database, Sparkles, Cpu, Binary, RotateCw, Download, Zap } from 'lucide-react';

interface MatrixItem extends GeneratedName {
  id: string;
  isGenerating: boolean;
  imageUrl: string;
  isStaged: boolean;
  sourceBase64: string;
  sourceMimeType: string;
  statusMessage: string;
}

const LOADING_MESSAGES = [
  "Decrypting DNA...",
  "Mapping Cortex...",
  "Patching Reality...",
  "Synthesizing Era...",
  "Rendering Persona...",
  "Bypassing Lab Locks...",
  "Upside Down Leak...",
  "Matrix Alignment..."
];

const App: React.FC = () => {
  const [items, setItems] = useState<MatrixItem[]>([]);
  const [ingestedSpecimens, setIngestedSpecimens] = useState<CharacterSpecimen[]>([]);
  const [usedAdjectives, setUsedAdjectives] = useState<string[]>([]);
  const [isIngesting, setIsIngesting] = useState(true);
  const [ingestionProgress, setIngestionProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  // Status message rotation for active generation cards
  useEffect(() => {
    const interval = setInterval(() => {
      setItems(prev => prev.map(item => {
        if (item.isGenerating) {
          const currentIndex = LOADING_MESSAGES.indexOf(item.statusMessage);
          const nextIndex = (currentIndex + 1) % LOADING_MESSAGES.length;
          return { ...item, statusMessage: LOADING_MESSAGES[nextIndex] };
        }
        return item;
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const ingestAssets = async () => {
    setIsIngesting(true);
    const hydrated: CharacterSpecimen[] = [];
    
    for (let i = 0; i < SPECIMENS.length; i++) {
      const spec = SPECIMENS[i];
      try {
        const { base64, mimeType } = await urlToData(spec.sourceUrl);
        hydrated.push({ ...spec, sourceBase64: base64, sourceMimeType: mimeType });
        setIngestionProgress(Math.round(((i + 1) / SPECIMENS.length) * 100));
      } catch (err) {
        console.error(`Asset glitch for ${spec.name}`, err);
        hydrated.push({ ...spec, sourceBase64: "", sourceMimeType: "image/jpeg" });
      }
    }
    
    setIngestedSpecimens(hydrated);
    
    const initialItems: MatrixItem[] = hydrated.map((spec) => ({
      id: spec.name,
      characterName: spec.name,
      title: spec.stagedTitle,
      description: spec.stagedDescription,
      imageUrl: spec.sourceBase64 ? `data:${spec.sourceMimeType};base64,${spec.sourceBase64}` : "",
      sourceBase64: spec.sourceBase64 || "",
      sourceMimeType: spec.sourceMimeType || "image/jpeg",
      isGenerating: false,
      isStaged: true,
      statusMessage: LOADING_MESSAGES[0]
    }));
    
    setItems(initialItems);
    setIsIngesting(false);
  };

  const downloadImage = (dataUrl: string, title: string) => {
    if (!dataUrl) return;
    try {
      const parts = dataUrl.split(',');
      if (parts.length < 2) return;
      
      const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
      const b64Data = parts[1];
      
      const binaryString = window.atob(b64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: mime });
      const url = window.URL.createObjectURL(blob);
      
      const extension = mime.split('/')[1] || 'png';
      const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `${safeTitle}.${extension}`;

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      console.error("Neural export failure:", err);
      setError("Matrix export failed. The neural data was too complex for your system's buffer.");
    }
  };

  const regenerateSinglePersona = async (characterName: string) => {
    const item = items.find(i => i.characterName === characterName);
    if (!item || item.isGenerating) return;

    setError(null);
    setItems(prev => prev.map(i => i.characterName === characterName ? { ...i, isGenerating: true } : i));

    try {
      const charSpec = ingestedSpecimens.find(s => s.name === characterName)!;
      // Pass the usedAdjectives to the model
      const [newMeta] = await generateMultiplePersonas([charSpec], usedAdjectives);
      
      if (!newMeta) throw new Error("Metadata generation failed");

      const newImageUrl = await generatePersonaImage(
        newMeta.characterName,
        newMeta.title,
        newMeta.description,
        charSpec.sourceBase64!,
        charSpec.sourceMimeType
      );

      // Extract the adjective (first word) to add to our cache
      const adjective = newMeta.title.split(' ')[0];
      setUsedAdjectives(prev => Array.from(new Set([...prev, adjective])));

      setItems(prev => prev.map(i => 
        i.characterName === characterName 
          ? { 
              ...i, 
              title: newMeta.title, 
              description: newMeta.description, 
              imageUrl: newImageUrl, 
              isGenerating: false, 
              isStaged: false 
            } 
          : i
      ));
    } catch (err) {
      console.error(`Individual reconstruction failure for ${characterName}:`, err);
      setError(`Neural link failed for ${characterName}. Check matrix stability.`);
      setItems(prev => prev.map(i => i.characterName === characterName ? { ...i, isGenerating: false } : i));
    }
  };

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      ingestAssets();
    }
  }, []);

  if (isIngesting) {
    return (
      <div className="h-screen bg-[#02040a] flex flex-col items-center justify-center text-slate-100 p-8">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="relative">
            <div className="w-24 h-24 border-2 border-blue-900 border-t-blue-400 rounded-full animate-spin mx-auto"></div>
            <Cpu className="absolute inset-0 m-auto w-10 h-10 text-blue-500 animate-pulse" />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-black uppercase tracking-[0.4em] italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-white">
              Neural Ingestion
            </h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">
              Fetching core specimens from remote databases...
            </p>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden shadow-2xl">
            <div className="h-full bg-blue-500 transition-all duration-500 shadow-[0_0_15px_#3b82f6]" style={{ width: `${ingestionProgress}%` }}></div>
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400 uppercase">
            <span>Progress: {ingestionProgress}%</span>
            <span className="animate-pulse">Active Link</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#02040a] text-slate-100 font-sans relative flex flex-col">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,_#1e293b_0%,_transparent_60%)] opacity-40"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
      </div>

      <header className="relative z-30 w-full px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between border-b border-white/5 backdrop-blur-3xl bg-black/60 shadow-2xl gap-4">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="relative group shrink-0">
             <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
             <div className="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 border border-blue-500/30 bg-blue-950/20 text-blue-400 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.1)]">
               <Cpu className="w-5 h-5 md:w-6 md:h-6 animate-pulse" />
             </div>
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-black tracking-tighter uppercase italic text-white leading-none">Hawkins Persona Matrix</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]"></span>
              <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Sequence v12.5 // Variational Cache Active ({usedAdjectives.length})</p>
            </div>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-3 px-4 py-1 border border-blue-500/20 bg-blue-500/5 rounded-full text-[8px] font-black uppercase tracking-[0.3em] text-blue-400">
          <Zap className="w-3 h-3 fill-current" />
          Neural Variety Engine Engaged
        </div>
      </header>

      <main className="relative z-20 flex-1 flex flex-col px-4 md:px-6 py-4 min-h-0 overflow-y-auto md:overflow-hidden">
        {error && (
          <div className="mb-4 p-3 bg-red-950/30 border border-red-500/30 rounded-lg flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <p className="text-red-200 font-bold uppercase text-[10px] tracking-widest">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 md:h-full pb-8 md:pb-2">
          {items.map((item) => (
            <div 
              key={item.id} 
              className={`relative group rounded-2xl bg-slate-900/40 border transition-all duration-700 flex flex-col min-h-[350px] md:min-h-0 shadow-2xl overflow-hidden aspect-[3/4] md:aspect-auto
                ${item.isGenerating ? 'border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.2)]' : 'border-white/5 hover:border-blue-500/40'}
              `}
            >
              <div className="relative flex-1 min-h-0 overflow-hidden">
                {item.isGenerating && (
                  <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950">
                    <div className="matrix-scan"></div>
                    <div className="absolute inset-0 opacity-20 flex items-center justify-center">
                       <Binary className="w-32 h-32 text-blue-500 animate-pulse opacity-10" />
                    </div>
                  </div>
                )}
                
                <img 
                  src={item.imageUrl} 
                  alt={item.title} 
                  className={`w-full h-full object-cover transition-all duration-[2000ms] ease-out 
                    ${item.isGenerating ? 'opacity-30 blur-2xl scale-125' : 'opacity-100 blur-0 scale-100'} 
                    ${item.isStaged && !item.isGenerating ? 'grayscale brightness-50 contrast-125' : ''}
                  `} 
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                
                {!item.isGenerating && (
                  <div className="absolute top-3 right-3 z-30 flex flex-col gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        regenerateSinglePersona(item.characterName);
                      }}
                      className="p-2 bg-black/40 hover:bg-blue-600/60 backdrop-blur-md border border-white/10 rounded-lg text-white/70 hover:text-white transition-all active:scale-90 group/btn shadow-xl"
                      title={`Sync ${item.characterName}`}
                    >
                      <RotateCw className="w-4 h-4 group-hover/btn:rotate-180 transition-transform duration-500" />
                    </button>
                    {!item.isStaged && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(item.imageUrl, item.title);
                        }}
                        className="p-2 bg-black/40 hover:bg-emerald-600/60 backdrop-blur-md border border-white/10 rounded-lg text-white/70 hover:text-white transition-all active:scale-90 group/btn shadow-xl animate-in fade-in slide-in-from-right-2"
                        title="Export Neural Variant"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}

                {item.isGenerating && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-10 p-4 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 border-t-2 border-blue-400 rounded-full animate-spin"></div>
                        <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-blue-400 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 animate-pulse">
                          {item.statusMessage}
                        </span>
                        <div className="flex justify-center gap-1">
                          {[0,1,2].map(i => (
                            <div key={i} className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }}></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                  <div className="flex items-center gap-2 mb-2">
                     <span className="text-[8px] font-black text-white/90 px-2 py-1 uppercase tracking-widest leading-none bg-blue-600/40 backdrop-blur-md border border-white/10 rounded-md">
                       {item.characterName}
                     </span>
                     {item.isStaged ? (
                        <div className="px-2 py-1 bg-slate-500/20 text-slate-400 text-[8px] font-black uppercase tracking-widest rounded-md border border-white/5 italic">
                          Staged
                        </div>
                     ) : (
                       !item.isGenerating && (
                        <div className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase tracking-widest rounded-md border border-emerald-500/20 animate-in fade-in zoom-in duration-1000">
                          Verified
                        </div>
                       )
                     )}
                  </div>
                  <h3 className="text-sm md:text-xs lg:text-sm font-black text-white uppercase italic tracking-tight leading-none truncate drop-shadow-xl">
                    {item.title}
                  </h3>
                </div>
              </div>

              <div className="absolute inset-0 p-6 bg-slate-950/95 backdrop-blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-center text-center translate-y-4 group-hover:translate-y-0 z-30 pointer-events-none group-hover:pointer-events-auto">
                 <div className="mb-4 flex justify-center">
                   <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-blue-500/30 flex items-center justify-center bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                     <Database className="w-5 h-5 text-blue-400" />
                   </div>
                 </div>
                 <p className="text-slate-200 text-[10px] leading-relaxed font-medium italic mb-6 line-clamp-6">
                   "{item.description}"
                 </p>
                 <div className="pt-4 border-t border-white/5 flex flex-col items-center">
                    <span className="text-[7px] text-slate-500 font-mono tracking-[0.3em] uppercase block">
                      Subject DNA Hash
                    </span>
                    <span className="text-[8px] text-blue-900 font-mono mt-1 block truncate w-full">
                      SHA256:0x{item.id.toUpperCase()}-F01-{item.id.length}
                    </span>
                    <div className="mt-4 flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          regenerateSinglePersona(item.characterName);
                        }}
                        className="flex items-center gap-2 px-4 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white text-[8px] font-black uppercase tracking-[0.2em] border border-blue-500/30 rounded-lg transition-all"
                      >
                        <RotateCw className="w-3 h-3" />
                        Sync Variant
                      </button>
                      {!item.isStaged && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadImage(item.imageUrl, item.title);
                          }}
                          className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white text-[8px] font-black uppercase tracking-[0.2em] border border-emerald-500/30 rounded-lg transition-all"
                        >
                          <Download className="w-3 h-3" />
                          Save
                        </button>
                      )}
                    </div>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <section className="relative z-30 w-full px-4 md:px-6 py-4 bg-black/60 border-t border-white/5 backdrop-blur-3xl flex flex-col gap-3 shadow-[0_-15px_40px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-4">
          <Database className="w-3 h-3 md:w-4 md:h-4 text-slate-600" />
          <h2 className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.6em] text-slate-500">DNA Repository Source Assets</h2>
          <div className="h-[1px] flex-1 bg-white/5"></div>
        </div>
        
        <div className="flex items-center justify-start md:justify-center gap-3 md:gap-4 overflow-x-auto pb-1 px-2 md:px-4 custom-scrollbar-hide">
          {ingestedSpecimens.map((spec) => {
            const currentItem = items.find(i => i.characterName === spec.name);
            const isGenerated = currentItem && !currentItem.isStaged && !currentItem.isGenerating;
            const isGenerating = currentItem && currentItem.isGenerating;
            return (
              <div key={spec.name} className="flex flex-col items-center gap-2 group flex-shrink-0">
                <div className={`relative w-8 h-8 md:w-12 md:h-12 rounded-xl border-2 transition-all duration-500 overflow-hidden ${isGenerated ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : isGenerating ? 'border-blue-400 animate-pulse' : 'border-slate-800 opacity-20 grayscale'}`}>
                  <img src={`data:${spec.sourceMimeType};base64,${spec.sourceBase64}`} alt={spec.name} className="w-full h-full object-cover" />
                  {isGenerating && <div className="absolute inset-0 bg-blue-500/20 mix-blend-overlay"></div>}
                </div>
                <span className={`text-[7px] md:text-[8px] font-black uppercase tracking-widest ${isGenerated ? 'text-blue-400' : 'text-slate-600'}`}>{spec.name}</span>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="relative z-30 w-full bg-black/80 py-2 px-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center backdrop-blur-md gap-2">
        <p className="text-[6px] md:text-[7px] text-slate-700 uppercase tracking-[0.8em] md:tracking-[1.2em] font-mono font-bold text-center">
          Hawkins Neural Forge // Edge Engine Alpha-12.5 // Patch 03.12
        </p>
        <div className="flex items-center gap-4 md:gap-5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping"></div>
            <span className="text-[7px] md:text-[8px] text-blue-900 font-bold uppercase tracking-widest">
              Reality Stream: Synchronized
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
