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

pragma solidity ^0.4.24;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Dio.sol";

contract TestDio {
    uint public initialBalance = 1 ether; // [Jehtro 20181010] Attention : you'll need this to test payable functions.
    Dio dio = Dio(DeployedAddresses.Dio());
    
    function testCovenantSetupRate() public {
        uint256 origRate = dio.getCovenantSetupRate();
        Assert.equal(origRate, 1000000000000000, "original rate shall be of value 1000000000000000");

        /**
         * [Jethro 20181010] Below test (regarding onlyOwner modifier) is not easily feasible, see https://ethereum.stackexchange.com/questions/56533/onlyowner-and-testing-question and https://ethereum.stackexchange.com/questions/38756/how-to-test-contract-functions-with-onlyowner-modifier.
         * In case of testing payalbe function, see https://delegatecall.com/questions/how-to-test-payable-function-in-soliditytruffle-380e7305-9d15-4453-acb3-52ea3125df18
         */
        /*
        uint256 newRate = 5;
        dio.setCovenantSetupRate(newRate);
        uint256 retRate = dio.getCovenantSetupRate();
        Assert.equal(retRate, newRate, "getCovenantSetupRate() shall match setCovenantSetupRate()");

        dio.setCovenantSetupRate(origRate).value(0.001 ether);    // revert back to original rate
        */
    }

    function testSetupCovenant() public {
        address endorserAddress = 0xD5b3A2B2a04ad4E3c2C8302430eC488cFEE148e7;
        uint numCovenantsWaiting = dio.getNumCovenantsWaiting(endorserAddress);
        dio.setupCovenant.value(1000000000000000)(endorserAddress, "我是大雄。玉子 (0xd5b3a2b2a04ad4e3c2c8302430ec488cfee148e7) 是我媽媽");
        uint newNumCovenantsWaiting = dio.getNumCovenantsWaiting(endorserAddress);
        Assert.equal(newNumCovenantsWaiting, numCovenantsWaiting + 1, "Number of convenants should increment one as new covenant created.");
        
        uint covenantID;
        address covenantContractor;
        address covenantEndorser; 
        string memory covenantStatement;
        Dio.CovenantState covenantState;
        (covenantID, covenantContractor, covenantEndorser, covenantStatement, covenantState) = dio.getCovenantsWaiting(endorserAddress, newNumCovenantsWaiting - 1);
        Assert.equal(covenantID, 0, "Created covenant under test's id shall be of value 0");
        Assert.equal(covenantContractor, this, "Covenant under test's contractor shall be this tester");
        Assert.equal(covenantEndorser, endorserAddress, "Covenant under test's endorser shall be 0xD5b3A2B2a04ad4E3c2C8302430eC488cFEE148e7");
        Assert.equal(uint(covenantState), uint(Dio.CovenantState.WAITING), "Covenant under test shall be of state WAITING");
    }

    function testEndorseCovenant() public {
        address endorserAddress = 0xD5b3A2B2a04ad4E3c2C8302430eC488cFEE148e7;
        uint numCovenantsWaiting = dio.getNumCovenantsWaiting(endorserAddress);
        Assert.equal(numCovenantsWaiting, 1, "Number of convenants should be one as new covenant created.");

        bool result = dio.endorseCovenantTest(0, this, "我是大雄。玉子 (0xd5b3a2b2a04ad4e3c2c8302430ec488cfee148e7) 是我媽媽", endorserAddress);
        Assert.equal(result, true, "Endorsement on an existing covenant shall be successful.");

        numCovenantsWaiting = dio.getNumCovenantsWaiting(endorserAddress);
        Assert.equal(numCovenantsWaiting, 0, "Number of convenants waiting shall be 0 since the covenant is endorsed.");
    }

    function testChallenge() public {
        address addressBeingChallenged = 0xD5b3A2B2a04ad4E3c2C8302430eC488cFEE148e7;
        string memory challengePhrase = "火星茉莉二手暴";
        uint numChallenges = dio.getNumChallengesTest(addressBeingChallenged);
        dio.setupChallenge.value(1000000000000000)(addressBeingChallenged, challengePhrase); 
        uint newNumChallenges = dio.getNumChallengesTest(addressBeingChallenged);
        Assert.equal(newNumChallenges, numChallenges + 1, "Number of challenges should increment one as new challenge created.");

        address challenger;
        string memory phrase;
        uint createTime;
        (challenger, phrase, createTime) = dio.getChallengeTest(newNumChallenges - 1, addressBeingChallenged);
        Assert.equal(challenger, this, "Challenger shall be this tester");
        Assert.equal(phrase, challengePhrase, "Challenge phrase shall be equal");
    }
}
