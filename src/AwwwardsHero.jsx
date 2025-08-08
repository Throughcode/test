import React, { Suspense, useRef } from "react";
import { Canvas, useFrame, extend } from "@react-three/fiber";
import { shaderMaterial, Sparkles, OrbitControls, Environment } from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration } from "@react-three/postprocessing";
import * as THREE from "three";

// Vertex shader for the custom terrain material
const vertexShader = `
uniform float uTime;
uniform float uDistort;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 pos = position;
  // Simple animated noise based on sine and cosine functions
  float noise = sin(pos.x * 3.0 + uTime) * 0.3 + cos(pos.y * 3.0 + uTime) * 0.3;
  pos.z += noise * uDistort;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

// Fragment shader for the custom terrain material
const fragmentShader = `
uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
varying vec2 vUv;
void main() {
  // Create a vertical gradient that subtly animates over time
  float mixFactor = vUv.y + 0.5 * sin(uTime + vUv.x * 4.0);
  vec3 color = mix(uColorA, uColorB, mixFactor);
  gl_FragColor = vec4(color, 1.0);
}
`;

// Define a custom shader material using Drei's shaderMaterial helper
const GlassTerrainMaterial = shaderMaterial(
  {
    uTime: 0,
    uDistort: 1.0,
    uColorA: new THREE.Color(0x00ffff), // cyan by default
    uColorB: new THREE.Color(0xff00ff), // magenta by default
  },
  vertexShader,
  fragmentShader
);

// Register the custom material so it can be used as a JSX element
extend({ GlassTerrainMaterial });

function Terrain(props) {
  const materialRef = useRef();
  // Update the time uniform every frame for animation
  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uTime = clock.getElapsedTime();
    }
  });
  return (
    <mesh {...props} rotation={[-Math.PI / 2, 0, 0]}>
      {/* A finely subdivided plane to allow displacement */}
      <planeGeometry args={[10, 10, 200, 200]} />
      {/* Use the custom material. Set a higher distortion for more movement */}
      <glassTerrainMaterial ref={materialRef} uDistort={1.5} />
    </mesh>
  );
}

function RefractiveOrb() {
  return (
    <mesh position={[0, 1.5, 0]}>
      <sphereGeometry args={[1, 64, 64]} />
      {/* A physical material with high transmission to simulate a glass orb */}
      <meshPhysicalMaterial
        transmission={1}
        thickness={1}
        roughness={0}
        metalness={0}
        clearcoat={1}
        clearcoatRoughness={0.1}
        reflectivity={1}
        ior={1.5}
      />
    </mesh>
  );
}

export default function AwwwardsHero() {
  return (
    <div className="h-[100dvh] w-full overflow-hidden">
      <Canvas camera={{ position: [0, 2, 5], fov: 60 }}>
        {/* Basic lighting for the scene */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        {/* Use an environment preset for soft lighting */}
        <Environment preset="sunset" />
        <Suspense fallback={null}>
          {/* The animated terrain and refractive orb */}
          <Terrain />
          <RefractiveOrb />
          {/* Sparkles provide a subtle magical effect */}
          <Sparkles count={50} size={6} scale={[10, 10, 10]} />
        </Suspense>
        {/* Postprocessing effects for an Awwwards-worthy feel */}
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.5} />
          <ChromaticAberration offset={[0.001, 0.001]} />
        </EffectComposer>
        {/* Optional camera controls for orbiting the scene (disabled zoom) */}
        <OrbitControls enableZoom={false} />
      </Canvas>
    </div>
  );
}
