const express = require('express');
const cors = require('cors');

const app = express()
const PORT = process.env.PORT || 8001;

const orderRoutes = require("./routes/orderRoutes");

app.use(express.json());
app.use(cors())

app.use('/api/orders', orderRoutes);


app.listen(PORT, async() => {
    console.log(`Orders service is running on port ${PORT}`);
})