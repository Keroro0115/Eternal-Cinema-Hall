
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Float, Icosahedron, Octahedron, Html } from '@react-three/drei';
import * as THREE from 'three';
import { MovieArt } from '../types';

interface Gallery3DProps {
  movies: MovieArt[];
  scrollPos: number; // 0 to movies.length
  onItemClick: (index: number) => void;
}

const ITEM_SPACING = 8;
const PATH_WIDTH = 4.5; // Distance of art from center path

export const Gallery3D: React.FC<Gallery3DProps> = ({ movies, scrollPos, onItemClick }) => {
  const { camera } = useThree();
  const smoothScroll = useRef(scrollPos);
  const cameraGroup = useRef<THREE.Group>(null);
  const floorRef = useRef<THREE.Mesh>(null);
  
  // Get current active color for particles
  const currentIndex = Math.round(scrollPos);
  const safeIndex = Math.min(Math.max(currentIndex, 0), movies.length - 1);
  const activeMovieColor = movies[safeIndex]?.color_palette[0] || '#ffffff';

  // Analytic path function
  const getPathPoint = (t: number) => {
    // Sinuous winding path
    const x = Math.sin(t * 0.5) * 6;
    const y = Math.sin(t * 0.3) * 1.5; 
    const z = -t * ITEM_SPACING;
    return new THREE.Vector3(x, y, z);
  };

  useFrame((state, delta) => {
    // 1. Smoothly interpolate scroll position
    smoothScroll.current = THREE.MathUtils.lerp(smoothScroll.current, scrollPos, delta * 3);

    // 2. Camera Positioning
    const cameraT = smoothScroll.current - 1.2; 
    const camPos = getPathPoint(cameraT);
    
    // Add height and center it
    camPos.y += 1.5;
    
    // Apply to camera
    camera.position.copy(camPos);

    // 3. Camera LookAt
    const lookT = smoothScroll.current + 3; 
    const lookAtPos = getPathPoint(lookT);
    lookAtPos.x += Math.sin(state.clock.elapsedTime * 0.2) * 2;
    camera.lookAt(lookAtPos);

    // 4. Update Light Group
    if (cameraGroup.current) {
        cameraGroup.current.position.copy(camPos);
        cameraGroup.current.lookAt(lookAtPos);
    }

    // 5. INFINITE FLOOR LOGIC
    if (floorRef.current) {
        floorRef.current.position.z = camera.position.z - 50; 
        floorRef.current.position.x = camera.position.x;
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} color="#ffffff" />
      
      <group ref={cameraGroup}>
        <spotLight 
            position={[0, 2, 0]} 
            intensity={2} 
            distance={30} 
            angle={0.6} 
            penumbra={0.5} 
            color="#fff0dd" 
        />
      </group>

      {/* INFINITE REFLECTIVE FLOOR */}
      <mesh ref={floorRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, -50]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial 
            color="#050505" 
            roughness={0.05} 
            metalness={0.9} 
        />
      </mesh>

      {/* Dynamic Atmosphere Particles */}
      <AtmosphereParticles targetColor={activeMovieColor} />

      {/* ARTWORK GALLERY */}
      {movies.map((movie, index) => {
        const centerPos = getPathPoint(index);
        const isLeft = index % 2 === 0;
        const xOffset = isLeft ? -PATH_WIDTH : PATH_WIDTH;
        
        // Orient panel
        const nextPos = getPathPoint(index + 0.5);
        const tangent = nextPos.clone().sub(centerPos).normalize();
        const rotation = new THREE.Euler().setFromQuaternion(
            new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent)
        );
        rotation.y += isLeft ? Math.PI / 4 : -Math.PI / 4;

        const moviePos = centerPos.clone();
        moviePos.x += xOffset;

        return (
          <MoviePanel
            key={movie.id}
            movie={movie}
            position={moviePos}
            rotation={rotation}
            isActive={Math.round(scrollPos) === index}
            onClick={() => onItemClick(index)}
            isLeft={isLeft}
          />
        );
      })}
    </>
  );
};

// --- Subcomponents ---

// Mood Particles that float everywhere but change color based on active movie
const AtmosphereParticles = ({ targetColor }: { targetColor: string }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const count = 1500;
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const { camera } = useThree();

    // Initialize random positions relative to a center point
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 80; 
            const y = (Math.random() - 0.5) * 40 + 5; 
            const z = (Math.random() - 0.5) * 100; 
            const scale = Math.random() * 0.2 + 0.02;
            temp.push({ x, y, z, scale, speed: Math.random() * 0.2, offset: Math.random() * 100 });
        }
        return temp;
    }, []);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        
        // FIX: access material.color safely, do not use meshRef.current.color
        const material = meshRef.current.material;
        if (material && !Array.isArray(material) && 'color' in material) {
            // @ts-ignore
             material.color.lerp(new THREE.Color(targetColor), delta * 2);
        }

        // Update positions relative to camera to create "Infinite" dust field
        const camZ = camera.position.z;
        const camX = camera.position.x;

        particles.forEach((particle, i) => {
            const time = state.clock.elapsedTime;
            const y = particle.y + Math.sin(time * particle.speed + particle.offset) * 1;
            
            dummy.position.set(
                particle.x + camX, // Follow X
                y, 
                particle.z + camZ // Follow Z
            );
            
            // Subtle rotation
            dummy.rotation.x = time * 0.1;
            dummy.rotation.y = time * 0.1;

            dummy.scale.setScalar(particle.scale);
            dummy.updateMatrix();
            // @ts-ignore
            meshRef.current.setMatrixAt(i, dummy.matrix);
        });
        // @ts-ignore
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <dodecahedronGeometry args={[0.1, 0]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
        </instancedMesh>
    );
};

