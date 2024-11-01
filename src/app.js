import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import compression from "compression"
import * as Routers from "./routes/index.js"

const corsConfig = {
  credentials: true,
  origin: process.env.FRONTEND_URL
}

const app = express()

app.use(cors(corsConfig))
app.use(compression())
app.use(cookieParser())
app.use(express.json())
app.use("/auth", Routers.authRouter)
app.use("/user", Routers.userRouter)
app.use("/plaid", Routers.plaidRouter)

export default app