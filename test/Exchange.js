const { ethers } = require("hardhat");
const { expect } = require("chai");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("Exchange", () => {
  // Tests go inside here
  let feeAccount, deployer, exchange, token1, token2;
  const feePercent = 10;
  beforeEach(async () => {
    // Fetch Token from Blockchain

    const Token = await ethers.getContractFactory("Token");
    const Exchange = await ethers.getContractFactory("Exchange");
    token1 = await Token.deploy("Dapp University", "DAPP", "1000000");
    token2 = await Token.deploy("Dapp University2", "DAPP2", "1000000");

    accounts = await ethers.getSigners();
    deployer = accounts[0];
    feeAccount = accounts[1];
    user1 = accounts[2];
    user2 = accounts[3];

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
        .depositToken(token1.address, amount);
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
          exchange.connect(user1).depositToken(token1.address, amount)
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
          .depositToken(token1.address, amount);
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
        .depositToken(token1.address, amount);
      result = await transaction.wait();
    });

    it("returns the user balance", async () => {
      expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(
        amount
      );
    });
  });

  describe("Making orders", async () => {
    let transaction, result;
    let amount = tokens(1);

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
          .depositToken(token1.address, amount);
        result = await transaction.wait();

        // make order
        transaction = await exchange
          .connect(user1)
          .makeOrder(token2.address, amount, token1.address, amount);
        result = await transaction.wait();
      });

      it("tracks the newly  created order", async () => {
        expect(await exchange.orderCount()).to.equal(1);
      });

      it("emit a order event", async () => {
        const event = result.events[0]; // 2 events are emited
        expect(event.event).to.equal("Order");

        const args = event.args;
        expect(args.id).to.equal(1);
        expect(args.user).to.equal(user1.address);
        expect(args.tokenGet).to.equal(token2.address);
        expect(args.amountGet).to.equal(amount);
        expect(args.tokenGive).to.equal(token1.address);
        expect(args.amountGive).to.equal(amount);
        expect(args.timestamp).to.at.least(1);
      });
    });

    describe("Failure", async () => {
      it("Rjects", async () => {
        await expect(
          exchange
            .connect(user1)
            .makeOrder(token2.address, tokens(1), token1.address, tokens(1))
        ).to.be.reverted;
      });
    });
  });

  describe(" Order actions", async () => {
    let transaction, result;
    let amount = tokens(1);

    beforeEach(async () => {
      //Deposite Token1
      transaction = await token1
        .connect(user1)
        .approve(exchange.address, amount);
      result = await transaction.wait();
      transaction = await exchange
        .connect(user1)
        .depositToken(token1.address, amount);
      result = await transaction.wait();
      // Give tokens to user2
      transaction = await token2
        .connect(deployer)
        .transfer(user2.address, tokens(100));
      result = await transaction.wait();

      // user2 deposite tokens
      transaction = await token2
        .connect(user2)
        .approve(exchange.address, tokens(2));
      result = await transaction.wait();

      transaction = await exchange
        .connect(user2)
        .depositToken(token2.address, tokens(2));
      result = await transaction.wait();
      // make order
      transaction = await exchange
        .connect(user1)
        .makeOrder(token2.address, amount, token1.address, amount);
      result = await transaction.wait();
    });

    describe("Cancelling orders", async () => {
      describe("Success", async () => {
        beforeEach(async () => {
          transaction = await exchange.connect(user1).cancelOrder(1);
          result = await transaction.wait();
        });
        it("updated canceled orders", async () => {
          expect(await exchange.orderCancelled(1)).to.equal(true);
        });

        it("emit a order event", async () => {
          const event = result.events[0]; // 2 events are emited
          expect(event.event).to.equal("Cancel");

          const args = event.args;
          expect(args.id).to.equal(1);
          expect(args.user).to.equal(user1.address);
          expect(args.tokenGet).to.equal(token2.address);
          expect(args.amountGet).to.equal(amount);
          expect(args.tokenGive).to.equal(token1.address);
          expect(args.amountGive).to.equal(amount);
          expect(args.timestamp).to.at.least(1);
        });
      });

      describe("Failure", async () => {
        beforeEach(async () => {
          transaction = await token1
            .connect(user1)
            .approve(exchange.address, amount);
          result = await transaction.wait();
          //Deposite Token
          transaction = await exchange
            .connect(user1)
            .depositToken(token1.address, amount);
          result = await transaction.wait();

          // make order
          transaction = await exchange
            .connect(user1)
            .makeOrder(token2.address, amount, token1.address, amount);
          result = await transaction.wait();
        });
        it("Rjects invalid order ids", async () => {
          const invalidOrderId = 9999;
          await expect(exchange.connect(user1).cancelOrder(invalidOrderId)).to
            .be.reverted;
        });

        it("Rjects unauthorized cancelations order", async () => {
          await expect(exchange.connect(user2).cancelOrder(1)).to.be.reverted;
        });
      });
    });

    describe("Filling orders", async () => {
      describe("Success", async () => {
        beforeEach(async () => {
          // user2 fills the order
          transaction = await exchange.connect(user2).fillOrder(1);
          result = await transaction.wait();
        });
        it("Executes the trade and charges fees", async () => {
          //Token Give
          expect(
            await exchange.balanceOf(token1.address, user1.address)
          ).to.equal(tokens(0));
          expect(
            await exchange.balanceOf(token1.address, user2.address)
          ).to.equal(tokens(1));
          expect(
            await exchange.balanceOf(token1.address, feeAccount.address)
          ).to.equal(tokens(0));
          // Token Get
          expect(
            await exchange.balanceOf(token2.address, user1.address)
          ).to.equal(tokens(1));
          expect(
            await exchange.balanceOf(token2.address, user2.address)
          ).to.equal(tokens(0.9));
          expect(
            await exchange.balanceOf(token2.address, feeAccount.address)
          ).to.equal(tokens(0.1));
        });

        // Update filling order
        it("updates filled orders", async () => {
          //Token Give
          expect(await exchange.orderFilled(1)).to.equal(true);
        });

        it("emits a Trade event", async () => {
          const event = result.events[0]; // 2 events are emited
          expect(event.event).to.equal("Trade");

          const args = event.args;
          expect(args.id).to.equal(1);
          expect(args.user).to.equal(user2.address);
          expect(args.tokenGet).to.equal(token2.address);
          expect(args.amountGet).to.equal(tokens(1));
          expect(args.tokenGive).to.equal(token1.address);
          expect(args.amountGive).to.equal(tokens(1));
          expect(args.creator).to.equal(user1.address);
          expect(args.timestamp).to.at.least(1);
        });
      });

      describe("Failure", async () => {
        it("Rjects invalid order ids", async () => {
          const invalidOrderId = 9999;
          await expect(exchange.connect(user2).fillOrder(invalidOrderId)).to.be
            .reverted;
        });

        it("Rjects already filled  order", async () => {
          transaction = await exchange.connect(user2).fillOrder(1);
          result = await transaction.wait();
          await expect(exchange.connect(user2).fillOrder(1)).to.be.reverted;
        });

        it("Rjects canceled   order", async () => {
          transaction = await exchange.connect(user1).cancelOrder(1);
          result = await transaction.wait();
          await expect(exchange.connect(user2).fillOrder(1)).to.be.reverted;
        });
      });
    });
  });
});
