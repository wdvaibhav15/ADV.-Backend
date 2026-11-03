import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  return res.status(200).json({ message: 'All is good!' });
});

app.get('/', (req, res) => {
  return res.status(200).json({ message: 'Welcome to the Cloud Deployment API!' });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});