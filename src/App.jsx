import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import ClassCard from './components/ClassCard';
import { mlManager } from './utils/ml';
import { Play, Download, Code } from 'lucide-react';

function App() {
    const [classes, setClasses] = useState([
        { id: 0, name: 'Class 1', images: [] },
        { id: 1, name: 'Class 2', images: [] }
    ]);
    const [isModelLoading, setIsModelLoading] = useState(true);
    const [isTraining, setIsTraining] = useState(false);
    const [trainingProgress, setTrainingProgress] = useState(0); // 0 to 100
    const [modelTrained, setModelTrained] = useState(false);
    const [generatedCode, setGeneratedCode] = useState('');

    useEffect(() => {
        mlManager.loadModel().then(() => setIsModelLoading(false));
    }, []);

    const handleTrain = async () => {
        setIsTraining(true);
        setTrainingProgress(0);

        // Re-initialize classifier to clear old data? 
        // Ideally we should clear, but for now we just add. 
        // This implies "Add directly" is the workflow.

        // Reset classifier if trained before?
        // mlManager.classifier.clearAllClasses(); // Assuming we had this method.
        // Let's implement clear functionality in ml.js or just create new classifier.

        // Check if we have images
        let totalImages = classes.reduce((acc, cls) => acc + cls.images.length, 0);
        if (totalImages === 0) {
            setIsTraining(false);
            return;
        }

        let processed = 0;

        for (let cls of classes) {
            for (let imgSrc of cls.images) {
                await new Promise((resolve) => {
                    const img = new Image();
                    img.src = imgSrc;
                    img.onload = async () => {
                        await mlManager.addExample(img, cls.name);
                        processed++;
                        setTrainingProgress(Math.round((processed / totalImages) * 100));
                        resolve();
                    };
                });
            }
        }

        setIsTraining(false);
        setModelTrained(true);
        generateDownloadableCode();
    };

    const generateDownloadableCode = () => {
        const modelData = mlManager.getClassifierDataset();

        const code = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>My Vision Model</title>
  <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs"></script>
  <script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet"></script>
  <script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/knn-classifier"></script>
  <style>
    body { font-family: sans-serif; background: #1a1a1a; color: white; display: flex; flex-direction: column; alignItems: center; justify-content: center; height: 100vh; margin: 0; }
    video { border: 2px solid #333; border-radius: 8px; margin-bottom: 1rem; }
    h1 { margin-bottom: 0.5rem; }
    #result { font-size: 1.5rem; color: #06b6d4; }
  </style>
</head>
<body>
  <h1>Recognition Model</h1>
  <video id="webcam" autoplay playsinline width="400" height="400"></video>
  <h2 id="result">Waiting...</h2>

  <script>
    const MODEL_DATA = ${modelData};
    
    async function run() {
      const video = document.getElementById('webcam');
      
      // Setup Webcam
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        await new Promise(resolve => video.onloadedmetadata = resolve);
      } catch (e) {
        document.getElementById('result').innerText = "Webcam access denied";
        return;
      }

      // Load Models
      document.getElementById('result').innerText = "Loading models...";
      const net = await mobilenet.load();
      const classifier = knnClassifier.create();
      
      // Restore Classifier
      if (MODEL_DATA) {
        const datasetObj = MODEL_DATA;
        const dataset = {};
        Object.keys(datasetObj).forEach((key) => {
          dataset[key] = tf.tensor(datasetObj[key], [datasetObj[key].length / 1024, 1024]);
        });
        classifier.setClassifierDataset(dataset);
      }

      console.log('Model Loaded');
      document.getElementById('result').innerText = "Model Active";

      while (true) {
        if (classifier.getNumClasses() > 0) {
          const activation = net.infer(video, true);
          try {
            const result = await classifier.predictClass(activation);
            if (result.label) {
                 document.getElementById('result').innerText = \`\${result.label} (\${(result.confidences[result.label] * 100).toFixed(1)}%)\`;
            }
          } catch (e) {
             // prediction error
          }
          activation.dispose();
        }
        await tf.nextFrame();
      }
    }
    run();
  </script>
</body>
</html>`;
        setGeneratedCode(code);
    };

    const downloadCode = () => {
        const blob = new Blob([generatedCode], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'index.html';
        a.click();
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />
            <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

                {isModelLoading && (
                    <div className="glass-card" style={{ marginBottom: '2rem', textAlign: 'center', color: 'var(--accent)' }}>
                        Loading TensorFlow models...
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem' }}>
                    {/* Left Column: Input */}
                    <section>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Training Data</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {classes.map(cls => (
                                <ClassCard
                                    key={cls.id}
                                    classData={cls}
                                    onUpdate={(updated) => {
                                        const newClasses = classes.map(c => c.id === cls.id ? updated : c);
                                        setClasses(newClasses);
                                    }}
                                    onDelete={() => setClasses(classes.filter(c => c.id !== cls.id))}
                                />
                            ))}
                        </div>

                        <button
                            className="btn-secondary"
                            style={{ marginTop: '1.5rem', width: '100%' }}
                            onClick={() => setClasses([...classes, { id: Date.now(), name: `Class ${classes.length + 1}`, images: [] }])}
                        >
                            + Add Class
                        </button>
                    </section>

                    {/* Right Column: Training & Preview */}
                    <section>
                        <div style={{ position: 'sticky', top: '100px' }}>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Model</h2>
                            <div className="glass-card" style={{ marginBottom: '2rem' }}>
                                <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                                    <p style={{ color: 'var(--text-secondary)' }}>
                                        {modelTrained ? "Model trained successfully!" : `Ready to train on ${classes.reduce((acc, c) => acc + c.images.length, 0)} images`}
                                    </p>
                                    {isTraining && (
                                        <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden', marginTop: '1rem' }}>
                                            <div style={{ width: `${trainingProgress}%`, background: 'var(--primary)', height: '100%', transition: 'width 0.3s' }}></div>
                                        </div>
                                    )}
                                </div>
                                <button
                                    disabled={isModelLoading || isTraining || classes.every(c => c.images.length === 0)}
                                    className="btn-primary"
                                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                                    onClick={handleTrain}
                                >
                                    <Play size={20} />
                                    {isTraining ? 'Training...' : 'Train Model'}
                                </button>
                            </div>

                            {modelTrained && generatedCode && (
                                <div className="glass-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h3 style={{ margin: 0 }}>Export</h3>
                                        <button className="btn-secondary" onClick={downloadCode} style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <Download size={16} /> Download HTML
                                        </button>
                                    </div>
                                    <div style={{ background: '#000', padding: '1rem', borderRadius: '8px', overflowX: 'auto', fontSize: '0.8rem', fontFamily: 'monospace', maxHeight: '300px' }}>
                                        <pre style={{ margin: 0 }}>{generatedCode.slice(0, 500)}... (Total: {generatedCode.length} chars)</pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

            </main>
        </div>
    );
}

export default App;
