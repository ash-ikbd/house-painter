import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ZoomInIcon } from './icons/ZoomInIcon';
import { ZoomOutIcon } from './icons/ZoomOutIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ShareIcon } from './icons/ShareIcon';

interface ImageComparatorProps {
  originalImage: string;
  newImage: string;
}

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(val, max));

export const ImageComparator: React.FC<ImageComparatorProps> = ({ originalImage, newImage }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSliderDragging = useRef(false);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, viewX: 0, viewY: 0 });
  const transitionTimeoutRef = useRef<number | null>(null);

  const isShareSupported = typeof navigator !== 'undefined' && !!navigator.share;

  const updateBoundedView = useCallback((newView: { scale: number, x: number, y: number }) => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    
    const scale = clamp(newView.scale, 1, 5);

    if (scale <= 1) {
      setView({ scale: 1, x: 0, y: 0 });
      return;
    }

    // With a center transform-origin, the max translation is half the "extra" size
    const maxX = (width * scale - width) / 2;
    const maxY = (height * scale - height) / 2;
    
    const x = clamp(newView.x, -maxX, maxX);
    const y = clamp(newView.y, -maxY, maxY);

    setView({ scale, x, y });
  }, []);

  const handleSliderMove = useCallback((clientX: number) => {
    if (!isSliderDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clamp(clientX - rect.left, 0, rect.width);
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  }, []);

  const handlePanMove = useCallback((clientX: number, clientY: number) => {
    if (!isPanning.current) return;
    const dx = clientX - panStart.current.x;
    const dy = clientY - panStart.current.y;
    updateBoundedView({
      scale: view.scale,
      x: panStart.current.viewX + dx,
      y: panStart.current.viewY + dy,
    });
  }, [view.scale, updateBoundedView]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isSliderDragging.current) handleSliderMove(e.clientX);
      else if (isPanning.current) handlePanMove(e.clientX, e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isSliderDragging.current) handleSliderMove(e.touches[0].clientX);
      else if (isPanning.current) handlePanMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    const onUp = () => {
      if (isPanning.current && containerRef.current) {
        containerRef.current.style.cursor = 'grab';
      }
      isSliderDragging.current = false;
      isPanning.current = false;
      document.body.style.cursor = 'auto';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
    };
  }, [handleSliderMove, handlePanMove]);
  
  useEffect(() => {
    return () => {
        if (transitionTimeoutRef.current) {
            clearTimeout(transitionTimeoutRef.current);
        }
    }
  }, []);

  const stopTransition = () => {
    if (isTransitioning) setIsTransitioning(false);
    if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
    }
  };

  const onContainerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (view.scale > 1) {
      e.preventDefault();
      stopTransition();
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY, viewX: view.x, viewY: view.y };
      e.currentTarget.style.cursor = 'grabbing';
    }
  };

  const onContainerTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
     if (view.scale > 1 && e.touches.length === 1) {
        stopTransition();
        isPanning.current = true;
        panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, viewX: view.x, viewY: view.y };
     }
  };

  const onSliderInteractionStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    isSliderDragging.current = true;
    document.body.style.cursor = 'ew-resize';
  };
  
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!containerRef.current) return;
    stopTransition();

    const { deltaY } = e;
    const zoomFactor = 1.1;
    const newScale = deltaY < 0 ? view.scale * zoomFactor : view.scale / zoomFactor;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate the image point under the cursor
    // The transform-origin is center, so we adjust calculations accordingly
    const pointX = (mouseX - rect.width / 2 - view.x) / view.scale;
    const pointY = (mouseY - rect.height / 2 - view.y) / view.scale;

    // Calculate the new translation to keep the point under the cursor
    const newX = -pointX * newScale + (mouseX - rect.width / 2);
    const newY = -pointY * newScale + (mouseY - rect.height / 2);

    updateBoundedView({ scale: newScale, x: newX, y: newY });
  };
  
  const applyZoom = (direction: 'in' | 'out') => {
    if (!containerRef.current) return;
    stopTransition();
    setIsTransitioning(true);

    const { width, height } = containerRef.current.getBoundingClientRect();
    const zoomFactor = 1.5;
    const newScale = direction === 'in' ? view.scale * zoomFactor : view.scale / zoomFactor;
    
    // Zoom towards the center of the view
    const centerX = width / 2;
    const centerY = height / 2;
    
    const pointX = (centerX - width / 2 - view.x) / view.scale;
    const pointY = (centerY - height / 2 - view.y) / view.scale;

    const newX = -pointX * newScale + (centerX - width / 2);
    const newY = -pointY * newScale + (centerY - height / 2);

    updateBoundedView({ scale: newScale, x: newX, y: newY });
    
    transitionTimeoutRef.current = window.setTimeout(() => setIsTransitioning(false), 200);
  };
  
  const resetView = () => {
    stopTransition();
    setIsTransitioning(true);
    setView({ scale: 1, x: 0, y: 0 });
    transitionTimeoutRef.current = window.setTimeout(() => setIsTransitioning(false), 200);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = newImage;
    const mimeType = newImage.substring(5, newImage.indexOf(';'));
    const extension = mimeType.split('/')[1] || 'png';
    link.download = `painted-image.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!isShareSupported) return;
    try {
      const response = await fetch(newImage);
      const blob = await response.blob();
      const file = new File([blob], `painted-image.${blob.type.split('/')[1]}`, { type: blob.type });

      await navigator.share({
        files: [file],
        title: 'My AI-Painted House',
        text: 'Check out the new color scheme I generated!',
      });
    } catch (error) {
      console.error('Error sharing image:', error);
    }
  };

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="relative w-full max-w-full mx-auto aspect-[16/10] rounded-lg overflow-hidden select-none touch-none"
        style={{ cursor: view.scale > 1 ? 'grab' : 'auto' }}
        onWheel={onWheel}
        onMouseDown={onContainerMouseDown}
        onTouchStart={onContainerTouchStart}
      >
        <div
          className={`relative w-full h-full origin-center ${isTransitioning ? 'transition-transform duration-200 ease-out' : ''}`}
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
        >
          <img
            src={originalImage}
            alt="Original"
            className="absolute inset-0 w-full h-full object-contain"
            draggable="false"
          />
          <div
            className="absolute inset-0 w-full h-full"
            style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
          >
            <img
              src={newImage}
              alt="AI Painted"
              className="absolute inset-0 w-full h-full object-contain"
              draggable="false"
            />
          </div>
          <div
            className="absolute top-0 bottom-0 w-1.5 bg-white/70 backdrop-blur-sm pointer-events-none"
            style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg border-2 border-gray-200">
              <svg className="w-6 h-6 text-gray-600 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
            </div>
          </div>
          <div 
             className="absolute top-0 bottom-0 -translate-x-1/2 w-12 cursor-ew-resize"
             style={{ left: `${sliderPosition}%` }}
             onMouseDown={onSliderInteractionStart}
             onTouchStart={onSliderInteractionStart}
          />
          <span className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full pointer-events-none">Before</span>
          <span className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full pointer-events-none">After</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mt-4">
        <button onClick={() => applyZoom('out')} disabled={view.scale <= 1} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed" title="Zoom Out">
          <ZoomOutIcon className="w-5 h-5" />
        </button>
        <button onClick={resetView} className="text-sm font-medium px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">
          Reset View
        </button>
        <button onClick={() => applyZoom('in')} disabled={view.scale >= 5} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed" title="Zoom In">
          <ZoomInIcon className="w-5 h-5" />
        </button>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>

        <button onClick={handleDownload} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition" title="Download Image">
          <DownloadIcon className="w-5 h-5" />
        </button>
        <button onClick={handleShare} disabled={!isShareSupported} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed" title="Share Image">
          <ShareIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};