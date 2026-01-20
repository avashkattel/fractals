import { useFractalStore } from '../store/fractalStore';
import { Slider } from './ui/slider';
import { fractals } from '../config/fractals';
import { cn } from '../lib/utils';
import { Video, StopCircle, Camera, RefreshCw, Play, Pause } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export const Controls = () => {
    const { currentFractal, params, updateParams, isRecording, setRecording, animatingParams } = useFractalStore();

    const [_, setSearchParams] = useSearchParams();

    const handleFractalChange = (id: string) => {
        // Update URL, which triggers Playground's useEffect to update Store
        setSearchParams({ fractal: id });
    };

    return (
        <div
            className="flex flex-col h-full p-6 overflow-y-auto text-gray-100 font-sans"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onPointerMove={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
        >
            <h2 className="text-xl font-bold mb-6 tracking-tight text-white border-b border-white/10 pb-4">Control Panel</h2>

            {/* Fractal Selector */}
            <div className="mb-6">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Fractal Type</label>
                <select
                    value={currentFractal.id}
                    onChange={(e) => handleFractalChange(e.target.value)}
                    className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all hover:bg-white/10 cursor-pointer appearance-none"
                    style={{ colorScheme: 'dark' }}
                >
                    {fractals.map(f => (
                        <option key={f.id} value={f.id} className="bg-neutral-900 text-white py-2">{f.name}</option>
                    ))}
                </select>
            </div>

            {/* Palette Selector */}
            <div className="mb-8">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Color Palette</label>
                <select
                    value={useFractalStore(s => s.paletteId)}
                    onChange={(e) => useFractalStore.getState().setPalette(e.target.value)}
                    className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all hover:bg-white/10 cursor-pointer mb-3 appearance-none"
                    style={{ colorScheme: 'dark' }}
                >
                    <option value="default" className="bg-neutral-900">Classic Blue</option>
                    <option value="fire" className="bg-neutral-900">Magma & Fire</option>
                    <option value="ice" className="bg-neutral-900">Arctic Ice</option>
                    <option value="neon" className="bg-neutral-900">Neon Nights</option>
                    <option value="matrix" className="bg-neutral-900">Matrix</option>
                    <option value="psychedelic" className="bg-neutral-900">Psychedelic</option>
                    <option value="gold" className="bg-neutral-900">Royal Gold</option>
                    <option value="grayscale" className="bg-neutral-900">Monochrome</option>
                    <option value="sunset" className="bg-neutral-900">Sunset Gradient</option>
                    <option value="forest" className="bg-neutral-900">Mystic Forest</option>
                    <option value="electric" className="bg-neutral-900">Electric Zap</option>
                    <option value="custom" className="bg-neutral-900 font-bold text-primary">✨ Custom (User)</option>
                </select>



                {/* Light Source Toggle (3D Only) */}
                {currentFractal.type === '3d' && (
                    <div className="mb-4 flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 transition-colors">
                        <input
                            type="checkbox"
                            id="showLights"
                            checked={useFractalStore(s => s.showLights)}
                            onChange={() => useFractalStore.getState().toggleShowLights()}
                            className="w-5 h-5 rounded border-yellow-500 text-yellow-500 focus:ring-yellow-500 bg-transparent checked:bg-yellow-500"
                        />
                        <label htmlFor="showLights" className="text-sm font-medium cursor-pointer select-none text-yellow-100">
                            Show & Move Lights
                        </label>
                    </div>
                )}

                <div className="flex gap-2 mb-4 bg-white/5 p-2 rounded-lg border border-white/10">
                    {useFractalStore(s => s.customStops).map((color, idx) => (
                        <div key={idx} className="flex-1 aspect-square relative group rounded transition-transform hover:scale-105">
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => useFractalStore.getState().updateCustomStop(idx, e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                title="Click to edit color"
                            />
                            <div
                                className="w-full h-full rounded shadow-sm border border-white/20"
                                style={{ backgroundColor: color }}
                            />
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <input
                        type="checkbox"
                        id="cycle"
                        checked={useFractalStore(s => s.colorCycle)}
                        onChange={() => useFractalStore.getState().toggleColorCycle()}
                        className="w-5 h-5 rounded border-gray-500 text-primary focus:ring-primary bg-transparent checked:bg-primary"
                    />
                    <label htmlFor="cycle" className="text-sm font-medium cursor-pointer select-none text-gray-200">
                        Cycle Colors (Animate)
                    </label>
                </div>
            </div>

            {/* Dynamic Parameters */}
            <div className="space-y-6 flex-1">
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Core Params</h3>
                    <button
                        onClick={useFractalStore.getState().resetParams}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] uppercase font-bold text-white transition-colors"
                        title="Reset to Defaults"
                    >
                        <RefreshCw size={12} /> Reset
                    </button>
                </div>

                <div className="space-y-6">
                    <Slider
                        label="Zoom Level"
                        value={Math.log10(params.zoom || 1)}
                        min={-1}
                        max={15}
                        step={0.1}
                        valueDisplay={(params.zoom || 1).toExponential(2) + "x"}
                        onChange={(e) => updateParams({ zoom: Math.pow(10, parseFloat(e.target.value)) })}
                    />

                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Iterations (Detail)</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="autoIter"
                                    checked={useFractalStore(s => s.autoIterations)}
                                    onChange={() => useFractalStore.getState().toggleAutoIterations()}
                                    className="w-4 h-4 rounded border-gray-500 text-primary focus:ring-primary bg-transparent"
                                />
                                <label htmlFor="autoIter" className="text-[10px] text-gray-300 cursor-pointer select-none">Auto</label>
                            </div>
                        </div>

                        <div className={useFractalStore(s => s.autoIterations) ? "opacity-50 pointer-events-none grayscale" : ""}>
                            <Slider
                                label="" // Hidden label as we moved it up
                                value={params.iterations || 100}
                                min={10}
                                max={1000}
                                step={10}
                                valueDisplay={params.iterations}
                                onChange={(e) => updateParams({ iterations: parseInt(e.target.value) })}
                            />
                        </div>

                        {useFractalStore(s => s.autoIterations) && (
                            <p className="text-[10px] text-gray-400 text-right">
                                Current: <span className="text-gray-400 font-mono ml-1">
                                    {Math.max(
                                        100,
                                        Math.floor(100 + 40 * Math.log10(params.zoom || 1))
                                    )}
                                </span>
                            </p>
                        )}
                    </div>

                    {/* Dynamic Parameters from Config */}
                    {Object.entries(currentFractal.paramConfig || {}).map(([key, config]) => (
                        <div key={key} className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">{config.label || key}</label>
                                <button
                                    onClick={() => useFractalStore.getState().toggleAnimation(key)}
                                    className={cn(
                                        "p-1 rounded transition-colors",
                                        animatingParams?.[key] ? "text-primary bg-primary/10" : "text-gray-500 hover:text-white"
                                    )}
                                    title="Toggle Animation"
                                >
                                    {animatingParams?.[key] ? <Pause size={12} /> : <Play size={12} />}
                                </button>
                            </div>
                            <Slider
                                label=""
                                value={typeof params[key] === 'number' ? params[key] : (config.min || 0)}
                                min={config.min}
                                max={config.max}
                                step={config.step || 0.01}
                                valueDisplay={typeof params[key] === 'number' ? params[key].toFixed(2) : ""}
                                onChange={(e) => updateParams({ [key]: parseFloat(e.target.value) })}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="mt-auto pt-6 border-t border-white/10">
                <div className="flex gap-4">
                    <button
                        className="flex-1 py-3 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-all flex items-center justify-center gap-2 border border-white/10"
                        onClick={() => {
                            const canvas = document.querySelector('canvas');
                            if (canvas) {
                                const link = document.createElement('a');
                                link.download = `fractal-${useFractalStore.getState().currentFractal.id}-${Date.now()}.png`;
                                link.href = canvas.toDataURL('image/png');
                                link.click();
                            }
                        }}
                        title="Take Snapshot"
                    >
                        <Camera size={20} /> Photo
                    </button>

                    <button
                        className={cn(
                            "flex-[2] py-3 px-4 rounded-lg transition-all font-bold flex items-center justify-center gap-2 shadow-lg",
                            isRecording
                                ? "bg-red-500/80 hover:bg-red-600 teext-white animate-pulse"
                                : "bg-primary hover:bg-primary/90 text-primary-foreground"
                        )}
                        onClick={() => setRecording(!isRecording)}
                    >
                        {isRecording ? (
                            <>
                                <StopCircle size={20} /> Stop
                            </>
                        ) : (
                            <>
                                <Video size={20} /> Record
                            </>
                        )}
                    </button>
                </div>
                {isRecording && <p className="text-xs text-center mt-2 text-red-300 animate-pulse">Recording... Pan/Zoom to animate!</p>}
            </div>
        </div>
    );
};
