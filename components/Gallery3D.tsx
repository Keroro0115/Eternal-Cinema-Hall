
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Float, Html, Cylinder, Box, Sphere, Torus, Cone, Capsule, Icosahedron, Octahedron, Environment, Stars, SpotLight } from '@react-three/drei';
import * as THREE from 'three';
import { MovieArt } from '../types';

interface Gallery3DProps {
  movies: MovieArt[];
  scrollPos: number; // 0 to movies.length
  isDetailsOpen: boolean;
  onItemClick: (index: number) => void;
}

const ITEM_SPACING = 8;
const PATH_WIDTH = 4.5; // Distance of art from center path

// Analytic path function moved outside to be reusable
const getPathPoint = (t: number) => {
  // Sinuous winding path
  const x = Math.sin(t * 0.5) * 6;
  const y = Math.sin(t * 0.3) * 1.5; 
  const z = -t * ITEM_SPACING;
  return new THREE.Vector3(x, y, z);
};

export const Gallery3D: React.FC<Gallery3DProps> = ({ movies, scrollPos, isDetailsOpen, onItemClick }) => {
  const { camera } = useThree();
  const smoothScroll = useRef(scrollPos);
  const cameraGroup = useRef<THREE.Group>(null);
  const floorRef = useRef<THREE.Mesh>(null);
  
  // Get current active color for particles
  const currentIndex = Math.round(scrollPos);
  const safeIndex = Math.min(Math.max(currentIndex, 0), movies.length - 1);
  const activeMovieColor = movies[safeIndex]?.color_palette?.[0] || '#ffffff';

  useFrame((state, delta) => {
    // Prevent huge jumps if tab was inactive
    const safeDelta = Math.min(delta, 0.1);

    // 1. Smoothly interpolate scroll position
    smoothScroll.current = THREE.MathUtils.lerp(smoothScroll.current, scrollPos, safeDelta * 3);

    // 2. Camera Logic
    // Standard "Corridor" Path Calculation
    const pathT = smoothScroll.current - 1.2; 
    const corridorCamPos = getPathPoint(pathT);
    corridorCamPos.y += 1.5;

    // "Details" Target Calculation
    // We calculate exactly where the camera needs to be to frame the movie correctly
    const activeIdx = Math.round(scrollPos);
    const isLeftMovie = activeIdx % 2 === 0;
    
    // Calculate the World Position of the active movie
    const activePathPos = getPathPoint(activeIdx);
    // Note: This matches the loop logic below for movie placement
    const activeMovieX = activePathPos.x + (isLeftMovie ? -PATH_WIDTH : PATH_WIDTH);

    // Ideally, we want the movie to appear on the opposite side of the text panel.
    // Left Movie -> Panel Right -> Movie should be on Left Screen -> Cam should be Right of Movie.
    // Right Movie -> Panel Left -> Movie should be on Right Screen -> Cam should be Left of Movie.
    // We use a fixed offset of 2.5 units to frame it perfectly.
    const detailCamX = isLeftMovie ? (activeMovieX + 2.5) : (activeMovieX - 2.5);

    // Determine target X
    const targetX = isDetailsOpen ? detailCamX : corridorCamPos.x;

    // Apply Camera Position
    // We blend X for the transition, but Y and Z largely follow the path to maintain the "ride" feel
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, safeDelta * 4);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, corridorCamPos.y, safeDelta * 4);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, corridorCamPos.z, safeDelta * 4);

    // 3. Camera LookAt
    const lookT = smoothScroll.current + 3; 
    const lookAtPos = getPathPoint(lookT);
    lookAtPos.x += Math.sin(state.clock.elapsedTime * 0.2) * 2;
    
    // When details are open, slightly adjust lookAt to face the movie better, but keep it subtle
    if (isDetailsOpen) {
        lookAtPos.x = THREE.MathUtils.lerp(lookAtPos.x, activeMovieX, safeDelta * 2);
    }
    
    camera.lookAt(lookAtPos);

    // 4. Update Light Group
    if (cameraGroup.current) {
        cameraGroup.current.position.copy(camera.position);
        cameraGroup.current.lookAt(lookAtPos);
    }

    // 5. INFINITE FLOOR LOGIC
    if (floorRef.current) {
        // Center floor exactly on camera so we never run off the edge
        floorRef.current.position.set(camera.position.x, -4, camera.position.z);
    }
  });

  return (
    <>
      {/* 1. Global Illumination & Environment - Critical for reflections */}
      <ambientLight intensity={1.0} color="#ffffff" />
      <Environment preset="city" blur={1} background={false} /> 
      <Stars radius={150} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />

      {/* 2. Camera-attached Light (Miner's Lamp) */}
      <group ref={cameraGroup}>
        <pointLight 
            position={[0, 2, 0]} 
            intensity={3} 
            distance={50} 
            decay={2} 
            color="#fff0dd" 
        />
        <directionalLight 
            position={[0, 0, -5]} 
            intensity={0.5} 
            color="#ffffff" 
        />
      </group>

      {/* 3. The Ground / Floor */}
      <mesh 
        ref={floorRef} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -4, 0]}
        raycast={() => null} // Disable raycast
      >
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial 
            color="#1a1a1a" 
            roughness={0.4} 
            metalness={0.5} 
            envMapIntensity={0.5}
        />
      </mesh>
      
      {/* 4. Grid Helper */}
      <FollowCameraGrid />

      {/* 5. Structural Elements */}
      <CorridorStructure length={movies.length + 5} />

      {/* 6. Particles */}
      <AtmosphereParticles targetColor={activeMovieColor} />

      {/* 7. ARTWORK GALLERY */}
      {movies.map((movie, index) => {
        const centerPos = getPathPoint(index);
        const isLeft = index % 2 === 0;
        const xOffset = isLeft ? -PATH_WIDTH : PATH_WIDTH;
        
        // Orient panel
        const nextPos = getPathPoint(index + 0.5);
        const dummyObj = new THREE.Object3D();
        dummyObj.position.copy(centerPos);
        dummyObj.lookAt(nextPos);
        // Add the side twist
        dummyObj.rotation.y += isLeft ? Math.PI / 4 : -Math.PI / 4;
        
        const rot: [number, number, number] = [dummyObj.rotation.x, dummyObj.rotation.y, dummyObj.rotation.z];
        const moviePos = centerPos.clone();
        moviePos.x += xOffset;

        // Is this the currently selected one?
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
    </>
  );
};

// --- Subcomponents ---

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
                            <ringGeometry args={[5, 5.2, 32]} />
                            <meshBasicMaterial color="#333" opacity={0.3} transparent />
                        </mesh>
                        <mesh position={[0, 4, 0]} rotation={[0, 0, 0]} raycast={() => null}>
                             <torusGeometry args={[8, 0.05, 16, 64, Math.PI]} />
                             <meshBasicMaterial color="#555" />
                        </mesh>
                        <mesh position={[-8, 0, 0]} raycast={() => null}>
                            <boxGeometry args={[0.1, 10, 0.1]} />
                            <meshStandardMaterial color="#222" />
                        </mesh>
                        <mesh position={[8, 0, 0]} raycast={() => null}>
                            <boxGeometry args={[0.1, 10, 0.1]} />
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
      switch (id) {
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

  const encodedPrompt = encodeURIComponent(`${movie.visual_metaphor.en} cinematic lighting minimal abstract 3d render masterpiece`);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=1200&nologo=true&seed=${movie.id}`;
  
  const isPosterRevealed = isActive && isDetailsOpen;

  useFrame((state, delta) => {
    if (flipGroup.current) {
        // SEMANTIC LOGIC CHANGE:
        // Default (Hidden/Corridor) = Rotation PI (Showing Back).
        // Active (Revealed/Details) = Rotation 0 (Showing Front/Image) OR 2PI.
        
        let targetRotation = Math.PI; // Default to Back

        if (isPosterRevealed) {
            // If Revealed, rotate to Front.
            // Symmetric Flip:
            // Left Movie (starts at PI) -> rotates to 0 (Delta -180).
            // Right Movie (starts at PI) -> rotates to 2PI (Delta +180).
            targetRotation = isLeft ? 0 : Math.PI * 2;
        }

        flipGroup.current.rotation.y = THREE.MathUtils.lerp(
            flipGroup.current.rotation.y, 
            targetRotation, 
            delta * 5
        );
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
        
          {/* 
            CRITICAL: The SUPER HITBOX
          */}
          <mesh
            position={[0, 0, 1.5]} 
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
            <boxGeometry args={[6.0, 7.5, 4.0]} />
            <meshBasicMaterial 
                visible={false}
                side={THREE.DoubleSide} 
            />
          </mesh>


        {/* The flippable container */}
        <group ref={flipGroup}>
            
            {/* 
                RESTRUCTURED FACES:
                Front (Z > 0) = Image
                Back (Z < 0) = Black Board
            */}

            {/* --- SIDE A: The AI Image (Front) --- */}
            {/* Normal Orientation. Visible when Group Rotation is 0 or 2PI. */}
            <group position={[0, 0, 0.06]}>
                
                <mesh position={[0, 0, -0.01]} raycast={() => null}>
                    <boxGeometry args={[3.6, 5.2, 0.1]} />
                    <meshStandardMaterial color={isPosterRevealed ? "#000" : "#111"} />
                </mesh>

                <AsyncImagePanel 
                    url={imageUrl} 
                    fallbackColor={primaryColor} 
                    isActive={true} 
                    isVisible={isPosterRevealed}
                />

                 <Html 
                    position={[0, -2.4, 0.1]} 
                    transform 
                    style={{ pointerEvents: 'none', userSelect: 'none', opacity: isPosterRevealed ? 1 : 0 }}
                >
                     <div className="bg-black/60 backdrop-blur-md px-4 py-1 rounded-full border border-white/10">
                        <h3 className="text-[10px] text-white/80 tracking-widest uppercase">
                            {movie.year}
                        </h3>
                     </div>
                </Html>
            </group>

            {/* --- SIDE B: The "Black Board" Cover (Back) --- */}
            {/* Rotated PI. Visible when Group Rotation is PI (Default). */}
            <group position={[0, 0, -0.06]} rotation={[0, Math.PI, 0]}>
                {/* Board Mesh - No Raycast */}
                <mesh receiveShadow raycast={() => null}>
                    <boxGeometry args={[3.6, 5.2, 0.1]} />
                    <meshStandardMaterial 
                        color="#080808" 
                        roughness={0.7} 
                        metalness={0.1}
                    />
                </mesh>

                {/* Glowing Border */}
                <mesh position={[0, 0, 0]} raycast={() => null}>
                    <boxGeometry args={[3.7, 5.3, 0.08]} />
                    <meshStandardMaterial 
                        color={primaryColor} 
                        emissive={primaryColor}
                        emissiveIntensity={hovered ? 0.8 : 0.1}
                        transparent opacity={0.8}
                    />
                </mesh>

                {/* 3D Icon */}
                <group position={[0, 0.5, 0.8]}>
                    <Float speed={4} rotationIntensity={1} floatIntensity={0.5}>
                        <MovieIcon id={movie.id} color1={primaryColor} color2={secondaryColor} />
                    </Float>
                </group>

                {/* Text */}
                <Html 
                    position={[0, -2, 0.1]} 
                    transform 
                    occlude="blending"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                     <div className="flex flex-col items-center justify-center text-center w-60 select-none">
                        <span className="text-[10px] text-white/40 tracking-[0.4em] uppercase mb-2">No. {String(movie.id).padStart(2,'0')}</span>
                        <h3 className="text-xl font-serif text-white/90 italic tracking-widest drop-shadow-lg">
                            {movie.title_en}
                        </h3>
                     </div>
                </Html>
            </group>

        </group>

        {/* --- STATIC ELEMENTS (Do not flip) --- */}
        <Html 
            position={[2.5, 0, 0]} 
            transform 
            occlude 
            style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
            <div className="font-serif text-white/50 text-4xl whitespace-nowrap opacity-60" style={{
                writingMode: 'vertical-rl',
                textOrientation: 'upright',
                letterSpacing: '0.2em',
                transform: 'rotateY(180deg)' 
            }}>
                {movie.key_element.en.toUpperCase()}
            </div>
        </Html>

        <Html 
            position={[-1, 1, -1]} 
            transform 
            style={{ pointerEvents: 'none', userSelect: 'none' }} 
            zIndexRange={[0, 0]}
        >
            <div className="text-[150px] font-bold text-white/5 font-mono select-none" style={{
                transform: 'rotateY(180deg)'
            }}>
            {movie.year}
            </div>
        </Html>

      </Float>
    </group>
  );
};

// Singleton loader
const globalTextureLoader = new THREE.TextureLoader();

const AsyncImagePanel = ({ url, fallbackColor, isActive, isVisible }: { url: string, fallbackColor: string, isActive: boolean, isVisible: boolean }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [texture, setTexture] = useState<THREE.Texture | null>(null);

    useEffect(() => {
        let mounted = true;
        globalTextureLoader.load(
            url, 
            (tex) => { if (mounted) setTexture(tex); },
            undefined,
            () => { if (mounted) setTexture(null); }
        );
        return () => { mounted = false; }
    }, [url]);

    return (
        <mesh ref={meshRef} position={[0, 0, 0.05]} raycast={() => null}>
            <planeGeometry args={[3.2, 4.8]} />
            {isVisible && texture ? (
                <meshBasicMaterial 
                    map={texture} 
                    transparent 
                    opacity={isActive ? 1 : 0.8}
                    color={isActive ? '#ffffff' : '#dddddd'}
                    side={THREE.DoubleSide} 
                />
            ) : (
                <meshBasicMaterial 
                    color="#111" 
                    transparent
                    opacity={1}
                />
            )}
        </mesh>
    );
};
