const express = require('express');
const cors = require('cors');
const pino = require('pino');
const pinoHttp = require('pino-http');

const logger = pino({
    level: 'info'
})

const app = express()
const PORT = process.env.PORT || 8001;

const orderRoutes = require("./routes/orderRoutes");
const requestIdMiddleware = require('./middleware/requestIdMiddleware');


app.use(express.json());
app.use(cors())

app.use(requestIdMiddleware);
app.use(pinoHttp({
    logger,
    customProps: (req) => ({requestId: req.requestId})
}));
app.use((req,res,next) => {
    req.log.info(
        {body: req.body, query: req.query},
        "Запрос получен сервисом заказов");
    next();
})

app.use('/api/orders', orderRoutes);


app.listen(PORT, async() => {
    console.log(`Orders service is running on port ${PORT}`);
})