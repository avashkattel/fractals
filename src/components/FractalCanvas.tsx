import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import { useFractalStore } from '../store/fractalStore';
import { Recorder } from './Recorder';
import { generatePaletteTexture } from '../config/palettes';
import * as THREE from 'three';
import basicVert from '../shaders/2d/basic.vert?raw';
import fullscreenVert from '../shaders/fullscreen.vert?raw';
import { useGesture } from '@use-gesture/react';

const Fractal2DMesh = () => {
    const { currentFractal, paletteId, colorCycle, customStops } = useFractalStore();
    const materialRef = useRef<THREE.ShaderMaterial>(null);
    const { viewport, gl, size } = useThree();

    // -------------------------------------------------------------------------
    // PHYSICS STATE
    // -------------------------------------------------------------------------
    // We keep visual state separate from Store to allow tight-loop physics/animation
    // without triggering React re-renders on every frame.
    const physics = useRef({
        zoom: 1.0,
        centerX: 0.0,
        centerY: 0.0,

        targetZoom: 1.0,
        targetX: 0.0,
        targetY: 0.0,

        isFlying: false, // True when auto-piloting to a clicked point
        isZoomingOut: false,

        // Momentum / Velocity (Simple friction model)
        velX: 0,
        velY: 0,

        lastStoreUpdate: 0,

        // Stepped Detail Logic
        latchedIter: 100,
        lastIterTime: 0,

        // Animation State
        animDirections: {} as Record<string, number>,
        animatedValues: {} as Record<string, number>,
    });

    // Initialize from Store once
    useEffect(() => {
        const store = useFractalStore.getState();
        physics.current.zoom = store.params.zoom || 1.0;
        physics.current.centerX = store.params.center?.[0] || 0;
        physics.current.centerY = store.params.center?.[1] || 0;

        physics.current.targetZoom = physics.current.zoom;
        physics.current.targetX = physics.current.centerX;
        physics.current.targetY = physics.current.centerY;
    }, []);

    // -------------------------------------------------------------------------
    // TEXTURE & UNIFORMS
    // -------------------------------------------------------------------------
    const paletteTexture = useMemo(() => {
        const data = generatePaletteTexture(paletteId, customStops);
        const texture = new THREE.DataTexture(data, 1024, 1, THREE.RGBAFormat);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
        return texture;
    }, [paletteId, customStops]);

    useEffect(() => {
        if (materialRef.current) materialRef.current.uniforms.u_palette.value = paletteTexture;
    }, [paletteTexture]);

    const uniforms = useMemo(() => ({
        u_resolution: { value: new THREE.Vector2(0, 0) },
        u_zoomCenterHigh: { value: new THREE.Vector2(0, 0) },
        u_zoomCenterLow: { value: new THREE.Vector2(0, 0) },
        u_zoomCenter: { value: new THREE.Vector2(0, 0) }, // Legacy/Fallback
        u_zoom: { value: 1.0 },
        u_maxIterations: { value: 100 },
        u_smoothIterations: { value: 100.0 },
        u_time: { value: 0 },
        u_juliaC: { value: new THREE.Vector2(0, 0) },
        u_palette: { value: paletteTexture },
        u_colorCycle: { value: 0 },
    }), []);

    // -------------------------------------------------------------------------
    // INTERACTION HANDLERS (useGesture)
    // -------------------------------------------------------------------------
    useGesture({
        // @ts-ignore
        onDrag: ({ delta: [dx, dy], event, tapping }) => {
            if (tapping) return; // Ignore taps (clicks)
            if (physics.current.isFlying) physics.current.isFlying = false;
            event.stopPropagation();

            const p = physics.current;
            const aspect = size.width / size.height;
            const scaleX = (dx / size.width) * aspect;
            const scaleY = -(dy / size.height);

            // 1:1 Direct movement for tight control
            p.centerX -= scaleX / p.zoom;
            p.centerY -= scaleY / p.zoom;

            // Sync Targets immediately so we don't snap back
            p.targetX = p.centerX;
            p.targetY = p.centerY;
        },

        onWheel: ({ delta: [_, dy], event }) => {
            if (physics.current.isFlying) physics.current.isFlying = false;
            event.stopPropagation();
            const p = physics.current;

            // Smoother Wheel
            const factor = 1.0 - (dy * 0.001);

            const rect = (gl.domElement).getBoundingClientRect();
            // @ts-ignore
            const clientX = event.clientX;
            // @ts-ignore
            const clientY = event.clientY;

            const mx = (clientX - rect.left) / rect.width;
            const my = 1.0 - ((clientY - rect.top) / rect.height);
            const aspect = size.width / size.height;

            const uvX = (mx - 0.5) * aspect;
            const uvY = (my - 0.5);

            const nextZoom = p.zoom * factor;

            p.centerX += (uvX / p.zoom) - (uvX / nextZoom);
            p.centerY += (uvY / p.zoom) - (uvY / nextZoom);
            p.zoom = nextZoom;

            p.targetZoom = nextZoom;
            p.targetX = p.centerX;
            p.targetY = p.centerY;
        },

        onClick: ({ event }) => {
            // Start Natural Flight
            const p = physics.current;
            const rect = gl.domElement.getBoundingClientRect();
            const mx = (event.clientX - rect.left) / rect.width;
            const my = 1.0 - ((event.clientY - rect.top) / rect.height);
            const aspect = size.width / size.height;
            const uvX = (mx - 0.5) * aspect;
            const uvY = (my - 0.5);

            const flyToX = p.centerX + uvX / p.zoom;
            const flyToY = p.centerY + uvY / p.zoom;

            p.targetX = flyToX;
            p.targetY = flyToY;
            p.isFlying = true;
        }
    }, {
        target: gl.domElement,
        eventOptions: { passive: false },
        drag: { filterTaps: true, threshold: 10 }
    });

    // -------------------------------------------------------------------------
    // ANIMATION LOOP
    // -------------------------------------------------------------------------
    useFrame((state, delta) => {
        if (!materialRef.current) return;
        const p = physics.current;
        const store = useFractalStore.getState();

        if (p.isFlying) {
            // Cinematic Ease-In-Out Flight
            // We clamp 'dt' to avoid jumping on lags
            const dt = Math.min(delta, 0.1);

            // 1. Pan towards Target (Spring-like but overdamped for smoothness)
            const distX = p.targetX - p.centerX;
            const distY = p.targetY - p.centerY;

            // Speed logic: Slower when far? Faster when close? 
            // "Start slow" -> Ease In.
            // Simple approach: Constant Factor Lerp is "Ease Out" (fast then slow).
            // To do "Start Slow", we need Velocity state.
            // Let's settle for a LOWER lerp factor for "Cinematic Slow" feel.
            const panFactor = 2.0 * dt;
            p.centerX += distX * panFactor;
            p.centerY += distY * panFactor;

            // 2. Continuous Zoom
            // Smooth constant-rate zoom
            // "Keep zooming"
            const zoomSpeed = 0.5; // 50% per second
            p.zoom *= (1.0 + zoomSpeed * dt);

        } else if (p.isZoomingOut) {
            // Reverse Fly/Zoom logic to return to default
            // For now, just zoom out towards center 0,0
            const dt = Math.min(delta, 0.1);
            const zoomSpeed = 0.5;

            // Target is default
            const reqZoom = store.params.zoom || 1.0;
            if (p.zoom > reqZoom) { // Only zoom out if zoomed in
                p.zoom /= (1.0 + zoomSpeed * dt);
                // also drift center back to 0,0
                p.centerX = THREE.MathUtils.lerp(p.centerX, 0.0, dt);
                p.centerY = THREE.MathUtils.lerp(p.centerY, 0.0, dt);

                if (p.zoom <= reqZoom + 0.01) {
                    p.zoom = reqZoom;
                    p.isZoomingOut = false;
                }
            } else {
                p.isZoomingOut = false;
            }
        } else {
            // Normal Damping
        }
        // Force Reset if store resetCount incremented
        // We use a ref to track the last seen reset count
        // Can't use hook in loop, so we check store state
        if ((physics.current as any).lastResetCount !== store.resetCount) {
            (physics.current as any).lastResetCount = store.resetCount;
            const def = store.params;
            // Snap Physics
            p.zoom = def.zoom || 1.0;
            p.centerX = def.center ? def.center[0] : 0.0;
            p.centerY = def.center ? def.center[1] : 0.0;
            p.targetZoom = p.zoom;
            p.targetX = p.centerX;
            p.targetY = p.centerY;
            p.latchedIter = 100;

            // Reset Animated Values & custom params
            physics.current.animatedValues = {};
            Object.keys(def).forEach(k => {
                if (k !== 'zoom' && k !== 'center' && k !== 'iterations') {
                    // Check if it's a number we track
                    if (typeof def[k] === 'number') {
                        physics.current.animatedValues[k] = def[k];
                        // Also force uniform update immediately?
                        const uName = `u_${k}`;
                        if (materialRef.current && materialRef.current.uniforms[uName]) {
                            materialRef.current.uniforms[uName].value = def[k];
                        }
                    }
                }
            });
        }

        // SYNC TO UNIFORMS
        materialRef.current.uniforms.u_time.value = state.clock.elapsedTime;
        materialRef.current.uniforms.u_resolution.value.set(size.width, size.height);
        materialRef.current.uniforms.u_colorCycle.value = colorCycle ? state.clock.elapsedTime : 0;

        materialRef.current.uniforms.u_zoom.value = p.zoom;

        // Double Precision Center Splitting
        const cxh = Math.fround(p.centerX);
        const cxl = p.centerX - cxh;
        const cyh = Math.fround(p.centerY);
        const cyl = p.centerY - cyh;

        materialRef.current.uniforms.u_zoomCenterHigh.value.set(cxh, cyh);
        materialRef.current.uniforms.u_zoomCenterLow.value.set(cxl, cyl);
        materialRef.current.uniforms.u_zoomCenter.value.set(p.centerX, p.centerY);

        // Iteration & Fog (Stepped to reduce GPU Load)
        // We only update if change is significant or time passes
        const frameNow = Date.now();
        // @ts-ignore
        const lastIterTime = (physics.current as any).lastIterTime || 0;
        // @ts-ignore
        const latchedIter = (physics.current as any).latchedIter || 100;

        const logZoom = Math.log10(p.zoom || 1.0);
        let idealIter = store.params.iterations || 100;

        if (store.autoIterations) {
            idealIter = Math.max(idealIter, 200 + 100 * logZoom);
        }

        let targetIter = idealIter;

        if (store.autoIterations) {
            // Stepped Logic
            const timeDiff = frameNow - lastIterTime;
            const diff = Math.abs(idealIter - latchedIter);

            if (timeDiff > 500 || diff > 50) {
                // Update Latch
                (physics.current as any).latchedIter = idealIter;
                (physics.current as any).lastIterTime = frameNow;
                targetIter = idealIter;
            } else {
                targetIter = latchedIter; // Hold
            }
        }

        // Smooth Lerp to Target (Visuals)
        const currentSmooth = materialRef.current.uniforms.u_smoothIterations ? materialRef.current.uniforms.u_smoothIterations.value : idealIter;
        // Slower lerp for stepped target to mask the jump
        const nextSmooth = THREE.MathUtils.lerp(currentSmooth, targetIter, 0.05);

        materialRef.current.uniforms.u_maxIterations.value = Math.floor(nextSmooth) + 5; // Safety buffer
        if (materialRef.current.uniforms.u_smoothIterations) {
            materialRef.current.uniforms.u_smoothIterations.value = nextSmooth;
        }

        if (store.params.juliaC && materialRef.current.uniforms.u_juliaC) {
            materialRef.current.uniforms.u_juliaC.value.set(store.params.juliaC[0], store.params.juliaC[1]);
        }

        // ANIMATION LOOP
        const animatingParams = store.animatingParams || {};
        const paramConfig = currentFractal.paramConfig || {};

        Object.keys(animatingParams).forEach(key => {
            if (!animatingParams[key]) return;
            const conf = paramConfig[key];
            if (!conf) return;

            // Initialize logic
            let val = physics.current.animatedValues[key] ?? store.params[key] ?? conf.min;
            let dir = physics.current.animDirections[key] ?? 1;

            // Speed: Fixed step per frame for consistency
            // User requested "Increase very slowly"
            // Previous was (step || 0.01) * 0.5 = 0.005 per frame (approx 0.3 per sec at 60fps)
            // Let's make it 10x slower for "Very Slow"
            const step = (conf.step || 0.001) * 0.05; // Extremely slow creeping


            val += step * dir;

            // Ping Pong
            if (val >= conf.max) {
                val = conf.max;
                dir = -1;
            } else if (val <= conf.min) {
                val = conf.min;
                dir = 1;
            }

            physics.current.animatedValues[key] = val;
            physics.current.animDirections[key] = dir;

            // Update Uniform
            const uName = `u_${key}`;
            if (materialRef.current && materialRef.current.uniforms[uName]) {
                materialRef.current.uniforms[uName].value = val;
            }
        });

        // SYNC TO STORE (Throttled)
        if (frameNow - p.lastStoreUpdate > 100) { // 10fps for smoother sliders
            store.updateParams({
                zoom: p.zoom,
                center: [p.centerX, p.centerY],
                ...physics.current.animatedValues // Sync animated values back to UI
            });
            p.lastStoreUpdate = frameNow;
        }
    });

    return (
        <mesh scale={[viewport.width, viewport.height, 1]}>
            <planeGeometry args={[1, 1]} />
            <shaderMaterial
                ref={materialRef}
                vertexShader={basicVert}
                fragmentShader={currentFractal.fragmentShader}
                uniforms={uniforms}
                depthWrite={false}
                depthTest={false}
            />
        </mesh>
    );
};

