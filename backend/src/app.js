import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import customerRoutes from './routes/customerRoutes.js';
import masterRoutes from './routes/masterRoutes.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());

// Serves image, PDF, etc. files from the public/uploads folder
app.use('/uploads', express.static('public/uploads'));

// Routes
app.use('/api/customer', customerRoutes);
app.use('/api/master', masterRoutes);


// Default Route
app.get('/', (req, res) => {
  res.send('Bean Bank API is running');
});

// Global error handler (opsional)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
