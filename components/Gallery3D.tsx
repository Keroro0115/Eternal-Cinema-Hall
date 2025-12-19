
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Float, Html, Cylinder, Box, Sphere, Torus, Cone, Capsule, Icosahedron, Octahedron, Environment, Stars, SpotLight, Text, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { MovieArt } from '../types';

interface Gallery3DProps {
  movies: MovieArt[];
  scrollPos: number; // 0 to movies.length
  isDetailsOpen: boolean;
  onItemClick: (index: number) => void;
  onRestart: () => void;
}

const ITEM_SPACING = 8;
const PATH_WIDTH = 6.5; 

// Analytic path function moved outside to be reusable
const getPathPoint = (t: number) => {
  // Sinuous winding path
  const x = Math.sin(t * 0.5) * 6;
  const y = Math.sin(t * 0.3) * 1.5; 
  const z = -t * ITEM_SPACING;
  return new THREE.Vector3(x, y, z);
};

// Frame-rate independent damping helper
const damp = (current: number, target: number, lambda: number, delta: number) => {
    return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * delta));
};

export const Gallery3D: React.FC<Gallery3DProps> = ({ movies, scrollPos, isDetailsOpen, onItemClick, onRestart }) => {
  const { camera } = useThree();
  const smoothScroll = useRef(scrollPos);
  
  // We store the smoothed look-at vector to prevent rotational jitter
  const smoothedLookAt = useRef(new THREE.Vector3(0, 0, -20));
  
  const cameraGroup = useRef<THREE.Group>(null);
  const floorRef = useRef<THREE.Mesh>(null);
  
  // Get current active color for particles
  const currentIndex = Math.round(scrollPos);
  const safeIndex = Math.min(Math.max(currentIndex, 0), movies.length - 1);
  const activeMovieColor = movies[safeIndex]?.color_palette?.[0] || '#ffffff';

  // Check if we are at the portal (end of list)
  const isPortal = currentIndex >= movies.length;

  useFrame((state, delta) => {
    // Cap delta to prevent instability on lag spikes
    const step = Math.min(delta, 0.1);

    // 1. Smoothly interpolate scroll position using Damping
    smoothScroll.current = damp(smoothScroll.current, scrollPos, 3, step);

    // 2. Camera Logic
    // Standard "Corridor" Path Calculation
    const pathT = smoothScroll.current - 1.2; 
    const corridorCamPos = getPathPoint(pathT);
    corridorCamPos.y += 1.5;

    // "Details" Target Calculation
    const activeIdx = Math.round(scrollPos);
    const isLeftMovie = activeIdx % 2 === 0;
    
    // Calculate the World Position of the active movie
    const activePathPos = getPathPoint(activeIdx);
    const activeMovieX = activePathPos.x + (isLeftMovie ? -PATH_WIDTH : PATH_WIDTH);

    // Ideally, we want the movie to appear on the opposite side of the text panel.
    const detailCamX = isLeftMovie ? (activeMovieX + 3.5) : (activeMovieX - 3.5);

    // Determine target X
    // If we are at the portal, align to center. 
    // If details are open and NOT at portal, align to detail view.
    // Otherwise, standard corridor walk.
    let targetX = corridorCamPos.x;
    if (isPortal) {
        targetX = corridorCamPos.x; // Keep center alignment for portal
    } else if (isDetailsOpen) {
        targetX = detailCamX;
    }

    // Apply Camera Position with Damping
    camera.position.x = damp(camera.position.x, targetX, 4, step);
    camera.position.y = damp(camera.position.y, corridorCamPos.y, 4, step);
    camera.position.z = damp(camera.position.z, corridorCamPos.z, 4, step);

    // 3. Camera LookAt Stabilization
    const lookT = smoothScroll.current + 3; 
    const targetLookAt = getPathPoint(lookT);
    
    // Add atmospheric sway
    targetLookAt.x += Math.sin(state.clock.elapsedTime * 0.2) * 2;
    
    // When details are open, bias the look target towards the movie to frame it better
    // Do NOT bias if we are looking at the portal
    if (isDetailsOpen && !isPortal) {
        // We gently pull the look target towards the movie horizontal center
        targetLookAt.x = THREE.MathUtils.lerp(targetLookAt.x, activeMovieX, 0.5);
    }
    
    // Damp the LookAt vector itself to remove rotational jitter
    smoothedLookAt.current.x = damp(smoothedLookAt.current.x, targetLookAt.x, 3, step);
    smoothedLookAt.current.y = damp(smoothedLookAt.current.y, targetLookAt.y, 3, step);
    smoothedLookAt.current.z = damp(smoothedLookAt.current.z, targetLookAt.z, 3, step);

    camera.lookAt(smoothedLookAt.current);

    // 4. Update Light Group to follow camera
    if (cameraGroup.current) {
        cameraGroup.current.position.copy(camera.position);
        cameraGroup.current.lookAt(smoothedLookAt.current);
    }

    // 5. INFINITE FLOOR LOGIC
    if (floorRef.current) {
        floorRef.current.position.set(camera.position.x, -4, camera.position.z);
    }
  });

  return (
    <>
      <ambientLight intensity={1.0} color="#ffffff" />
      <Environment preset="city" blur={1} background={false} /> 
      <Stars radius={150} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />

      <group ref={cameraGroup}>
        <pointLight position={[0, 2, 0]} intensity={3} distance={50} decay={2} color="#fff0dd" />
        <directionalLight position={[0, 0, -5]} intensity={0.5} color="#ffffff" />
      </group>

      <mesh 
        ref={floorRef} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -4, 0]}
        raycast={() => null}
      >
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.5} envMapIntensity={0.5} />
      </mesh>
      
      <FollowCameraGrid />
      
      {/* Extend corridor structure to accommodate portal */}
      <CorridorStructure length={movies.length + 8} />
      
      <AtmosphereParticles targetColor={activeMovieColor} />

      {movies.map((movie, index) => {
        const centerPos = getPathPoint(index);
        const isLeft = index % 2 === 0;
        const xOffset = isLeft ? -PATH_WIDTH : PATH_WIDTH;
        
        const nextPos = getPathPoint(index + 0.5);
        const dummyObj = new THREE.Object3D();
        dummyObj.position.copy(centerPos);
        dummyObj.lookAt(nextPos);
        dummyObj.rotation.y += isLeft ? Math.PI / 4 : -Math.PI / 4;
        
        const rot: [number, number, number] = [dummyObj.rotation.x, dummyObj.rotation.y, dummyObj.rotation.z];
        const moviePos = centerPos.clone();
        moviePos.x += xOffset;

        const isSelected = Math.round(scrollPos) === index;

        return (
          <MoviePanel
            key={movie.id}
            movie={movie}
            position={[moviePos.x, moviePos.y, moviePos.z]}
            rotation={rot}
            isActive={isSelected}
            isDetailsOpen={isDetailsOpen}
            onClick={() => onItemClick(index)}
            isLeft={isLeft}
          />
        );
      })}

      {/* THE CINEMA GATE */}
      <PortalDoor 
        index={movies.length} 
        onEnter={onRestart} 
        isActive={isPortal}
      />
    </>
  );
};

