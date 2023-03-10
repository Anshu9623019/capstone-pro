// const {
//     time,
//     loadFixture,
//   } = require("@nomicfoundation/hardhat-network-helpers");
//   const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

const { ethers } = require("hardhat");
const { expect } = require("chai");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};
describe("Token", () => {
  // Tests go inside here
  let token, accounts, deployer, receiver;
  beforeEach(async () => {
    // Fetch Token from Blockchain
    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy("Dapp University", "DAPP", "1000000");
    accounts = await ethers.getSigners();
    deployer = accounts[0];
    receiver = accounts[1];
    exchange = accounts[2];
  });

  describe("Deployment", () => {
    const name = "Dapp University";
    const symbol = "DAPP";
    const decimals = "18";
    const totalSupply = tokens("1000000");
    it("has correct name", async () => {
      //Read token name
      const name = await token.name();
      // Check that the name correct
      expect(name).to.equal(name);
    });
    it("has correct Symbol", async () => {
      //Read token symbol
      const symbol = await token.symbol();
      // Check that the symbol correct
      expect(symbol).to.equal(symbol);
    });
    it("has correct Decimals", async () => {
      expect(await token.decimals()).to.equal(decimals);
    });
    it("has correct totalSupply", async () => {
      expect(await token.totalSupply()).to.equal(totalSupply);
    });
    it("has correct balanceOf", async () => {
      expect(await token.balanceOf(deployer.address)).to.equal(totalSupply);
    });
  });

  describe("Sending Token", async () => {
    let amount, transaction, result;
    describe("Success", async () => {
      beforeEach(async () => {
        amount = tokens(100);
        transaction = await token
          .connect(deployer)
          .transfer(receiver.address, amount);
        result = await transaction.wait();
      });
      it("Transfer token balance", async () => {
        expect(await token.balanceOf(deployer.address)).to.equal(
          tokens(999900)
        );
        expect(await token.balanceOf(receiver.address)).to.equal(amount);
      });

      it("emit a transfer event", async () => {
        const event = result.events[0];
        expect(event.event).to.equal("Transfer");

        const args = event.args;
        expect(args.from).to.equal(deployer.address);
        expect(args.to).to.equal(receiver.address);
        expect(args.value).to.equal(amount);
      });
    });

    describe("Failure", async () => {
      it("reject insufficient balance", async () => {
        const invalidAmount = tokens(1000000000000);
        await expect(
          token.connect(deployer).transfer(receiver.address, invalidAmount)
        ).to.be.reverted;
      });

      it("reject invalid recipeint", async () => {
        const amount = tokens(100);
        await expect(
          token
            .connect(deployer)
            .transfer("0x0000000000000000000000000000000000000000", amount)
        ).to.be.reverted;
      });
    });
  });

  describe("Approving Token", async () => {
    let amount, transaction, result;
    beforeEach(async () => {
      amount = tokens(100);
      transaction = await token
        .connect(deployer)
        .approve(exchange.address, amount);
      result = await transaction.wait();
    });

    describe("Success", async () => {
      it("Allocates an allowance for delegated token spending", async () => {
        expect(
          await token.allowance(deployer.address, exchange.address)
        ).to.equal(amount);
      });
      it("emit a approval event", async () => {
        const event = result.events[0];
        expect(event.event).to.equal("Approval");

        const args = event.args;
        expect(args.owner).to.equal(deployer.address);
        expect(args.spender).to.equal(exchange.address);
        expect(args.value).to.equal(amount);
      });
    });

    describe("Failure", async () => {
      it("rejects invalid spenders", async () => {
        await expect(
          token
            .connect(deployer)
            .approve("0x0000000000000000000000000000000000000000", amount)
        ).to.be.reverted;
      });
    });
  });

  describe("Delegated Token Transfer", () => {
    let amount, transaction, result;

    beforeEach(async () => {
      amount = tokens(100);
      transaction = await token
        .connect(deployer)
        .approve(exchange.address, amount);
      result = await transaction.wait();
    });

    describe("Success", () => {
      beforeEach(async () => {
        transaction = await token
          .connect(exchange)
          .transferFrom(deployer.address, receiver.address, amount);
        result = await transaction.wait();
      });

      it("transfer token balances", async () => {
        expect(await token.balanceOf(deployer.address)).to.be.equal(
          ethers.utils.parseUnits("999900", "ether")
        );
        expect(await token.balanceOf(receiver.address)).to.be.equal(amount);
      });

      it("reset the allowance", async () => {
        expect(
          await token.allowance(deployer.address, exchange.address)
        ).to.be.equal(0);
      });

      it("emit a transfer event", async () => {
        const event = result.events[0];
        expect(event.event).to.equal("Transfer");

        const args = event.args;
        expect(args.from).to.equal(deployer.address);
        expect(args.to).to.equal(receiver.address);
        expect(args.value).to.equal(amount);
      });
    });

    describe("Failure", async () => {
      const invalidAmount = token(10000000000);
      await expect(
        token
          .connect(exchange)
          .transferFrom(deployer.address, receiver, invalidAmount).to.be
          .reverted
      );
    });
  });
});
