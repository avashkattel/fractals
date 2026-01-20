
import { useRef, useEffect } from 'react';
import { TransformControls, Html } from '@react-three/drei';
import { useFractalStore } from '../store/fractalStore';
import * as THREE from 'three';

const LightHandler = ({ index, position, onUpdate }: { index: number, position: [number, number, number], onUpdate: (pos: [number, number, number]) => void }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const controlsRef = useRef<any>(null);

    // Sync mesh position with store when store updates externally (or init)
    useEffect(() => {
        if (meshRef.current) {
            meshRef.current.position.set(...position);
        }
    }, [position]);

    return (
        <>
            <TransformControls
                ref={controlsRef}
                object={meshRef as unknown as React.MutableRefObject<THREE.Object3D>}
                mode="translate"
                onObjectChange={() => {
                    if (meshRef.current) {
                        const p = meshRef.current.position;
                        onUpdate([p.x, p.y, p.z]);
                    }
                }}
            />
            <mesh ref={meshRef} position={position}>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshBasicMaterial color="white" wireframe />
                <Html position={[0, 0.4, 0]}>
                    <div className="text-xs bg-black/50 text-white px-1 rounded pointer-events-none whitespace-nowrap">
                        Light {index + 1}
                    </div>
                </Html>
            </mesh>
        </>
    );
};

export const LightRig = () => {
    const { showLights, lightPositions, updateLightPosition } = useFractalStore();

    if (!showLights) return null;

    return (
        <group>
            {lightPositions.map((pos, idx) => (
                <LightHandler
                    key={idx}
                    index={idx}
                    position={pos}
                    onUpdate={(newPos) => updateLightPosition(idx, newPos)}
                />
            ))}
        </group>
    );
};
