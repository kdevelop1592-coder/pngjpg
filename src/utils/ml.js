import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as knnClassifier from '@tensorflow-models/knn-classifier';

class MLManager {
    constructor() {
        this.net = null;
        this.classifier = null;
        this.isLoaded = false;
    }

    async loadModel() {
        if (this.isLoaded) return;
        try {
            console.log('Loading MobileNet...');
            this.net = await mobilenet.load();
            console.log('MobileNet loaded');
            this.classifier = knnClassifier.create();
            console.log('KNN Classifier created');
            this.isLoaded = true;
        } catch (error) {
            console.error('Error loading models:', error);
            throw error;
        }
    }

    async addExample(imageElement, classId) {
        if (!this.isLoaded) await this.loadModel();
        try {
            const activation = this.net.infer(imageElement, true);
            this.classifier.addExample(activation, classId);
            activation.dispose();
        } catch (e) {
            console.error("Error adding example:", e);
        }
    }

    async predict(imageElement) {
        if (!this.isLoaded || this.classifier.getNumClasses() === 0) return null;

        // Check if imageElement is valid
        if (!imageElement || !imageElement.width || !imageElement.height) {
            console.warn('Invalid image element passed to predict');
            return null;
        }

        const activation = this.net.infer(imageElement, true);
        const result = await this.classifier.predictClass(activation);
        activation.dispose();
        return result;
    }

    getClassifierDataset() {
        if (!this.classifier) return "{}";
        const dataset = this.classifier.getClassifierDataset();
        const datasetObj = {};
        Object.keys(dataset).forEach((key) => {
            let data = dataset[key].dataSync();
            datasetObj[key] = Array.from(data);
        });
        return JSON.stringify(datasetObj);
    }

    async loadClassifierDataset(datasetJson) {
        if (!this.isLoaded) await this.loadModel();
        const datasetObj = JSON.parse(datasetJson);
        const dataset = {};
        Object.keys(datasetObj).forEach((key) => {
            dataset[key] = tf.tensor(datasetObj[key], [datasetObj[key].length / 1024, 1024]);
        });
        this.classifier.setClassifierDataset(dataset);
    }
}

export const mlManager = new MLManager();
