
import React, { useState, useEffect, useRef } from 'react';
import { Persona, GeneratedName, CharacterSpecimen } from './types';
import { generateMultiplePersonas, generatePersonaImage, urlToBase64 } from './geminiService';
import { Loader2, RefreshCcw, Sparkles, ShieldAlert, Cpu, Clock } from 'lucide-react';

const SPECIMENS: CharacterSpecimen[] = [
  { name: "Eleven", letter: "E", imageUrl: "https://static0.gamerantimages.com/wordpress/wp-content/uploads/2022/07/Stranger-Things-Eleven-Featured-Image.jpg?w=1600&h=900&fit=crop" },
  { name: "Mike", letter: "M", imageUrl: "https://hips.hearstapps.com/hmg-prod/images/finn-1653510331.jpg?crop=0.668xw:1.00xh;0.107xw,0" },
  { name: "Dustin", letter: "D", imageUrl: "https://static.wikia.nocookie.net/strangerthings8338/images/0/07/Dustin_S4.png/revision/latest?cb=20220531050146" }, 
  { name: "Steve", letter: "S", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/22/Joe_Keery_by_Gage_Skidmore.jpg" },
  { name: "Derrick", letter: "D", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSULWYET1t9UpeBcaFmfpDtbQiWpMWA0C2HjQ&s" },
  { name: "Nancy", letter: "N", imageUrl: "https://miro.medium.com/v2/resize:fit:1400/0*H0er7fOPkcX-eiKq" },
  { name: "Lucas", letter: "L", imageUrl: "https://static.wikia.nocookie.net/strangerthings8338/images/b/b4/Lucas_S4.png/revision/latest?cb=20230602174909" },
  { name: "Eddie", letter: "E", imageUrl: "https://external-preview.redd.it/LpaV22k1yHLEWY15Hq3Vh00dwG-MFuGKUGaYHMgUYfQ.jpg?auto=webp&s=cb54aef0e2b7b2247aa94d9e557f227acdf671c8" },
  { name: "Will", letter: "W", imageUrl: "https://townsquare.media/site/252/files/2022/07/attachment-will-byers.jpg?w=780&q=75" },
  { name: "Max", letter: "M", imageUrl: "https://static.wikia.nocookie.net/strangerthings8338/images/7/73/Max_Mayfield_-_S3.png/revision/latest/scale-to-width/360?cb=20220731231457" }
];

interface MatrixItem extends GeneratedName {
  id: string;
  isGenerating: boolean;
  imageUrl?: string;
  isFallbackMode?: boolean;
}

const App: React.FC = () => {
  const [items, setItems] = useState<MatrixItem[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  const startSequence = async () => {
    setIsInitializing(true);
    setItems([]);
    setError(null);

    try {
      const shuffled = [...SPECIMENS].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 6);

      const names = await generateMultiplePersonas(selected);
      
      const placeholders: MatrixItem[] = names.map(n => ({
        ...n,
        id: Math.random().toString(36).substr(2, 9),
        isGenerating: true
      }));
      
      setItems(placeholders);
      setIsInitializing(false);

      placeholders.forEach(async (item) => {
        try {
          const charSpec = SPECIMENS.find(s => s.name === item.characterName) || SPECIMENS[0];
          const base64 = await urlToBase64(charSpec.imageUrl);
          
          const imageUrl = await generatePersonaImage(
            item.characterName, 
            item.title, 
            item.description, 
            base64
          );
          
          setItems(prev => prev.map(p => 
            p.id === item.id ? { ...p, imageUrl, isGenerating: false, isFallbackMode: !base64 } : p
          ));
        } catch (err) {
          console.error(`Temporal glitch for ${item.title}:`, err);
          setItems(prev => prev.map(p => 
            p.id === item.id ? { ...p, isGenerating: false } : p
          ));
        }
      });
    } catch (err) {
      console.error("Temporal rift detected:", err);
      setError("Reality sync failed. Please try again.");
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      startSequence();
    }
  }, []);

  return (
    <div className="h-screen bg-[#02040a] text-slate-100 font-sans selection:bg-slate-700 selection:text-white relative overflow-hidden flex flex-col">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,_#1e293b_0%,_transparent_60%)] opacity-30"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-5"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#02040a] to-[#02040a]"></div>
      </div>

      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="p-2 border border-slate-700 bg-slate-900/40 text-red-500 rounded-md">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight uppercase italic text-white leading-none">Temporal Matrix</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mt-1">Hawkins Lab // Neural Reality</p>
          </div>
        </div>

        <button 
          onClick={startSequence}
          disabled={isInitializing || items.some(i => i.isGenerating)}
          className="group relative flex items-center gap-3 px-6 py-3 bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all disabled:opacity-20 disabled:cursor-wait"
        >
          {isInitializing || items.some(i => i.isGenerating) ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
          )}
          <span>Resync Reality</span>
        </button>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          {error && (
            <div className="mb-8 p-4 bg-red-950/20 border-l-4 border-red-700 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
              <ShieldAlert className="w-6 h-6 text-red-600" />
              <p className="text-red-100 font-bold uppercase text-xs tracking-wider">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
            {isInitializing && Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square bg-slate-900/10 border border-slate-800/20 flex flex-col items-center justify-center animate-pulse">
                <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
              </div>
            ))}

            {!isInitializing && items.map((item) => (
              <div key={item.id} className="relative group aspect-square bg-black border border-slate-800/50 overflow-hidden transition-all duration-700 hover:border-white/20 hover:shadow-2xl">
                {item.imageUrl ? (
                  <>
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-all duration-[2000ms] group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                    
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="flex items-center gap-2 mb-2">
                         <span className="text-[9px] font-black bg-white text-black px-2 py-0.5 uppercase tracking-widest leading-none">{item.characterName}</span>
                         {item.isFallbackMode && (
                           <span className="text-[8px] font-bold text-slate-500 border border-slate-800 px-1 uppercase leading-none">AI Composite</span>
                         )}
                      </div>
                      <h3 className="text-2xl font-bold text-white uppercase italic tracking-tighter leading-none mb-2">
                        {item.title}
                      </h3>
                      <p className="text-slate-400 text-[10px] leading-relaxed font-medium line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        {item.description}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black p-10 text-center border border-slate-800">
                    <div className="w-12 h-12 border-t-2 border-white rounded-full animate-spin mb-4"></div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest italic mb-1">{item.title}</h3>
                    <p className="text-[8px] text-slate-600 font-mono tracking-[0.2em] uppercase">Processing Reality...</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <section className="mt-12 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600 whitespace-nowrap">Specimen Database</h2>
              <div className="h-[1px] w-full bg-slate-900"></div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 opacity-40 hover:opacity-100 transition-opacity duration-700">
              {SPECIMENS.map((spec) => (
                <div key={spec.name} className="flex flex-col items-center gap-2 group cursor-help">
                  <div className="relative w-12 h-12 border border-slate-800 group-hover:border-slate-400 transition-all overflow-hidden">
                    <img src={spec.imageUrl} alt={spec.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0" />
                  </div>
                  <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest group-hover:text-white">{spec.name}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="relative z-10 w-full bg-black/50 border-t border-slate-900/50 py-4 px-6 backdrop-blur-md">
        <p className="text-[8px] text-slate-700 text-center uppercase tracking-[0.8em] font-mono font-bold opacity-60">
          Neural Analysis // Hawkins National Laboratory // Reality Matrix v4.3
        </p>
      </footer>

      <style>{`
        body {
          scrollbar-width: thin;
          scrollbar-color: #334155 #02040a;
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #02040a;
        }
        ::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default App;
