import { Router } from "express"
import jsonwebtoken from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import axios from "axios"
import 'dotenv/config'
import User from "../db/models/User.js"
import { verifyToken } from '../middleware/verifyToken.js'
import mongoose from "mongoose"

const authRouter = Router()
.post("/register", async (req, res) => {
  try {
    const existingEmail = await User.findOne({ email: req.body.email })
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already in use' })
    }
    const existingNumber = await User.findOne({ phoneNumber: req.body.phoneNumber })
    if (existingNumber) {
      return res.status(409).json({ error: 'Username already in use' })
    }

    const newUser = new User({
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      firstName: req.body.givenName,
      lastName: req.body.familyName,
      fullName: req.body.name,
      password: req.body.password,
    })
    let user = await newUser.save()

    res.status(200).json({ message: "User registered successfully", status: "ok", data: user })
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' })
  }
})
.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const passwordMatch = req.body.password == user.password
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jsonwebtoken.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30 days' })
    res.status(200).json({ token })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})
.get("/user", async (req, res) => {
  try {
    const decoded = jsonwebtoken.decode(req.query.token)
    const user = await User.findOne({ _id: new mongoose.Types.ObjectId(decoded.id) })
    res.status(200).json({ user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default authRouter