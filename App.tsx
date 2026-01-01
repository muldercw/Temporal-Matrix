
import React, { useState, useEffect, useRef } from 'react';
import { GeneratedName, CharacterSpecimen } from './types';
import { SPECIMENS } from './specimens';
import { generateMultiplePersonas, generatePersonaImage } from './geminiService';
import { urlToData } from './utils';
import { Database, Cpu, RotateCw, Download, Loader2, AlertCircle, Plus, Upload, Trash2, Wand2 } from 'lucide-react';

interface MatrixItem extends GeneratedName {
  id: string;
  isGenerating: boolean;
  imageUrl: string;
  isStaged: boolean;
  sourceBase64: string;
  sourceMimeType: string;
  statusMessage: string;
  userAdjective: string;
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
  const [allSpecimens, setAllSpecimens] = useState<CharacterSpecimen[]>([]);
  const [usedAdjectives, setUsedAdjectives] = useState<string[]>([]);
  const [isIngesting, setIsIngesting] = useState(true);
  const [ingestionProgress, setIngestionProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const [pendingDNA, setPendingDNA] = useState<{ base64: string; mimeType: string } | null>(null);
  const [customNameInput, setCustomNameInput] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);

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
    const cached = sessionStorage.getItem('hawkins_custom_specimens');
    const customSpecs: CharacterSpecimen[] = cached ? JSON.parse(cached) : [];
    const hydrated: CharacterSpecimen[] = [];
    
    const totalAssets = SPECIMENS.length + customSpecs.length;
    
    for (let i = 0; i < SPECIMENS.length; i++) {
      const spec = SPECIMENS[i];
      try {
        const { base64, mimeType } = await urlToData(spec.sourceUrl);
        hydrated.push({ ...spec, sourceBase64: base64, sourceMimeType: mimeType });
        setIngestionProgress(Math.round(((i + 1) / totalAssets) * 100));
      } catch (err) {
        hydrated.push({ ...spec, sourceBase64: "", sourceMimeType: "image/jpeg" });
      }
    }

    const finalSpecimens = [...hydrated, ...customSpecs];
    setAllSpecimens(finalSpecimens);
    