// --- Subcomponents ---

// Generate a procedural halftone/noise texture for the door
const createHalftoneTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    // 1. Fill Black
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, 512, 512);

    // 2. Add Noise/Dust
    for (let i = 0; i < 5000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const size = Math.random() * 1.5;
        const opacity = Math.random() * 0.1;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }

    // 3. Add Halftone Grid Pattern
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    const spacing = 4;
    for (let y = 0; y < 512; y += spacing) {
        for (let x = 0; x < 512; x += spacing) {
             if ((x + y) % (spacing * 2) === 0) {
                 ctx.fillRect(x, y, 1, 1);
             }
        }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
};

const PortalDoor = ({ index, onEnter, isActive }: { index: number, onEnter: () => void, isActive: boolean }) => {
    const pos = getPathPoint(index);
    const nextPos = getPathPoint(index + 1);
    
    // Orient the portal group to face the path direction
    const dummy = new THREE.Object3D();
    dummy.position.copy(pos);
    dummy.lookAt(nextPos);
    
    const groupRef = useRef<THREE.Group>(null);
    const { camera } = useThree();
    const [visiblityOpacity, setVisibilityOpacity] = useState(0);

    // Generate texture once
    const noiseTexture = useMemo(() => createHalftoneTexture(), []);

    useFrame(() => {
        if (!groupRef.current) return;
        
        // Calculate distance from camera to the door
        const dist = camera.position.distanceTo(groupRef.current.position);
        
        const fadeStart = 25;
        const fadeEnd = 8; // Slightly closer fade end
        
        // Linear interpolation for opacity
        const opacity = THREE.MathUtils.clamp(1 - (dist - fadeEnd) / (fadeStart - fadeEnd), 0, 1);
        
        if (Math.abs(opacity - visiblityOpacity) > 0.05) {
            setVisibilityOpacity(opacity);
        }

        groupRef.current.visible = opacity > 0.01;

        groupRef.current.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const material = child.material as THREE.MeshStandardMaterial;
                if (material) {
                    material.transparent = true;
                    // Cap opacity at 0.95 to keep the transparent/ghostly feel user requested
                    material.opacity = opacity * 0.95; 
                }
            }
        });
    });

    return (
        <group 
            ref={groupRef}
            position={[pos.x, pos.y + 1.5, pos.z]} 
            rotation={[dummy.rotation.x, dummy.rotation.y, dummy.rotation.z]} 
        >
             {/* Rotate 180 deg to face camera */}
             <group rotation={[0, Math.PI, 0]}>
                
                {/* 1. The Monolith Doors with Texture */}
                {/* Left Panel */}
                <group position={[-1.4, 0, 0.2]}>
                    <mesh>
                        <boxGeometry args={[2.5, 7.5, 0.2]} />
                        <meshStandardMaterial 
                            map={noiseTexture}
                            color="#111" 
                            roughness={0.8} 
                            metalness={0.2}
                            transparent
                        />
                    </mesh>
                    {/* Art Deco Decoration Lines (Left) */}
                    <mesh position={[0.5, 0, 0.11]}>
                         <boxGeometry args={[0.05, 7, 0.01]} />
                         <meshStandardMaterial color="#444" roughness={0.5} metalness={0.8} />
                    </mesh>
                    <mesh position={[-0.5, 0, 0.11]}>
                         <boxGeometry args={[0.05, 7, 0.01]} />
                         <meshStandardMaterial color="#444" roughness={0.5} metalness={0.8} />
                    </mesh>
                </group>

                {/* Right Panel */}
                <group position={[1.4, 0, 0.2]}>
                    <mesh>
                        <boxGeometry args={[2.5, 7.5, 0.2]} />
                        <meshStandardMaterial 
                            map={noiseTexture}
                            color="#111" 
                            roughness={0.8} 
                            metalness={0.2}
                            transparent
                        />
                    </mesh>
                    {/* Art Deco Decoration Lines (Right) */}
                    <mesh position={[0.5, 0, 0.11]}>
                         <boxGeometry args={[0.05, 7, 0.01]} />
                         <meshStandardMaterial color="#444" roughness={0.5} metalness={0.8} />
                    </mesh>
                    <mesh position={[-0.5, 0, 0.11]}>
                         <boxGeometry args={[0.05, 7, 0.01]} />
                         <meshStandardMaterial color="#444" roughness={0.5} metalness={0.8} />
                    </mesh>
                </group>
                
                {/* 2. Outer Frame Border (Thin lines) */}
                <mesh position={[0, 3.8, 0.2]}>
                    <boxGeometry args={[6, 0.1, 0.3]} />
                    <meshStandardMaterial color="#222" metalness={0.5} />
                </mesh>
                <mesh position={[0, -3.8, 0.2]}>
                    <boxGeometry args={[6, 0.1, 0.3]} />
                    <meshStandardMaterial color="#222" metalness={0.5} />
                </mesh>
                <mesh position={[-2.9, 0, 0.2]}>
                    <boxGeometry args={[0.1, 7.7, 0.3]} />
                    <meshStandardMaterial color="#222" metalness={0.5} />
                </mesh>
                <mesh position={[2.9, 0, 0.2]}>
                    <boxGeometry args={[0.1, 7.7, 0.3]} />
                    <meshStandardMaterial color="#222" metalness={0.5} />
                </mesh>

                {/* 3. The Gap / Void (Clickable Area) */}
                <mesh 
                    position={[0, 0, 0.15]} 
                    onClick={onEnter} 
                    onPointerOver={() => document.body.style.cursor = 'pointer'} 
                    onPointerOut={() => document.body.style.cursor = 'auto'}
                >
                    <planeGeometry args={[5.5, 7.5]} />
                    <meshBasicMaterial color="#000" transparent opacity={0} /> {/* Invisible Hitbox */}
                </mesh>

                {/* 4. Subtle Inner Glow from the crack */}
                <mesh position={[0, 0, 0.21]}>
                    <planeGeometry args={[0.15, 7.5]} />
                    <meshBasicMaterial color="#d4af37" transparent opacity={visiblityOpacity * 0.4} blending={THREE.AdditiveBlending} />
                </mesh>

                {/* 5. Text Overlay - Fades in via CSS opacity */}
                <Html 
                    transform 
                    position={[0, 0, 0.6]} 
                    center 
                    style={{ 
                        pointerEvents: 'none', 
                        opacity: visiblityOpacity, 
                        transition: 'opacity 0.2s linear' 
                    }}
                >
                  <div className="flex flex-col items-center justify-center text-center select-none w-64">
                    <h2 className="text-2xl font-serif text-white/90 tracking-[0.6em] uppercase font-bold drop-shadow-2xl">
                        THE END
                    </h2>
                    <div className="h-px w-8 bg-white/20 my-3"></div>
                    <button 
                        className="pointer-events-auto px-4 py-1.5 border border-white/10 hover:bg-white/5 hover:border-cinema-gold text-white/50 hover:text-white text-[9px] tracking-[0.3em] uppercase transition-all duration-500 rounded-sm"
                        onClick={onEnter}
                        style={{ pointerEvents: visiblityOpacity > 0.8 ? 'auto' : 'none' }}
                    >
                        Return
                    </button>
                  </div>
                </Html>

             </group>
        </group>
    )
}

