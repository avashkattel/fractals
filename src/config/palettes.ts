// Helper to parse hex
const hexToRgb = (hex: string) => {
    const cleanHex = hex.replace('#', '');
    const bigint = parseInt(cleanHex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
};

export interface Palette {
    id: string;
    name: string;
    stops: string[]; // Hex codes
}

export const palettes: Palette[] = [
    { id: 'default', name: 'Classic Blue', stops: ['#000764', '#206bcb', '#edffff', '#ffaa00', '#000200'] },
    { id: 'fire', name: 'Magma & Fire', stops: ['#000000', '#3e0707', '#d83600', '#ffde00', '#ffffca'] },
    { id: 'ice', name: 'Arctic Ice', stops: ['#000000', '#00192e', '#004975', '#00aaff', '#e0ffff'] },
    { id: 'neon', name: 'Neon Nights', stops: ['#000000', '#ff00ff', '#00ffff', '#ffff00', '#ffffff'] },
    { id: 'matrix', name: 'Matrix', stops: ['#001000', '#003300', '#00ff00', '#ccffcc'] },
    { id: 'psychedelic', name: 'Psychedelic', stops: ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'] },
    { id: 'gold', name: 'Royal Gold', stops: ['#000000', '#2a1d00', '#7c5e00', '#ffd700', '#fffee0'] },
    { id: 'grayscale', name: 'Monochrome', stops: ['#000000', '#ffffff'] },
    { id: 'sunset', name: 'Sunset Gradient', stops: ['#1a0b2e', '#4f1a45', '#a63346', '#f69e6b', '#ffeeb0'] },
    { id: 'forest', name: 'Mystic Forest', stops: ['#0d1a0d', '#1a4030', '#568c6a', '#a8dcb9'] },
    { id: 'electric', name: 'Electric Zap', stops: ['#000000', '#330033', '#9900cc', '#ff00ff', '#ffffff'] },
];

export const generatePaletteTexture = (paletteId: string, customStops?: string[]): Uint8Array => {
    let paletteStops = customStops;

    if (paletteId !== 'custom') {
        // Deep copy stops to avoid reference issues
        const p = palettes.find(p => p.id === paletteId) || palettes[0];
        paletteStops = [...p.stops];
    }

    // Fallback
    if (!paletteStops || paletteStops.length === 0) {
        paletteStops = ['#000000', '#ffffff'];
    }

    const width = 1024;
    const data = new Uint8Array(width * 4); // RGBA (Required for modern Three.js)

    // Convert hex stops to RGB objects
    const colors = paletteStops.map(hexToRgb);

    // For smooth fractals, the palette MUST loop seamlessly.
    // We force a loop by appending the first color to the end if it doesn't match.
    // Or we can mirror. For now, simple loop append.

    // Ensure Loop: Append first color to end
    // Check if last color is same as first
    const first = colors[0];
    const last = colors[colors.length - 1];

    // Simple distance check or equality
    if (first.r !== last.r || first.g !== last.g || first.b !== last.b) {
        colors.push({ ...first });
    }

    // Cosine Interpolation for smoother gradients (fixes banding)
    const cosineInterpolate = (y1: number, y2: number, mu: number) => {
        const mu2 = (1 - Math.cos(mu * Math.PI)) / 2;
        return (y1 * (1 - mu2) + y2 * mu2);
    };

    for (let i = 0; i < width; i++) {
        const t = i / (width - 1);

        const segmentCount = colors.length - 1;

        let r, g, b;

        if (segmentCount === 0) {
            r = colors[0].r;
            g = colors[0].g;
            b = colors[0].b;
        } else {
            const exactIndex = t * segmentCount;
            const startIndex = Math.floor(exactIndex);
            const endIndex = Math.min(startIndex + 1, colors.length - 1);
            const subT = exactIndex - startIndex;

            const c1 = colors[startIndex];
            const c2 = colors[endIndex];

            // Use Cosine Interpolation instead of Linear
            r = cosineInterpolate(c1.r, c2.r, subT);
            g = cosineInterpolate(c1.g, c2.g, subT);
            b = cosineInterpolate(c1.b, c2.b, subT);
        }

        data[i * 4 + 0] = r;
        data[i * 4 + 1] = g;
        data[i * 4 + 2] = b;
        data[i * 4 + 3] = 255;
    }

    return data;
};
