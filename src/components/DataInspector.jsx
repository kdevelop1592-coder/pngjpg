import React, { useEffect, useRef } from 'react';

export default function DataInspector({ imageData, activePixelIndex, onHoverPixel, scrollToIndex }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const offscreenCanvasRef = useRef(null);

    // Initialize offscreen canvas
    if (!offscreenCanvasRef.current) {
        offscreenCanvasRef.current = document.createElement('canvas');
    }

    // Constants for grid layout
    const CELL_WIDTH = 90;
    const CELL_HEIGHT = 20;
    const FONT_SIZE = 12;

    // 1. Draw Static Content (Grid + Text) to Offscreen Canvas
    useEffect(() => {
        if (!imageData) return;

        const { width, height, pixels } = imageData;
        const offscreen = offscreenCanvasRef.current;
        const ctx = offscreen.getContext('2d');

        // Set canvas dimensions to fit all data
        const totalWidth = width * CELL_WIDTH;
        const totalHeight = height * CELL_HEIGHT;

        // Handle high DPI displays for sharp text
        const dpr = window.devicePixelRatio || 1;
        const desiredWidth = totalWidth * dpr;
        const desiredHeight = totalHeight * dpr;

        // Resize offscreen if needed
        if (offscreen.width !== desiredWidth || offscreen.height !== desiredHeight) {
            offscreen.width = desiredWidth;
            offscreen.height = desiredHeight;
            ctx.scale(dpr, dpr);
        }

        // We need to set context properties after resize (or always to be safe)
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.font = `${FONT_SIZE}px monospace`;

        // Clear and Draw Static Background
        ctx.fillStyle = '#1e1e1e';
        ctx.fillRect(0, 0, totalWidth, totalHeight);

        pixels.forEach((pixel, i) => {
            const col = i % width;
            const row = Math.floor(i / width);
            const x = col * CELL_WIDTH;
            const y = row * CELL_HEIGHT;

            // Draw Grid Lines (Static)
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x, y, CELL_WIDTH, CELL_HEIGHT);

            // Draw Text (Static - inactive color)
            ctx.fillStyle = '#aaa';
            const text = `[${pixel.r},${pixel.g},${pixel.b}]`;
            ctx.fillText(text, x + CELL_WIDTH / 2, y + CELL_HEIGHT / 2);
        });

    }, [imageData]);

    // 2. Render to Main Canvas (Composition + Highlight)
    useEffect(() => {
        if (!imageData || !canvasRef.current || !offscreenCanvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const offscreen = offscreenCanvasRef.current;
        const dpr = window.devicePixelRatio || 1;

        // Sync main canvas size
        if (canvas.width !== offscreen.width || canvas.height !== offscreen.height) {
            canvas.width = offscreen.width;
            canvas.height = offscreen.height;
            canvas.style.width = `${offscreen.width / dpr}px`;
            canvas.style.height = `${offscreen.height / dpr}px`;
        }

        // A. Draw Cached Content
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(offscreen, 0, 0);

        // B. Draw Highlight (Dynamic)
        if (activePixelIndex !== null && activePixelIndex >= 0) {
            const { width, pixels } = imageData;
            const i = activePixelIndex;
            const pixel = pixels[i];

            if (pixel) {
                const col = i % width;
                const row = Math.floor(i / width);
                const x = col * CELL_WIDTH;
                const y = row * CELL_HEIGHT;

                // Reset context for dynamic drawing
                ctx.save();
                ctx.scale(dpr, dpr);
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'center';
                ctx.font = `${FONT_SIZE}px monospace`;

                // 1. Highlight Background
                ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
                ctx.fillRect(x, y, CELL_WIDTH, CELL_HEIGHT);

                // 2. Highlight Border
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, CELL_WIDTH, CELL_HEIGHT);

                // 3. Redraw Text in Active Color (White)
                ctx.fillStyle = '#fff';
                const text = `[${pixel.r},${pixel.g},${pixel.b}]`;
                ctx.fillText(text, x + CELL_WIDTH / 2, y + CELL_HEIGHT / 2);

                ctx.restore();
            }
        }

    }, [imageData, activePixelIndex]);

    // Handle programmatic scrolling to specific index
    useEffect(() => {
        if (scrollToIndex === null || !imageData || !containerRef.current) return;

        const { width } = imageData;
        const col = scrollToIndex % width;
        const row = Math.floor(scrollToIndex / width);

        // Calculate position in pixels
        const targetX = col * CELL_WIDTH;
        const targetY = row * CELL_HEIGHT;

        // Center the target cell in the container
        const container = containerRef.current;
        container.scrollTop = targetY - container.clientHeight / 2 + CELL_HEIGHT / 2;
        container.scrollLeft = targetX - container.clientWidth / 2 + CELL_WIDTH / 2;

    }, [scrollToIndex, imageData]);

    const handleMouseMove = (e) => {
        if (!imageData || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const col = Math.floor(x / CELL_WIDTH);
        const row = Math.floor(y / CELL_HEIGHT);

        if (col >= 0 && col < imageData.width && row >= 0 && row < imageData.height) {
            const index = row * imageData.width + col;
            onHoverPixel(index);
        } else {
            // Do not reset to null here immediately to avoid flickering when moving between cells slightly? 
            // Actually, PixelViewer logic resets it, so we should too for consistency.
            // onHoverPixel(null);
        }
    };

    const handleMouseLeave = () => {
        onHoverPixel(null);
    }

    if (!imageData) return (
        <div className="glass-card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            Waiting for data...
        </div>
    );

    return (
        <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                <h3 style={{ margin: 0 }}>Computer Vision (Raw Data)</h3>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', opacity: 0.7 }}>
                    Real-time memory view: {imageData.width}x{imageData.height} matrix
                </p>
            </div>

            <div
                ref={containerRef}
                style={{
                    flex: 1,
                    overflow: 'auto',
                    position: 'relative',
                    background: '#1a1a1a',
                    paddingBottom: '24px', // Reserve space for horizontal scrollbar
                    paddingRight: '24px'   // Reserve space for vertical scrollbar
                }}
            >
                <canvas
                    ref={canvasRef}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    style={{ display: 'block' }}
                />
            </div>
        </div>
    );
}
