require('dotenv').config();
const express = require('express');
const app = express();
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middlewares/errorHandler')
const cookieParser = require('cookie-parser');
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.get('/server-status', (req, res) => {
  res.send('Server is running!')
})

app.use('/auth', authRoutes);

app.use(errorHandler);
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));