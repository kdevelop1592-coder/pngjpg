import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PixelViewer from './components/PixelViewer';
import DataInspector from './components/DataInspector';
import { processImage } from './utils/ImageProcessor';
import { Upload, FileImage } from 'lucide-react';

function App() {
    const [imageData, setImageData] = useState(null);
    const [activePixelIndex, setActivePixelIndex] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [resolution, setResolution] = useState(64);
    const [sourceFile, setSourceFile] = useState(null);

    // Re-process image when resolution changes
    useEffect(() => {
        if (sourceFile) {
            processImageWithStatus(sourceFile);
        }
    }, [resolution]);

    const processImageWithStatus = async (file) => {
        setIsProcessing(true);
        try {
            const data = await processImage(file, resolution);
            setImageData(data);
            setActivePixelIndex(null);
        } catch (error) {
            console.error(error);
            alert("Failed to process image");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSourceFile(file);
        processImageWithStatus(file);
    };

    const handleSampleImage = async () => {
        // Create a simple 4x4 sample image programmatically
        const canvas = document.createElement('canvas');
        canvas.width = 4;
        canvas.height = 4;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 4, 4);
        gradient.addColorStop(0, 'red');
        gradient.addColorStop(0.5, 'green');
        gradient.addColorStop(1, 'blue');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 4, 4);

        const url = canvas.toDataURL();
        const res = await fetch(url);
        const blob = await res.blob();

        setSourceFile(blob);
        processImageWithStatus(blob);
    };

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />
            <main style={{ flex: 1, padding: '1rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                {/* Control Bar */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <label className="btn-primary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Upload size={18} />
                        Upload Image
                        <input type="file" onChange={handleFileUpload} accept="image/*" style={{ display: 'none' }} />
                    </label>
                    <button className="btn-secondary" onClick={handleSampleImage} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileImage size={18} />
                        Load Sample
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.9rem' }}>Resolution: {resolution}px</span>
                        <input
                            type="range"
                            min="16"
                            max="100"
                            step="4"
                            value={resolution}
                            onChange={(e) => setResolution(Number(e.target.value))}
                            style={{ cursor: 'pointer' }}
                        />
                    </div>
                </div>

                {/* Main Visualization Area */}
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', minHeight: 0 }}>

                    {/* Left: Pixel Visualizer */}
                    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        <h2 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem 0', textAlign: 'center' }}>1. Computer Vision (Pixels)</h2>
                        <PixelViewer
                            imageData={imageData}
                            activePixelIndex={activePixelIndex}
                            onHoverPixel={setActivePixelIndex}
                        />
                    </div>

                    {/* Right: Data Inspector */}
                    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        <h2 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem 0', textAlign: 'center' }}>2. Computer Memory (Data)</h2>
                        <DataInspector
                            imageData={imageData}
                            activePixelIndex={activePixelIndex}
                            onHoverPixel={setActivePixelIndex}
                        />
                    </div>

                </div>
            </main>
        </div>
    );
}

export default App;

