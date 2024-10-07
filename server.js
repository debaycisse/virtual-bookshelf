require('dotenv').config();
const express = require('express');
const routes = require('./routes/index');

const app = express();
const port = process.env.EXP_PORT;
app.use(express.json());
app.use('/api/v1', routes);

app.listen(port, () => {
  console.log(`Server running at http://127.0.0.1:${port}`);
});

module.exports = app;
