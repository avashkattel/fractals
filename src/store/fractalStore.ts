import { create } from 'zustand';
import { fractals, type FractalConfig } from '../config/fractals';
import { palettes } from '../config/palettes';

interface FractalState {
    currentFractal: FractalConfig;
    params: Record<string, any>;
    setFractal: (id: string) => void;
    updateParams: (newParams: Record<string, any>) => void;
    resetParams: () => void;
    resetCount: number;
    isRecording: boolean;
    setRecording: (isRecording: boolean) => void;

    // Visuals
    paletteId: string;
    setPalette: (id: string) => void;

    customStops: string[];
    updateCustomStop: (index: number, color: string) => void;

    colorCycle: boolean;
    toggleColorCycle: () => void;

    // Iteration Control
    autoIterations: boolean;
    toggleAutoIterations: () => void;

    // Animation Control
    animatingParams: Record<string, boolean>;
    toggleAnimation: (paramKey: string) => void;

    // Interactive Lighting (3D)
    showLights: boolean;
    toggleShowLights: () => void;
    lightPositions: [number, number, number][]; // 5 Lights
    updateLightPosition: (index: number, pos: [number, number, number]) => void;
}

export const useFractalStore = create<FractalState>((set) => ({
    currentFractal: fractals[0],
    params: { ...fractals[0].defaultParams },

    setFractal: (id) => set((state) => {
        const fractal = fractals.find(f => f.id === id);
        if (!fractal) return state;
        return {
            currentFractal: fractal,
            params: { ...fractal.defaultParams },
            autoIterations: fractal.defaultAutoIterations ?? false
        };
    }),

    updateParams: (newParams) => set((state) => ({
        params: { ...state.params, ...newParams }
    })),

    resetParams: () => set((state) => ({
        params: { ...state.currentFractal.defaultParams },
        autoIterations: state.currentFractal.defaultAutoIterations ?? false,
        resetCount: state.resetCount + 1
    })),

    resetCount: 0,

    isRecording: false,
    setRecording: (isRecording) => set({ isRecording }),

    paletteId: 'default',
    setPalette: (id) => set(() => {
        // If switching TO a preset, update customStops to match it (so UI stays synced)
        // If switching TO custom, we keep current customStops
        if (id !== 'custom') {
            const p = palettes.find(pd => pd.id === id);
            // Ensure we always have 5 stops for the UI, fill if needed
            if (p) {
                // Resample or pad to 5? 
                // Simple padding for now: loop last color
                const stops = [...p.stops];
                while (stops.length < 5) stops.push(stops[stops.length - 1]);
                // Truncate if > 5?
                // Let's just keep the raw stops but maybe UI only shows first 5?
                // User asked "put a 5 box". Let's force 5 stops for custom.

                // Smart Resample to 5
                // Actually, let's just store the exact stops. 
                // The "5 box" UI will edit the first 5 stops or add stops.

                // Request: "put a 5 box". This implies 5 fixed colors for custom.
                // Let's create a derived 5-stop array for the 'custom' mode base.
                const derived = [
                    stops[0],
                    stops[Math.floor(stops.length * 0.25)],
                    stops[Math.floor(stops.length * 0.5)],
                    stops[Math.floor(stops.length * 0.75)],
                    stops[stops.length - 1]
                ];
                return { paletteId: id, customStops: derived };
            }
        }
        return { paletteId: id };
    }),

    customStops: ['#000764', '#206bcb', '#edffff', '#ffaa00', '#000200'], // Default init
    updateCustomStop: (index, color) => set((state) => {
        const newStops = [...state.customStops];
        newStops[index] = color;
        return {
            paletteId: 'custom', // Auto-switch to custom
            customStops: newStops
        };
    }),

    colorCycle: false,
    toggleColorCycle: () => set((s) => ({ colorCycle: !s.colorCycle })),

    autoIterations: false,
    toggleAutoIterations: () => set((s) => ({ autoIterations: !s.autoIterations })),

    animatingParams: {},
    toggleAnimation: (key) => set((s) => ({
        animatingParams: {
            ...s.animatingParams,
            [key]: !s.animatingParams[key]
        }
    })),

    // Lighting Defaults
    showLights: false,
    toggleShowLights: () => set((s) => ({ showLights: !s.showLights })),
    // Initial positions (matching the logic in shader roughly, but explicit)
    lightPositions: [
        [5.0, 5.0, 5.0],    // Light 0
        [-5.0, 5.0, 5.0],   // Light 1
        [0.0, 5.0, -5.0],   // Light 2
        [5.0, -5.0, 0.0],   // Light 3 (Under)
        [-5.0, 0.0, -5.0]   // Light 4
    ],
    updateLightPosition: (index, pos) => set((state) => {
        const newLights = [...state.lightPositions];
        newLights[index] = pos;
        return { lightPositions: newLights };
    }),
}));
