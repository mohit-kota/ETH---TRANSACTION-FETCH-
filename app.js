const express = require("express");
const mongoose = require("mongoose");
const app = express();
const PORT = 3000;

const cron = require("node-cron");
//const fetch = require('node-fetch')
const axios = require("axios");
const router = express.Router();

const uri =
  "mongodb+srv://mohithkota70:mohitkota70@cluster0.on6osqo.mongodb.net/test";

mongoose
  .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected...");
  })
  .catch((err) => {
    console.log(err);
  });

require("./models/transactions");
const Transaction = mongoose.model("Transaction");

// Endpoint to fetch transactions for a given address
app.get("/fetchtransactions/:address", async (req, res) => {
  const { address } = req.params;
  //   const apiKey = process.env.ETHERSCAN_API_KEY; // You will need to set up your own API key
  const apiUrl = `https://api-goerli.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=asc&apikey=N12756K3R1GF293JTAMY8VKK8DSKSXAZQ2`;
  // default address we use 0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae
  try {
    const response = await axios.get(apiUrl);
    const transactions = response.data.result.filter(
      (tx) => tx.txreceipt_status === "1"
    ); // Only include successful transactions
    const json_data = transactions;

    res.json(json_data);
    await Transaction.insertMany(transactions);
    console.log("Transaction Fetched Successfully");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching transactions" });
  }
});

app.get("/", async (req, res) => {
  res.status(200);

  res.send(
    `Hey This is a web application to fetch Eth crypto  transactions of a user.
     Try these urls to get to know more about this web application
     <br>
     <hr />
     /fetchtransactions/'Your address' (to fetch the transaction of that particular user address and insert it into mongodb database) ; 
     <br>
     <hr />
     /eth_live_price  (for LIVE PRICE OF ETH in inr rupees) ;
     <hr />
     <br>
     /transactions/'Your address' ; (it fetch the transactions of that user and sends the balance to that address and current live price of ETH);
     <hr />

     to test use <b>0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae<b> as your address
    `
  );
});

app.get("/eth_live_price", async (request, response) => {
  async function fetchEthereumPrice() {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr"
    );
    const data = response.data.ethereum.inr;
    return data;
  }
  //const price1 = fetchEthereumPrice();

  const EthereumPrice = require("./models/liveprice");
  async function insertEthereumPrice(price) {
    const ethereumPrice = new EthereumPrice({ price });
    await ethereumPrice.save();
  }
  // Schedule the cron job to run every 10 minutes
  cron.schedule("*/1 * * * *", async () => {
    const price = await fetchEthereumPrice();
    console.log(price);
    response.status(200);
    response.send({ price });
    // await connection.query('INSERT INTO prices (price) VALUES (?)', [price]);
    alert("live price is " + price);
    insertEthereumPrice(price);
    console.log("Price inserted successfully into db , the price is " + price);
  });
});

async function fetchEthereumPrice() {
  const response = await axios.get(
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr"
  );
  const data = response.data.ethereum.inr;
  return data;
}

app.get("/transactions/:address", async (req, res) => {
  const { address } = req.params;
  //   const apiKey = process.env.ETHERSCAN_API_KEY; // You will need to set up your own API key
  const apiUrl = `https://api-goerli.etherscan.io/api?module=account&action=txlist&address=0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae&startblock=0&endblock=99999999&page=1&offset=10&sort=asc&apikey=N12756K3R1GF293JTAMY8VKK8DSKSXAZQ2`;

  try {
    const response = await axios.get(apiUrl);
    const transactions = response.data.result.filter(
      (tx) => tx.txreceipt_status === "1"
    ); // Only include successful transactions
    const json_data = transactions;

    let balance = 0;

    // Calculate the balance based on the transactions
    transactions.forEach((transaction) => {
      if (transaction.to === address) {
        balance += transaction.value;
      } else if (transaction.from === address) {
        balance -= transaction.value;
      }
    });

    // Return the balance and Ethereum price as JSON

    // res.json(json_data);
    //await Transaction.insertMany(transactions);
    const ethereumPrice = await fetchEthereumPrice();
    res.json({
      balance,
      ethereumPrice,
    });
    console.log(" User Transaction & Balance Fetched Successfully");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching transactions" });
  }
});

// Start the server
app.listen(PORT, (error) => {
  if (!error)
    console.log(
      "Server is Successfully Running, and App is listening on port " + PORT
    );
  else console.log("Error occurred, server can't start", error);
});
