import { create } from 'zustand';
import { fractals, type FractalConfig } from '../config/fractals';

interface FractalState {
    currentFractal: FractalConfig;
    params: Record<string, any>;
    setFractal: (id: string) => void;
    updateParams: (newParams: Record<string, any>) => void;
    resetParams: () => void;
    isRecording: boolean;
    setRecording: (isRecording: boolean) => void;
}

export const useFractalStore = create<FractalState>((set) => ({
    currentFractal: fractals[0],
    params: { ...fractals[0].defaultParams },

    setFractal: (id) => set((state) => {
        const fractal = fractals.find(f => f.id === id);
        if (!fractal) return state;
        return {
            currentFractal: fractal,
            params: { ...fractal.defaultParams }
        };
    }),

    updateParams: (newParams) => set((state) => ({
        params: { ...state.params, ...newParams }
    })),

    resetParams: () => set((state) => ({
        params: { ...state.currentFractal.defaultParams }
    })),

    isRecording: false,
    setRecording: (isRecording) => set({ isRecording }),
}));
