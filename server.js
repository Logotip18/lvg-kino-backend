require('dotenv').config();
   const express = require('express');
   const cors = require('cors');

   const app = express();

   // Настройка CORS
   app.use(cors({
       origin: ['http://localhost:3001', 'https://lvgkino.ru', 'https://lvg-kino.netlify.app'],
       methods: ['GET', 'POST', 'PUT', 'DELETE'],
       allowedHeaders: ['Content-Type'],
   }));
   app.use(express.json());

   // Мок-данные для сеансов
   let sessions = [
       { id: 1, movieTitle: 'Дюна 2', time: '2025-05-25T18:00:00Z' },
       { id: 2, movieTitle: 'Аватар 3', time: '2025-05-25T20:00:00Z' },
   ];

   // Мок-данные для зала
   const hallData = {
       hallId: 1,
       seats: [
           Array(8).fill().map(() => ({ status: 'free', type: 'pouf', people: 0 })),
           Array(5).fill().map(() => ({ status: 'free', type: 'double', people: 0 })),
           Array(6).fill().map(() => ({ status: 'free', type: 'double', people: 0 })),
           [
               { status: 'free', type: 'quad', people: 0 },
               { status: 'free', type: 'double', people: 0 },
               { status: 'free', type: 'double', people: 0 },
               { status: 'free', type: 'double', people: 0 },
               { status: 'free', type: 'double', people: 0 },
               { status: 'free', type: 'quad', people: 0 },
           ],
           [
               { status: 'free', type: 'quad', people: 0 },
               { status: 'free', type: 'double', people: 0 },
               { status: 'free', type: 'double', people: 0 },
               { status: 'free', type: 'double', people: 0 },
               { status: 'free', type: 'quad', people: 0 },
           ],
       ],
   };

   // Получить все сеансы
   app.get('/api/sessions', (req, res) => {
       res.json(sessions);
   });

   // Получить схему зала для сеанса
   app.get('/api/hall/:sessionId', (req, res) => {
       const sessionId = parseInt(req.params.sessionId);
       if (sessions.find(s => s.id === sessionId)) {
           res.json(hallData);
       } else {
           res.status(404).json({ error: 'Session not found' });
       }
   });

   // Создать новый сеанс
   app.post('/api/sessions', (req, res) => {
       const { movieTitle, time } = req.body;
       if (!movieTitle || !time) {
           return res.status(400).json({ error: 'Missing movieTitle or time' });
       }
       const newSession = {
           id: sessions.length ? sessions[sessions.length - 1].id + 1 : 1,
           movieTitle,
           time,
       };
       sessions.push(newSession);
       res.status(201).json(newSession);
   });

   // Обновить сеанс
   app.put('/api/sessions/:id', (req, res) => {
       const id = parseInt(req.params.id);
       const { movieTitle, time } = req.body;
       const session = sessions.find(s => s.id === id);
       if (!session) {
           return res.status(404).json({ error: 'Session not found' });
       }
       if (movieTitle) session.movieTitle = movieTitle;
       if (time) session.time = time;
       res.json(session);
   });

   // Удалить сеанс
   app.delete('/api/sessions/:id', (req, res) => {
       const id = parseInt(req.params.id);
       const sessionIndex = sessions.findIndex(s => s.id === id);
       if (sessionIndex === -1) {
           return res.status(404).json({ error: 'Session not found' });
       }
       sessions.splice(sessionIndex, 1);
       res.json({ message: 'Session deleted' });
   });

   // Забронировать место
   app.post('/api/book', (req, res) => {
       const { sessionId, row, seat, people } = req.body;
       if (!sessionId || row == null || seat == null || !people) {
           return res.status(400).json({ error: 'Missing required fields' });
       }
       const session = sessions.find(s => s.id === sessionId);
       if (!session) {
           return res.status(404).json({ error: 'Session not found' });
       }
       if (row >= hallData.seats.length || seat >= hallData.seats[row].length) {
           return res.status(400).json({ error: 'Invalid seat' });
       }
       if (hallData.seats[row][seat].status === 'booked') {
           return res.status(400).json({ error: 'Seat already booked' });
       }
       hallData.seats[row][seat].status = 'booked';
       hallData.seats[row][seat].people = people;
       const totalCost = people * 400;
       res.json({ message: 'Booking successful', totalCost });
   });

   const PORT = process.env.PORT || 3000;
   app.listen(PORT, () => {
       console.log(`Server running on port ${PORT}`);
   });