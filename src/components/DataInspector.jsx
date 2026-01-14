import React, { useEffect, useRef } from 'react';

export default function DataInspector({ imageData, activePixelIndex, onHoverPixel }) {
    const scrollRef = useRef(null);
    const itemRefs = useRef({});

    useEffect(() => {
        if (activePixelIndex !== null && itemRefs.current[activePixelIndex] && scrollRef.current) {
            const el = itemRefs.current[activePixelIndex];
            // Simple scroll into view logic could go here if needed, 
            // but might be too jumpy for hover. highlighting is enough for now.
        }
    }, [activePixelIndex]);

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
                    Each box represents one pixel's color code [R, G, B]
                </p>
            </div>

            <div
                ref={scrollRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1rem',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem'
                }}
            >
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${imageData.width}, 1fr)`,
                    gap: '2px'
                }}>
                    {imageData.pixels.map((pixel, i) => (
                        <div
                            key={i}
                            ref={el => itemRefs.current[i] = el}
                            onMouseEnter={() => onHoverPixel(i)}
                            className="data-cell"
                            style={{
                                padding: '4px',
                                background: activePixelIndex === i ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0,0,0,0.2)',
                                border: activePixelIndex === i ? '1px solid #00ff00' : '1px solid transparent',
                                color: activePixelIndex === i ? 'white' : '#aaa',
                                borderRadius: '4px',
                                textAlign: 'center',
                                cursor: 'crosshair',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.1s'
                            }}
                            title={`Pixel ${i}: ${pixel.hex}`}
                        >
                            [{pixel.r},{pixel.g},{pixel.b}]
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
