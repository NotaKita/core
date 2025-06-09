const express = require('express');
require('dotenv').config();
const app = express();
const authRoutes = require('./routes/authRoutes');


app.use(express.json());
app.use('/auth', authRoutes);

app.get('/server-status', (req, res) => {
  res.send('Server is running!')
})

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));