const FollowCameraGrid = () => {
    const gridRef = useRef<THREE.Group>(null);
    const { camera } = useThree();
    useFrame(() => {
        if (gridRef.current) {
            gridRef.current.position.set(0, -3.95, camera.position.z);
            gridRef.current.position.x = camera.position.x;
        }
    });
    return (
        <group ref={gridRef}>
             <gridHelper args={[100, 50, 0x444444, 0x111111]} />
        </group>
    )
}

const CorridorStructure = ({ length }: { length: number }) => {
    const indices = Array.from({ length: length + 4 }, (_, i) => i - 2);
    return (
        <group>
            {indices.map(i => {
                const pos = getPathPoint(i);
                const nextPos = getPathPoint(i + 0.1);
                const dummyObj = new THREE.Object3D();
                dummyObj.position.copy(pos);
                dummyObj.lookAt(nextPos);
                const rot: [number, number, number] = [dummyObj.rotation.x, dummyObj.rotation.y, dummyObj.rotation.z];

                return (
                    <group key={i} position={[pos.x, 0, pos.z]} rotation={rot}>
                        <mesh position={[0, -3.9, 0]} rotation={[-Math.PI/2, 0, 0]} raycast={() => null}>
                            <ringGeometry args={[7.5, 7.8, 32]} />
                            <meshBasicMaterial color="#333" opacity={0.3} transparent />
                        </mesh>
                        <mesh position={[0, 5, 0]} rotation={[0, 0, 0]} raycast={() => null}>
                             <torusGeometry args={[11, 0.05, 16, 64, Math.PI]} />
                             <meshBasicMaterial color="#555" />
                        </mesh>
                        <mesh position={[-11, 0, 0]} raycast={() => null}>
                            <boxGeometry args={[0.1, 12, 0.1]} />
                            <meshStandardMaterial color="#222" />
                        </mesh>
                        <mesh position={[11, 0, 0]} raycast={() => null}>
                            <boxGeometry args={[0.1, 12, 0.1]} />
                            <meshStandardMaterial color="#222" />
                        </mesh>
                    </group>
                )
            })}
        </group>
    )
}

