import React, { useState } from 'react';
import Header from './components/Header';
import PixelViewer from './components/PixelViewer';
import DataInspector from './components/DataInspector';
import { processImage } from './utils/ImageProcessor';
import { Upload, FileImage } from 'lucide-react';

function App() {
    const [imageData, setImageData] = useState(null);
    const [activePixelIndex, setActivePixelIndex] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        try {
            const data = await processImage(file);
            setImageData(data);
            setActivePixelIndex(null);
        } catch (error) {
            console.error(error);
            alert("Failed to process image");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSampleImage = async () => {
        // Create a simple 4x4 sample image programmatically or load a specialized one
        // For now, let's just create a data URL for a simple tiny gradient
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

        setIsProcessing(true);
        processImage(blob).then(setImageData).finally(() => setIsProcessing(false));
    };

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />
            <main style={{ flex: 1, padding: '1rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                {/* Control Bar */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', gap: '1rem' }}>
                    <label className="btn-primary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Upload size={18} />
                        Upload Image
                        <input type="file" onChange={handleFileUpload} accept="image/*" style={{ display: 'none' }} />
                    </label>
                    <button className="btn-secondary" onClick={handleSampleImage} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileImage size={18} />
                        Load Sample (4x4)
                    </button>
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

