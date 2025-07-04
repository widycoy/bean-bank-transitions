import express from 'express';
import dotenv from 'dotenv';
import customerRoutes from './routes/customerRoutes.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT 

app.use(express.json());
app.use('/api/customers', customerRoutes);

app.listen (PORT, () => {
  console.log(`Server is running at http:localhost:${PORT}`);
});