const MovieIcon = ({ id, color1, color2 }: { id: number, color1: string, color2: string }) => {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (group.current) {
        group.current.rotation.y += delta * 0.5;
        group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  const materialGlass = <meshStandardMaterial color={color1} emissive={color1} emissiveIntensity={0.6} roughness={0.2} metalness={0.8} transparent opacity={0.9} />;
  const materialSolid = <meshStandardMaterial color={color2} emissive={color2} emissiveIntensity={0.2} roughness={0.3} metalness={0.6} />;

  const renderSpecificIcon = () => {
      // Use mod 16 so infinite IDs loop through available shapes
      const shapeId = ((id - 1) % 16) + 1;
      
      switch (shapeId) {
          case 1: return <group><Cylinder args={[0.3, 0.3, 1, 16]}>{materialGlass}</Cylinder><Torus args={[0.2, 0.05, 16, 32]} rotation={[Math.PI/2, 0, 0]} position={[0, 0.55, 0]}>{materialSolid}</Torus></group>;
          case 2: return <Box args={[0.6, 1.4, 0.15]}><meshStandardMaterial color="#222" emissive="#333" emissiveIntensity={0.4} roughness={0.1} metalness={0.9} /></Box>;
          case 3: return <group><Torus args={[0.5, 0.15, 16, 32]}>{materialGlass}</Torus><Sphere args={[0.2]} position={[0,0,0]}>{materialSolid}</Sphere></group>;
          case 4: return <group><Sphere args={[0.5, 32, 32]}><meshBasicMaterial color="#ffaa00" /></Sphere><Torus args={[0.7, 0.02, 16, 64]}><meshBasicMaterial color="#00ffff" /></Torus></group>;
          case 5: return <group><Box args={[0.6, 0.4, 0.6]} position={[0, -0.3, 0]}>{materialSolid}</Box><Box args={[0.4, 0.3, 0.4]} position={[0, 0.1, 0]}>{materialGlass}</Box></group>;
          case 6: return <group rotation={[0, 0, Math.PI / 4]}><Box args={[0.1, 1.5, 0.05]} position={[0, 0, 0]}>{materialGlass}</Box><Box args={[0.4, 0.05, 0.1]} position={[0, -0.5, 0]}>{materialSolid}</Box></group>;
          case 7: return <group><Sphere args={[0.3, 32, 32]} position={[0,0,0]}><meshBasicMaterial color="black" /></Sphere><Torus args={[0.6, 0.05, 16, 64]} rotation={[Math.PI/3, 0, 0]}><meshBasicMaterial color={color1} /></Torus><Torus args={[0.6, 0.05, 16, 64]} rotation={[-Math.PI/3, 0, 0]}><meshBasicMaterial color={color2} /></Torus></group>;
          case 8: return <group rotation={[0, 0, Math.PI/4]}><Capsule args={[0.3, 1, 4, 16]}><meshStandardMaterial color={color1} emissive={color1} emissiveIntensity={0.5} roughness={0.2} metalness={0.5} /></Capsule></group>;
          case 9: return <group><Cylinder args={[0.05, 0.05, 1.5]} position={[0, -0.2, 0]}>{materialSolid}</Cylinder><Sphere args={[0.3]} position={[0, 0.6, 0]}><meshBasicMaterial color={color2} /></Sphere></group>;
          case 10: return <Icosahedron args={[0.6, 0]}><meshStandardMaterial color="#444" roughness={0.9} flatShading /></Icosahedron>;
          case 11: return <Torus args={[0.6, 0.25, 16, 32]}><meshStandardMaterial color="#222" roughness={0.4} /></Torus>;
          case 12: return <group rotation={[0, 0, -Math.PI / 4]}><Cylinder args={[0.05, 0.05, 1.8]} position={[0,0,0]}>{materialSolid}</Cylinder><Cone args={[0.2, 0.4, 4]} position={[0, 0.9, 0]}>{materialGlass}</Cone></group>;
          case 13: return <group><Torus args={[0.6, 0.2, 16, 32]}><meshStandardMaterial color="#d00" emissive="#500" roughness={0.2} /></Torus><Cylinder args={[0.4, 0.4, 0.2]} rotation={[Math.PI/2, 0, 0]}><meshStandardMaterial color="#ccc" metalness={1} /></Cylinder></group>;
          case 14: return <group><Cone args={[0.5, 0.8, 32]} position={[0, -0.2, 0]} rotation={[Math.PI, 0, 0]}><meshStandardMaterial color={color1} metalness={0.8} roughness={0.2} /></Cone><Cylinder args={[0.05, 0.05, 0.6]} position={[0, 0.5, 0]}>{materialSolid}</Cylinder></group>;
          case 15: return <group><Box args={[0.8, 1.4, 0.1]}><meshStandardMaterial color="#87CEEB" /></Box><Box args={[0.7, 1.3, 0.12]} position={[0,0,0]}><meshStandardMaterial color="black" /></Box></group>;
          case 16: return <group rotation={[0, 0, Math.PI/6]}><Cylinder args={[0.05, 0.02, 1.4]} position={[-0.2, 0, 0]} rotation={[0, 0, -0.1]}><meshStandardMaterial color="#ddd" metalness={1} roughness={0.2} /></Cylinder><Cylinder args={[0.05, 0.02, 1.5]} position={[0, 0.1, 0]}><meshStandardMaterial color="#ddd" metalness={1} roughness={0.2} /></Cylinder><Cylinder args={[0.05, 0.02, 1.4]} position={[0.2, 0, 0]} rotation={[0, 0, 0.1]}><meshStandardMaterial color="#ddd" metalness={1} roughness={0.2} /></Cylinder></group>;
          default: return <Octahedron args={[0.6, 0]}>{materialGlass}</Octahedron>;
      }
  }

  return <group ref={group}>{renderSpecificIcon()}</group>;
};

const AtmosphereParticles = ({ targetColor }: { targetColor: string }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const count = 1500;
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const { camera } = useThree();
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            temp.push({ x: (Math.random() - 0.5) * 80, y: (Math.random() - 0.5) * 40 + 5, z: (Math.random() - 0.5) * 100, scale: Math.random() * 0.2 + 0.02, speed: Math.random() * 0.2, offset: Math.random() * 100 });
        }
        return temp;
    }, []);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        const material = meshRef.current.material as THREE.MeshBasicMaterial;
        if (material && 'color' in material && targetColor) {
             if (material.color && typeof material.color.lerp === 'function') material.color.lerp(new THREE.Color(targetColor), delta * 2);
        }
        const camZ = camera.position.z;
        const camX = camera.position.x;
        const time = state.clock.elapsedTime;
        for (let i = 0; i < count; i++) {
            const p = particles[i];
            dummy.position.set(p.x + camX, p.y + Math.sin(time * p.speed + p.offset) * 1, p.z + camZ);
            dummy.rotation.set(time * 0.1, time * 0.1, 0);
            dummy.scale.setScalar(p.scale);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    });
    return <instancedMesh ref={meshRef} args={[undefined, undefined, count]} raycast={() => null}><dodecahedronGeometry args={[0.1, 0]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.6} /></instancedMesh>;
};

