import React, { useEffect, useRef, useMemo, useState } from 'react';

export default function PixelViewer({ imageData, activePixelIndex, onHoverPixel, pixelSize = 20, onZoom, onPixelClick, centerOnIndex }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const offscreenCanvasRef = useRef(null);

    // Pan state (virtual camera offset)
    const panOffset = useRef({ x: 0, y: 0 });

    // Drag state
    const isDragging = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });
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
        const ctx = offscreen.getContext('2d', { alpha: false });

        // Resize offscreen only if dimensions changed
        if (offscreen.width !== dimensions.width || offscreen.height !== dimensions.height) {
            offscreen.width = dimensions.width;
            offscreen.height = dimensions.height;
        }

        // Clear and Draw static pixels
        ctx.fillStyle = '#111'; // Match background
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

    // 2. Render to Main Canvas (Composition + Highlight + Pan)
    useEffect(() => {
        if (!imageData || !canvasRef.current || !offscreenCanvasRef.current || !containerRef.current) return;

        const canvas = canvasRef.current;
        const container = containerRef.current;
        const ctx = canvas.getContext('2d', { alpha: false });
        const offscreen = offscreenCanvasRef.current;

        // Resize main canvas to fill container
        if (canvas.width !== container.clientWidth || canvas.height !== container.clientHeight) {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
        }

        let animationFrameId;

        const render = () => {
            // Clear background
            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.save();

            // Apply Pan Transform
            ctx.translate(panOffset.current.x, panOffset.current.y);

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

            ctx.restore();
        };

        // Use rAF for smoother updates if updates are frequent
        animationFrameId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };

        // Re-render when panOffset changes? No, panOffset is a ref.
        // We need to trigger render loop. 
        // Actually, simply calling render() once here isn't enough for continuous animation if we were animating,
        // but here we render on dependency change. 
        // Wait, pan updates are in MouseMove, which doesn't trigger re-render of React component.
        // We need a persistent loop OR trigger re-render on mouse move.
        // For performance, let's use a persistent loop or trigger the render function from mouse move.

        // Let's modify: Make the render function accessible or run it inside a rAF loop triggered by interaction.
        // For now, to keep it reactive to props, let's keep it here.
        // AND add a way to trigger it from mouse events.
    }, [imageData, activePixelIndex, pixelSize, dimensions, cursor]); // Cursor dependency to trigger redraw if needed? No.

    // Helper to trigger a single frame render manually (for pan updates)
    const requestRender = () => {
        if (!imageData || !canvasRef.current || !offscreenCanvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const offscreen = offscreenCanvasRef.current;

        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(panOffset.current.x, panOffset.current.y);
        ctx.drawImage(offscreen, 0, 0);

        if (activePixelIndex !== null && activePixelIndex >= 0) {
            const { width } = imageData;
            const i = activePixelIndex;
            const x = (i % width);
            const y = Math.floor(i / width);
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.strokeRect(x * (pixelSize + GAP), y * (pixelSize + GAP), pixelSize, pixelSize);
        }
        ctx.restore();
    };

    // --- Mouse Handlers for Drag Panning ---

    const handleMouseDown = (e) => {
        isDragging.current = true;
        setCursor('grabbing');
        lastMousePos.current = { x: e.clientX, y: e.clientY };
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

            requestRender(); // Force redraw on pan
            return;
        }

        // Handle Hover Logic (only if not dragging)
        if (!imageData || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        // Adjust mouse coordinate by pan offset
        const x = e.clientX - rect.left - panOffset.current.x;
        const y = e.clientY - rect.top - panOffset.current.y;

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

            // If dragging happened, we already returned from MouseMove, so no click.
            // But what if it was a tiny drag? Simple Distance check.
            // We calculated dx/dy incrementally. Let's track total movement if needed?
            // Or simpler: handle click separately.

            // Check if it was a click (distance from down < threshold)
            // But we didn't store start pos for distance check in this refactor.
            // Let's rely on standard logic: if it moved significantly, it's a drag.
            // For now, let's assume if MouseUp happens, check if mouse moved?

            // Re-use logic: if displacement is small.
            // Let's add startPos back if we want strict click detection.
            // Simplified: If dragging flag was true, we just stop. 
            // We can rely on onClick, but React's onClick might fire after MouseUp.
            // Let's handle click manually here to be safe with canvas.

            // Actually, let's revert to a "click only if didn't move much" logic:
            // But we don't have the original start pos stored in a variable that persists specifically for click check
            // unless we add it. 
        }
    };

    // Separate ref for click detection
    const clickStartPos = useRef({ x: 0, y: 0 });

    const handleMouseDownWrapper = (e) => {
        clickStartPos.current = { x: e.clientX, y: e.clientY };
        handleMouseDown(e);
    };

    const handleMouseUpWrapper = (e) => {
        handleMouseUp(e);
        const dist = Math.hypot(e.clientX - clickStartPos.current.x, e.clientY - clickStartPos.current.y);
        if (dist < 5) {
            handleClick(e);
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

    // Center on specific index (programmatic navigation)
    useEffect(() => {
        if (centerOnIndex !== null && centerOnIndex >= 0 && imageData && containerRef.current) {
            const { width } = imageData;
            const col = centerOnIndex % width;
            const row = Math.floor(centerOnIndex / width);

            const container = containerRef.current;
            // Calculate target pixel position in world space
            const targetX = col * (pixelSize + GAP);
            const targetY = row * (pixelSize + GAP);

            // Calculate pan offset to center that pixel
            // ScreenX = WorldX + PanX
            // CenterX = TargetX + PanX  =>  PanX = CenterX - TargetX
            const centerX = container.clientWidth / 2;
            const centerY = container.clientHeight / 2;

            // Adjust to center the pixel itself
            panOffset.current = {
                x: centerX - targetX - (pixelSize / 2),
                y: centerY - targetY - (pixelSize / 2)
            };
            requestRender();
        }
    }, [centerOnIndex, imageData, pixelSize]); // Re-center if pixel size changes? Maybe yes for keeping focus.

    // Center image on load (only if no specific focus)
    useEffect(() => {
        if (imageData && containerRef.current && dimensions.width > 0 && centerOnIndex === null) {
            const container = containerRef.current;
            // Center: (ContainerW - ContentW) / 2
            panOffset.current = {
                x: Math.max(0, (container.clientWidth - dimensions.width) / 2),
                y: Math.max(0, (container.clientHeight - dimensions.height) / 2)
            };
            requestRender();
        }
    }, [imageData, dimensions]);

    return (
        <div
            ref={containerRef}
            className="pixel-viewer glass-card"
            onMouseDown={handleMouseDownWrapper}
            onMouseUp={handleMouseUpWrapper}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
            style={{
                overflow: 'hidden', // Hide scrollbars
                display: 'flex',
                // justifyContent: 'center', // handled by panOffset
                // alignItems: 'center',
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
