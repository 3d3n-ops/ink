'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

// Image order: learn_deeper (first), think_better, reflect_more, create_and_express (last/on top)
const images = [
  '/learn_deeper.png',
  '/think_better.png',
  '/reflect_more.png',
  '/create_and_express.png',
];

export default function ScrollParallax() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [containerTop, setContainerTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [windowHeight, setWindowHeight] = useState(0);

  useEffect(() => {
    const updateMeasurements = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerTop(rect.top + window.scrollY);
        setContainerHeight(rect.height);
      }
      setWindowHeight(window.innerHeight);
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    updateMeasurements();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateMeasurements);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateMeasurements);
    };
  }, []);

  // Calculate scroll progress within the container (0 to 1)
  const scrollableDistance = containerHeight - windowHeight;
  const scrolledIntoContainer = scrollY - containerTop;
  const overallProgress = Math.max(0, Math.min(1, scrolledIntoContainer / scrollableDistance));

  // Each card gets 100vh of scroll
  // Card animation happens over a portion, then stays fixed
  const getCardProgress = (index: number) => {
    if (index === 0) return 1; // First card is always in place
    
    // Each card after the first gets its own 100vh scroll segment
    const segmentStart = (index - 1) / (images.length - 1);
    const segmentEnd = index / (images.length - 1);
    const animationPortion = 0.7; // Animation takes 70% of segment, 30% stays visible
    const animationEnd = segmentStart + (segmentEnd - segmentStart) * animationPortion;
    
    if (overallProgress < segmentStart) {
      // Card hasn't started animating yet
      return 0;
    } else if (overallProgress > animationEnd) {
      // Card has finished animating - in final position
      return 1;
    } else {
      // Card is animating
      const animationProgress = (overallProgress - segmentStart) / (animationEnd - segmentStart);
      // Ease out cubic for smooth deceleration
      return 1 - Math.pow(1 - animationProgress, 3);
    }
  };

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-[#FFFAF0] mt-32"
      style={{ height: `${images.length * 100}vh` }}
    >
      <div className="sticky top-0 h-screen flex items-center justify-center">
        <div className="w-full max-w-2xl mx-auto px-4">
          <div className="relative w-full" style={{ aspectRatio: '3/4' }}>
            {images.map((src, index) => {
              const progress = getCardProgress(index);
              
              // Target offset positions for stacking effect
              const targetOffsetX = index * 8 * (index % 2 === 0 ? -1 : 1);
              const targetOffsetY = index * 12;
              const targetRotation = index * 1.5 * (index % 2 === 0 ? -1 : 1);
              
              // Slide up INTO the offset position (interpolate from below to final offset)
              const startY = 100; // Start 100vh below
              const translateYPercent = startY * (1 - progress); // Slides up as progress increases
              const offsetX = targetOffsetX * progress;
              const offsetY = targetOffsetY * progress;
              const rotation = targetRotation * progress;
              
              // Z-index: later images on top
              const zIndex = index + 1;

              return (
                <div
                  key={src}
                  className="absolute inset-0 will-change-transform"
                  style={{
                    transform: `translate(${offsetX}px, calc(${translateYPercent}vh + ${offsetY}px)) rotate(${rotation}deg)`,
                    zIndex,
                  }}
                >
                  <div 
                    className="relative w-full h-full" 
                    style={{ 
                      filter: 'drop-shadow(0 12px 32px rgba(22, 18, 16, 0.15))',
                    }}
                  >
                    <Image
                      src={src}
                      alt={`Feature ${index + 1}`}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 500px"
                      priority={index === 0}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
