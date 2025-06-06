const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware dengan CORS yang diperluas
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Endpoint yang lebih robust
app.post('/api/chat', async (req, res) => {
  try {
    // Validasi input
    if (!req.body.message) {
      return res.status(400).json({ error: 'Pesan tidak boleh kosong' });
    }

    const apiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: [
          {
            role: "system",
            content: "Kamu adalah AbidinAI, asisten AI yang membantu pengguna dengan ramah dan profesional."
          },
          { role: "user", content: req.body.message }
        ],
        temperature: 0.7,
        max_tokens: 1024
      }),
      timeout: 10000 // Timeout 10 detik
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      console.error('Groq API Error:', errorData);
      throw new Error(`API Error: ${apiResponse.status}`);
    }

    const responseData = await apiResponse.json();
    const reply = responseData.choices[0]?.message?.content || "Maaf, saya tidak bisa menjawab saat ini.";

    res.json({ reply });
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ 
      error: 'Terjadi kesalahan internal',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`GROQ_API_KEY exists: ${!!process.env.GROQ_API_KEY}`);
  });
      }
