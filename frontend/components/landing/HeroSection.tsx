import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { TorusKnot, Environment, Float, Sparkles } from '@react-three/drei';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type * as THREE from 'three';

function Scene() {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.2;
            meshRef.current.rotation.x += delta * 0.1;
        }
    });

    return (
        <>
            <Environment preset="city" />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <Float speed={2} rotationIntensity={1} floatIntensity={2}>
                <TorusKnot ref={meshRef} args={[1.5, 0.4, 128, 32]} scale={1.2}>
                    <meshStandardMaterial
                        color="#4f46e5"
                        roughness={0.1}
                        metalness={0.8}
                        envMapIntensity={2}
                    />
                </TorusKnot>
            </Float>
            <Sparkles count={50} scale={10} size={4} speed={0.4} opacity={0.5} />
        </>
    );
}

export function HeroSection() {
    return (
        <div className="relative isolate overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mx-auto max-w-2xl flex-shrink-0 lg:mx-0 lg:max-w-xl lg:pt-8"
                >
                    <div className="mt-24 sm:mt-32 lg:mt-16">
                        <a href="#" className="inline-flex space-x-6">
                            <span className="rounded-full bg-blue-600/10 px-3 py-1 text-sm font-semibold leading-6 text-blue-600 ring-1 ring-inset ring-blue-600/20">
                                What&apos;s new
                            </span>
                            <span className="inline-flex items-center space-x-2 text-sm font-medium leading-6 text-gray-600">
                                <span>Just shipped v1.0</span>
                            </span>
                        </a>
                    </div>
                    <h1 className="mt-10 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                        Where breakthrough <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">ideas</span> happen
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-gray-600">
                        BrainBoard is the infinite canvas for your team&apos;s best work. Collaborate visually, connect concepts, and organize projects in a beautiful spatial workspace.
                    </p>
                    <div className="mt-10 flex items-center gap-x-6">
                        <Link
                            href="/register"
                            className="group rounded-full bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all flex items-center"
                        >
                            Start for free
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link href="/login" className="text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600 transition-colors">
                            Log in <span aria-hidden="true">→</span>
                        </Link>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mt-0 lg:mr-0 lg:max-w-none lg:flex-none xl:ml-32 w-full lg:w-[600px] h-[500px]"
                >
                    <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
                        <Scene />
                    </Canvas>
                </motion.div>
            </div>
        </div>
    );
}
