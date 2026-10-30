import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { connectDB } from './config/db.js';

import path from 'path'
import { fileURLToPath } from 'url';

import userRouter from './routes/userRoute.js';
import itemRouter from './routes/itemRoute.js';
import cartRouter from './routes/cartRoute.js'
import orderRouter from './routes/orderRoute.js';
import aiRouter from './routes/aiRoute.js';


const app = express();
const port = process.env.PORT || 4000;

const configuredOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
const allowedOrigins = new Set([
    'http://localhost:5173',
    'http://localhost:5174',
    ...configuredOrigins,
]);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)

//MIDDLEWARE
app.use(cors({
    origin: (origin, callback) => {
        if(!origin || allowedOrigins.has(origin)) {
            callback(null, true)
        }

        else
        {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true,
})
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//DATABASE
connectDB()

//ROUTES
app.use('/api/user', userRouter)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/api/items', itemRouter)
app.use('/api/cart', cartRouter)
app.use('/api/orders', orderRouter)
app.use('/api/ai', aiRouter)

app.get('/',(req, res) => {
    res.send('API WORKING')
})

app.listen(port, () => {
    console.log(`Server Started on http://localhost:${port}`)
})