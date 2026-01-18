import { useState } from 'react';
import { FractalCanvas } from '../components/FractalCanvas';
import { Controls } from '../components/Controls';
import { ChevronRight, ChevronLeft, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Dashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="relative w-full h-full flex">
            {/* Main Canvas Area */}
            <div className="flex-1 relative">
                <FractalCanvas />

                {/* Toggle Button for mobile/desktop */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="absolute top-4 left-4 z-10 p-2 bg-card/80 backdrop-blur rounded-md border text-foreground hover:bg-accent transition-colors"
                >
                    {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </button>

                <Link
                    to="/"
                    className="absolute top-4 left-16 z-10 p-2 bg-card/80 backdrop-blur rounded-md border text-foreground hover:bg-accent transition-colors"
                >
                    <Home size={20} />
                </Link>
            </div>

            {/* Sidebar Controls */}
            <div className={cn(
                "absolute right-0 top-0 h-full w-80 bg-card/95 backdrop-blur border-l transition-transform duration-300 ease-in-out z-20 flex flex-col",
                sidebarOpen ? "translate-x-0" : "translate-x-full"
            )}>
                <Controls />
            </div>
        </div>
    );
}
