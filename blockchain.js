//import module to generate hash
const crypto = require("crypto-js");
const EC = require("elliptic").ec;
const ec = new EC('secp256k1');

//each block in the chain
class Block {
    constructor(transactions, timestamp, previousHash) {
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.hash = this.generateHash();
        //value that must be changed to change the hash so that it begins with the required characters
        this.nonce = 0;
    }

    //function to generate hash for the current block
    generateHash() {
        return crypto.SHA256(this.timestamp + JSON.stringify(this.transactions) + this.previousHash + this.nonce).toString();
    }

     //method to mine a block (proof of work)
     mineBlock(diff) {
        while(this.hash.substring(0,diff) !== Array(diff+1).join("0")) {
            this.nonce++;
            this.hash = this.generateHash();
        }
    }
        
    //check if all the transactions in the block is valid
    hasValidTransactions() {
        for (const txn of this.transactions) {
            if (!txn.isValid()) return false;
        }
        return true;
    }
}

class Transaction {
    constructor(from, to, amount) {
        this.fromAddress = from;
        this.toAddress = to;
        this.amount = amount;
    }

    //generate hash of our transation details so that it can be signed
    generateHash() {
        return crypto.SHA256(this.fromAddress + this.toAddress + this.amount).toString();
    }

    //method to sign our transaction so that it can be verified that the correct person has performed it
    //it takes signingKey as a parameter which have both public and private key
    signTransaction(signingKey) {
        //check whether the transaction of correct person is being signed
        if (signingKey.getPublic('hex') !== this.fromAddress) {
            throw new Error('you cannot sign transactions for other wallets');
        }
        //generate a hash for the transaction using generateHash method
        const hashTxn = this.generateHash();
        //sign the generated hash with the signing key pair
        const sig = signingKey.sign(hashTxn, 'base64');
        //assign signature to transaction
        this.signature = sig.toDER('hex');
    }

    //check if the transaction is correctly signed
    isValid() {
        //return true if the transaction is a mining reward
        if(this.fromAddress === null) return true;
         
        if (!this.signature || this.signature.length == 0) {
            throw new Error("transaction not signed!");
        }

        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
        return publicKey.verify(this.generateHash(), this.signature);
    }
}

//main class which creates the whole of blockchain
class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.pendingTransactions = [];
        this.miningReward = 100;
        this.mineDifficulty = 2;
    }

    //create the genesis block so that the chain can be initatied
    createGenesisBlock() {
        return new Block([new Transaction(null,null,0)], 0, "30/05/2023", "0x0");
    }

    //to get the latest block in the chain
    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    //check whether the chain is valid after adding new block
    isChainValid() {
        for (let i = 1; i < this.chain.length; ++i) {
            let previousBlock = this.chain[i-1];
            let currentBlock = this.chain[i];

            if (!currentBlock.hasValidTransactions()) return false;

            if (currentBlock.hash !== currentBlock.generateHash()) return false;
            
            if (currentBlock.previousHash !== previousBlock.hash) return false;
            
            return true;
        }
    }

    //mine pending transactions using this method
    minePendingTransactions(miningRewardAddress) {
        let block = new Block(this.pendingTransactions, Date.now());//in reality all pending transactions is not given to the miner but an option to choose the transactions is given
        block.previousHash = this.getLatestBlock().hash;//set the previousHash property of this block
        block.mineBlock(this.mineDifficulty);
        this.chain.push(block);
        //reset the pending transactions array and make a transaction to the miner for the mining reward
        this.pendingTransactions = [new Transaction(null, miningRewardAddress, this.miningReward)];
    }

    //method to simply create a transaction and add it to the pending transactions array
    addTransaction(transaction) {
        //check if the transaction have to and from address
        if (!transaction.fromAddress || !transaction.toAddress) throw new Error("transaction must contain address");

        //check whether the transaction is valid or not
        if(!transaction.isValid()) throw new Error('the transaction is not valid');

        //simply push the transaction to the pending transactions array
        this.pendingTransactions.push(transaction);
    }

    //method to get balance of an address
    //in block chain blance is not simply in the wallet but we have to calculate it through each transaction of ours
    getBalanceOfAddress(add) {
        let balance = 0;
        for (let block of this.chain) {
            for (let trnx of block.transactions) {
                if (trnx.fromAddress == add) {
                    balance -= trnx.amount;
                }
                if (trnx.toAddress == add) {
                    balance += trnx.amount;
                }
            }
        }
        return balance;
    }
}

module.exports = {Blockchain, Transaction};