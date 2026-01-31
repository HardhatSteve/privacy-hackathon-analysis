"use client";

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
    OrbitControls,
    PerspectiveCamera,
    Environment,
    ContactShadows,
    Float,
    Text,
    AdaptiveDpr,
    Preload
} from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { EventBus, ForensicEvent } from '../../../sdk/events/bus';

// --- 1. GPU Powered Core (Cinematic Shader) ---

function Core({ active }: { active: boolean }) {
    const mesh = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    // Stable uniforms to avoid re-creations
    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#00f0ff') },
        uActiveColor: { value: new THREE.Color('#ff6b00') },
        uIsActive: { value: 0.0 }
    }), []);

    const targetColor = useMemo(() => new THREE.Color(active ? '#ff6b00' : '#00f0ff'), [active]);

    useFrame(({ clock }) => {
        if (!materialRef.current) return;
        materialRef.current.uniforms.uTime.value = clock.elapsedTime;

        // Smooth transition between states
        materialRef.current.uniforms.uIsActive.value = THREE.MathUtils.lerp(
            materialRef.current.uniforms.uIsActive.value,
            active ? 1.0 : 0.0,
            0.05
        );

        materialRef.current.uniforms.uColor.value.lerp(targetColor, 0.05);

        if (mesh.current) {
            mesh.current.rotation.y += 0.005;
            mesh.current.rotation.z += 0.002;
        }
    });

    return (
        <group>
            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
                <mesh ref={mesh}>
                    <icosahedronGeometry args={[1.6, 64]} />
                    <shaderMaterial
                        ref={materialRef}
                        transparent
                        uniforms={uniforms}
                        vertexShader={`
                        varying vec3 vNormal;
                        varying vec3 vPosition;
                        uniform float uTime;

                        void main() {
                            vNormal = normal;
                            vPosition = position;
                            // GPU-driven deformation
                            float distortion = sin(uTime * 1.5 + position.y * 3.0) * 0.12;
                            vec3 pos = position + normal * distortion;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                        }
                    `}
                        fragmentShader={`
                        varying vec3 vNormal;
                        varying vec3 vPosition;
                        uniform vec3 uColor;
                        uniform float uTime;
                        uniform float uIsActive;

                        void main() {
                            // Cinematic Fresnel Glow
                            float fresnel = pow(1.0 - dot(vNormal, vec3(0, 0, 1)), 3.0);
                            
                            // Tactical Scanlines
                            float scanline = sin(vPosition.y * 15.0 - uTime * 3.0) * 0.05 + 0.95;
                            
                            // Pulse logic
                            float pulse = sin(uTime * 4.0) * 0.1 * uIsActive;
                            
                            vec3 finalColor = uColor * scanline + (fresnel * 0.4);
                            gl_FragColor = vec4(finalColor + pulse, 0.85);
                        }
                    `}
                    />
                </mesh>

                <Text
                    position={[0, 2.6, 0]}
                    fontSize={0.18}
                    color={active ? "#ff6b00" : "#00f0ff"}
                    maxWidth={2}
                    textAlign="center"
                >
                    {active ? "AUTHENTICATING_COMMITMENT" : "ROOT_STATE_OBSERVER"}
                </Text>
            </Float>
        </group>
    );
}

// --- 2. Instanced Node Matrix (High-Performance Tree) ---

function NodeMatrix({ activePath }: { activePath: Array<{ level: number, index: number }> | null }) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const baseColor = useMemo(() => new THREE.Color('#000000'), []);
    const glowColor = useMemo(() => new THREE.Color('#00f0ff'), []);
    const activeColor = useMemo(() => new THREE.Color('#ff6b00'), []);

    // Pre-calculate tree positions
    const nodes = useMemo(() => {
        const list = [];
        for (let l = 1; l <= 4; l++) {
            const count = Math.pow(2, l);
            const radius = l * 3.5;
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                list.push({
                    idx: list.length,
                    level: l,
                    id: i,
                    pos: new THREE.Vector3(
                        Math.cos(angle) * radius,
                        -l * 2.5,
                        Math.sin(angle) * radius
                    )
                });
            }
        }
        return list;
    }, []);

    useFrame((state) => {
        if (!meshRef.current) return;

        nodes.forEach((node, i) => {
            const isActive = activePath?.some(p => p.level === node.level && p.index === node.id);

            dummy.position.copy(node.pos);

            // Subtle levitation
            dummy.position.y += Math.sin(state.clock.elapsedTime + i) * 0.05;

            const scale = isActive ? 0.2 + Math.sin(state.clock.elapsedTime * 10) * 0.05 : 0.08;
            dummy.scale.setScalar(scale);

            dummy.updateMatrix();
            meshRef.current?.setMatrixAt(i, dummy.matrix);
            meshRef.current?.setColorAt(i, isActive ? activeColor : glowColor);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, nodes.length]}>
            <icosahedronGeometry args={[1, 2]} />
            <meshStandardMaterial
                emissiveIntensity={2.5}
                toneMapped={false}
                metalness={1}
                roughness={0}
            />
        </instancedMesh>
    );
}