interface MoviePanelProps {
  movie: MovieArt;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  isActive: boolean;
  onClick: () => void;
  isLeft: boolean;
}

const MoviePanel: React.FC<MoviePanelProps> = ({ 
  movie, 
  position,
  rotation,
  isActive, 
  onClick,
  isLeft
}) => {
  const [hovered, setHovered] = useState(false);
  const primaryColor = movie.color_palette[0];
  const secondaryColor = movie.color_palette[1] || '#ffffff';

  const encodedPrompt = encodeURIComponent(`${movie.visual_metaphor.en} cinematic lighting minimal abstract 3d render masterpiece`);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=1200&nologo=true&seed=${movie.id}`;

  return (
    <group position={position} rotation={rotation}>
      <Float speed={2} rotationIntensity={0.05} floatIntensity={0.2}>
        <group
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          {/* 1. Structural Frame */}
          <mesh position={[0, 0, -0.1]}>
             <boxGeometry args={[3.6, 5.2, 0.2]} />
             <meshStandardMaterial 
                color="#111" 
                roughness={0.2}
                metalness={0.8} 
             />
          </mesh>

          {/* 2. Color Accent Border */}
          <mesh position={[0, 0, -0.05]}>
             <boxGeometry args={[3.5, 5.1, 0.15]} />
             <meshStandardMaterial 
                color={primaryColor} 
                emissive={primaryColor}
                emissiveIntensity={isActive || hovered ? 0.5 : 0.1}
             />
          </mesh>

          {/* 3. Non-Blocking Image / Color Block */}
          <AsyncImagePanel 
            url={imageUrl} 
            fallbackColor={primaryColor} 
            isActive={isActive || hovered} 
          />

          {/* 4. Prop Visualization (HTML) */}
          <Html 
            position={[2.5, 0, 0.5]} 
            transform 
            occlude 
            style={{ pointerEvents: 'none' }}
          >
            {/* Rotate Y 180deg to fix mirroring caused by panel rotation */}
            <div className="font-serif text-white/50 text-4xl whitespace-nowrap opacity-60" style={{
                writingMode: 'vertical-rl',
                textOrientation: 'upright',
                letterSpacing: '0.2em',
                transform: 'rotateY(180deg)' 
            }}>
                {movie.key_element.en.toUpperCase()}
            </div>
          </Html>

          {/* 5. Huge Background Year Number (HTML) */}
           <Html 
            position={[-1, 1, -1]} 
            transform 
            style={{ pointerEvents: 'none' }} 
            zIndexRange={[0, 0]}
           >
             <div className="text-[150px] font-bold text-white/5 font-mono select-none" style={{
                 transform: 'rotateY(180deg)'
             }}>
                {movie.year}
             </div>
           </Html>

          {/* 6. Geometric Abstract Accents - GLOWING GEM */}
          <group position={[-2.4, 2.2, 0.5]}>
             <Float speed={4} rotationIntensity={1} floatIntensity={0.5}>
                <Octahedron args={[0.5, 0]}>
                   <meshPhysicalMaterial 
                     color={secondaryColor} 
                     emissive={secondaryColor}
                     emissiveIntensity={3}
                     transparent
                     opacity={0.8}
                     roughness={0.1}
                     metalness={0.9}
                     transmission={0.6}
                     thickness={1}
                   />
                </Octahedron>
             </Float>
          </group>
          
          {/* 7. Readable Label (HTML Overlay) */}
          <Html 
            position={[0, -3.5, 0]} 
            center 
            transform 
            style={{ pointerEvents: 'none' }}
          >
             <div className="flex flex-col items-center justify-center text-center w-80" style={{
                 transform: 'rotateY(180deg)'
             }}>
                <p className="text-sm text-gray-200 font-serif italic mb-1 whitespace-pre-wrap leading-relaxed opacity-90 drop-shadow-md">
                   {movie.haiku.zh.split('\n')[0]}
                </p>
                <h3 className="text-xs text-gray-500 font-sans tracking-widest uppercase">
                    {movie.title_zh}
                </h3>
             </div>
          </Html>

        </group>
      </Float>
    </group>
  );
};

// A component that renders a plane immediately and loads texture in background without suspending
const AsyncImagePanel = ({ url, fallbackColor, isActive }: { url: string, fallbackColor: string, isActive: boolean }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [texture, setTexture] = useState<THREE.Texture | null>(null);

    useEffect(() => {
        const loader = new THREE.TextureLoader();
        loader.load(url, (tex) => {
            setTexture(tex);
        });
        return () => { setTexture(null) }
    }, [url]);

    return (
        <mesh ref={meshRef} position={[0, 0, 0.1]}>
            <planeGeometry args={[3.2, 4.8]} />
            {texture ? (
                <meshBasicMaterial 
                    map={texture} 
                    transparent 
                    opacity={isActive ? 1 : 0.8}
                    color={isActive ? '#ffffff' : '#dddddd'}
                />
            ) : (
                <meshStandardMaterial 
                    color={fallbackColor} 
                    roughness={0.8} 
                />
            )}
        </mesh>
    );
};
