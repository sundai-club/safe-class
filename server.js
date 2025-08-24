const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.static('.'));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error('ERROR: GEMINI_API_KEY not found in environment variables');
    console.log('Please add your Gemini API key to the .env file');
    process.exit(1);
}

app.post('/api/gemini', async (req, res) => {
    try {
        const { prompt, type = 'feedback' } = req.body;

        if (!prompt) {
            return res.status(400).json({ 
                error: 'Prompt is required' 
            });
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: type === 'hint' ? 0.5 : 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    }
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Gemini API Error:', response.status, errorData);
            
            if (response.status === 400 && errorData.includes('API_KEY_INVALID')) {
                return res.status(401).json({ 
                    error: 'Invalid API key. Please check your Gemini API key configuration.' 
                });
            }
            
            return res.status(response.status).json({ 
                error: `API request failed: ${response.status}` 
            });
        }

        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

        res.json({ 
            response: generatedText,
            type: type
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'Internal server error. Please try again.' 
        });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok',
        message: 'Safe Class Simulation API is running',
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.use((req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found' 
    });
});

app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ 
        error: 'Internal server error' 
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Safe Class Simulation server running on port ${PORT}`);
    console.log(`📚 Training simulation available at: http://localhost:${PORT}`);
    console.log(`🔧 API health check: http://localhost:${PORT}/api/health`);
    
    if (process.env.NODE_ENV === 'development') {
        console.log(`💡 Development mode: API key loaded from .env file`);
    }
});