// server.js (ФИНАЛЬНАЯ ПОЛНАЯ ВЕРСИЯ С РУЧНОЙ НАСТРОЙКОЙ CORS)

const express = require('express');
const { Cerebras } = require('@cerebras/cerebras_cloud_sdk');
const app = express();
const port = process.env.PORT || 3000;

const CEREBRAS_API_KEY = process.env.cerebras_api_key; 
const cerebras = CEREBRAS_API_KEY ? new Cerebras({ apiKey: CEREBRAS_API_KEY }) : null;

// Ручная настройка CORS, которая решает проблему
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Разрешаем доступ с любого домена
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
});

app.use(express.json());

app.post('/api/gemini', async (req, res) => {
    const userText = req.body.text;

    if (!cerebras) {
         return res.status(500).json({ error: 'API ключ Cerebras не настроен на сервере.' });
    }
    if (!userText) {
        return res.status(400).json({ error: 'Текст запроса отсутствует' });
    }

    try {
        const completion = await cerebras.chat.completions.create({
            messages: [
                { role: 'system', content: 'Ты AI-ассистент дрона. Ответь кратко и по-дружески.' },
                { role: 'user', content: userText }
            ],
            model: 'qwen-3-235b-a22b-instruct-2507',
            stream: false,
            max_tokens: 256,
            temperature: 0.7
        });
        
        const aiResponseText = completion.choices[0].message.content.trim();
        
        // Эта часть кода была обрезана
        const clientResponse = {
            candidates: [{ content: { parts: [{ text: aiResponseText }] } }]
        };
        
        res.json(clientResponse);

    } catch (error) {
        console.error('Ошибка на сервере при обращении к Cerebras:', error);
        const errorMessage = error.response?.data?.detail || error.message || 'Неизвестная ошибка API';
        res.status(500).json({ error: `Ошибка API Cerebras: ${errorMessage}` });
    }
});

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port} (режим Cerebras)`);
});