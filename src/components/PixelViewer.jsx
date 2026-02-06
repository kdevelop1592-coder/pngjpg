import React, { useEffect, useRef, useMemo, useState } from 'react';

export default function PixelViewer({ imageData, activePixelIndex, onHoverPixel, pixelSize = 20, onZoom, onPixelClick, centerOnIndex }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const requestRef = useRef();

    // Pan state (virtual camera offset)
    const panOffset = useRef({ x: 0, y: 0 });

    // Drag state
    const isDragging = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });
    const clickStartRef = useRef({ x: 0, y: 0 });
    const [cursor, setCursor] = useState('grab');

    // Configurable pixel size for visualization
    const GAP = 1;

    // Helper to calculate total dimensions
    const getContentDimensions = () => {
        if (!imageData) return { width: 0, height: 0 };
        return {
            width: imageData.width * (pixelSize + GAP),
            height: imageData.height * (pixelSize + GAP)
        };
    };

    const draw = () => {
        if (!imageData || !canvasRef.current || !containerRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: false });
        // const dpr = window.devicePixelRatio || 1; // High DPI handling if desired, but pixel art might not need it?
        // Let's stick to 1x for performance on massive grids, or use dpr if text crispness matters.
        // For 20px pixels, 1x is fine.

        const container = containerRef.current;
        if (canvas.width !== container.clientWidth || canvas.height !== container.clientHeight) {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
        }

        const width = canvas.width;
        const height = canvas.height;

        // Clear background
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, width, height);

        ctx.save();

        // Apply Pan
        const offsetX = panOffset.current.x;
        const offsetY = panOffset.current.y;
        ctx.translate(offsetX, offsetY);

        // --- Culling using Viewport ---
        // We need to find which pixels are visible.
        // Screen Rect: (0, 0) to (width, height)
        // World Rect: (-offsetX, -offsetY) to (-offsetX + width, -offsetY + height)

        const worldLeft = -offsetX;
        const worldTop = -offsetY;
        const worldRight = worldLeft + width;
        const worldBottom = worldTop + height;

        const cellSize = pixelSize + GAP;

        const startCol = Math.floor(worldLeft / cellSize);
        const endCol = Math.min(imageData.width, Math.ceil(worldRight / cellSize));
        const startRow = Math.floor(worldTop / cellSize);
        const endRow = Math.min(imageData.height, Math.ceil(worldBottom / cellSize));

        // Draw Visible Pixels
        for (let row = Math.max(0, startRow); row < endRow; row++) {
            for (let col = Math.max(0, startCol); col < endCol; col++) {
                const i = row * imageData.width + col;
                const pixel = imageData.pixels[i];
                if (!pixel) continue; // Should not happen if within bounds

                const x = col * cellSize;
                const y = row * cellSize;

                ctx.fillStyle = `rgba(${pixel.r}, ${pixel.g}, ${pixel.b}, ${pixel.a / 255})`;
                ctx.fillRect(x, y, pixelSize, pixelSize);
            }
        }

        // Draw Highlight
        if (activePixelIndex !== null && activePixelIndex >= 0) {
            const i = activePixelIndex;
            const col = i % imageData.width;
            const row = Math.floor(i / imageData.width);

            if (col >= 0 && col < imageData.width && row >= 0 && row < imageData.height) {
                const x = col * cellSize;
                const y = row * cellSize;

                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, pixelSize, pixelSize);
            }
        }

        ctx.restore();
    };

    // Render Loop
    useEffect(() => {
        const animate = () => {
            draw();
            requestRef.current = requestAnimationFrame(animate);
        };
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [imageData, activePixelIndex, pixelSize]); // Re-bind animate if these change


    // Force a single draw on mount or prop change (covered by loop, but needed for non-loop updates?)
    // The loop handles it.

    // Center on specific index (programmatic navigation)
    useEffect(() => {
        if (centerOnIndex !== null && centerOnIndex >= 0 && imageData && containerRef.current) {
            const { width } = imageData;
            const col = centerOnIndex % width;
            const row = Math.floor(centerOnIndex / width);

            const container = containerRef.current;
            const cellSize = pixelSize + GAP;

            // Calculate target pixel position in world space
            const targetX = col * cellSize;
            const targetY = row * cellSize;

            const centerX = container.clientWidth / 2;
            const centerY = container.clientHeight / 2;

            panOffset.current = {
                x: centerX - targetX - (pixelSize / 2),
                y: centerY - targetY - (pixelSize / 2)
            };
        }
    }, [centerOnIndex, imageData, pixelSize]);

    // Center image on load (only if no specific focus)
    useEffect(() => {
        if (imageData && containerRef.current && centerOnIndex === null) {
            const dims = getContentDimensions();
            if (dims.width > 0) {
                const container = containerRef.current;
                panOffset.current = {
                    x: Math.max(0, (container.clientWidth - dims.width) / 2),
                    y: Math.max(0, (container.clientHeight - dims.height) / 2)
                };
            }
        }
    }, [imageData]); // removed dimensions dep as it is calculated inside

    // --- Mouse Handlers ---

    const handleMouseDown = (e) => {
        isDragging.current = true;
        setCursor('grabbing');
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        clickStartRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
        // Handle Pan
        if (isDragging.current) {
            e.preventDefault();
            const dx = e.clientX - lastMousePos.current.x;
            const dy = e.clientY - lastMousePos.current.y;

            panOffset.current.x += dx;
            panOffset.current.y += dy;

            lastMousePos.current = { x: e.clientX, y: e.clientY };
            return; // Loop will render new pos
        }

        // Handle Hover Logic
        if (!imageData || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left - panOffset.current.x;
        const y = e.clientY - rect.top - panOffset.current.y;

        const cellSize = pixelSize + GAP;
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);

        if (col >= 0 && col < imageData.width && row >= 0 && row < imageData.height) {
            const index = row * imageData.width + col;
            if (index !== activePixelIndex) {
                onHoverPixel(index);
            }
        } else {
            if (activePixelIndex !== null) onHoverPixel(null); // Optional: clear hover when outside
        }
    };

    const handleMouseUp = (e) => {
        if (isDragging.current) {
            isDragging.current = false;
            setCursor('grab');

            // Click detection
            const dist = Math.hypot(e.clientX - clickStartRef.current.x, e.clientY - clickStartRef.current.y);
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
        // Adjust for pan
        const x = e.clientX - rect.left - panOffset.current.x;
        const y = e.clientY - rect.top - panOffset.current.y;

        const cellSize = pixelSize + GAP;
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);

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
                overflow: 'hidden',
                display: 'flex',
                padding: '0',
                height: '100%',
                background: '#111',
                cursor: cursor,
                position: 'relative'
            }}
        >
            {imageData ? (
                <canvas
                    ref={canvasRef}
                    style={{ display: 'block', imageRendering: 'pixelated' }}
                />
            ) : (
                <div style={{ color: 'var(--text-secondary)', margin: 'auto' }}>
                    Upload an image to see its atoms!
                </div>
            )}
        </div>
    );
}
