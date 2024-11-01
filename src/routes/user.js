import { Router } from "express"
import 'dotenv/config'
import User from "../db/models/User.js"

const userRouter = Router()
  .post("/", async (req, res) => {
    try {
      console.log(req.body)
      res.status(200).json({ message: 'all good' })
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

export default userRouter