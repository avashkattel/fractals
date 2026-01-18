import { Link } from 'react-router-dom';
import { fractals } from '../config/fractals';
import { ArrowRight } from 'lucide-react';

export default function Home() {
    return (
        <div className="min-h-screen bg-background text-foreground p-8 overflow-y-auto">
            <header className="max-w-6xl mx-auto mb-12 text-center">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mb-4">
                    Fractal Explorer
                </h1>
                <p className="text-xl text-muted-foreground">
                    Dive into the infinite beauty of mathematics. Explore 2D and 3D fractals in real-time.
                </p>
            </header>

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fractals.map((fractal) => (
                    <Link
                        key={fractal.id}
                        to="/dashboard"
                        // In a real app we'd dispatch an action to set the fractal here, 
                        // but for now we'll let the dashboard load default or use query params later.
                        // Better: use a URL param like /dashboard/:fractalId
                        className="group relative overflow-hidden rounded-xl border border-border bg-card hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
                    >
                        <div className="aspect-video bg-muted relative">
                            {/* Placeholder for thumbnail */}
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground opacity-20 text-6xl font-black">
                                {fractal.name[0]}
                            </div>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="flex items-center gap-2 text-white font-medium px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
                                    Explore <ArrowRight size={16} />
                                </span>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-2">
                                <h2 className="text-2xl font-bold group-hover:text-primary transition-colors">{fractal.name}</h2>
                                <span className="px-2 py-1 text-xs font-mono rounded bg-secondary text-secondary-foreground uppercase">
                                    {fractal.type}
                                </span>
                            </div>
                            <p className="text-muted-foreground line-clamp-3">
                                {fractal.description}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
