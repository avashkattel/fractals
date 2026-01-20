import { Link } from 'react-router-dom';
import { fractals } from '../config/fractals';
import { WikipediaIcon } from '../components/WikipediaIcon';
// import { cn } from '../lib/utils'; // Not strictly needed if we just use standard classes logic

export default function Home() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30 font-sans">
            {/* Background Grid Pattern */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-20"
                style={{
                    backgroundImage: `linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Hero Section */}
            <header className="relative z-10 pt-20 pb-16 px-6 max-w-7xl mx-auto border-b border-white/10">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-500">
                            FRACTAL<br />PLAYGROUND
                        </h1>
                        <p className="mt-6 text-xl text-gray-400 max-w-2xl font-light">
                            Real-time GPU raymarching & iterative mapping exploration.
                        </p>
                    </div>
                </div>
            </header>

            {/* Grid */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {fractals.map((fractal) => (
                        <Link
                            key={fractal.id}
                            to={`/playground?fractal=${fractal.id}`}
                            className="group relative flex flex-col h-full bg-black/40 border border-white/10 hover:border-cyan-500/50 transition-all duration-300 backdrop-blur-sm overflow-hidden"
                        >
                            {/* Card Decoration */}
                            <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                <div className="w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                            </div>

                            {/* Thumbnail Container */}
                            <div className="aspect-[16/9] w-full bg-gray-900 border-b border-white/5 relative overflow-hidden group-hover:border-cyan-500/20 transition-colors">
                                <img
                                    src={`thumbnails/${fractal.id}.jpg`}
                                    alt={fractal.name}
                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-out"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

                                {/* Overlay Type Badge */}
                                <div className="absolute bottom-4 left-4 font-mono text-xs px-2 py-1 bg-white/10 border border-white/20 backdrop-blur text-white/80">
                                    {fractal.type === '3d' ? '3D RAYMARCH' : '2D ITERATIVE'}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-3">
                                    <h2 className="text-2xl font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                                        {fractal.name}
                                    </h2>
                                    {/* Minimal Wiki Link */}
                                    {fractal.wikiLink && (
                                        <a
                                            href={fractal.wikiLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-gray-500 hover:text-white transition-colors p-1"
                                            onClick={(e) => e.stopPropagation()}
                                            title="View on Wikipedia"
                                        >
                                            <WikipediaIcon className="w-5 h-5" />
                                        </a>
                                    )}
                                </div>
                                <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-1">
                                    {fractal.description}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </main >

            {/* Footer Removed as requested */}
            < div className="h-20" />
        </div >
    );
}

