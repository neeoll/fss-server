import { Router } from "express"
import 'dotenv/config'
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import axios from "axios"
import User from "../db/models/User.js"
import jsonwebtoken from 'jsonwebtoken'
import mongoose from "mongoose";

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration)

const plaidRouter = Router()
  .post("/createLinkToken", async (req, res) => {
    const { id } = req.body
    const user = await User.findOne({ _id: new mongoose.Types.ObjectId(id) })
    if (!user) return res.status(401).json({ error: "Unauthorized" })

    const request = {
      user: {
        client_user_id: user._id
      },
      client_name: "Financial Services Solution",
      products: ['auth'],
      language: 'en',
      country_codes: ['US'],
      android_package_name: process.env.ANDROID_PACKAGE_NAME
    }

    try {
      const createTokenResponse = await plaidClient.linkTokenCreate(request)
      console.log('createTokenResponse: ', createTokenResponse.data)
      return res.status(200).json(createTokenResponse.data)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: "Internal server error" })
    }
  })
  .post('/setAccessToken', async (req, res) => {
    const { publicToken } = req.body
    const request = { public_token: publicToken }

    try {
      const tokenExchangeResponse = await plaidClient.itemPublicTokenExchange(request)
      console.log(tokenExchangeResponse.data)
      const accessToken = tokenExchangeResponse.data.access_token

      const accountsBalanceGetResponse = await plaidClient.accountsBalanceGet({ access_token: accessToken })
      const balances = accountsBalanceGetResponse.data
      
      const accounts = balances.accounts.map(account => account.account_id)
      
      await User.updateOne({ email: 'arias.noel24@gmail.com' }, { $set: { accessToken: tokenExchangeResponse.data.access_token, accounts: accounts }})
      return res.status(200).json(tokenExchangeResponse.data)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: "Internal server error" })
    }
  })
  .get('/balance', async (req, res) => {
    const request = { access_token: req.query.accessToken }
    try {
      const response = await plaidClient.accountsBalanceGet(request)
      console.log('balance: ', response.data)
      res.status(200).json(response.data)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Internal server error' })
    }
  })
  .get('/transactions', async (req, res) => {
    const request = { access_token: req.query.accessToken }
    try {
      const response = await plaidClient.transactionsSync(request)
      res.status(200).json(response.data)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Internal server error' })
    }
  })
  .post("/createTransferAuthorization", async (req, res) => {
    const { request } = req.body
    try {
      const transferAuthorizationCreateResponse = await plaidClient.transferAuthorizationCreate(request)
      res.status(200).json(transferAuthorizationCreateResponse.data)
    } catch (error) {
      console.error(error)
      res.status(200).json({ error: 'Internal server error' })
    }
  })
  .post("/createTransfer", async (req, res) => {
    const { request } = req.body
    try {
      const transferCreateResponse = await plaidClient.transferCreate(request)
    } catch (error) {
      console.error(error)
      res.status(200).json({ error: 'Internal server error' })
    }
  })
  .post("/createTransferIntent", async (req, res) => {
    try {
      const { request } = req.body
      const transferIntentCreateResponse = await plaidClient.transferAuthorizationCreate(request)
      res.status(200).json(transferIntentCreateResponse.data)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Internal server error' })
    }
  })
  .post("/createTransferLinkToken", async (req, res) => {
    const { transferIntentId, authToken, accessToken, requestData } = req.body

    console.log(requestData)

    try {
      const decoded = jsonwebtoken.decode(authToken)
      const user = await User.findOne({ _id: decoded.id })
      
      const linkTokenRequest = {
        user: {
          client_user_id: user.id
        },
        client_name: 'Financial Services Solution',
        products: ['transfer'],
        language: 'en',
        country_codes: ['US'],
        link_customization_name: 'fss_transfer',
        android_package_name: process.env.ANDROID_PACKAGE_NAME,
        access_token: accessToken,
      }

      const linkResponse = await plaidClient.linkTokenCreate(linkTokenRequest)
      console.log(linkResponse.data)
      res.status(200).json(linkResponse.data)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

export default plaidRouter

const data = {
  "accounts": [
    {
      "account_id": "vvPkqoyajLUm6D9gYzgkFryXOyxANyfprQoLz", 
      "balances": [Object], 
      "mask": "2537", 
      "name": "High Yield Savings Acct", 
      "official_name": "High Yield Savings Acct", 
      "subtype": "savings", 
      "type": "depository"
    }
  ], 
  "item": {
    "available_products": [
      "balance", 
      "identity"
    ], 
    "billed_products": ["auth"], 
    "consent_expiration_time": "2025-11-01T13:48:54Z", 
    "consented_products": ["auth", "identity"], 
    "error": null, 
    "institution_id": "ins_10", 
    "item_id": "om05d1Lx3JsjVgRq1Nq9UVJvz6daELHBJaqNB", 
    "products": ["auth"], 
    "update_type": "background", 
    "webhook": ""
  }, 
  "request_id": "63ufOsvfoVxlyPL"
}