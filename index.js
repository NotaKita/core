require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const companyRoutes = require('./routes/companyRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const errorHandler = require('./middlewares/errorHandler')
const cookieParser = require('cookie-parser');
const PORT = process.env.PORT || 3001;

const app = express();

// Trust first proxy (needed for express-rate-limit with X-Forwarded-For)
app.set('trust proxy', 1);

const allowedOrigins = [
  'https://dev.notakita.web.id',
  'http://localhost:5173', // <-- allow local dev
  'http://localhost:3000'
];

app.use(cors({
  origin: function(origin, callback) {
    console.log('CORS check:', { origin, allowedOrigins }); // <--- Add this line
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie']
}));

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