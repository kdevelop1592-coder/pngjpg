import React, { useRef, useEffect, useState } from 'react';

export default function OriginalImageViewer({ imageUrl }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (!imageUrl || !canvasRef.current || !containerRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            // Fit image to container initially
            const container = containerRef.current;
            const containerAspect = container.clientWidth / container.clientHeight;
            const imgAspect = img.width / img.height;

            let initialScale = 1;
            if (imgAspect > containerAspect) {
                initialScale = (container.clientWidth * 0.9) / img.width;
            } else {
                initialScale = (container.clientHeight * 0.9) / img.height;
            }

            // Set initial state only if it's a new image loaded (naively checking via scale === 1 might be reset by parent, but local state persists)
            // For now, let's just draw whenever render happens.

            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;

            // Draw
            draw(ctx, img, canvas.width, canvas.height, initialScale, { x: 0, y: 0 });

            // Update state with initial values if this is the first load of this image? 
            // Actually, better to control draw via state.

            // But for simplicity in this effect, we just want to ensure we have the image object ready.
            // We should probably store the image object in state or ref to avoid reloading.
        };
        img.src = imageUrl;

    }, [imageUrl]);

    // Better approach: Load image once, then trigger redraws based on state
    const [imageObj, setImageObj] = useState(null);

    useEffect(() => {
        if (!imageUrl) {
            setImageObj(null);
            return;
        }
        const img = new Image();
        img.onload = () => {
            setImageObj(img);
            // Reset view on new image
            setScale(1);
            setOffset({ x: 0, y: 0 });
        };
        img.src = imageUrl;
    }, [imageUrl]);

    useEffect(() => {
        if (!imageObj || !canvasRef.current || !containerRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const container = containerRef.current;

        // Resize canvas to fill container
        if (canvas.width !== container.clientWidth || canvas.height !== container.clientHeight) {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate centered position
        // Current logic: Image is drawn at (center + offset) * scale ??? 
        // Let's do standard pan/zoom logic:
        // Translate to center -> scale -> translate offset

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        ctx.save();
        ctx.translate(centerX + offset.x, centerY + offset.y);
        ctx.scale(scale, scale);

        // Draw image centered
        ctx.drawImage(imageObj, -imageObj.width / 2, -imageObj.height / 2);

        ctx.restore();

    }, [imageObj, scale, offset]);


    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
        // change cursor style
        if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        setOffset({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        if (containerRef.current) containerRef.current.style.cursor = 'grab';
    };

    const handleWheel = (e) => {
        e.preventDefault();
        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;
        const newScale = Math.min(Math.max(0.1, scale + delta * scale * 5), 20); // Zoom limit
        setScale(newScale);
    };

    if (!imageUrl) return (
        <div className="glass-card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <p>Upload an image to view original</p>
        </div>
    );

    return (
        <div
            className="glass-card"
            style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Original Image</h3>
                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                    Zoom: {(scale * 100).toFixed(0)}%
                </div>
            </div>
            <div
                ref={containerRef}
                style={{ flex: 1, overflow: 'hidden', position: 'relative', cursor: 'grab', background: '#111' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
            >
                <canvas ref={canvasRef} style={{ display: 'block' }} />
            </div>
        </div>
    );
}
