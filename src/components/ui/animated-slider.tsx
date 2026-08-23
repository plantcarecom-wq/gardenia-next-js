'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Leaf } from 'lucide-react';

interface AnimatedSliderProps {
  images: string[];
  /** Auto-advance interval in ms; set to 0 to disable. Pauses on hover/drag. */
  autoPlayInterval?: number;
}

export function AnimatedSlider({ images, autoPlayInterval = 5000 }: AnimatedSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // 1 for right, -1 for left
  const [isPaused, setIsPaused] = useState(false);
  const imageCount = images?.length ?? 0;

  // Kept above the empty-state early return so hook order never changes
  // between renders (Rules of Hooks) — guards internally instead.
  useEffect(() => {
    if (imageCount <= 1 || isPaused || !autoPlayInterval) return;
    const id = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % imageCount);
    }, autoPlayInterval);
    return () => clearInterval(id);
  }, [imageCount, isPaused, autoPlayInterval]);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square max-h-[560px] bg-gray-50 dark:bg-muted/30 rounded-3xl overflow-hidden border border-white/10 dark:border-white/5 flex items-center justify-center relative backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col items-center justify-center text-gray-300 dark:text-gray-700/50 space-y-4">
          <Leaf className="w-24 h-24 opacity-20" />
          <span className="text-sm uppercase tracking-widest font-medium">No Image</span>
        </div>
      </div>
    );
  }

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9,
    }),
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prev) => {
      let nextIndex = prev + newDirection;
      if (nextIndex < 0) nextIndex = images.length - 1;
      if (nextIndex >= images.length) nextIndex = 0;
      return nextIndex;
    });
  };

  return (
    <div className="space-y-6">
      <div
        className="relative aspect-square max-h-[560px] rounded-3xl overflow-hidden bg-black/5 dark:bg-black/20 shadow-2xl group border border-white/20 dark:border-white/5 backdrop-blur-md"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.img
            key={currentIndex}
            src={images[currentIndex]}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              scale: { duration: 0.4 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragStart={() => setIsPaused(true)}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);
              if (swipe < -swipeConfidenceThreshold) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1);
              }
              setIsPaused(false);
            }}
            className="absolute inset-0 w-full h-full object-cover rounded-3xl cursor-grab active:cursor-grabbing"
            alt={`Product image ${currentIndex + 1}`}
          />
        </AnimatePresence>

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button
              className="absolute z-10 left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/30 dark:bg-black/30 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/50 hover:scale-110 border border-white/20"
              onClick={() => paginate(-1)}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              className="absolute z-10 right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/30 dark:bg-black/30 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/50 hover:scale-110 border border-white/20"
              onClick={() => paginate(1)}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Floating Indicator */}
        {images.length > 1 && (
          <div className="absolute z-10 bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/20 dark:bg-black/40 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
            {images.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-6 bg-white' : 'w-2 bg-white/40'
                  }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <div className="flex gap-4 overflow-x-auto py-4 scrollbar-hide px-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => {
                setDirection(i > currentIndex ? 1 : -1);
                setCurrentIndex(i);
              }}
              className={`relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 transition-all duration-300 ${i === currentIndex
                ? 'ring-2 ring-emerald-500 scale-105 shadow-xl'
                : 'opacity-60 hover:opacity-100 hover:scale-105'
                }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
              {i === currentIndex && (
                <motion.div
                  layoutId="active-thumbnail"
                  className="absolute inset-0 border-2 border-emerald-500 rounded-2xl z-10 pointer-events-none"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
