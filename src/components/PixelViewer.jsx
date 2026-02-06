import React, { useEffect, useRef, useMemo } from 'react';

export default function PixelViewer({ imageData, activePixelIndex, onHoverPixel, pixelSize = 20, onZoom, onPixelClick }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const offscreenCanvasRef = useRef(null);

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

    const handleMouseMove = (e) => {
        if (!imageData || !canvasRef.current) return;

        // Optimize: Use simpler math if possible, but getBoundingClientRect is necessary for offsets
        // potentially throttle this if it's still laggy
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const col = Math.floor(x / (pixelSize + GAP));
        const row = Math.floor(y / (pixelSize + GAP));

        if (col >= 0 && col < imageData.width && row >= 0 && row < imageData.height) {
            const index = row * imageData.width + col;
            // Only update if index changed to avoid React state thrashing
            if (index !== activePixelIndex) {
                onHoverPixel(index);
            }
        } else {
            if (activePixelIndex !== null) onHoverPixel(null);
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
            onWheel={handleWheel}
            style={{
                overflow: 'auto',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '2rem',
                height: '100%',
                background: '#111' // Darker background for contrast
            }}
        >
            {imageData ? (
                <canvas
                    ref={canvasRef}
                    onClick={handleClick}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => onHoverPixel(null)}
                    style={{ cursor: 'crosshair', imageRendering: 'pixelated', display: 'block' }}
                />
            ) : (
                <div style={{ color: 'var(--text-secondary)' }}>
                    Upload an image to see its atoms!
                </div>
            )}
        </div>
    );
}
