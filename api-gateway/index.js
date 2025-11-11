const express = require('express');
const cors = require('cors');

const app = express()
const PORT = process.env.PORT || 8080;

const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");
const aggregRoutes = require("./routes/aggregRoutes");
const authRoutes = require("./routes/authRoutes");
const authMiddleware = require('./middleware/authMiddleware');




app.use(express.json());
app.use(cors())
app.use('/auth', authRoutes);

app.use(authMiddleware);
app.use('/users', aggregRoutes);
app.use('/users', userRoutes);
app.use('/orders', orderRoutes);



app.get('/health', (req, res) => {
    res.json({status: 'API Gateway is running'});
});


app.listen(PORT, async() => {
    console.log(`API Gateway is running on port ${PORT}`);
});