// --- 3. Scene Orchestration ---

export const MerkleTree3D = () => {
    const [mounted, setMounted] = useState(false);
    const [activeDeposit, setActiveDeposit] = useState<{
        commitment: string;
        path: Array<{ level: number; index: number }>;
    } | null>(null);

    useEffect(() => {
        setMounted(true);
        const handleEvent = (event: ForensicEvent) => {
            if (event.type === 'COMMITMENT_CREATED') {
                const hex = event.hex || (event.data?.commitment as string) || '00';
                const path = [];
                for (let i = 1; i <= 4; i++) {
                    const levelNodes = Math.pow(2, i);
                    const index = parseInt(hex.slice(i * 2, i * 2 + 2), 16) % levelNodes;
                    path.push({ level: i, index });
                }
                setActiveDeposit({ commitment: hex, path });
                setTimeout(() => setActiveDeposit(null), 10000);
            }
        };
        const unsubscribe = EventBus.onAll(handleEvent);
        return () => unsubscribe();
    }, []);

    if (!mounted) return <div className="w-full h-full bg-black/40 rounded-3xl" />;

    return (
        <div className="w-full h-full relative group">
            <Canvas shadows={false} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
                <AdaptiveDpr pixelated />
                <PerspectiveCamera makeDefault position={[18, 14, 22]} fov={30} />
                <OrbitControls
                    enableDamping
                    autoRotate={!activeDeposit}
                    autoRotateSpeed={0.4}
                    maxPolarAngle={Math.PI / 1.8}
                    minPolarAngle={Math.PI / 6}
                    enableZoom={false}
                />

                <color attach="background" args={['#010305']} />
                <fog attach="fog" args={['#010305', 20, 50]} />

                <ambientLight intensity={0.3} />
                <spotLight position={[10, 20, 10]} intensity={1.5} angle={0.3} penumbra={1} color="#00f0ff" />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff00ff" />

                <group position={[0, 4, 0]}>
                    <Core active={!!activeDeposit} />
                    <NodeMatrix activePath={activeDeposit?.path || null} />
                </group>

                <Environment preset="night" />
                <ContactShadows position={[0, -10, 0]} opacity={0.3} scale={50} blur={2.5} far={20} />
                <Preload all />
            </Canvas>

            {/* Tactical Overlay */}
            <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between select-none">
                <div className="flex justify-between items-start">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-1"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-3 bg-tactical-cyan" />
                            <h2 className="text-[10px] font-bold text-white tracking-[0.5em] uppercase font-mono">
                                Nexus_Core_V2
                            </h2>
                        </div>
                        <p className="text-[8px] text-white/20 font-mono">ZKP_CIRCUIT_DENSE // MAINNET_SYNC</p>
                    </motion.div>

                    <div className="text-right font-mono text-[8px] text-white/10 uppercase tracking-[0.2em] leading-relaxed">
                        TELEMETRY_STATUS: <span className="text-tactical-green">SYNC</span><br />
                        RECURSIVE_PROVING: <span className="text-tactical-cyan">ON</span>
                    </div>
                </div>

                <AnimatePresence>
                    {activeDeposit && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-black/80 backdrop-blur-2xl border-r-2 border-tactical-orange p-6 max-w-sm mr-auto rounded-xl"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-2 h-2 rounded-full bg-tactical-orange shadow-[0_0_10px_#ff6b00]" />
                                <span className="text-[11px] font-bold text-tactical-orange uppercase tracking-widest">Commitment_Detected</span>
                            </div>
                            <div className="font-mono space-y-3">
                                <div className="text-[10px] text-white/60 break-all leading-tight bg-white/[0.03] p-2 rounded">
                                    {activeDeposit.commitment}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {activeDeposit.path.map((p, i) => (
                                        <div key={i} className="px-2 py-0.5 border border-white/5 rounded text-[8px] text-white/40">
                                            L{p.level}:N{p.index}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex justify-between items-end">
                    <div className="px-4 py-2 border border-white/5 bg-black/40 rounded-lg">
                        <span className="text-[8px] font-mono text-white/20 tracking-widest uppercase flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-tactical-green animate-pulse" />
                            State_Persistence: <span className="text-white/60">Verified</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
