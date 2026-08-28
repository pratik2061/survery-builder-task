import 'dotenv/config'
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import surveyRouter from './routes/survey.route';
import authRouter from './routes/auth.route';

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({
    origin: [
        process.env.FRONTEND_URL!
    ].filter(Boolean),
    credentials: true
}));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use('/api/surveys', surveyRouter)
app.use('/api/auth', authRouter)

app.get('/health', (req, res) => {
    res.json({
        message: "server running",
        status: "ok"
    })
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
