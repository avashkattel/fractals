import mandelbrotFrag from '../shaders/2d/mandelbrot.frag?raw';
import juliaFrag from '../shaders/2d/julia.frag?raw';
import burningShipFrag from '../shaders/2d/burning_ship.frag?raw';
import newtonFrag from '../shaders/2d/newton.frag?raw';
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
}

export const fractals: FractalConfig[] = [
    // 2D Fractals
    {
        id: 'mandelbrot',
        name: 'Mandelbrot Set',
        type: '2d',
        fragmentShader: mandelbrotFrag,
        defaultParams: {
            zoom: 1.0,
            center: [-0.5, 0.0],
            iterations: 100,
        },
        description: "The classic set of complex numbers c for which z = z^2 + c does not diverge.",
    },
    {
        id: 'julia',
        name: 'Julia Set',
        type: '2d',
        fragmentShader: juliaFrag,
        defaultParams: {
            zoom: 0.8,
            center: [0.0, 0.0],
            iterations: 100,
            juliaC: [-0.4, 0.6],
        },
        description: "A fractal defined by a fixed constant c in z = z^2 + c.",
    },
    {
        id: 'burning_ship',
        name: 'Burning Ship',
        type: '2d',
        fragmentShader: burningShipFrag,
        defaultParams: {
            zoom: 0.5,
            center: [-0.5, -0.5],
            iterations: 100,
        },
        description: "A variation of the Mandelbrot set using absolute values: z = (|Re(z)| + i|Im(z)|)^2 + c.",
    },
    {
        id: 'newton',
        name: 'Newton Fractal',
        type: '2d',
        fragmentShader: newtonFrag,
        defaultParams: {
            zoom: 1.0,
            center: [0.0, 0.0],
            iterations: 50,
        },
        description: "Derived from Newton's method for finding roots of the polynomial z^3 - 1.",
    },

    // 3D Fractals
    {
        id: 'mandelbulb',
        name: 'Mandelbulb',
        type: '3d',
        fragmentShader: mandelbulbFrag,
        defaultParams: {
            zoom: 1.0,
            center: [0.0, 0.0],
            iterations: 100,
            cameraPos: [0.0, 0.0, 3.0],
            power: 8.0,
        },
        description: "A 3D Mandelbrot analogue using spherical coordinates and powers greater than 2.",
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
            cameraPos: [2.0, 2.0, 2.0],
        },
        description: "A fractal curve in three dimensions. Starts with a cube and recursively removes sub-cubes.",
    },
];
