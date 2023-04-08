const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  hash: String,
  blockNumber: Number,
  timeStamp: Number,
  from: String,
  to: String,
  value: String,
  gas: Number,
  gasPrice: String,
  isError: Boolean,
  txreceipt_status: Number,
  input: String,
  contractAddress: String,
  cumulativeGasUsed: Number,
  gasUsed: Number,
  confirmations: Number
});

const Transaction = mongoose.model('Transaction', transactionSchema);