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

contract owned {
    address _owner;

    constructor() public {
        _owner = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender == _owner);
        _;
    }

    function transferOwnership(address newOwner) onlyOwner public {
        _owner = newOwner;
    }
}

contract Dio is owned {
    enum CovenantState { INVALID, WAITING, COVENANTED }
    struct Covenant {
        uint id;
        address contractor;
        address endorser;
        string statement;
        CovenantState state;
    }
    Covenant[] _covenants;
    mapping(address => uint[]) _covenantsLookup;    // maps contractor / endorser's address to array of index to <covenants : struct >
    mapping(address => uint[]) _covenantsWaitingLookup;    // maps endorser's address to array of index to <covenants : struct >

    struct Challenge {
        address challenger;
        string phrase;
        uint createTime;
    }
    mapping(address => Challenge[]) _challenges;      // maps being challenged one's address to struct of {challenger's address, challenge string, create time, array of retrieval time}
    uint256 _totalChallenges;
    
    event CovenantSetuped(address indexed contractor, address indexed endorser);
    event CovenantEndorsed(address indexed contractor, address indexed endorser);
    event ChallengeSetuped(address indexed challeger, address indexed addressBeingChallenged);

    uint256 _covenantSetupRateInWei;
    uint256 _challengeRateInWei;
    uint256 _minBalance;            // maintains a safety value for fees etc.

    constructor(uint256 initialCovenantSetupRate, uint256 initialChallengeRateInWei, uint256 initialMinBalance) public {
        _owner = msg.sender;
        _covenantSetupRateInWei = initialCovenantSetupRate;
        _challengeRateInWei = initialChallengeRateInWei;
        _minBalance = initialMinBalance;
    }

    function setCovenantSetupRate(uint256 newRateInWei) onlyOwner public {
        _covenantSetupRateInWei = newRateInWei;
    }
    
    function getCovenantSetupRate() view public returns (uint256 covenantSetupRate) {
        return _covenantSetupRateInWei;
    }

    function setChallengeRate(uint256 newRateInWei) onlyOwner public {
        _challengeRateInWei = newRateInWei;
    }
    
    function getChallengeRate() view public returns (uint256 challengeRate) {
        return _challengeRateInWei;
    }

    function setupCovenant(address endorser, string statement) payable public {
        require(msg.value >= _covenantSetupRateInWei);        // msg.value is in Wei

        uint currCovenantIndex = _covenants.length;
        _covenants.push(Covenant(currCovenantIndex, msg.sender, endorser, statement, CovenantState.WAITING));

        _covenantsLookup[msg.sender].push(currCovenantIndex);
        _covenantsLookup[endorser].push(currCovenantIndex);

        _covenantsWaitingLookup[endorser].push(currCovenantIndex);
        
        emit CovenantSetuped(msg.sender, endorser);
    }

    function getCovenant(uint id) view public returns (
        uint covenantID, 
        address covenantContractor, 
        address covenantEndorser, 
        string covenantStatement, 
        CovenantState covenantState
    ) {
        require(id < _covenants.length);

        Covenant storage covenant = _covenants[id];
        require((covenant.contractor == msg.sender) || (covenant.endorser == msg.sender));
        return (
            covenant.id,
            covenant.contractor,
            covenant.endorser,
            covenant.statement,
            covenant.state
        );
    }

    function getNumCovenants() view public returns (uint number) {
        return _covenants.length;
    }

    function getNumCovenantsWaiting(address endorser) view public returns (uint number) {
        return _covenantsWaitingLookup[endorser].length;
    }

    function getCovenantsWaiting(address endorser, uint index) view public returns (uint covenantID, address covenantContractor, address covenantEndorser, string covenantStatement, CovenantState covenantState) {
        require(index < _covenantsWaitingLookup[endorser].length);

        return getCovenant(_covenantsWaitingLookup[endorser][index]);
    }

    function compareStrings(string a, string b) pure internal returns (bool){
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    function _endorseCovenant(uint covenantID, address covenantContractor, string covenantStatement, address endorserAddr) internal returns (bool result) {
        for (uint i = 0; i < _covenantsWaitingLookup[endorserAddr].length; ++i) {
            Covenant storage covenant = _covenants[_covenantsWaitingLookup[endorserAddr][i]];

            if (covenant.id == covenantID) {
                require(covenant.contractor == covenantContractor);
                assert(covenant.endorser == endorserAddr);
                require(compareStrings(covenant.statement, covenantStatement) == true);
                require(covenant.state == CovenantState.WAITING);

                covenant.state = CovenantState.COVENANTED;

                delete _covenantsWaitingLookup[endorserAddr][i];
                _covenantsWaitingLookup[endorserAddr].length--;

                emit CovenantEndorsed(covenantContractor, msg.sender);

                return true;
            }
        }
        return false;
    }

    function endorseCovenant(uint covenantID, address covenantContractor, string covenantStatement) public returns (bool result) {
        return _endorseCovenant(covenantID, covenantContractor, covenantStatement, msg.sender);
    }

    function getCovenantIndices(address contractorOrEndorser) view public returns (uint[] covenantIndices) {
        return _covenantsLookup[contractorOrEndorser];
    }

    // [Jethro 20181013] Function returns array of string is infeasible. Disable. @see https://ethereum.stackexchange.com/questions/17312/solidity-can-you-return-dynamic-arrays-in-a-function
    /*
    function getCovenants(address contractorOrEndorser) view public returns (
        uint[] covenantIDs,
        address[] covenantContractors,
        address[] covenanEendorsers,
        string[] covenantStatements,
        CovenantState[] covenantStates
    ) {
        uint[] storage covenantIndices = _covenantsLookup[contractorOrEndorser];
        
        uint[] memory ids = new uint[](covenantIndices.length);
        address[] memory contractors = new address[](covenantIndices.length);
        address[] memory endorsers = new address[](covenantIndices.length);
        string[] memory statements = new string[](covenantIndices.length);
        CovenantState[] memory states = new CovenantState[](covenantIndices.length);
        
        for (uint i = 0; i < covenantIndices.length; i++) {
            Covenant storage covenant = _covenants[covenantIndices[i]];
            ids[i] = covenant.id;
            contractors[i] = covenant.contractor;
            endorsers[i] = covenant.endorser;
            statements[i] = covenant.statement;
            states[i] = covenant.state;
        }
        
        return (ids, contractors, endorsers, statements, states);
    }*/

    function setupChallenge(address addressBeingChallenged, string challengePhrase) payable public {
        require(msg.value >= _challengeRateInWei);        // msg.value is in Wei

        _challenges[addressBeingChallenged].push(Challenge({
            challenger : msg.sender,
            phrase : challengePhrase,
            createTime : now
        }));
        
        _totalChallenges++;
        
        emit ChallengeSetuped(msg.sender, addressBeingChallenged);
    }

    function _getNumChallenges(address addressBeingChallenged) view internal returns (uint numChanlleges) {
        return _challenges[addressBeingChallenged].length;
    }

    function getNumChallenges() view public returns (uint numChanlleges) {
        return _getNumChallenges(msg.sender);
    }
    
    function getTotalChallenges() view public returns (uint totalChallenges) {
        return _totalChallenges;
    }

    function _getChallenge(uint index, address addressBeingChallenged) view public returns (address challenger, string phrase, uint createTime) {
        require(index < _challenges[addressBeingChallenged].length);

        Challenge storage challenge = _challenges[addressBeingChallenged][index];
        return (
            challenge.challenger,
            challenge.phrase,
            challenge.createTime
        );
    }

    function getChallenge(uint index) view public returns (address challenger, string phrase, uint createTime) {
        return _getChallenge(index, msg.sender);
    }
    
    function isOwned() view public returns (bool) {
        return msg.sender == _owner;
    }

    function transfer(address destinationAddress, uint256 amount) onlyOwner public {
        //address payable destAddress = address(destinationAddress);
        address destAddress = address(destinationAddress);
        address myAddress = address(this);
        if (myAddress.balance >= (amount + _minBalance)) {
            destAddress.transfer(amount);
        }
    }

    /**
     * For test purpose only!!!
     * Remember to remove this when doing production deployment!!!
     * This function is a compromise since `onlyOwner` and pretend address as
     * another party (in which case `onlyOwner` is not added, and 5th parameter
     * is used).
     */
    /*function endorseCovenantTest(uint covenantID, address covenantContractor, string covenantStatement, address endorserAddr) public returns (bool result) {
        return _endorseCovenant(covenantID, covenantContractor, covenantStatement, endorserAddr);
    }*/

    /**
     * Test purpose only!!!
     * Remember to remove this when doing production deployment!!!
     */
    /*function getNumChallengesTest(address addressBeingChallenged) view public returns (uint numChanlleges) {
        return _getNumChallenges(addressBeingChallenged);
    }*/

    /**
     * Test purpose only!!!
     * Remember to remove this when doing production deployment!!!
     */
    /*function getChallengeTest(uint index, address addressBeingChallenged) view public returns (address challenger, string phrase, uint createTime) {
        return _getChallenge(index, addressBeingChallenged);
    }*/
}
