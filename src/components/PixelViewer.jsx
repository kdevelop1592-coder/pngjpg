import React, { useEffect, useRef, useState } from 'react';

export default function PixelViewer({ imageData, activePixelIndex, onHoverPixel }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    // Configurable pixel size for visualization
    const PIXEL_SIZE = 20;
    const GAP = 1;

    useEffect(() => {
        if (!imageData || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const { width, height, pixels } = imageData;

        // Calculate functionality canvas size
        canvas.width = width * (PIXEL_SIZE + GAP);
        canvas.height = height * (PIXEL_SIZE + GAP);

        // Draw Pixels
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        pixels.forEach((pixel, i) => {
            const x = (i % width);
            const y = Math.floor(i / width);

            // Draw background for transparency
            ctx.fillStyle = '#eee';
            ctx.fillRect(
                x * (PIXEL_SIZE + GAP),
                y * (PIXEL_SIZE + GAP),
                PIXEL_SIZE,
                PIXEL_SIZE
            );

            // Draw actual pixel
            ctx.fillStyle = `rgba(${pixel.r}, ${pixel.g}, ${pixel.b}, ${pixel.a / 255})`;
            ctx.fillRect(
                x * (PIXEL_SIZE + GAP),
                y * (PIXEL_SIZE + GAP),
                PIXEL_SIZE,
                PIXEL_SIZE
            );

            // Draw Highlight
            if (i === activePixelIndex) {
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 2;
                ctx.strokeRect(
                    x * (PIXEL_SIZE + GAP),
                    y * (PIXEL_SIZE + GAP),
                    PIXEL_SIZE,
                    PIXEL_SIZE
                );
            }
        });

    }, [imageData, activePixelIndex]);

    const handleMouseMove = (e) => {
        if (!imageData || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const col = Math.floor(x / (PIXEL_SIZE + GAP));
        const row = Math.floor(y / (PIXEL_SIZE + GAP));

        if (col >= 0 && col < imageData.width && row >= 0 && row < imageData.height) {
            const index = row * imageData.width + col;
            onHoverPixel(index);
        } else {
            onHoverPixel(null);
        }
    };

    return (
        <div
            ref={containerRef}
            className="pixel-viewer glass-card"
            style={{
                overflow: 'auto',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '2rem',
                height: '100%'
            }}
        >
            {imageData ? (
                <canvas
                    ref={canvasRef}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => onHoverPixel(null)}
                    style={{ cursor: 'crosshair', imageRendering: 'pixelated' }}
                />
            ) : (
                <div style={{ color: 'var(--text-secondary)' }}>
                    Upload an image to see its atoms!
                </div>
            )}
        </div>
    );
}
