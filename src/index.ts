import { AIServiceClient } from './services/AIServiceClient';
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Add CORS middleware
app.use(bodyParser.json());

// Initialize AI client outside of route handler
const aiClient = new AIServiceClient();

// Initialize AI client when server starts
async function initializeAIClient() {
    await aiClient.initialize();
    console.log('AI Client initialized');
}

app.post('/api/generate-image', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({
                success: false,
                error: 'Prompt is required'
            });
        }

        const imageResult = await aiClient.generateAndStoreImage(prompt);

        if (imageResult.success) {
            res.json(imageResult);
        } else {
            res.status(500).json(imageResult);
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Start server
app.listen(port, async () => {
    await initializeAIClient();
    console.log(`Server running on port ${port}`);
}); 