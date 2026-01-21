import React, { useEffect, useRef } from 'react';

export default function DataInspector({ imageData, activePixelIndex, onHoverPixel, scrollToIndex }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    // Constants for grid layout
    const CELL_WIDTH = 90;
    const CELL_HEIGHT = 20;
    const FONT_SIZE = 12;

    useEffect(() => {
        if (!imageData || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const { width, height, pixels } = imageData;

        // Set canvas dimensions to fit all data
        const totalWidth = width * CELL_WIDTH;
        const totalHeight = height * CELL_HEIGHT;

        // Handle high DPI displays for sharp text
        const dpr = window.devicePixelRatio || 1;
        const currentWidth = canvas.width;
        const currentHeight = canvas.height;
        const desiredWidth = totalWidth * dpr;
        const desiredHeight = totalHeight * dpr;

        // Prepare context
        let isResized = false;
        if (currentWidth !== desiredWidth || currentHeight !== desiredHeight) {
            canvas.width = desiredWidth;
            canvas.height = desiredHeight;
            canvas.style.width = `${totalWidth}px`;
            canvas.style.height = `${totalHeight}px`;
            ctx.scale(dpr, dpr);
            isResized = true;
        }

        // We need to reset context properties if resized (context is reset)
        // or just set them always to be safe
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.font = `${FONT_SIZE}px monospace`;

        // Clear canvas
        // If resized, it's already cleared. But explicit clear is safer if no resize.
        if (!isResized) {
            ctx.clearRect(0, 0, totalWidth, totalHeight);
        }

        ctx.fillStyle = '#1e1e1e'; // Dark background matching theme roughly
        ctx.fillRect(0, 0, totalWidth, totalHeight);

        // Draw cells
        pixels.forEach((pixel, i) => {
            const col = i % width;
            const row = Math.floor(i / width);
            const x = col * CELL_WIDTH;
            const y = row * CELL_HEIGHT;

            // Only draw visible cells? For now draw all is fine if performance is okay.
            // But we can optimize loop too if needed. 44x64 = 2816 items. Fast enough.

            // Highlight background if active
            if (i === activePixelIndex) {
                ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
                ctx.fillRect(x, y, CELL_WIDTH, CELL_HEIGHT);
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, CELL_WIDTH, CELL_HEIGHT);
            } else {
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x, y, CELL_WIDTH, CELL_HEIGHT);
            }

            // Draw Text
            ctx.fillStyle = i === activePixelIndex ? '#fff' : '#aaa';
            const text = `[${pixel.r},${pixel.g},${pixel.b}]`;
            ctx.fillText(text, x + CELL_WIDTH / 2, y + CELL_HEIGHT / 2);
        });

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
