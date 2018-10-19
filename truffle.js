/**
 * Copyright (C) GOYOURLIFE INC. - All Rights Reserved.
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 * Written by Jethro E. Lee (Exce) <jethro.lee@goyourlife.com>, September 2018.
 *
 * Project: `DIO - Decentralized Investigative Organization (去中心化徵信社)`
 *
 * @author Jethro E. Lee (Exce) <jethro.lee@goyourlife.com>
 * @link http://www.goyourlife.com
 * @copyright Copyright &copy; 2018 GOYOURLIFE INC.
 */

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    main: {
      network_id: "1",
      host: "<your (live mainnet) full node address>", 
      port: 8545, 
      gasPrice: 6000000000,    // 9 GWei (determined through current price on the market via https://etherscan.io/gastracker)
      gas: 2200000,      // The actual gas needed can actually be obtained rom ganachecli console... max = 2100591
      from: "<your account address>",
    },
    development: {
      host: "<your developement net, e.g., ganache / ganache-cli>", 
      port: 8545, 
      network_id: "*", // Match any network id
      from: "<your (development net) account>"
    }
  }
};
