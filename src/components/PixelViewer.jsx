import React, { useEffect, useRef, useState } from 'react';

export default function PixelViewer({ imageData, activePixelIndex, onHoverPixel, pixelSize = 20, onZoom, onPixelClick }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    // Configurable pixel size for visualization
    const GAP = 1;

    useEffect(() => {
        if (!imageData || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const { width, height, pixels } = imageData;

        // Calculate functionality canvas size
        canvas.width = width * (pixelSize + GAP);
        canvas.height = height * (pixelSize + GAP);

        // Draw Pixels
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        pixels.forEach((pixel, i) => {
            const x = (i % width);
            const y = Math.floor(i / width);

            // Draw background for transparency
            ctx.fillStyle = '#eee';
            ctx.fillRect(
                x * (pixelSize + GAP),
                y * (pixelSize + GAP),
                pixelSize,
                pixelSize
            );

            // Draw actual pixel
            ctx.fillStyle = `rgba(${pixel.r}, ${pixel.g}, ${pixel.b}, ${pixel.a / 255})`;
            ctx.fillRect(
                x * (pixelSize + GAP),
                y * (pixelSize + GAP),
                pixelSize,
                pixelSize
            );

            // Draw Highlight
            if (i === activePixelIndex) {
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 2;
                ctx.strokeRect(
                    x * (pixelSize + GAP),
                    y * (pixelSize + GAP),
                    pixelSize,
                    pixelSize
                );
            }
        });

    }, [imageData, activePixelIndex, pixelSize]);

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

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const col = Math.floor(x / (pixelSize + GAP));
        const row = Math.floor(y / (pixelSize + GAP));

        if (col >= 0 && col < imageData.width && row >= 0 && row < imageData.height) {
            const index = row * imageData.width + col;
            onHoverPixel(index);
        } else {
            onHoverPixel(null);
        }
    };

    const handleWheel = (e) => {
        if (e.ctrlKey) {
            // Prevent browser zoom if possible, though React event might be too late for some browsers
            // But main goal is to detect intent
            // e.preventDefault(); // React synthetic events might warn about this if passive.

            // Zoom In/Out
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
                height: '100%'
            }}
        >
            {imageData ? (
                <canvas
                    ref={canvasRef}
                    onClick={handleClick}
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
