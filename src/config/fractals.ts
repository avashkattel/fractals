
import mandelbrotFrag from '../shaders/2d/mandelbrot.frag?raw';
import juliaFrag from '../shaders/2d/julia.frag?raw';
import burningShipFrag from '../shaders/2d/burning_ship.frag?raw';
import newtonFrag from '../shaders/2d/newton.frag?raw';
import tricornFrag from '../shaders/2d/tricorn.frag?raw';
import celticFrag from '../shaders/2d/celtic.frag?raw';
import lambdaFrag from '../shaders/2d/lambda.frag?raw';
import sineFrag from '../shaders/2d/sine.frag?raw';
import cosineFrag from '../shaders/2d/cosine.frag?raw';
import mandelbulbFrag from '../shaders/3d/mandelbulb.frag?raw';
import mengerFrag from '../shaders/3d/menger.frag?raw';

export type FractalType = '2d' | '3d';

export interface FractalConfig {
    id: string;
    name: string;
    type: FractalType;
    fragmentShader: string;
    defaultParams: {
        zoom: number;
        center: [number, number];
        iterations: number;
        [key: string]: any;
    };
    description: string;
    wikiLink?: string;
    defaultAutoIterations?: boolean;
    paramConfig?: Record<string, {
        min: number;
        max: number;
        step?: number;
        label?: string;
    }>;
}

export const fractals: FractalConfig[] = [
    // 2D Fractals
    {
        id: 'mandelbrot',
        name: 'Mandelbrot Set',
        type: '2d',
        fragmentShader: mandelbrotFrag,
        defaultParams: {
            zoom: 0.35,
            center: [-0.7, 0.0],
            iterations: 400,
        },
        description: "The classic set of complex numbers c for which z = z^2 + c does not diverge.",
        wikiLink: "https://en.wikipedia.org/wiki/Mandelbrot_set",
    },
    {
        id: 'julia',
        name: 'Julia Set',
        type: '2d',
        fragmentShader: juliaFrag,
        defaultParams: {
            zoom: 0.45,
            center: [0.0, 0.0],
            iterations: 100,
            juliaC: [-0.4, 0.6],
        },
        description: "A fractal defined by a fixed constant c in z = z^2 + c.",
        wikiLink: "https://en.wikipedia.org/wiki/Julia_set",
        defaultAutoIterations: true,
    },
    {
        id: 'burning_ship',
        name: 'Burning Ship',
        type: '2d',
        fragmentShader: burningShipFrag,
        defaultParams: {
            zoom: 0.3,
            center: [-0.5, -0.5],
            iterations: 100,
        },
        description: "A variation of the Mandelbrot set using absolute values: z = (|Re(z)| + i|Im(z)|)^2 + c.",
        wikiLink: "https://en.wikipedia.org/wiki/Burning_Ship_fractal",
    },
    {
        id: 'newton',
        name: 'Newton Fractal',
        type: '2d',
        fragmentShader: newtonFrag,
        defaultParams: {
            zoom: 0.5,
            center: [0.0, 0.0],
            iterations: 50,
        },
        description: "Derived from Newton's method for finding roots of the polynomial z^3 - 1.",
        wikiLink: "https://en.wikipedia.org/wiki/Newton_fractal",
    },
    {
        id: 'tricorn',
        name: 'Tricorn (Mandelbar)',
        type: '2d',
        fragmentShader: tricornFrag,
        defaultParams: {
            zoom: 0.35,
            center: [0.0, 0.0],
            iterations: 200,
        },
        description: "A variation where z = conj(z)^2 + c. Features 3-fold symmetry.",
        wikiLink: "https://en.wikipedia.org/wiki/Tricorn_(mathematics)",
    },
    {
        id: 'celtic',
        name: 'Celtic Mandelbrot',
        type: '2d',
        fragmentShader: celticFrag,
        defaultParams: {
            zoom: 0.35,
            center: [0.0, 0.0],
            iterations: 200,
        },
        description: "Defined by z = (|Re(z)| + i*Im(z))^2 + c. Resembles a ship.",
        wikiLink: "https://en.wikipedia.org/wiki/Mandelbrot_set#Related_fractals",
    },
    {
        id: 'lambda',
        name: 'Lambda (Logistic)',
        type: '2d',
        fragmentShader: lambdaFrag,
        defaultParams: {
            zoom: 0.8,
            center: [0.0, 0.0],
            iterations: 200,
        },
        description: "The parameter space of the Logistic Map: z = c*z*(1-z).",
        wikiLink: "https://en.wikipedia.org/wiki/Logistic_map",
    },
    {
        id: 'sine',
        name: 'Sine Mandelbrot',
        type: '2d',
        fragmentShader: sineFrag,
        defaultParams: {
            zoom: 0.5,
            center: [0.0, 0.0],
            iterations: 100,
        },
        description: "A transcendental fractal: z = sin(z) + c.",
        wikiLink: "https://en.wikipedia.org/wiki/Complex_dynamics",
    },
    {
        id: 'cosine',
        name: 'Cosine Mandelbrot',
        type: '2d',
        fragmentShader: cosineFrag,
        defaultParams: {
            zoom: 0.5,
            center: [0.0, 0.0],
            iterations: 100,
        },
        description: "A transcendental fractal: z = cos(z) + c.",
        wikiLink: "https://en.wikipedia.org/wiki/Complex_dynamics",
    },
    {
        id: 'mandelbulb',
        name: 'Mandelbulb',
        type: '3d',
        fragmentShader: mandelbulbFrag,
        defaultParams: {
            zoom: 1.0,
            center: [0.0, 0.0],
            iterations: 100,
            cameraPos: [0.0, 0.0, 5.0],
            power: 8.0,
        },
        description: "A 3D Mandelbrot analogue using spherical coordinates and powers greater than 2.",
        wikiLink: "https://en.wikipedia.org/wiki/Mandelbulb",
        paramConfig: {
            power: { min: 2.0, max: 16.0, step: 0.1, label: "Power" }
        }
    },
    {
        id: 'menger',
        name: 'Menger Sponge',
        type: '3d',
        fragmentShader: mengerFrag,
        defaultParams: {
            zoom: 1.0,
            center: [0.0, 0.0],
            iterations: 100,
            cameraPos: [3.5, 3.5, 3.5], // Pulled back
        },
        description: "A fractal curve in three dimensions. Starts with a cube and recursively removes sub-cubes.",
        wikiLink: "https://en.wikipedia.org/wiki/Menger_sponge",
    },
];
