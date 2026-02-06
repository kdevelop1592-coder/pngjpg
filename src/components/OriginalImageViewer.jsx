import React, { useRef, useEffect, useState } from 'react';

export default function OriginalImageViewer({ imageUrl, onPixelClick }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const clickStartRef = useRef({ x: 0, y: 0 });

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
        clickStartRef.current = { x: e.clientX, y: e.clientY };

        if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        setOffset({ x: newX, y: newY });
    };

    const handleMouseUp = (e) => {
        setIsDragging(false);
        if (containerRef.current) containerRef.current.style.cursor = 'grab';

        // Check for click (minimal movement)
        const dist = Math.hypot(e.clientX - clickStartRef.current.x, e.clientY - clickStartRef.current.y);
        if (dist < 5 && imageObj && onPixelClick) {
            handleImageClick(e);
        }
    };

    const handleImageClick = (e) => {
        if (!canvasRef.current || !imageObj) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Inverse Transform:
        // Screen -> Canvas (already done with rect)
        // Canvas -> Untranslate Center & Offset -> Unscale -> Uncenter Image
        // x_img = (x_canvas - center_x - offset_x) / scale + img_w / 2

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        const rawX = (clickX - centerX - offset.x) / scale;
        const rawY = (clickY - centerY - offset.y) / scale;

        const imgX = rawX + imageObj.width / 2;
        const imgY = rawY + imageObj.height / 2;

        // Check bounds
        if (imgX >= 0 && imgX < imageObj.width && imgY >= 0 && imgY < imageObj.height) {
            // Emitting normalized coordinates (0 to 1)
            const u = imgX / imageObj.width;
            const v = imgY / imageObj.height;

            // We pass an object to distinguish from a simple integer index
            onPixelClick({ u, v });
        }
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
                onMouseLeave={() => setIsDragging(false)}
                onWheel={handleWheel}
            >
                <canvas ref={canvasRef} style={{ display: 'block' }} />
            </div>
        </div>
    );
}
