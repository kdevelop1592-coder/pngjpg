import React, { useEffect, useRef } from 'react';

export default function DataInspector({ imageData, activePixelIndex, onHoverPixel }) {
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
        canvas.width = totalWidth * dpr;
        canvas.height = totalHeight * dpr;
        canvas.style.width = `${totalWidth}px`;
        canvas.style.height = `${totalHeight}px`;

        ctx.scale(dpr, dpr);
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.font = `${FONT_SIZE}px monospace`;

        // Clear canvas
        ctx.fillStyle = '#1e1e1e'; // Dark background matching theme roughly
        ctx.fillRect(0, 0, totalWidth, totalHeight);

        // Draw cells
        pixels.forEach((pixel, i) => {
            const col = i % width;
            const row = Math.floor(i / width);
            const x = col * CELL_WIDTH;
            const y = row * CELL_HEIGHT;

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
