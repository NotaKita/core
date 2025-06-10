require('dotenv').config();
const express = require('express');
const app = express();
const authRoutes = require('./routes/authRoutes');
const companyRoutes = require('./routes/companyRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const errorHandler = require('./middlewares/errorHandler')
const cookieParser = require('cookie-parser');
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/server-status', (_, res) => {
  res.send('Server is running!')
})

// API Routes
app.use('/auth', authRoutes);
app.use('/companies', companyRoutes);
app.use('/invoices', invoiceRoutes);


app.use(errorHandler);
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));