interface MoviePanelProps {
  movie: MovieArt;
  position: [number, number, number];
  rotation: [number, number, number];
  isActive: boolean;
  isDetailsOpen: boolean;
  onClick: () => void;
  isLeft: boolean;
}

const MoviePanel: React.FC<MoviePanelProps> = ({ 
  movie, 
  position,
  rotation,
  isActive, 
  isDetailsOpen,
  onClick,
  isLeft
}) => {
  const [hovered, setHovered] = useState(false);
  const primaryColor = movie.color_palette[0];
  const secondaryColor = movie.color_palette[1] || '#ffffff';
  
  const flipGroup = useRef<THREE.Group>(null);
  const outerGroup = useRef<THREE.Group>(null);

  const isPosterRevealed = isActive && isDetailsOpen;

  useFrame((state, delta) => {
    // 1. FLIP & ROTATION LOGIC
    if (flipGroup.current) {
        let targetRotation = Math.PI; // Default to Back (180 deg)

        if (isPosterRevealed) {
            const parentRotY = rotation[1];
            const desiredWorldRotY = isLeft ? Math.PI / 2 : -Math.PI / 2;
            targetRotation = desiredWorldRotY - parentRotY;
        }

        flipGroup.current.rotation.y = damp(flipGroup.current.rotation.y, targetRotation, 5, delta);
    }

    // 2. SCALE LOGIC
    if (outerGroup.current) {
        const targetScale = isPosterRevealed ? 1.3 : 1.0;
        outerGroup.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 4);
    }
  });

  return (
    <group 
        ref={outerGroup}
        position={position} 
        rotation={rotation}
    >
      <SpotLight
        position={[0, 4, 3]} 
        angle={0.3}
        penumbra={0.5}
        intensity={hovered ? 50 : 0} 
        distance={10}
        color={primaryColor}
        target={outerGroup.current || undefined}
        castShadow
      />

      <Float speed={2} rotationIntensity={0.05} floatIntensity={0.2}>
        
          {/* HITBOX */}
          <mesh
            position={[0, 0, 0]} 
            onClick={(e) => { 
                e.stopPropagation(); 
                onClick(); 
            }}
            onPointerOver={(e) => {
                e.stopPropagation();
                setHovered(true);
            }}
            onPointerOut={() => setHovered(false)}
          >
            <boxGeometry args={[3.6, 5.2, 0.3]} />
            <meshBasicMaterial 
                visible={false}
                side={THREE.DoubleSide} 
            />
          </mesh>


        {/* The flippable container */}
        <group ref={flipGroup}>
            
            {/* FLOATING ICONS - Front Only, positioned higher and further out */}
            <group position={[2.5, 3.8, 0.5]}>
                <Float speed={4} rotationIntensity={1} floatIntensity={0.5}>
                    <group scale={0.7}>
                        <MovieIcon id={movie.id} color1={primaryColor} color2={secondaryColor} />
                    </group>
                </Float>
            </group>
            
            {/* --- SIDE A: Procedural Poster (Front) --- */}
            <group position={[0, 0, 0.06]}>
                
                <mesh position={[0, 0, -0.01]} raycast={() => null}>
                    <boxGeometry args={[3.6, 5.2, 0.1]} />
                    <meshStandardMaterial color="#111" />
                </mesh>

                <ProceduralPoster 
                    movie={movie}
                    isActive={true} 
                />
            </group>

            {/* --- SIDE B: Procedural Poster (Back - Mirrored) --- */}
            <group position={[0, 0, -0.06]} rotation={[0, Math.PI, 0]}>
                <mesh position={[0, 0, -0.01]} raycast={() => null}>
                    <boxGeometry args={[3.6, 5.2, 0.1]} />
                    <meshStandardMaterial color="#111" />
                </mesh>

                <ProceduralPoster 
                    movie={movie}
                    isActive={true} 
                />
            </group>

        </group>

      </Float>
    </group>
  );
};

