import React from 'react';
import { Sparkles } from 'lucide-react';

export default function Header() {
    return (
        <header style={{
            padding: '1.5rem 2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            borderBottom: '1px solid var(--glass-border)',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(10px)',
            position: 'sticky',
            top: 0,
            zIndex: 100
        }}>
            <div style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                padding: '0.5rem',
                borderRadius: '12px',
                display: 'flex'
            }}>
                <Sparkles size={24} color="white" />
            </div>
            <div>
                <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>VisionCode</h1>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Train models in your browser & export code
                </p>
            </div>
        </header>
    );
}
