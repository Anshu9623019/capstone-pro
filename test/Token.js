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
  let token;
  beforeEach(async () => {
    // Fetch Token from Blockchain
    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy("Dapp University", "DAPP", "1000000");
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
  });
});
