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

import "./Dio.sol";

contract DioTest is Dio {
    constructor(uint256 initialCovenantSetupRate, uint256 initialChallengeRateInWei) public {
        _owner = msg.sender;
        _covenantSetupRateInWei = initialCovenantSetupRate;
        _challengeRateInWei = initialChallengeRateInWei;
    }

    /**
     * For test purpose only!!!
     * Remember to remove this when doing production deployment!!!
     * This function is a compromise since `onlyOwner` and pretend address as
     * another party (in which case `onlyOwner` is not added, and 5th parameter
     * is used).
     */
    function endorseCovenantTest(uint covenantID, address covenantContractor, string covenantStatement, address endorserAddr) public returns (bool result) {
        return _endorseCovenant(covenantID, covenantContractor, covenantStatement, endorserAddr);
    }

    /**
     * Test purpose only!!!
     * Remember to remove this when doing production deployment!!!
     */
    function getNumChallengesTest(address addressBeingChallenged) view public returns (uint numChanlleges) {
        return _getNumChallenges(addressBeingChallenged);
    }

    /**
     * Test purpose only!!!
     * Remember to remove this when doing production deployment!!!
     */
    function getChallengeTest(uint index, address addressBeingChallenged) view public returns (address challenger, string phrase, uint createTime) {
        return _getChallenge(index, addressBeingChallenged);
    }
}
