import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '1d'
  },
  email: {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD
  },
  frontend: {
    url: process.env.FRONTEND_URL
  },
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
}; 