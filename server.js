// server.js (ФИНАЛЬНАЯ ВЕРСИЯ ДЛЯ CEREBRAS, ГОТОВАЯ К ХОСТИНГУ)

const express = require('express');
const cors = require('cors'); // Добавляем cors
const { Cerebras } = require('@cerebras/cerebras_cloud_sdk');
const app = express();
const port = process.env.PORT || 3000; // Railway использует переменную PORT

// БЕРЕМ КЛЮЧ ИЗ ПЕРЕМЕННЫХ ОКРУЖЕНИЯ RAILWAY
const CEREBRAS_API_KEY = process.env.cerebras_api_key; 
// ^^^ Имя 'cerebras_api_key' должно в точности совпадать с тем, что вы указали на Railway

// Инициализируем клиент Cerebras с ключом из переменных окружения
// Добавляем проверку, чтобы клиент не создавался без ключа
const cerebras = CEREBRAS_API_KEY ? new Cerebras({ apiKey: CEREBRAS_API_KEY }) : null;

app.use(cors()); // РАЗРЕШАЕМ ЗАПРОСЫ С ДРУГИХ САЙТОВ
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
                {
                    role: 'system',
                    content: 'Ты AI-ассистент дрона. Ответь кратко и по-дружески.'
                },
                {
                    role: 'user',
                    content: userText
                }
            ],
            model: 'qwen-3-235b-a22b-instruct-2507',
            stream: false,
            max_tokens: 256,
            temperature: 0.7
        });
        
        const aiResponseText = completion.choices[0].message.content.trim();
        
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