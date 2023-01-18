const { ethers } = require("hardhat");
const { expect } = require("chai");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("Exchange", () => {
  // Tests go inside here
  let feeAccount, deployer, exchange, token1;
  const feePercent = 10;
  beforeEach(async () => {
    // Fetch Token from Blockchain

    const Token = await ethers.getContractFactory("Token");
    const Exchange = await ethers.getContractFactory("Exchange");
    token1 = await Token.deploy("Dapp University", "DAPP", "1000000");

    accounts = await ethers.getSigners();
    deployer = accounts[0];
    feeAccount = accounts[1];
    user1 = accounts[2];

    amount = tokens(100);
    let transaction = await token1
      .connect(deployer)
      .transfer(user1.address, amount);

    exchange = await Exchange.deploy(feeAccount.address, feePercent);
  });

  describe("Deployment", () => {
    it("tracks the fee account", async () => {
      expect(await exchange.feeAccount()).to.equal(feeAccount.address);
    });

    it("tracks the fee percent", async () => {
      expect(await exchange.feePercent()).to.equal(feePercent);
    });
  });

  describe("Deposit Tokens", async () => {
    let transaction, result;
    amount = tokens(10);

    beforeEach(async () => {
      //Approve Token
      transaction = await token1
        .connect(user1)
        .approve(exchange.address, amount);
      result = await transaction.wait();
      //Deposite Token
      transaction = await exchange
        .connect(user1)
        .depositeToken(token1.address, amount);
      result = await transaction.wait();
    });
    describe("Success", async () => {
      it("tracks the token deposite", async () => {
        expect(await token1.balanceOf(exchange.address)).to.equal(amount);
        expect(await exchange.tokens(token1.address, user1.address)).to.equal(
          amount
        );
        expect(
          await exchange.balanceOf(token1.address, user1.address)
        ).to.equal(amount);
      });

      it("emit a approval event", async () => {
        const event = result.events[1]; // 2 events are emited
        expect(event.event).to.equal("Deposit");

        const args = event.args;
        expect(args.token).to.equal(token1.address);
        expect(args.user).to.equal(user1.address);
        expect(args.amount).to.equal(amount);
        expect(args.balance).to.equal(amount);
      });
    });

    describe("Failure", async () => {
      it("fails when no token ", async () => {
        // Don't approve any tokens before depositing
        await expect(
          exchange.connect(user1).depositeToken(token1.address, amount)
        ).to.be.reverted;
      });
    });
  });

  describe("Withdrawing Tokens", async () => {
    let transaction, result;
    let amount = tokens(10);

    describe("Success", async () => {
      beforeEach(async () => {
        //Approve Token
        transaction = await token1
          .connect(user1)
          .approve(exchange.address, amount);
        result = await transaction.wait();
        //Deposite Token
        transaction = await exchange
          .connect(user1)
          .depositeToken(token1.address, amount);
        result = await transaction.wait();

        // Withdraw tokens
        transaction = await exchange
          .connect(user1)
          .withdrawToken(token1.address, amount);
        result = await transaction.wait();
      });

      it("tracks the token deposite", async () => {
        expect(await token1.balanceOf(exchange.address)).to.equal(0);
        expect(await exchange.tokens(token1.address, user1.address)).to.equal(
          0
        );
        expect(
          await exchange.balanceOf(token1.address, user1.address)
        ).to.equal(0);
      });

      it("emit a approval event", async () => {
        const event = result.events[1]; // 2 events are emited
        expect(event.event).to.equal("Withdraw");

        const args = event.args;
        expect(args.token).to.equal(token1.address);
        expect(args.user).to.equal(user1.address);
        expect(args.amount).to.equal(amount);
        expect(args.balance).to.equal(0);
      });
    });

    describe("Failure", async () => {
      it("fails for insufficient  balances", async () => {
        // Attempt to withdraw token withot depositing
        await expect(
          exchange.connect(user1).withdrawToken(token1.address, amount)
        ).to.be.reverted;
      });
    });
  });

  describe("Checking balance", async () => {
    let transaction, result;
    let amount = tokens(1);

    beforeEach(async () => {
      //Approve Token
      transaction = await token1
        .connect(user1)
        .approve(exchange.address, amount);
      result = await transaction.wait();
      //Deposite Token
      transaction = await exchange
        .connect(user1)
        .depositeToken(token1.address, amount);
      result = await transaction.wait();
    });

    it("returns the user balance", async () => {
      expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(
        amount
      );
    });
  });
});
