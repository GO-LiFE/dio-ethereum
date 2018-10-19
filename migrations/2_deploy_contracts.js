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

const Dio= artifacts.require("Dio.sol");

module.exports = function(deployer, network) {
    if (network == "main") {
        deployer.deploy(
            Dio, 
            1000000000000000,       // 0.001 ETH for initialCovenantSetupRate
            1000000000000000,       // 0.001 ETH for initialChallengeRateInWei
            3000000000000000        // 7 Gwei * 21000 (transfer) = 147000 GWei = 0.000147 ETH, as a result, for safety, use 0.003 for initialMinBalance
        );
    }
    else if (network == "development") {
        deployer.deploy(
            Dio, 
            1000000000000000,       // 0.001 ETH for initialCovenantSetupRate
            1000000000000000,       // 0.001 ETH for initialChallengeRateInWei
            3000000000000000        // 7 Gwei * 21000 (transfer) = 147000 GWei = 0.000147 ETH, as a result, for safety, use 0.003 for initialMinBalance
        );
    }
};
