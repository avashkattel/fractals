import { useFractalStore } from '../store/fractalStore';
import { Slider } from './ui/slider';
import { fractals } from '../config/fractals';
import { cn } from '../lib/utils';
import { Video, StopCircle } from 'lucide-react';

export const Controls = () => {
    const { currentFractal, params, updateParams, setFractal, isRecording, setRecording } = useFractalStore();

    return (
        <div className="flex flex-col h-full p-6 overflow-y-auto">
            <h2 className="text-xl font-bold mb-6">Controls</h2>

            {/* Fractal Selector */}
            <div className="mb-8">
                <label className="block text-sm font-medium mb-2">Fractal Type</label>
                <select
                    value={currentFractal.id}
                    onChange={(e) => setFractal(e.target.value)}
                    className="w-full p-2 rounded-md bg-secondary border border-border text-foreground outline-none focus:ring-2 focus:ring-primary"
                >
                    {fractals.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                </select>
            </div>

            {/* Dynamic Parameters */}
            <div className="space-y-6 flex-1">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Parameters</h3>

                <Slider
                    label="Zoom"
                    value={Math.log10(params.zoom || 1)}
                    min={-1}
                    max={15}
                    step={0.1}
                    valueDisplay={(params.zoom || 1).toFixed(2) + "x"}
                    onChange={(e) => updateParams({ zoom: Math.pow(10, parseFloat(e.target.value)) })}
                />

                <Slider
                    label="Iterations"
                    value={params.iterations || 100}
                    min={10}
                    max={1000}
                    step={10}
                    valueDisplay={params.iterations}
                    onChange={(e) => updateParams({ iterations: parseInt(e.target.value) })}
                />

                {currentFractal.type === '3d' && (
                    <Slider
                        label="Power (Mandelbulb)"
                        value={params.power || 8}
                        min={2}
                        max={16}
                        step={0.1}
                        valueDisplay={params.power?.toFixed(1) || "8.0"}
                        onChange={(e) => updateParams({ power: parseFloat(e.target.value) })}
                    />
                )}
            </div>

            {/* Actions */}
            <div className="mt-auto pt-6 border-t border-border">
                <button
                    className={cn(
                        "w-full py-3 px-4 rounded-md transition-all font-medium flex items-center justify-center gap-2",
                        isRecording
                            ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 animate-pulse"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                    onClick={() => setRecording(!isRecording)}
                >
                    {isRecording ? (
                        <>
                            <StopCircle size={20} /> Stop Recording
                        </>
                    ) : (
                        <>
                            <Video size={20} /> Start Recording
                        </>
                    )}
                </button>
                {isRecording && <p className="text-xs text-center mt-2 text-muted-foreground">Recording active... Move camera to animate.</p>}
            </div>
        </div>
    );
};
