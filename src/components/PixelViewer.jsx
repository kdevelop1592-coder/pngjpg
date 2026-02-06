import React, { useEffect, useRef, useMemo, useState } from 'react';

export default function PixelViewer({ imageData, activePixelIndex, onHoverPixel, pixelSize = 20, onZoom, onPixelClick }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const offscreenCanvasRef = useRef(null);

    // Drag state
    const isDragging = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });
    const scrollStart = useRef({ left: 0, top: 0 });
    const [cursor, setCursor] = useState('grab');

    // Configurable pixel size for visualization
    const GAP = 1;

    // Memoize dimensions to avoid recalculation on every render
    const dimensions = useMemo(() => {
        if (!imageData) return { width: 0, height: 0 };
        return {
            width: imageData.width * (pixelSize + GAP),
            height: imageData.height * (pixelSize + GAP)
        };
    }, [imageData, pixelSize]);

    // 1. Draw Static Content (Pixels) to Offscreen Canvas
    useEffect(() => {
        if (!imageData) return;

        // Initialize offscreen canvas if needed
        if (!offscreenCanvasRef.current) {
            offscreenCanvasRef.current = document.createElement('canvas');
        }

        const { width, height, pixels } = imageData;
        const offscreen = offscreenCanvasRef.current;
        const ctx = offscreen.getContext('2d', { alpha: false }); // Optimize by disabling alpha if possible, though we use it

        // Resize offscreen only if dimensions changed
        if (offscreen.width !== dimensions.width || offscreen.height !== dimensions.height) {
            offscreen.width = dimensions.width;
            offscreen.height = dimensions.height;
        }

        // Clear and Draw static pixels
        ctx.fillStyle = '#eee';
        ctx.fillRect(0, 0, offscreen.width, offscreen.height);

        pixels.forEach((pixel, i) => {
            const x = (i % width);
            const y = Math.floor(i / width);

            // Draw actual pixel
            ctx.fillStyle = `rgba(${pixel.r}, ${pixel.g}, ${pixel.b}, ${pixel.a / 255})`;
            ctx.fillRect(
                x * (pixelSize + GAP),
                y * (pixelSize + GAP),
                pixelSize,
                pixelSize
            );
        });

    }, [imageData, pixelSize, dimensions]);

    // 2. Render to Main Canvas (Composition + Highlight)
    useEffect(() => {
        if (!imageData || !canvasRef.current || !offscreenCanvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: false });
        const offscreen = offscreenCanvasRef.current;

        // Ensure main canvas matches offscreen size
        if (canvas.width !== offscreen.width || canvas.height !== offscreen.height) {
            canvas.width = offscreen.width;
            canvas.height = offscreen.height;
        }

        let animationFrameId;

        const render = () => {
            // A. Draw cached static content
            ctx.drawImage(offscreen, 0, 0);

            // B. Draw Highlight (Dynamic)
            if (activePixelIndex !== null && activePixelIndex >= 0) {
                const { width } = imageData;
                const i = activePixelIndex;
                const x = (i % width);
                const y = Math.floor(i / width);

                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 2;
                ctx.strokeRect(
                    x * (pixelSize + GAP),
                    y * (pixelSize + GAP),
                    pixelSize,
                    pixelSize
                );
            }
        };

        // Use rAF for smoother updates if updates are frequent
        animationFrameId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };

    }, [imageData, activePixelIndex, pixelSize, dimensions]);

    // --- Mouse Handlers for Drag Panning ---

    const handleMouseDown = (e) => {
        if (!containerRef.current) return;
        isDragging.current = true;
        setCursor('grabbing');
        startPos.current = { x: e.clientX, y: e.clientY };
        scrollStart.current = {
            left: containerRef.current.scrollLeft,
            top: containerRef.current.scrollTop
        };
    };

    const handleMouseMove = (e) => {
        // Handle Pan
        if (isDragging.current && containerRef.current) {
            e.preventDefault();
            const dx = e.clientX - startPos.current.x;
            const dy = e.clientY - startPos.current.y;
            containerRef.current.scrollLeft = scrollStart.current.left - dx;
            containerRef.current.scrollTop = scrollStart.current.top - dy;
            return; // Don't do hover logic if dragging
        }

        // Handle Hover Logic (only if not dragging)
        if (!imageData || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const col = Math.floor(x / (pixelSize + GAP));
        const row = Math.floor(y / (pixelSize + GAP));

        if (col >= 0 && col < imageData.width && row >= 0 && row < imageData.height) {
            const index = row * imageData.width + col;
            if (index !== activePixelIndex) {
                onHoverPixel(index);
            }
        } else {
            if (activePixelIndex !== null) onHoverPixel(null);
        }
    };

    const handleMouseUp = (e) => {
        if (isDragging.current) {
            isDragging.current = false;
            setCursor('grab');

            // Calculate distance moved to determine if it was a click or a drag
            const dist = Math.hypot(e.clientX - startPos.current.x, e.clientY - startPos.current.y);

            // If moved less than 5 pixels, treat as a click
            if (dist < 5) {
                handleClick(e);
            }
        }
    };

    const handleMouseLeave = () => {
        isDragging.current = false;
        setCursor('grab');
        onHoverPixel(null);
    };

    const handleClick = (e) => {
        if (!imageData || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const col = Math.floor(x / (pixelSize + GAP));
        const row = Math.floor(y / (pixelSize + GAP));

        if (col >= 0 && col < imageData.width && row >= 0 && row < imageData.height) {
            const index = row * imageData.width + col;
            if (onPixelClick) {
                onPixelClick(index);
            }
        }
    };

    const handleWheel = (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 1 : -1;
            if (onZoom) {
                onZoom(delta);
            }
        }
    };

    return (
        <div
            ref={containerRef}
            className="pixel-viewer glass-card"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
            style={{
                overflow: 'auto',
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                padding: '0',
                height: '100%',
                background: '#111', // Darker background for contrast
                cursor: cursor,
                position: 'relative'
            }}
        >
            {imageData ? (
                <div style={{
                    minWidth: '100%',
                    minHeight: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '2rem'
                }}>
                    <canvas
                        ref={canvasRef}
                        style={{ display: 'block', imageRendering: 'pixelated' }}
                    />
                </div>
            ) : (
                <div style={{ color: 'var(--text-secondary)', margin: 'auto' }}>
                    Upload an image to see its atoms!
                </div>
            )}
        </div>
    );
}
