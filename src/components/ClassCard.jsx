import React, { useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

export default function ClassCard({ classData, onUpdate, onDelete }) {
    const fileInputRef = useRef(null);

    const handleFiles = (files) => {
        const fileArray = Array.from(files).filter(file => file.type.startsWith('image/'));

        Promise.all(fileArray.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
        })).then(images => {
            onUpdate({ ...classData, images: [...classData.images, ...images] });
        });
    };

    return (
        <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <input
                    value={classData.name}
                    onChange={(e) => onUpdate({ ...classData, name: e.target.value })}
                    placeholder="Class Name"
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        borderBottom: '1px solid var(--glass-border)',
                        padding: '0.25rem',
                        width: '60%'
                    }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {classData.images.length} images
                    </span>
                    {onDelete && (
                        <button
                            onClick={onDelete}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    maxHeight: '150px',
                    overflowY: 'auto'
                }}
            >
                {classData.images.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative', aspectRatio: '1' }}>
                        <img
                            src={img}
                            alt={`class-${idx}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                        />
                    </div>
                ))}
            </div>

            <div
                onClick={() => fileInputRef.current.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault();
                    handleFiles(e.dataTransfer.files);
                }}
                style={{
                    border: '2px dashed var(--glass-border)',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
            >
                <Upload size={24} style={{ marginBottom: '0.5rem' }} />
                <p style={{ margin: 0, fontSize: '0.9rem' }}>Click or drop images</p>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFiles(e.target.files)}
                />
            </div>
        </div>
    );
}
