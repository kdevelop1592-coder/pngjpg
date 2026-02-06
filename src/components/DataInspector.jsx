import React, { useEffect, useRef, useState, useCallback } from 'react';

export default function DataInspector({ imageData, activePixelIndex, onHoverPixel, scrollToIndex }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const requestRef = useRef();

    // Constants for grid layout
    const CELL_WIDTH = 90;
    const CELL_HEIGHT = 20;
    const FONT_SIZE = 12;

    // Helper to draw the grid
    const draw = useCallback(() => {
        if (!imageData || !canvasRef.current || !containerRef.current) return;

        const container = containerRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: false }); // Optimize for no transparency if possible
        const dpr = window.devicePixelRatio || 1;

        // Container dimensions (viewport)
        const viewWidth = container.clientWidth;
        const viewHeight = container.clientHeight;

        // Update canvas size if viewport changed
        if (canvas.width !== viewWidth * dpr || canvas.height !== viewHeight * dpr) {
            canvas.width = viewWidth * dpr;
            canvas.height = viewHeight * dpr;
            canvas.style.width = `${viewWidth}px`;
            canvas.style.height = `${viewHeight}px`;
        }

        // Reset transform for new frame
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Scroll position
        const scrollTop = container.scrollTop;
        const scrollLeft = container.scrollLeft;

        // Calculate visible range
        const startCol = Math.floor(scrollLeft / CELL_WIDTH);
        const endCol = Math.min(imageData.width, Math.ceil((scrollLeft + viewWidth) / CELL_WIDTH));
        const startRow = Math.floor(scrollTop / CELL_HEIGHT);
        const endRow = Math.min(imageData.height, Math.ceil((scrollTop + viewHeight) / CELL_HEIGHT));

        // Background
        ctx.fillStyle = '#1a1a1a'; // Match container bg
        ctx.fillRect(0, 0, viewWidth, viewHeight);

        // Set Text Styles
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.font = `${FONT_SIZE}px monospace`;

        // Draw Visible Cells
        for (let row = startRow; row < endRow; row++) {
            for (let col = startCol; col < endCol; col++) {
                const i = row * imageData.width + col;
                const pixel = imageData.pixels[i];
                if (!pixel) continue;

                // Screen coordinates (relative to viewport)
                const x = (col * CELL_WIDTH) - scrollLeft;
                const y = (row * CELL_HEIGHT) - scrollTop;

                // Highlight Active Pixel
                const isActive = (i === activePixelIndex);

                // Background for cell
                if (isActive) {
                    ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
                    ctx.fillRect(x, y, CELL_WIDTH, CELL_HEIGHT);
                }

                // Grid Lines
                ctx.strokeStyle = isActive ? '#00ff00' : '#333';
                ctx.lineWidth = isActive ? 1.5 : 0.5;
                ctx.strokeRect(x, y, CELL_WIDTH, CELL_HEIGHT);

                // Text
                ctx.fillStyle = isActive ? '#fff' : '#aaa';
                const text = `[${pixel.r},${pixel.g},${pixel.b}]`;
                ctx.fillText(text, x + CELL_WIDTH / 2, y + CELL_HEIGHT / 2);
            }
        }
    }, [imageData, activePixelIndex]);

    // Render Loop using requestAnimationFrame for smooth scrolling
    useEffect(() => {
        const animate = () => {
            draw();
            requestRef.current = requestAnimationFrame(animate);
        };
        requestRef.current = requestAnimationFrame(animate);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [draw]);

    // Handle Scroll to Index
    useEffect(() => {
        if (scrollToIndex === null || !imageData || !containerRef.current) return;

        const { width } = imageData;
        const col = scrollToIndex % width;
        const row = Math.floor(scrollToIndex / width);

        const targetX = col * CELL_WIDTH;
        const targetY = row * CELL_HEIGHT;

        const container = containerRef.current;
        // Center the target
        container.scrollTop = targetY - container.clientHeight / 2 + CELL_HEIGHT / 2;
        container.scrollLeft = targetX - container.clientWidth / 2 + CELL_WIDTH / 2;
    }, [scrollToIndex, imageData]);

    // Mouse Interaction
    const handleMouseMove = (e) => {
        if (!imageData || !containerRef.current) return;

        const container = containerRef.current;
        const rect = container.getBoundingClientRect();

        // Mouse relative to viewport
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Adjust for scroll to get content coordinates
        const contentX = mouseX + container.scrollLeft;
        const contentY = mouseY + container.scrollTop;

        const col = Math.floor(contentX / CELL_WIDTH);
        const row = Math.floor(contentY / CELL_HEIGHT);

        if (col >= 0 && col < imageData.width && row >= 0 && row < imageData.height) {
            const index = row * imageData.width + col;
            onHoverPixel(index);
        }
    };

    const handleMouseLeave = () => {
        onHoverPixel(null);
    };

    if (!imageData) return (
        <div className="glass-card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            Waiting for data...
        </div>
    );

    const totalWidth = imageData.width * CELL_WIDTH;
    const totalHeight = imageData.height * CELL_HEIGHT;

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
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                    flex: 1,
                    overflow: 'auto',
                    position: 'relative',
                    background: '#1a1a1a',
                }}
            >
                {/* Spacer to force scrollbars */}
                <div style={{ width: totalWidth, height: totalHeight, position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} />

                {/* Sticky Canvas - stays in viewport */}
                <canvas
                    ref={canvasRef}
                    style={{
                        display: 'block',
                        position: 'sticky',
                        top: 0,
                        left: 0,
                        pointerEvents: 'none' // Let mouse events pass through to container? No, container handles them.
                    }}
                />
            </div>
        </div>
    );
}