// --- Procedural Poster System ---

const generatePosterTexture = (movie: MovieArt): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    const width = 512;
    const height = 768;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Colors
    const bg = movie.color_palette[0] || '#000';
    const accent1 = movie.color_palette[1] || '#fff';
    const accent2 = movie.color_palette[2] || '#888';
    const textCol = '#fff';

    // Background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Random Design Seed based on ID
    const seed = movie.id % 4;

    ctx.save();
    
    if (seed === 0) {
        // Style: Big Circle / Swiss Style
        ctx.fillStyle = accent1;
        ctx.beginPath();
        ctx.arc(width/2, height/2 - 100, 250, 0, Math.PI*2);
        ctx.fill();
        
        ctx.fillStyle = accent2;
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillRect(50, 500, width - 100, 50);
        ctx.globalCompositeOperation = 'source-over';

    } else if (seed === 1) {
        // Style: Diagonals
        ctx.fillStyle = accent1;
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(width, 0);
        ctx.lineTo(width, height/2);
        ctx.lineTo(0, height);
        ctx.fill();

        ctx.fillStyle = accent2;
        ctx.beginPath();
        ctx.arc(width - 100, 150, 80, 0, Math.PI*2);
        ctx.fill();

    } else if (seed === 2) {
         // Style: Split Horizon
         ctx.fillStyle = accent1;
         ctx.fillRect(0, height/2, width, height/2);
         
         ctx.strokeStyle = accent2;
         ctx.lineWidth = 20;
         ctx.strokeRect(40, 40, width-80, height-80);

    } else {
        // Style: Typographic Chaos
        ctx.fillStyle = accent1;
        ctx.font = 'bold 300px serif';
        ctx.globalAlpha = 0.2;
        ctx.fillText(String(movie.year), -50, 300);
        ctx.fillText(String(movie.year), 100, 600);
        ctx.globalAlpha = 1.0;
    }
    
    ctx.restore();

    // Typography (Swiss/International Style)
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Title
    ctx.fillStyle = textCol;
    ctx.font = 'bold 56px sans-serif'; // Modern Sans
    
    // Wrap text logic
    const words = movie.title_en.toUpperCase().split(' ');
    let line = '';
    let y = height - 240;
    const x = 40;
    const maxWidth = width - 80;

    for(let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n] + ' ';
            y += 65;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, y);

    // Meta Data Line
    y += 80;
    ctx.font = '400 24px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(`${movie.year} // ${movie.director_en.toUpperCase()}`, x, y);
    
    // Visual Metaphor Small
    y += 40;
    ctx.font = 'italic 20px serif';
    ctx.fillText(movie.visual_metaphor.en.substring(0, 40) + '...', x, y);

    return new THREE.CanvasTexture(canvas);
};

const ProceduralPoster = ({ movie, isActive }: { movie: MovieArt, isActive: boolean }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const texture = useMemo(() => generatePosterTexture(movie), [movie]);

    useFrame((state) => {
        if (!meshRef.current) return;
        // Subtle shimmer effect
        if (isActive) {
             const time = state.clock.elapsedTime;
             const material = meshRef.current.material as THREE.MeshBasicMaterial;
             material.opacity = 0.9 + Math.sin(time * 2) * 0.05;
        }
    });

    return (
        <mesh ref={meshRef} position={[0, 0, 0.05]} raycast={() => null}>
            <planeGeometry args={[3.2, 4.8]} />
            <meshBasicMaterial 
                map={texture} 
                transparent 
                opacity={0.9}
                side={THREE.DoubleSide} 
            />
        </mesh>
    );
};
