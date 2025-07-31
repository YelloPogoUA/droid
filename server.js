// server.js (ФИНАЛЬНАЯ ВЕРСИЯ ДЛЯ CEREBRAS API)

const express = require('express');
const { Cerebras } = require('@cerebras/cerebras_cloud_sdk'); // Используем SDK от Cerebras
const app = express();
const port = 3000;

// <-- ВАЖНО: Вставьте сюда свой БЕСПЛАТНЫЙ ключ от Cerebras
const CEREBRAS_API_KEY = 'csk-9v4n4mdwvvhw5nndcw94tmv9xtmejpn25xkjdt2dr4pwmjnc'; 

// Инициализируем клиент Cerebras с вашим ключом
const cerebras = new Cerebras({ apiKey: CEREBRAS_API_KEY });

app.use(express.json());
app.use(express.static(__dirname));

// Имя эндпоинта /api/gemini оставлено, чтобы не менять index.html
app.post('/api/gemini', async (req, res) => {
    const userText = req.body.text;

    if (!userText) {
        return res.status(400).json({ error: 'Текст запроса отсутствует' });
    }
    
    if (!CEREBRAS_API_KEY || CEREBRAS_API_KEY.includes('ВАШ_КЛЮЧ')) {
         return res.status(500).json({ error: 'API ключ Cerebras не был указан на сервере в файле server.js' });
    }

    try {
        // Отправляем запрос в Cerebras (без потоковой передачи)
        const completion = await cerebras.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'Ты AI-ассистент дрона. Ответь кратко и по-дружески как умный дрон. Если пользователь дает команду управления дроном, объясни, что ты можешь сделать: повороты, следование за курсором, смену цветов, масштаба. Если это обычный разговор - общайся естественно.'
                },
                {
                    role: 'user',
                    content: userText
                }
            ],
            model: 'qwen-3-235b-a22b-instruct-2507', // Модель, которую вы нашли
            stream: false, // Важно: получаем ответ целиком, а не по частям
            max_tokens: 256, // Ограничим ответ, чтобы было быстрее
            temperature: 0.7
        });
        
        // Извлекаем текст ответа
        const aiResponseText = completion.choices[0].message.content.trim();
        
        // Адаптируем ответ под формат, который ожидает наш сайт (index.html)
        const clientResponse = {
            candidates: [{ content: { parts: [{ text: aiResponseText }] } }]
        };
        
        res.json(clientResponse);

    } catch (error) {
        console.error('Ошибка на сервере при обращении к Cerebras:', error);
        // Cerebras может возвращать более подробные ошибки
        const errorMessage = error.response?.data?.detail || error.message || 'Неизвестная ошибка API';
        res.status(500).json({ error: `Ошибка API Cerebras: ${errorMessage}` });
    }
});

app.listen(port, () => {
    console.log(`Сервер запущен (режим Cerebras). Откройте в браузере: http://localhost:${port}`);
});