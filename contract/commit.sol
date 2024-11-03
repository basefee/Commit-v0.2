// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title CommitProtocol - An on-chain accountability protocol
/// @notice This contract enables users to create and participate in commitment-based challenges
/// @dev Implements stake management, fee distribution, and emergency controls

contract CommitProtocol is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    struct Client {
        address feeAddress;
        uint8 feeShare;
        bool isActive;
    }

    struct Commitment {
        uint256 id;
        address creator;
        address client;
        address tokenAddress;
        uint256 stakeAmount;
        uint256 joinFee;
        uint256 creatorTokenFee;
        uint8 creatorShare;
        string description;
        address[] participants;
        mapping(address => bool) participantSuccess;
        bool isResolved;
        bool isCancelled;
        uint256 failedCount;
        uint256 joinDeadline;
        uint256 fulfillmentDeadline;
    }


    // Fee structure
    /// @notice Fee structure for the protocol
    /// @dev All fees are represented in basis points (1/100 of a percent)
    uint256 public constant COMMIT_CREATION_FEE = 0.001 ether;  // Fixed fee in ETH
    uint8 public constant PROTOCOL_SHARE = 1;      // 1% protocol fee from failed stakes
    uint8 public constant MAX_CLIENT_FEE = 9;      // Maximum 9% client fee from failed stakes
    uint8 public constant MAX_CREATOR_SHARE = 10;  // Maximum 10% creator share from failed stakes
	
	// Operational limits
    /// @notice Operational constraints to ensure protocol safety
    uint256 public constant MAX_DESCRIPTION_LENGTH = 1000;    // Characters
    uint256 public constant MAX_PARTICIPANTS = 100;           // Per commitment
    uint256 public constant MAX_DEADLINE_DURATION = 365 days; // Maximum time window

    // State variables
    uint256 public nextCommitmentId;
    address public protocolFeeAddress;
    bool public paused;
    mapping(address => bool) public allowedTokens;
    mapping(address => Client) public clients;
    mapping(uint256 => Commitment) public commitments;
    mapping(uint256 => mapping(address => bool)) public hasJoined;
    mapping(uint256 => mapping(address => uint256)) public balances;
    mapping(address => uint256) public accumulatedFees;
    mapping(address => mapping(address => uint256)) public accumulatedTokenFees;

    // Events
    event ClientRegistered(address indexed clientAddress, address feeAddress, uint8 feeShare);
    event TokenAllowanceUpdated(address indexed token, bool allowed);
    event CommitmentCreated(
        uint256 indexed id,
        address indexed creator,
        address indexed client,
        address tokenAddress,
        uint256 stakeAmount,
        uint256 joinFee,
        uint256 creatorTokenFee,
        uint8 creatorShare
    );
    event CommitmentJoined(uint256 indexed id, address indexed participant);
    event CommitmentResolved(uint256 indexed id, address[] winners);
    event CommitmentCancelled(uint256 indexed id);
    event RewardsClaimed(
			uint256 indexed id,
			address indexed user,
			address indexed token,
			uint256 amount
	);
    event Paused(address account);
    event Unpaused(address account);
    event ProtocolFeeAddressUpdated(address oldAddress, address newAddress);
    event EmergencyWithdrawal(address token, uint256 amount);
    event ClientDeactivated(address indexed clientAddress);
    event CommitmentEmergencyPaused(uint256 indexed id);

    // Modifiers
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    modifier commitmentExists(uint256 _id) {
        require(_id < nextCommitmentId, "Commitment does not exist");
        _;
    }

    modifier withinJoinPeriod(uint256 _id) {
        require(block.timestamp <= commitments[_id].joinDeadline, "Joining period ended");
        _;
    }

    constructor(address _protocolFeeAddress) Ownable(msg.sender) {
        require(_protocolFeeAddress != address(0), "Invalid protocol fee address");
        protocolFeeAddress = _protocolFeeAddress;
    }

    /// @notice Creates a new commitment challenge
    /// @param _tokenAddress The ERC20 token used for staking
    /// @param _stakeAmount Amount each participant must stake in token units
    /// @param _joinFee Fee in ETH required to join the commitment
    /// @param _creatorTokenFee Additional token fee that goes to creator (in same token as stake)
    /// @param _creatorShare Percentage of failed stakes allocated to creator (0-10)
    /// @param _description Human-readable description of the commitment
    /// @param _joinDeadline Timestamp when joining period ends
    /// @param _fulfillmentDeadline Timestamp when commitment must be completed
    /// @param _client Address of the client platform creating this commitment
    /// @dev Fees are distributed immediately, stakes are held until resolution
    function createCommitment(
        address _tokenAddress,
        uint256 _stakeAmount,
        uint256 _joinFee,
        uint256 _creatorTokenFee,
        uint8 _creatorShare,
        string calldata _description,
        uint256 _joinDeadline,
        uint256 _fulfillmentDeadline,
        address _client
    ) external payable nonReentrant whenNotPaused {
        require(allowedTokens[_tokenAddress], "Token not allowed");
        require(clients[_client].isActive, "Invalid client");
        require(msg.value == COMMIT_CREATION_FEE, "Must pay creation fee");
        require(_creatorShare <= MAX_CREATOR_SHARE, "Creator share too high");
        require(_joinDeadline > block.timestamp, "Join deadline must be future");
        require(_fulfillmentDeadline > _joinDeadline, "Invalid fulfillment deadline");
        require(_fulfillmentDeadline <= block.timestamp + MAX_DEADLINE_DURATION, "Deadline too far");
        require(bytes(_description).length <= MAX_DESCRIPTION_LENGTH, "Description too long");
        require(_stakeAmount > 0, "Stake amount must be positive");
        require(_creatorTokenFee >= 0, "Invalid creator token fee");
        if (_joinFee > 0) {
            require(_joinFee >= PROTOCOL_SHARE + clients[_client].feeShare, "Fee too low for shares");
        }

        // Transfer creation fee
        (bool sent, ) = protocolFeeAddress.call{value: COMMIT_CREATION_FEE}("");
        require(sent, "Failed to send creation fee");

        uint256 commitmentId = nextCommitmentId++;
        Commitment storage commitment = commitments[commitmentId];

        commitment.id = commitmentId;
        commitment.creator = msg.sender;
        commitment.client = _client;
        commitment.tokenAddress = _tokenAddress;
        commitment.stakeAmount = _stakeAmount;
        commitment.joinFee = _joinFee;
        commitment.creatorTokenFee = _creatorTokenFee;
        commitment.creatorShare = _creatorShare;
        commitment.description = _description;
        commitment.joinDeadline = _joinDeadline;
        commitment.fulfillmentDeadline = _fulfillmentDeadline;

        emit CommitmentCreated(
            commitmentId,
            msg.sender,
            _client,
            _tokenAddress,
            _stakeAmount,
            _joinFee,
            _creatorTokenFee,
            _creatorShare
        );
    }

    function joinCommitment(uint256 _id) external payable nonReentrant whenNotPaused commitmentExists(_id) withinJoinPeriod(_id) {
        Commitment storage commitment = commitments[_id];
        require(!hasJoined[_id][msg.sender], "Already joined");
        require(!commitment.isResolved && !commitment.isCancelled, "Commitment not active");
        require(commitment.participants.length < MAX_PARTICIPANTS, "Maximum participants reached");

        // Handle join fee if set
        if (commitment.joinFee > 0) {
            require(msg.value == commitment.joinFee, "Incorrect join fee");

            uint256 protocolShare = (commitment.joinFee * PROTOCOL_SHARE) / 100;
            uint256 clientShare = (commitment.joinFee * clients[commitment.client].feeShare) / 100;
            uint256 creatorShare = commitment.joinFee - protocolShare - clientShare;

            (bool sentProtocol, ) = protocolFeeAddress.call{value: protocolShare}("");
            (bool sentClient, ) = clients[commitment.client].feeAddress.call{value: clientShare}("");
            (bool sentCreator, ) = commitment.creator.call{value: creatorShare}("");
            
            require(sentProtocol && sentClient && sentCreator, "Fee transfer failed");
        }

        // Handle creator token fee if set
        if (commitment.creatorTokenFee > 0) {
            uint256 protocolTokenFee = (commitment.creatorTokenFee * PROTOCOL_SHARE) / 100;
            uint256 clientTokenFee = (commitment.creatorTokenFee * clients[commitment.client].feeShare) / 100;
            uint256 creatorTokenShare = commitment.creatorTokenFee - protocolTokenFee - clientTokenFee;

            // Transfer total token fee amount from participant
            IERC20(commitment.tokenAddress).safeTransferFrom(
                msg.sender,
                address(this),
                commitment.creatorTokenFee
            );

            // Update accumulated token fees
            accumulatedTokenFees[commitment.tokenAddress][protocolFeeAddress] += protocolTokenFee;
            accumulatedTokenFees[commitment.tokenAddress][clients[commitment.client].feeAddress] += clientTokenFee;
            balances[_id][commitment.creator] += creatorTokenShare;
        }

        // Transfer stake amount
        IERC20(commitment.tokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            commitment.stakeAmount
        );

        commitment.participants.push(msg.sender);
        hasJoined[_id][msg.sender] = true;
        balances[_id][msg.sender] = commitment.stakeAmount;

        emit CommitmentJoined(_id, msg.sender);
    }

    function resolveCommitment(uint256 _id, address[] calldata _winners) external nonReentrant whenNotPaused commitmentExists(_id) {
        Commitment storage commitment = commitments[_id];
        require(msg.sender == commitment.creator, "Only creator can resolve");
        require(!commitment.isResolved && !commitment.isCancelled, "Commitment not active");
        require(block.timestamp >= commitment.fulfillmentDeadline, "Fulfillment period not ended");
        require(_winners.length > 0, "Must have at least one winner");
        require(_winners.length <= commitment.participants.length, "Too many winners");

        // Validate winners and count failures
        commitment.failedCount = 0;
        mapping(address => bool) memory seenWinners;
        for (uint256 j = 0; j < _winners.length; j++) {
            require(!seenWinners[_winners[j]], "Duplicate winner");
            seenWinners[_winners[j]] = true;
            address participant = _winners[j];
            bool isWinner = false;

            for (uint256 i = 0; i < commitment.participants.length; i++) {
                if (participant == commitment.participants[i]) {
                    isWinner = true;
                    break;
                }
            }

            commitment.participantSuccess[participant] = isWinner;
            if (!isWinner) {
                commitment.failedCount++;
            }
        }

        distributeRewards(_id, _winners);
        commitment.isResolved = true;
        emit CommitmentResolved(_id, _winners);
    }

    /// @notice Distributes rewards after commitment resolution
    /// @dev Calculates and allocates shares of failed stakes to protocol, client, creator, and winners
    /// @param _id The commitment ID
    /// @param _winners Array of addresses that successfully completed the commitment
    function distributeRewards(uint256 _id, address[] memory _winners) internal {
        Commitment storage commitment = commitments[_id];
        
        // Calculate total stakes from failed participants
        uint256 totalFailedStake = commitment.failedCount * commitment.stakeAmount;
        
        if (totalFailedStake > 0) {
            // Calculate fee shares based on predefined percentages
            uint256 protocolFeeAmount = (totalFailedStake * PROTOCOL_SHARE) / 100;    // 1% to protocol
            uint256 clientFeeAmount = (totalFailedStake * clients[commitment.client].feeShare) / 100;  // Client's share (up to 9%)
            uint256 creatorAmount = (totalFailedStake * commitment.creatorShare) / 100;  // Creator's share (up to 10%)
            
            // Remaining amount goes to winners
            uint256 winnerAmount = totalFailedStake - protocolFeeAmount - clientFeeAmount - creatorAmount;
            
            // Accumulate protocol and client fees for later withdrawal
            accumulatedFees[protocolFeeAddress] += protocolFeeAmount;
            accumulatedFees[clients[commitment.client].feeAddress] += clientFeeAmount;
            
            // Assign creator's share immediately
            balances[_id][commitment.creator] += creatorAmount;
            
            // Distribute remaining funds equally among winners
            uint256 amountPerWinner = winnerAmount / _winners.length;
            uint256 dust = winnerAmount - (amountPerWinner * _winners.length);
            
            for (uint256 i = 0; i < _winners.length; i++) {
                balances[_id][_winners[i]] += amountPerWinner;
            }
            if (dust > 0) {
                balances[_id][_winners[0]] += dust;  // Give dust to first winner
            }
        }
    }

    function cancelCommitment(uint256 _id) external nonReentrant whenNotPaused commitmentExists(_id) {
        Commitment storage commitment = commitments[_id];
        require(msg.sender == commitment.creator, "Only creator can cancel");
        require(!commitment.isResolved && !commitment.isCancelled, "Commitment not active");
        require(commitment.participants.length == 0, "Cannot cancel with participants");

        commitment.isCancelled = true;
        emit CommitmentCancelled(_id);
    }

    function claimRewards(uint256 _id) external nonReentrant whenNotPaused commitmentExists(_id) {
        Commitment storage commitment = commitments[_id];
        require(commitment.isResolved, "Commitment not resolved");

        uint256 amount = balances[_id][msg.sender];
        require(amount > 0, "No rewards to claim");

        balances[_id][msg.sender] = 0;
        IERC20(commitment.tokenAddress).safeTransfer(msg.sender, amount);

        emit RewardsClaimed(_id, msg.sender, commitment.tokenAddress, amount);
    }

    // Client registration and management
    function registerClient(address _feeAddress, uint8 _feeShare) external {
        require(_feeAddress != address(0), "Invalid fee address");
        require(_feeShare <= MAX_CLIENT_FEE, "Fee share too high");
        require(!clients[msg.sender].isActive, "Already registered");
        
        clients[msg.sender] = Client({
            feeAddress: _feeAddress,
            feeShare: _feeShare,
            isActive: true
        });
        
        emit ClientRegistered(msg.sender, _feeAddress, _feeShare);
    }

    // Admin functions
    function setAllowedToken(address token, bool allowed) external onlyOwner {
        allowedTokens[token] = allowed;
        emit TokenAllowanceUpdated(token, allowed);
    }

    function setProtocolFeeAddress(address _newAddress) external onlyOwner {
        _validateAddress(_newAddress);
        emit ProtocolFeeAddressUpdated(protocolFeeAddress, _newAddress);
        protocolFeeAddress = _newAddress;
    }

    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    // Emergency function
    function emergencyWithdraw(IERC20 token) external onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        token.safeTransfer(msg.sender, balance);
        emit EmergencyWithdrawal(address(token), balance);
    }

    function emergencyWithdrawToken(IERC20 token, uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be positive");
        require(amount <= token.balanceOf(address(this)), "Insufficient balance");
        token.safeTransfer(msg.sender, amount);
        emit EmergencyWithdrawal(address(token), amount);
    }

    /// @notice Emergency function to resolve stuck commitments
    /// @dev Can only be called by owner after deadline or when contract is paused
    /// @param _id The commitment ID to resolve
    function emergencyResolveCommitment(uint256 _id) external onlyOwner {
        Commitment storage commitment = commitments[_id];
        require(!commitment.isResolved && !commitment.isCancelled, "Invalid state");
        require(
            block.timestamp > commitment.fulfillmentDeadline || paused,
            "Can only emergency resolve after deadline or when paused"
        );

        // Return all stakes to original participants
        for (uint256 i = 0; i < commitment.participants.length; i++) {
            address participant = commitment.participants[i];
            uint256 amount = balances[_id][participant];
            if (amount > 0) {
                // Clear balance before transfer to prevent reentrancy
                balances[_id][participant] = 0;
                IERC20(commitment.tokenAddress).safeTransfer(participant, amount);
            }
        }
        
        commitment.isResolved = true;
    }

    function withdrawAccumulatedFees() external nonReentrant {
        uint256 amount = accumulatedFees[msg.sender];
        require(amount > 0, "No fees to withdraw");
        accumulatedFees[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }

    function deactivateClient(address clientAddress) external onlyOwner {
        require(clients[clientAddress].isActive, "Client not active");
        clients[clientAddress].isActive = false;
        emit ClientDeactivated(clientAddress);
    }

    receive() external payable {
        revert("Direct deposits not allowed");
    }

    // At the contract level
    error InvalidAddress();
    error UnauthorizedAccess();
    error DeadlineExpired();

    // Add emergency pause for specific commitment
    function emergencyPauseCommitment(uint256 _id) external onlyOwner commitmentExists(_id) {
        Commitment storage commitment = commitments[_id];
        require(!commitment.isResolved && !commitment.isCancelled, "Invalid state");
        commitment.isCancelled = true;
        emit CommitmentEmergencyPaused(_id);
    }

    function _validateAddress(address addr) internal pure {
        if (addr == address(0)) revert InvalidAddress();
    }

    /// @notice Withdraw accumulated token fees
    /// @param token The token address to withdraw
    function withdrawAccumulatedTokenFees(address token) external nonReentrant {
        uint256 amount = accumulatedTokenFees[token][msg.sender];
        require(amount > 0, "No token fees to withdraw");
        
        accumulatedTokenFees[token][msg.sender] = 0;
        IERC20(token).safeTransfer(msg.sender, amount);
    }
}
