import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
  email: String,
  phoneNumber: String,
  firstName: String,
  lastName: String,
  fullName: String,
  password: String,
  accessToken: String,
  accounts: [String],
  verified: {
    type: Boolean,
    default: false
  },
})

export default mongoose.model('User', userSchema)