const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/test', (req, res) => {
    res.json({ message: 'Привет от бэкенда LVG-KINO!' });
});

const sessions = [
    {
        id: 1,
        movieTitle: 'Фильм 1',
        time: '2025-05-25T18:00:00Z',
        seats: [
            Array(8).fill().map(() => ({ status: 'free', type: 'pouf', people: 0 })),
            Array(5).fill().map(() => ({ status: 'free', type: 'double', people: 0 })),
            Array(6).fill().map(() => ({ status: 'free', type: 'double', people: 0 })),
            [
                { status: 'free', type: 'quad', people: 0 },
                ...Array(4).fill().map(() => ({ status: 'free', type: 'double', people: 0 })),
                { status: 'free', type: 'quad', people: 0 },
            ],
            [
                { status: 'free', type: 'quad', people: 0 },
                ...Array(3).fill().map(() => ({ status: 'free', type: 'double', people: 0 })),
                { status: 'free', type: 'quad', people: 0 },
            ],
        ],
    },
    {
        id: 2,
        movieTitle: 'Фильм 2',
        time: '2025-05-25T20:00:00Z',
        seats: [
            Array(8).fill().map(() => ({ status: 'free', type: 'pouf', people: 0 })),
            Array(5).fill().map(() => ({ status: 'free', type: 'double', people: 0 })),
            Array(6).fill().map(() => ({ status: 'free', type: 'double', people: 0 })),
            [
                { status: 'free', type: 'quad', people: 0 },
                ...Array(4).fill().map(() => ({ status: 'free', type: 'double', people: 0 })),
                { status: 'free', type: 'quad', people: 0 },
            ],
            [
                { status: 'free', type: 'quad', people: 0 },
                ...Array(3).fill().map(() => ({ status: 'free', type: 'double', people: 0 })),
                { status: 'free', type: 'quad', people: 0 },
            ],
        ],
    },
];

app.get('/api/sessions', (req, res) => {
    console.log('Returning sessions:', sessions.map(s => ({ id: s.id, movieTitle: s.movieTitle, time: s.time })));
    res.json(sessions.map(({ id, movieTitle, time }) => ({ id, movieTitle, time })));
});

app.get('/api/hall/:sessionId', (req, res) => {
    const sessionId = parseInt(req.params.sessionId);
    const session = sessions.find(s => s.id === sessionId);
    if (!session) {
        console.log(`Session ${sessionId} not found`);
        return res.status(404).json({ error: 'Сеанс не найден' });
    }
    console.log(`Returning seats for session ${sessionId}:`, JSON.stringify(session.seats, null, 2));
    res.json({ hallId: 1, seats: session.seats });
});

app.post('/api/book', (req, res) => {
    const { sessionId, row, seat, people } = req.body;
    console.log('Booking request:', { sessionId, row, seat, people });
    const session = sessions.find(s => s.id === sessionId);
    if (!session) {
        console.log(`Session ${sessionId} not found`);
        return res.status(404).json({ error: 'Сеанс не найден' });
    }
    if (row < 0 || row >= session.seats.length || seat < 0 || seat >= session.seats[row].length) {
        console.log(`Invalid seat: row=${row}, seat=${seat}`);
        return res.status(400).json({ error: 'Недопустимое место' });
    }
    const seatData = session.seats[row][seat];
    if (seatData.status === 'booked') {
        console.log(`Seat already booked: row=${row}, seat=${seat}`);
        return res.status(400).json({ error: 'Место уже забронировано' });
    }
    if (seatData.type === 'pouf' && people !== 1) {
        console.log(`Invalid people for pouf: ${people}`);
        return res.status(400).json({ error: 'Пуфик только для 1 человека' });
    }
    if (seatData.type === 'double' && (people < 2 || people > 3)) {
        console.log(`Invalid people for double: ${people}`);
        return res.status(400).json({ error: 'Двухместный диван для 2–3 человек' });
    }
    if (seatData.type === 'quad' && (people < 4 || people > 6)) {
        console.log(`Invalid people for quad: ${people}`);
        return res.status(400).json({ error: 'Четырёхместный диван для 4–6 человек' });
    }
    session.seats[row][seat] = { ...seatData, status: 'booked', people };
    const ticketPrice = 400;
    const totalCost = people * ticketPrice;
    console.log('Seat booked:', { row, seat, people, totalCost });
    console.log(`Updated seats for session ${sessionId}:`, JSON.stringify(session.seats, null, 2));
    res.json({ message: 'Место забронировано', row, seat, people, totalCost });
});

app.post('/api/sessions', (req, res) => {
    const { movieTitle, time } = req.body;
    console.log('Adding session:', { movieTitle, time });
    if (!movieTitle || !time) {
        console.log('Invalid session data');
        return res.status(400).json({ error: 'Название фильма и время обязательны' });
    }
    const newSession = {
        id: sessions.length + 1,
        movieTitle,
        time,
        seats: [
            Array(8).fill().map(() => ({ status: 'free', type: 'pouf', people: 0 })),
            Array(5).fill().map(() => ({ status: 'free', type: 'double', people: 0 })),
            Array(6).fill().map(() => ({ status: 'free', type: 'double', people: 0 })),
            [
                { status: 'free', type: 'quad', people: 0 },
                ...Array(4).fill().map(() => ({ status: 'free', type: 'double', people: 0 })),
                { status: 'free', type: 'quad', people: 0 },
            ],
            [
                { status: 'free', type: 'quad', people: 0 },
                ...Array(3).fill().map(() => ({ status: 'free', type: 'double', people: 0 })),
                { status: 'free', type: 'quad', people: 0 },
            ],
        ],
    };
    sessions.push(newSession);
    console.log('Session added:', newSession);
    res.json({ id: newSession.id, movieTitle, time });
});

app.put('/api/sessions/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const session = sessions.find(s => s.id === id);
    if (!session) {
        console.log(`Session ${id} not found`);
        return res.status(404).json({ error: 'Сеанс не найден' });
    }
    const { movieTitle, time } = req.body;
    session.movieTitle = movieTitle || session.movieTitle;
    session.time = time || session.time;
    console.log('Session updated:', { id, movieTitle: session.movieTitle, time: session.time });
    res.json({ id, movieTitle: session.movieTitle, time: session.time });
});

app.delete('/api/sessions/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = sessions.findIndex(s => s.id === id);
    if (index === -1) {
        console.log(`Session ${id} not found`);
        return res.status(404).json({ error: 'Сеанс не найден' });
    }
    sessions.splice(index, 1);
    console.log(`Session ${id} deleted`);
    res.json({ message: 'Сеанс удалён' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});