const Fractal3DContent = () => {
    // 3D might not support palette texture easily without shader update. 
    // User focus is deep zoom (2D). Skipping palette for 3D for now or just passing it safely.
    const { params, currentFractal } = useFractalStore();
    const materialRef = useRef<THREE.ShaderMaterial>(null);
    const { camera } = useThree();

    // 1. Generate Palette Texture FIRST
    const { paletteId, customStops, colorCycle } = useFractalStore();
    const paletteTexture = useMemo(() => {
        const data = generatePaletteTexture(paletteId, customStops);
        const texture = new THREE.DataTexture(data, 1024, 1, THREE.RGBAFormat);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
        return texture;
    }, [paletteId, customStops]);

    // 2. Initialize Uniforms with the Texture
    const uniforms = useMemo(() => ({
        u_resolution: { value: new THREE.Vector2(1, 1) }, // Prevent divide by zero (NaN) on first frame
        u_time: { value: 0 },
        u_cameraPos: { value: new THREE.Vector3(0, 0, 3) },
        u_cameraDir: { value: new THREE.Vector3(0, 0, -1) },
        u_power: { value: params.power || 8.0 },
        u_maxIterations: { value: params.iterations || 100 },
        u_palette: { value: paletteTexture }, // Set immediately!
        u_colorCycle: { value: 0 },
    }), [paletteTexture]); // Re-create if texture changes (or use effect to update value)

    // Effect to update palette texture ref (still good to keep for hot updates)
    useEffect(() => {
        if (materialRef.current) {
            materialRef.current.uniforms.u_palette.value = paletteTexture;
        }
    }, [paletteTexture]);

    useFrame((state) => {
        if (!materialRef.current) return;
        materialRef.current.uniforms.u_time.value = state.clock.elapsedTime;
        materialRef.current.uniforms.u_resolution.value.set(state.size.width, state.size.height);

        // Sync Shader Camera to R3F Camera (OrbitControls)
        materialRef.current.uniforms.u_cameraPos.value.copy(camera.position);

        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        materialRef.current.uniforms.u_cameraDir.value.copy(dir);

        materialRef.current.uniforms.u_power.value = params.power || 8.0;
        materialRef.current.uniforms.u_maxIterations.value = params.iterations || 100;
        materialRef.current.uniforms.u_colorCycle.value = colorCycle ? state.clock.elapsedTime : 0;
    });

    return (
        <group>
            <mesh frustumCulled={false}>
                <planeGeometry args={[1, 1]} />
                <shaderMaterial
                    ref={materialRef}
                    vertexShader={fullscreenVert}
                    fragmentShader={currentFractal.fragmentShader}
                    uniforms={uniforms}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                    depthTest={false}
                />
            </mesh>
        </group>
    )
}

export const FractalCanvas = () => {
    const { currentFractal } = useFractalStore();

    return (
        <div className="w-full h-full bg-black">
            {/* Limit 3D DPR to 1 for performance, 2D gets crisp 2x */}
            <Canvas dpr={currentFractal.type === '3d' ? 1 : [1, 2]}>
                <Recorder />
                {currentFractal.type === '3d' ? (
                    <>
                        <PerspectiveCamera makeDefault position={[0, 0, 4]} />
                        <OrbitControls
                            enableZoom={true}
                            enablePan={false}
                            enableRotate={true}
                            enableDamping={true} // Smooth rotation
                            dampingFactor={0.05}
                        />
                        <Fractal3DContent key={currentFractal.id} />
                    </>
                ) : (
                    <>
                        <OrthographicCamera makeDefault position={[0, 0, 1]} zoom={1} />
                        <Fractal2DMesh key={currentFractal.id} />
                    </>
                )}
            </Canvas>
        </div>
    );
};
