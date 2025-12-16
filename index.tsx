
import React, { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import { AnimatePresence, motion } from 'framer-motion';
import { Html, useProgress } from '@react-three/drei';
import { Gallery3D } from './components/Gallery3D';
import { fetchMovieData } from './services/geminiService';
import { FALLBACK_MOVIES } from './constants';
import { AppState } from './types';

// Icons
const IconArrowLeft = (props: React.SVGProps<SVGSVGElement>) => <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
const IconArrowRight = (props: React.SVGProps<SVGSVGElement>) => <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
const IconClose = (props: React.SVGProps<SVGSVGElement>) => <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const IconSparkles = (props: React.SVGProps<SVGSVGElement>) => <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" {...props}><path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" /></svg>;

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="text-cinema-gold font-mono text-xs tracking-widest uppercase">
        {progress.toFixed(0)}% Loading Universe...
      </div>
    </Html>
  );
}

const App = () => {
  const [state, setState] = useState<AppState>({
    currentMovieIndex: 0,
    isDetailsOpen: false,
    language: 'zh',
    isLoading: false, 
    movies: FALLBACK_MOVIES,
  });

  const [isCurating, setIsCurating] = useState(true);
  const [scrollPos, setScrollPos] = useState(0);
  
  // Ref to track scroll position inside async effects
  const scrollPosRef = useRef(0);
  useEffect(() => { scrollPosRef.current = scrollPos; }, [scrollPos]);

  // Initial Fetch (Only if user hasn't moved much)
  useEffect(() => {
    const initData = async () => {
      try {
        const data = await fetchMovieData();
        
        // Only update if user is still near the start to prevent jarring shifts
        if (scrollPosRef.current > 0.5) {
            console.log("User active, skipping initial background update.");
            setIsCurating(false);
            return;
        }

        if (data && data.movies && data.movies.length > 0) {
          setState(prev => ({ ...prev, movies: data.movies }));
        }
      } catch (e) {
        console.error("Background fetch failed, keeping fallback data");
      } finally {
        setIsCurating(false);
      }
    };
    initData();
  }, []);

  // Infinite Scroll Trigger
  useEffect(() => {
    const triggerThreshold = state.movies.length - 4;
    
    if (scrollPos > triggerThreshold && !state.isLoading && !isCurating) {
        const loadMore = async () => {
            console.log("Approaching end of universe, expanding...");
            setState(prev => ({ ...prev, isLoading: true }));
            setIsCurating(true);

            try {
                const newData = await fetchMovieData();
                if (newData && newData.movies.length > 0) {
                    setState(prev => {
                        // Re-index new movies to append correctly
                        const startingId = prev.movies.length + 1;
                        const newMoviesWithIds = newData.movies.map((m, i) => ({
                            ...m,
                            id: startingId + i
                        }));
                        
                        return {
                            ...prev,
                            isLoading: false,
                            movies: [...prev.movies, ...newMoviesWithIds]
                        };
                    });
                } else {
                    setState(prev => ({ ...prev, isLoading: false }));
                }
            } catch (e) {
                console.error("Failed to expand universe", e);
                setState(prev => ({ ...prev, isLoading: false }));
            } finally {
                setIsCurating(false);
            }
        };
        loadMore();
    }
  }, [scrollPos, state.movies.length, state.isLoading, isCurating]);


  // Keyboard Event Listener for ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && state.isDetailsOpen) {
            setState(s => ({ ...s, isDetailsOpen: false }));
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isDetailsOpen]);

  // Update current index based on scroll position for UI sync
  useEffect(() => {
    const index = Math.round(scrollPos);
    if (index !== state.currentMovieIndex && index >= 0) {
      setState(prev => ({ ...prev, currentMovieIndex: index }));
    }
  }, [scrollPos]);

  const handleNext = () => {
    // Infinite scroll: just go next, no bounds checking against max length
    setScrollPos(prev => prev + 1);
  };

  const handlePrev = () => {
    setScrollPos(prev => Math.max(prev - 1, 0));
  };
  
  // Wheel Handler with strict damping
  const handleWheel = useCallback((e: React.WheelEvent) => {
    const delta = e.deltaY * 0.002;
    setScrollPos(prev => {
      const next = prev + delta;
      return Math.max(0, next); // Only clamp start, allow infinite end
    });
  }, []);

  const toggleLanguage = () => {
    setState(prev => ({ ...prev, language: prev.language === 'zh' ? 'en' : 'zh' }));
  };

  // Safe movie access - clamp to last available movie
  const safeMovieIndex = Math.min(state.currentMovieIndex, state.movies.length - 1);
  const currentMovie = state.movies[safeMovieIndex] || state.movies[0];
  
  const lang = state.language;
  const isEn = lang === 'en';
  
  // Layout Logic:
  const isLeftMovie = state.currentMovieIndex % 2 === 0;
  const panelOnRight = isLeftMovie; 
  
  if (!currentMovie) return null;

  return (
    <div 
      className="w-full h-screen bg-[#050505] text-white overflow-hidden relative font-sans selection:bg-cinema-gold selection:text-black"
      onWheel={handleWheel}
    >
      
      {/* Film Grain Overlay */}
      <div className="absolute inset-0 pointer-events-none z-50 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>

      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }} dpr={[1, 2]}> 
          <color attach="background" args={['#050505']} />
          <fogExp2 attach="fog" color="#050505" density={0.01} />
          
          <Suspense fallback={<Loader />}>
            <Gallery3D 
              movies={state.movies} 
              scrollPos={scrollPos}
              isDetailsOpen={state.isDetailsOpen}
              onItemClick={(idx) => {
                setScrollPos(idx);
                setState(s => ({ ...s, isDetailsOpen: true }));
              }}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Header */}
      <header className="absolute top-0 left-0 w-full p-8 flex justify-between items-start z-40 pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="text-3xl md:text-5xl font-serif font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-300 to-gray-600 drop-shadow-2xl">
            {isEn ? 'ETERNAL GALLERY' : '永恒回廊'}
          </h1>
          <p className="text-xs md:text-sm text-gray-400 mt-2 font-mono tracking-[0.3em] uppercase opacity-70 border-l-2 border-cinema-gold pl-3">
            {isEn ? 'Infinite Cinema Archive' : '无限电影艺术档案'}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
            <button 
            onClick={toggleLanguage}
            className="pointer-events-auto px-4 py-1.5 glass-panel rounded-sm text-[10px] font-bold tracking-[0.2em] hover:bg-white hover:text-black transition-all duration-300 uppercase border border-white/20"
            >
            {isEn ? 'CN / EN' : '中 / 英'}
            </button>
            
            {/* AI Status Indicator */}
            {isCurating && (
                <div className="pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                    <motion.div 
                        animate={{ rotate: 360, opacity: [0.5, 1, 0.5] }} 
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="text-cinema-gold"
                    >
                        <IconSparkles />
                    </motion.div>
                    <span className="text-[10px] uppercase tracking-widest text-cinema-gold/80 font-mono">
                        {isEn ? 'Expanding Universe...' : '宇宙扩张中...'}
                    </span>
                </div>
            )}
        </div>
      </header>

      {/* Navigation Controls */}
      <div className="absolute bottom-12 right-12 z-40 flex flex-col gap-4 pointer-events-auto">
        <div className="flex flex-col items-center gap-2 glass-panel p-2 rounded-full border border-white/10">
           {/* Up Arrow triggers NEXT (Forward) */}
           <ControlButton onClick={handleNext} icon={<IconArrowLeft className="rotate-90" />} />
           <div className="w-px h-8 bg-white/10"></div>
           {/* Down Arrow triggers PREV (Backward) */}
           <ControlButton onClick={handlePrev} icon={<IconArrowRight className="rotate-90" />} />
        </div>
      </div>
      
      {/* Progress Indicator - Shows total loaded so far */}
      <div className="absolute bottom-12 left-12 z-40 font-mono text-xs text-cinema-gold tracking-widest opacity-80">
          {String(state.currentMovieIndex + 1).padStart(3, '0')} / ∞
      </div>

      {/* Movie Info (Bottom Center) */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-center pointer-events-none w-full px-4 z-30">
        <AnimatePresence mode="wait">
          {!state.isDetailsOpen && (
            <motion.div
              key={currentMovie.id}
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(5px)' }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              <h2 className="text-3xl md:text-5xl font-serif text-white mb-3 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] tracking-wide">
                {lang === 'zh' ? currentMovie.title_zh : currentMovie.title_en}
              </h2>
              
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-cinema-gold to-transparent mb-3 opacity-50"></div>

              <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/5 flex items-center gap-4">
                 <span className="font-mono text-xs text-gray-400">{currentMovie.year}</span>
                 <span className="text-cinema-gold">•</span>
                 <span className="font-serif italic text-gray-300">{lang === 'zh' ? currentMovie.director_zh : currentMovie.director_en}</span>
              </div>
              
              <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 0.6 }}
                 transition={{ delay: 1 }}
                 className="mt-6 text-[10px] text-gray-400 uppercase tracking-[0.3em]"
              >
                  {isEn ? 'Click poster to reveal' : '点击海报揭秘'}
              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Slide-in Detail Panel */}
      <AnimatePresence>
        {state.isDetailsOpen && currentMovie && (
          <>
            <motion.div 
              initial={{ x: panelOnRight ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: panelOnRight ? '100%' : '-100%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`absolute top-0 ${panelOnRight ? 'right-0 border-l' : 'left-0 border-r'} h-full w-full md:w-[600px] z-50 bg-black/75 backdrop-blur-3xl saturate-200 border-white/10 shadow-2xl overflow-y-auto`}
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8 md:p-12 relative min-h-full">
                
                <button 
                  className={`absolute top-8 ${panelOnRight ? 'right-8' : 'left-8'} text-gray-500 hover:text-white transition-colors`}
                  onClick={() => setState(s => ({ ...s, isDetailsOpen: false }))}
                >
                  <IconClose />
                </button>

                <div className="space-y-10 mt-12">
                  
                  {/* Header Section */}
                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                        <span className="text-cinema-gold font-mono text-xs tracking-widest uppercase">No. {String(currentMovie.id).padStart(3, '0')}</span>
                        <span className="text-gray-500 font-mono text-xs">{currentMovie.year}</span>
                    </div>
                    
                    <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4 leading-none tracking-tight">
                        {lang === 'zh' ? currentMovie.title_zh : currentMovie.title_en}
                    </h2>

                    <div className="flex items-center gap-3 mb-8 text-sm text-gray-400 font-sans tracking-widest uppercase">
                        <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] text-cinema-gold">DIR</span>
                        <span>{lang === 'zh' ? currentMovie.director_zh : currentMovie.director_en}</span>
                    </div>

                    <div className="relative pl-6 border-l border-cinema-gold/50">
                        <h3 className="text-xl md:text-2xl font-serif text-gray-200 italic leading-relaxed opacity-90">
                            {lang === 'zh' ? currentMovie.visual_metaphor.zh : currentMovie.visual_metaphor.en}
                        </h3>
                    </div>
                  </div>

                  {/* Haiku Section */}
                  <div className="bg-white/5 p-6 rounded-lg border border-white/5 relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-1 h-full bg-cinema-gold"></div>
                     <pre className="font-serif text-lg text-gray-300 whitespace-pre-wrap leading-loose italic relative z-10">
                      {lang === 'zh' ? currentMovie.haiku.zh : currentMovie.haiku.en}
                     </pre>
                     <div className="absolute -right-4 -bottom-4 text-[100px] text-white/5 font-serif pointer-events-none select-none leading-none">”</div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-8 py-8 border-t border-b border-white/10">
                    <div>
                      <h4 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-3">{isEn ? 'Emotion' : '核心情绪'}</h4>
                      <p className="text-xl font-serif text-white">{lang === 'zh' ? currentMovie.core_emotion.zh : currentMovie.core_emotion.en}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-3">{isEn ? 'Key Element' : '关键意象'}</h4>
                      <p className="text-xl font-serif text-white">{lang === 'zh' ? currentMovie.key_element.zh : currentMovie.key_element.en}</p>
                    </div>
                  </div>

                  {/* Palette */}
                  <div>
                    <h4 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-4">{isEn ? 'Palette' : '色调'}</h4>
                    <div className="flex gap-4">
                      {currentMovie.color_palette.map((color, i) => (
                        <div key={i} className="group relative">
                          <div 
                            className="w-12 h-12 rounded-full border border-white/10 shadow-lg cursor-pointer transition-transform hover:scale-110" 
                            style={{ backgroundColor: color }} 
                          />
                          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity font-mono">{color}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Art Note */}
                  <div className="pt-2">
                    <h4 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-4">{isEn ? 'Curator Note' : '策展人笔记'}</h4>
                    <p className="text-gray-400 leading-8 text-sm md:text-base font-light text-justify">
                      {lang === 'zh' ? currentMovie.art_note.zh : currentMovie.art_note.en}
                    </p>
                  </div>
                </div>

                {/* Footer Decor */}
                <div className="absolute bottom-4 right-8 opacity-10 text-[100px] font-serif leading-none select-none pointer-events-none text-white/5">
                  {currentMovie.year}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const ControlButton = ({ onClick, icon }: { onClick: () => void, icon: React.ReactNode }) => (
  <button 
    onClick={onClick}
    className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300"
  >
    {icon}
  </button>
);

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
