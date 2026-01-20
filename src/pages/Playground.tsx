import { useState, useEffect } from 'react';
import { FractalCanvas } from '../components/FractalCanvas';
import { Controls } from '../components/Controls';
import { ChevronRight, ChevronLeft, Home } from 'lucide-react';
import { WikipediaIcon } from '../components/WikipediaIcon';

import { Link, useSearchParams } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useFractalStore } from '../store/fractalStore';

export default function Playground() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [searchParams] = useSearchParams();
    const { setFractal } = useFractalStore();

    // Deep Linking Sync
    useEffect(() => {
        const fractalId = searchParams.get('fractal');
        if (fractalId) {
            setFractal(fractalId);
        }
    }, [searchParams, setFractal]);

    // Get current fractal from store
    const currentFractal = useFractalStore(s => s.currentFractal);

    return (
        <div className="fixed top-0 left-0 w-screen h-[100dvh] overflow-hidden bg-black">
            {/* Main Canvas Area - Full Screen */}
            <div className="absolute inset-0 z-0">
                <FractalCanvas />
            </div>

            {/* Home Link - Top Left */}
            <div className="absolute top-4 left-4 z-20 flex gap-2">
                <Link
                    to="/"
                    className="p-3 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all flex items-center justify-center group"
                    title="Back to Home"
                >
                    <Home size={24} className="group-hover:scale-110 transition-transform" />
                </Link>
                {currentFractal?.wikiLink && (
                    <a
                        href={currentFractal.wikiLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white hover:bg-purple-500/20 hover:border-purple-500/50 transition-all flex items-center justify-center group"
                        title="View on Wikipedia"
                    >
                        <WikipediaIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </a>
                )}
            </div>

            {/* Sidebar Controls - Sci-Fi Design */}
            <div className={cn(
                "absolute right-0 top-0 h-full w-80 bg-black/90 backdrop-blur-xl border-l border-white/10 transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] z-20 flex flex-col shadow-2xl",
                sidebarOpen ? "translate-x-0" : "translate-x-full"
            )}>
                {/* Decorative Top Line */}
                <div className="h-1 w-full bg-gradient-to-r from-cyan-500 to-purple-600 mb-0 flex-shrink-0" />

                {/* Toggle Button */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="absolute -left-8 top-1/2 -translate-y-1/2 w-8 h-24 bg-black/90 backdrop-blur-xl border-y border-l border-white/10 rounded-l-md flex items-center justify-center text-cyan-500 hover:text-white hover:bg-cyan-900/40 transition-all"
                    aria-label="Toggle Controls"
                >
                    {sidebarOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>

                <Controls />
            </div>
        </div>
    );
}