    setItems(finalSpecimens.map((spec) => ({
      id: spec.name + (spec.isCustom ? '_custom_' + Math.random().toString(36).substr(2, 9) : ''),
      characterName: spec.name,
      title: spec.stagedTitle,
      description: spec.stagedDescription,
      imageUrl: spec.sourceBase64 ? `data:${spec.sourceMimeType};base64,${spec.sourceBase64}` : "",
      sourceBase64: spec.sourceBase64 || "",
      sourceMimeType: spec.sourceMimeType || "image/jpeg",
      isGenerating: false,
      isStaged: true,
      statusMessage: LOADING_MESSAGES[0],
      userAdjective: ""
    })));
    setIsIngesting(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Full = event.target?.result as string;
      setPendingDNA({ base64: base64Full.split(',')[1], mimeType: file.type });
      setCustomNameInput(file.name.split('.')[0].substring(0, 15));
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const finalizeDNAInjection = () => {
    if (!pendingDNA || !customNameInput.trim()) return;
    const name = customNameInput.trim();
    const newSpec: CharacterSpecimen = {
      name, letter: name.charAt(0).toUpperCase(), sourceUrl: "",
      sourceBase64: pendingDNA.base64, sourceMimeType: pendingDNA.mimeType,
      stagedTitle: name, stagedDescription: "Custom subject added to the matrix.", isCustom: true
    };
    const updated = [...allSpecimens, newSpec];
    setAllSpecimens(updated);
    sessionStorage.setItem('hawkins_custom_specimens', JSON.stringify(updated.filter(s => s.isCustom)));
    setItems(prev => [...prev, {
      id: name + '_custom_' + Date.now(), characterName: name, title: name, description: "Unanalyzed DNA data.",
      imageUrl: `data:${pendingDNA.mimeType};base64,${pendingDNA.base64}`,
      sourceBase64: pendingDNA.base64, sourceMimeType: pendingDNA.mimeType,
      isGenerating: false, isStaged: true, statusMessage: LOADING_MESSAGES[0], userAdjective: ""
    }]);
    setPendingDNA(null); setCustomNameInput("");
  };

  const downloadImage = (dataUrl: string, title: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${title.replace(/\s+/g, '_').toLowerCase()}_persona.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const regenerateSinglePersona = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item || item.isGenerating) return;
    setError(null);
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, isGenerating: true } : i));

    try {
      const charSpec = allSpecimens.find(s => s.name === item.characterName)!;
      const mod = item.userAdjective.trim();
      const [newMeta] = await generateMultiplePersonas([charSpec], usedAdjectives, mod || undefined);
      
      if (!newMeta) throw new Error("Metadata failed");
      const newImageUrl = await generatePersonaImage(newMeta.characterName, newMeta.title, newMeta.description, item.sourceBase64, item.sourceMimeType);

      if (!mod) setUsedAdjectives(prev => [...prev, newMeta.title.split(' ')[0]]);

      setItems(prev => prev.map(i => i.id === itemId ? { 
        ...i, title: newMeta.title, description: newMeta.description, imageUrl: newImageUrl, isGenerating: false, isStaged: false 
      } : i));
    } catch (err) {
      setError(`Neural link failed for ${item.characterName}. Core stability compromised.`);
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, isGenerating: false } : i));
    }
  };

  const deleteSpecimen = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    const name = items.find(i => i.id === id)?.characterName;
    const updated = allSpecimens.filter(s => !(s.name === name && s.isCustom));
    setAllSpecimens(updated);
    sessionStorage.setItem('hawkins_custom_specimens', JSON.stringify(updated.filter(s => s.isCustom)));
  };

  useEffect(() => { if (!initializedRef.current) { initializedRef.current = true; ingestAssets(); } }, []);

  if (isIngesting) return (
    <div className="h-screen bg-[#02040a] flex flex-col items-center justify-center text-slate-100 p-8">
      <div className="w-24 h-24 border-2 border-red-900 border-t-red-500 rounded-full animate-spin mb-8" />
      <h1 className="text-3xl font-black uppercase tracking-[0.4em] italic text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-white to-blue-500">Neural Ingestion</h1>
      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mt-4">Synchronizing with Hawkins Sub-Matrix...</p>
      <div className="w-64 bg-slate-900 h-1 mt-8 rounded-full overflow-hidden">
        <div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${ingestionProgress}%` }} />
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-[#02040a] text-slate-100 font-sans relative flex flex-col overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,_#1e293b_0%,_transparent_60%)] opacity-40"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
      </div>

      {pendingDNA && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl bg-black/80 animate-in fade-in duration-300">
          <div className="max-w-sm w-full bg-slate-900/80 border border-red-500/30 rounded-3xl p-8 shadow-2xl text-center">
            <h2 className="text-xl font-black uppercase tracking-widest italic text-red-500 mb-6">Subject Designation</h2>
            <input type="text" autoFocus value={customNameInput} onChange={(e) => setCustomNameInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && finalizeDNAInjection()} placeholder="NAME..." className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-center font-black uppercase tracking-[0.4em] text-white focus:border-red-500/50 outline-none mb-6" />
            <div className="flex gap-3">
              <button onClick={() => setPendingDNA(null)} className="flex-1 px-4 py-3 bg-slate-800 text-[10px] font-black uppercase tracking-widest rounded-xl">Abort</button>
              <button onClick={finalizeDNAInjection} disabled={!customNameInput.trim()} className="flex-1 px-4 py-3 bg-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl disabled:opacity-50">Initialize</button>
            </div>
          </div>
        </div>
      )}

      <header className="relative z-30 px-6 py-4 flex items-center justify-between border-b border-white/5 backdrop-blur-3xl bg-black/60 shadow-2xl">
        <div className="flex items-center gap-4">
          <Cpu className="w-6 h-6 text-blue-400 animate-pulse" />
          <h1 className="text-xl font-black tracking-tighter uppercase italic text-white">Hawkins Persona Matrix</h1>
        </div>
        <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all">Inject New DNA</button>
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
      </header>

      <main className="relative z-20 flex-1 px-6 py-8 overflow-y-auto custom-scrollbar-hide">
        {error && <div className="mb-6 p-4 bg-red-950/30 border border-red-500/30 rounded-xl text-red-200 text-[10px] font-black uppercase tracking-widest flex items-center gap-4"><AlertCircle className="w-4 h-4" />{error}</div>}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8 pb-12">
          {items.map((item) => (
            <div key={item.id} className={`relative group rounded-2xl bg-slate-900/40 border transition-all duration-700 aspect-[3/4] overflow-hidden ${item.isGenerating ? 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)] scale-[1.02]' : 'border-white/5 hover:border-blue-500/40'}`}>
              
              {/* Image with strong grayscale logic for staged items */}
              <img 
                src={item.imageUrl} 
                alt={item.title} 
                className={`w-full h-full object-cover transition-all duration-[2000ms] 
                  ${item.isGenerating ? 'opacity-30 blur-2xl scale-125' : 'opacity-100'}
                  ${item.isStaged && !item.isGenerating ? 'grayscale brightness-50 contrast-125 saturate-0' : ''}
                `} 
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
              
              <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[7px] font-black text-white/90 px-2 py-1 uppercase tracking-widest backdrop-blur-md rounded border border-white/10 ${item.isGenerating ? 'bg-red-600/40 border-red-500/30' : 'bg-blue-600/40 border-blue-500/30'}`}>
                    {item.characterName}
                  </span>
                  {item.isStaged && !item.isGenerating && (
                    <span className="text-[7px] font-black text-slate-400 px-2 py-1 uppercase tracking-widest bg-slate-800/40 backdrop-blur-md rounded border border-white/5 italic">Staged DNA</span>
                  )}
                </div>
                <h3 className="text-sm font-black text-white uppercase italic tracking-tight truncate drop-shadow-lg">{item.title}</h3>
              </div>

              {/* Hover Overlay with Thematic Modifier Input */}
              <div className="absolute inset-0 p-6 bg-black/10 backdrop-blur-[48px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-center text-center z-30 pointer-events-none group-hover:pointer-events-auto border border-white/10 rounded-2xl shadow-inner">
                 <div className="mb-6">
                    <p className="text-white text-[9px] leading-relaxed font-bold italic line-clamp-4 drop-shadow-md">"{item.description}"</p>
                 </div>
                 
                 <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="space-y-1.5">
                      <label className="block text-[7px] font-black text-white/50 uppercase tracking-[0.2em] text-left ml-1">Thematic Modifier</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="e.g. Dangerous, Cyber, Gothic..." 
                          value={item.userAdjective} 
                          onChange={(e) => setItems(prev => prev.map(i => i.id === item.id ? { ...i, userAdjective: e.target.value } : i))}
                          onKeyDown={(e) => e.key === 'Enter' && regenerateSinglePersona(item.id)}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-3 text-[10px] text-white placeholder-white/20 outline-none focus:border-blue-500/50 transition-all uppercase tracking-widest font-black shadow-inner" 
                        />
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => regenerateSinglePersona(item.id)} 
                      disabled={item.isGenerating} 
                      className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.2)] active:scale-95 transition-all"
                    >
                      {item.isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                      {item.isGenerating ? "Syncing..." : "Sync Variant"}
                    </button>
                    
                    {!item.isStaged && (
                      <button onClick={() => downloadImage(item.imageUrl, item.title)} className="w-full py-2 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white text-[7px] font-black uppercase tracking-widest rounded-lg transition-all border border-white/5">Download Render</button>
                    )}
                    
                    {item.id.includes('_custom') && (
                      <button onClick={() => deleteSpecimen(item.id)} className="w-full text-[6px] text-red-900 font-bold uppercase tracking-widest hover:text-red-500 transition-colors mt-1">Scrub DNA Data</button>
                    )}
                 </div>
              </div>

              {item.isGenerating && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md z-40">
                  <div className="w-10 h-10 border-t-2 border-red-500 rounded-full animate-spin mb-4" />
                  <span className="text-[8px] font-black text-red-500 uppercase tracking-widest animate-pulse">{item.statusMessage}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* DNA Repository Tray Area */}
      <section className="relative z-30 w-full px-6 py-5 bg-black/80 border-t border-white/5 backdrop-blur-3xl flex flex-col gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4">
          <Database className="w-3.5 h-3.5 text-slate-500" />
          <h2 className="text-[9px] font-black uppercase tracking-[0.7em] text-slate-500">DNA Repository Source Assets</h2>
          <div className="h-[1px] flex-1 bg-white/5"></div>
        </div>
        
        <div className="flex items-center justify-center gap-5 overflow-x-auto pb-2 px-2 custom-scrollbar-hide">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-2 group flex-shrink-0"
          >
            <div className="relative w-11 h-11 rounded-xl border-2 border-dashed border-slate-700 bg-slate-800/10 flex items-center justify-center text-slate-600 group-hover:text-red-500 group-hover:border-red-500/50 transition-all">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-600 group-hover:text-red-500">Add Sample</span>
          </button>

          {allSpecimens.map((spec, idx) => {
            const currentItem = items.find(i => i.characterName === spec.name);
            const isGenerated = currentItem && !currentItem.isStaged && !currentItem.isGenerating;
            const isGenerating = currentItem && currentItem.isGenerating;
            return (
              <div key={`${spec.name}-${idx}`} className="flex flex-col items-center gap-2 group flex-shrink-0">
                <div className={`relative w-11 h-11 rounded-xl border-2 transition-all duration-700 overflow-hidden 
                  ${isGenerated ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : isGenerating ? 'border-red-500 animate-pulse' : 'border-slate-800 opacity-20 grayscale saturate-0'}`}>
                  <img src={spec.sourceBase64 ? `data:${spec.sourceMimeType};base64,${spec.sourceBase64}` : spec.sourceUrl} alt={spec.name} className="w-full h-full object-cover" />
                </div>
                <span className={`text-[7px] font-black uppercase tracking-[0.15em] transition-colors duration-500 ${isGenerating ? 'text-red-500' : isGenerated ? 'text-blue-400' : 'text-slate-600'}`}>{spec.name}</span>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="px-6 py-3 bg-[#010205] border-t border-white/5 flex justify-between items-center text-[7px] font-black uppercase tracking-[1em] text-slate-700 backdrop-blur-md">
        <div className="flex items-center gap-2">
           <Cpu className="w-3 h-3 text-slate-800" />
           <span>Hawkins Neural Forge // Edge Engine Alpha-12.8.5</span>
        </div>
        <div className="flex gap-6">
          <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" /> Reality Link: Synchronized</div>
          <div className="flex items-center gap-2 text-blue-500/50"><Database className="w-3 h-3" /> Core Samples: {allSpecimens.length}</div>
        </div>
      </footer>
    </div>
  );
};

export default App;
