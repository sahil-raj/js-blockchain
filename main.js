// public: 042e17180f51e590ddf18457329890826e824be461f4f3630ab5f193c21d9027b78619c9ccbbdf3009661ee8f1251fd6de446d59ddf6e01c66d03b1603365880a2
// private: 16125321b77bd081b645afe7483b9727c94f532cb0282b7f7198df25f39b3fce

const EC = require("elliptic").ec;
const ec = new EC('secp256k1');

const {Blockchain, Transaction} = require("./blockchain");

const myKey = ec.keyFromPrivate("16125321b77bd081b645afe7483b9727c94f532cb0282b7f7198df25f39b3fce");

const myWalletAddress = myKey.getPublic('hex');

const myChain = new Blockchain();

const myTransaction1 = new Transaction(myWalletAddress, "test-wallet", 10);
console.log(myChain.pendingTransactions);

myTransaction1.signTransaction(myKey);

myChain.addTransaction(myTransaction1);
console.log(myChain.pendingTransactions);

myChain.minePendingTransactions(myWalletAddress);

console.log(myChain.getBalanceOfAddress(myWalletAddress), myChain.getBalanceOfAddress("test-wallet"));

myChain.minePendingTransactions(myWalletAddress);

console.log(myChain.isChainValid());

let y = new Transaction('test-wallet',myWalletAddress,100);

y.signTransaction(myKey);

myChain.chain[1].transactions.push(y);

console.log(myChain.isChainValid());