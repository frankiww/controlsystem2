const express = require('express');
const cors = require('cors');

const app = express()
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(cors())


app.listen(PORT, async() => {
    console.log(`Users service is running on port ${PORT}`);
})