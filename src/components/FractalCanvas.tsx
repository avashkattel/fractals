import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useFractalStore } from '../store/fractalStore';
import { Recorder } from './Recorder';
import * as THREE from 'three';
import basicVert from '../shaders/2d/basic.vert?raw';

const FractalMesh = () => {
    const { currentFractal, params, updateParams } = useFractalStore();
    const materialRef = useRef<THREE.ShaderMaterial>(null);
    const { camera } = useThree();

    // Initial uniforms
    const uniforms = useMemo(() => ({
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        u_zoomCenter: { value: new THREE.Vector2(params.center?.[0] || 0, params.center?.[1] || 0) },
        u_zoom: { value: params.zoom || 1 },
        u_maxIterations: { value: params.iterations || 100 },
        u_time: { value: 0 },
        u_juliaC: { value: new THREE.Vector2(params.juliaC?.[0] || 0, params.juliaC?.[1] || 0) },
        u_cameraPos: { value: new THREE.Vector3(0, 0, 3) },
        u_cameraDir: { value: new THREE.Vector3(0, 0, -1) },
        u_power: { value: params.power || 8.0 },
    }), []);

    // Update uniforms when params change
    useEffect(() => {
        if (materialRef.current) {
            materialRef.current.uniforms.u_zoom.value = params.zoom || 1;
            if (params.center) materialRef.current.uniforms.u_zoomCenter.value.set(params.center[0], params.center[1]);
            materialRef.current.uniforms.u_maxIterations.value = params.iterations || 100;
            if (params.juliaC) materialRef.current.uniforms.u_juliaC.value.set(params.juliaC[0], params.juliaC[1]);
            if (params.power) materialRef.current.uniforms.u_power.value = params.power;
        }
    }, [params]);

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            if (materialRef.current) {
                materialRef.current.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.u_time.value = state.clock.elapsedTime;

            if (currentFractal.type === '3d') {
                materialRef.current.uniforms.u_cameraPos.value.copy(camera.position);
                const dir = new THREE.Vector3();
                camera.getWorldDirection(dir);
                materialRef.current.uniforms.u_cameraDir.value.copy(dir);
            }
        }
    });

    // 2D Interaction Handlers
    useEffect(() => {
        if (currentFractal.type === '3d') return;

        const canvas = document.querySelector('canvas');
        if (!canvas) return;

        const handleWheel = (e: WheelEvent) => {
            const zoomFactor = 0.1;
            const newZoom = e.deltaY > 0 ? (params.zoom || 1) * (1 - zoomFactor) : (params.zoom || 1) * (1 + zoomFactor);
            updateParams({ zoom: newZoom });
        };

        canvas.addEventListener('wheel', handleWheel, { passive: true });
        return () => {
            canvas.removeEventListener('wheel', handleWheel);
        }
    }, [currentFractal.type, params.zoom, updateParams]);

    return (
        <mesh>
            <planeGeometry args={[2, 2]} />
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

export const FractalCanvas = () => {
    const { currentFractal } = useFractalStore();

    return (
        <div className="w-full h-full bg-black">
            <Canvas camera={{ position: [0, 0, 3] }}>
                <FractalMesh />
                <Recorder />
                {currentFractal.type === '3d' && <OrbitControls enableZoom={true} enablePan={false} enableRotate={true} />}
            </Canvas>
        </div>
    );
};
