const express = require('express');
const cors = require('cors');

const app = express()
const PORT = process.env.PORT || 8080;

const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");
const aggregRoutes = require("./routes/aggregRoutes");
const authRoutes = require("./routes/authRoutes");

const authMiddleware = require('./middleware/authMiddleware');
const requestIdMiddleware = require('./middleware/requestIdMiddleware');


app.use(express.json());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID']
}));
app.use(requestIdMiddleware);
app.use('/v1/auth', authRoutes);

app.use(authMiddleware);
app.use('/v1/users', aggregRoutes);
app.use('/v1/users', userRoutes);
app.use('/v1/orders', orderRoutes);



app.get('/health', (req, res) => {
    res.json({status: 'API Gateway is running'});
});


app.listen(PORT, async() => {
    console.log(`API Gateway is running on port ${PORT}`);
});