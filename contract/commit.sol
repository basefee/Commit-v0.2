// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

/// @title CommitProtocol — an onchain accountability protocol
/// @notice Enables users to create and participate in commitment-based challenges
/// @dev Implements stake management, fee distribution, and emergency controls
contract CommitProtocol is 
    UUPSUpgradeable, 
    ReentrancyGuardUpgradeable, 
    OwnableUpgradeable, 
    PausableUpgradeable 
{
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Client represents an integrated application or platform using the Commit Protocol
    struct Client {
        address feeAddress;    // Address where client's fee share is sent
        uint8 feeShare;        // Percentage of fees client receives (0-9%)
        bool isActive;         // Whether users can create commitments through this client
    }

    struct Commitment {
        uint256 id;
        address creator;
        address client;
        address tokenAddress;
        uint256 stakeAmount;
        uint256 joinFee;
        uint8 creatorShare;
        string description;
        address[] participants;
        mapping(address => bool) participantSuccess;
        CommitmentStatus status;
        uint256 failedCount;
        uint256 joinDeadline;
        uint256 fulfillmentDeadline;
    }

    enum CommitmentStatus { Active, Resolved, Cancelled }

    /*//////////////////////////////////////////////////////////////
                                CONSTANTS
    //////////////////////////////////////////////////////////////*/

    uint256 public constant COMMIT_CREATION_FEE = 0.001 ether;  // 0.001 ETH
    uint8 public constant PROTOCOL_SHARE = 1;      // 1% protocol fee
    uint8 public constant MAX_CLIENT_FEE = 9;      // Max 9% client fee
    uint8 public constant MAX_CREATOR_SHARE = 10;  // Max 10% creator share
    uint256 public constant MAX_DESCRIPTION_LENGTH = 1000;    // Characters
    uint256 public constant MAX_DEADLINE_DURATION = 365 days; // Max time window
		
    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    uint256 public nextCommitmentId;
    address public protocolFeeAddress;
    mapping(address => bool) public allowedTokens;
    mapping(address => Client) public clients;
    mapping(uint256 => Commitment) public commitments;
    mapping(uint256 => mapping(address => bool)) public hasJoined;
    mapping(uint256 => mapping(address => uint256)) public balances;
    mapping(address => mapping(address => uint256)) public accumulatedTokenFees;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event ClientRegistered(address indexed clientAddress, address feeAddress, uint8 feeShare);
    event TokenAllowanceUpdated(address indexed token, bool allowed);
    event CommitmentCreated(
        uint256 indexed id,
        address indexed creator,
        address indexed client,
        address tokenAddress,
        uint256 stakeAmount,
        uint256 joinFee,
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
    event ProtocolFeeAddressUpdated(address oldAddress, address newAddress);
    event EmergencyWithdrawal(address token, uint256 amount);
    event ClientDeactivated(address indexed clientAddress);
    event CommitmentEmergencyPaused(uint256 indexed id);
    event CommitmentEmergencyResolved(uint256 indexed id);
    event FeesClaimed(address indexed recipient, address indexed token, uint256 amount);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidAddress();
    error UnauthorizedAccess(address caller);
    error InvalidState(CommitmentStatus status);
    error InsufficientBalance(uint256 available, uint256 required);
    error FulfillmentPeriodNotEnded(uint256 currentTime, uint256 deadline);
    error AlreadyJoined();
    error NoRewardsToClaim();
    error CommitmentNotExists(uint256 id);
    error InvalidCreationFee(uint256 sent, uint256 required);
    error TokenNotAllowed(address token);
    error ETHTransferFailed();
    error InvalidWinner(address winner);
    error InvalidTokenContract(address token);
    error InvalidFeeConfiguration(uint256 total);

    /*//////////////////////////////////////////////////////////////
                                MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    modifier commitmentExists(uint256 _id) {
        if (_id >= nextCommitmentId) revert CommitmentNotExists(_id);
        _;
    }

    modifier withinJoinPeriod(uint256 _id) {
        require(block.timestamp <= commitments[_id].joinDeadline, "Joining period ended");
        _;
    }

    /*//////////////////////////////////////////////////////////////
                            INITIALIZATION
    //////////////////////////////////////////////////////////////*/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the contract with the protocol fee address
    /// @param _protocolFeeAddress The address where protocol fees are sent
    function initialize(address _protocolFeeAddress) public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        __Pausable_init();
        if (_protocolFeeAddress == address(0)) revert InvalidAddress();
        protocolFeeAddress = _protocolFeeAddress;
    }

    /*//////////////////////////////////////////////////////////////
                        COMMITMENT CORE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

	/// @notice Creates a commitment with specified parameters and stake requirements
    /// @param _tokenAddress The address of the ERC20 token used for staking
    /// @param _stakeAmount The amount each participant must stake
    /// @param _joinFee The fee required to join the commitment
    /// @param _creatorShare The percentage of failed stakes the creator receives
    /// @param _description A brief description of the commitment
    /// @param _joinDeadline The deadline for participants to join
    /// @param _fulfillmentDeadline The deadline for fulfilling the commitment
    /// @param _client The address of the client associated with the commitment
    /// @dev Creator becomes first participant by staking tokens + paying creation fee in ETH
    function createCommitment(
        address _tokenAddress,
        uint256 _stakeAmount,
        uint256 _joinFee,
        uint8 _creatorShare,
        string calldata _description,
        uint256 _joinDeadline,
        uint256 _fulfillmentDeadline,
        address _client
    ) external payable nonReentrant whenNotPaused {
        if (msg.value != COMMIT_CREATION_FEE) revert InvalidCreationFee(msg.value, COMMIT_CREATION_FEE);
        if (!allowedTokens[_tokenAddress]) revert TokenNotAllowed(_tokenAddress);
        if (!clients[_client].isActive) revert InvalidState(CommitmentStatus.Cancelled);
        if (_creatorShare > MAX_CREATOR_SHARE) revert InvalidState(CommitmentStatus.Cancelled);
        if (_joinDeadline <= block.timestamp) revert InvalidState(CommitmentStatus.Cancelled);
        if (_fulfillmentDeadline <= _joinDeadline) revert InvalidState(CommitmentStatus.Cancelled);
        if (_fulfillmentDeadline > block.timestamp + MAX_DEADLINE_DURATION) revert InvalidState(CommitmentStatus.Cancelled);
        if (bytes(_description).length > MAX_DESCRIPTION_LENGTH) revert InvalidState(CommitmentStatus.Cancelled);
        if (_stakeAmount == 0) revert InvalidState(CommitmentStatus.Cancelled);
        if (_joinFee < PROTOCOL_SHARE + clients[_client].feeShare) revert InvalidState(CommitmentStatus.Cancelled);

		// Transfer creation fee in ETH
        (bool sent,) = protocolFeeAddress.call{value: COMMIT_CREATION_FEE}("");
        if (!sent) revert ETHTransferFailed();

        // Transfer only stake amount for creator (no join fee)
        IERC20(_tokenAddress).safeTransferFrom(msg.sender, address(this), _stakeAmount);

        uint256 commitmentId = nextCommitmentId++;
        Commitment storage commitment = commitments[commitmentId];
        
        // Initialize commitment details
        commitment.id = commitmentId;
        commitment.creator = msg.sender;
        commitment.client = _client;
        commitment.tokenAddress = _tokenAddress;
        commitment.stakeAmount = _stakeAmount;
        commitment.joinFee = _joinFee;
        commitment.creatorShare = _creatorShare;
        commitment.description = _description;
        commitment.joinDeadline = _joinDeadline;
        commitment.fulfillmentDeadline = _fulfillmentDeadline;

        // Make creator the first participant with their stake amount
        commitment.participants.push(msg.sender);
        hasJoined[commitmentId][msg.sender] = true;
        balances[commitmentId][msg.sender] = _stakeAmount;

        emit CommitmentCreated(
            commitmentId,
            msg.sender,
            _client,
            _tokenAddress,
            _stakeAmount,
            _joinFee,
            _creatorShare
        );
        emit CommitmentJoined(commitmentId, msg.sender);
    }

  	/// @notice Allows joining an active commitment
    /// @param _id The ID of the commitment to join
    function joinCommitment(uint256 _id) external nonReentrant whenNotPaused commitmentExists(_id) withinJoinPeriod(_id) {
        Commitment storage commitment = commitments[_id];
        if (hasJoined[_id][msg.sender]) revert AlreadyJoined();
        if (commitment.status != CommitmentStatus.Active) revert InvalidState(commitment.status);

        // Calculate total amount needed (stake + join fee)
        uint256 totalAmount = commitment.stakeAmount;
        
        // Handle join fee if set
        if (commitment.joinFee > 0) {
            uint256 protocolShare = (commitment.joinFee * PROTOCOL_SHARE) / 100;
            uint256 clientShare = (commitment.joinFee * clients[commitment.client].feeShare) / 100;
            uint256 creatorShare = commitment.joinFee - protocolShare - clientShare;

            totalAmount += commitment.joinFee;
            
            // Update accumulated token fees
            accumulatedTokenFees[commitment.tokenAddress][protocolFeeAddress] += protocolShare;
            accumulatedTokenFees[commitment.tokenAddress][clients[commitment.client].feeAddress] += clientShare;
            balances[_id][commitment.creator] += creatorShare;
        }

        // Transfer total amount in one transaction
        IERC20(commitment.tokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            totalAmount
        );

        // Record participant's join status and balance
        commitment.participants.push(msg.sender);
        hasJoined[_id][msg.sender] = true;
        balances[_id][msg.sender] = commitment.stakeAmount;

        emit CommitmentJoined(_id, msg.sender);
    }

    /// @notice Resolves commitment and distributes rewards to winners
    /// @param _id The ID of the commitment to resolve
    /// @param _winners The addresses of the participants who succeeded
    function resolveCommitment(uint256 _id, address[] calldata _winners) external nonReentrant whenNotPaused commitmentExists(_id) {
        Commitment storage commitment = commitments[_id];
        if (msg.sender != commitment.creator) revert UnauthorizedAccess(msg.sender);
        if (commitment.status != CommitmentStatus.Active) revert InvalidState(commitment.status);
        if (block.timestamp < commitment.fulfillmentDeadline) revert FulfillmentPeriodNotEnded(block.timestamp, commitment.fulfillmentDeadline);
        if (_winners.length == 0) revert InvalidState(CommitmentStatus.Resolved);
        if (_winners.length > commitment.participants.length) revert InvalidState(CommitmentStatus.Resolved);

        for (uint256 i = 0; i < commitment.participants.length; i++) {
            address participant = commitment.participants[i];
            bool isWinner = false;
            for (uint256 j = 0; j < _winners.length; j++) {
                if (participant == _winners[j]) {
                    isWinner = true;
                    break;
                }
            }

            // Mark participant success and count failures
            commitment.participantSuccess[participant] = isWinner;
            if (!isWinner) {
                commitment.failedCount++;
            }
        }

        // Distribute failed stakes among winners
        if (commitment.failedCount > 0) {
            uint256 totalFailedStake = commitment.failedCount * commitment.stakeAmount;
            
            // Calculate fee shares
            uint256 protocolFeeAmount = (totalFailedStake * PROTOCOL_SHARE) / 100;
            uint256 clientFeeAmount = (totalFailedStake * clients[commitment.client].feeShare) / 100;
            uint256 creatorAmount = (totalFailedStake * commitment.creatorShare) / 100;
            uint256 winnerAmount = totalFailedStake - protocolFeeAmount - clientFeeAmount - creatorAmount;

            // Update balances for fees and rewards
            accumulatedTokenFees[commitment.tokenAddress][protocolFeeAddress] += protocolFeeAmount;
            accumulatedTokenFees[commitment.tokenAddress][clients[commitment.client].feeAddress] += clientFeeAmount;
            balances[_id][commitment.creator] += creatorAmount;

            // Distribute remaining amount equally among winners
            uint256 amountPerWinner = winnerAmount / _winners.length;
            for (uint256 i = 0; i < _winners.length; i++) {
                balances[_id][_winners[i]] += amountPerWinner;
            }
        }

        // Mark commitment as resolved
        commitment.status = CommitmentStatus.Resolved;
        emit CommitmentResolved(_id, _winners);
    }

	/// @notice Allows creator or owner to cancel a commitment before any participants join
    /// @param _id The ID of the commitment to cancel
    function cancelCommitment(uint256 _id) external nonReentrant commitmentExists(_id) {
        Commitment storage commitment = commitments[_id];
        // Allow both creator and owner to cancel
        if (msg.sender != commitment.creator && msg.sender != owner()) revert UnauthorizedAccess(msg.sender);
        if (commitment.status != CommitmentStatus.Active) revert InvalidState(commitment.status);
        if (commitment.participants.length > 0) revert InvalidState(CommitmentStatus.Cancelled);

        commitment.status = CommitmentStatus.Cancelled;
        emit CommitmentCancelled(_id);
    }

	/// @notice Claims participant's rewards and stakes after commitment resolution
    /// @dev Winners can claim their original stake plus their share of rewards from failed stakes
    /// @dev Losers cannot claim anything as their stakes are distributed to winners
    /// @param _id The commitment ID to claim rewards from
    function claimRewards(uint256 _id) external nonReentrant {
        Commitment storage commitment = commitments[_id];
        if (commitment.status != CommitmentStatus.Resolved) revert InvalidState(commitment.status);
        if (!hasJoined[_id][msg.sender]) revert UnauthorizedAccess(msg.sender);

        uint256 amount = balances[_id][msg.sender];
        if (amount == 0) revert NoRewardsToClaim();

        // Clear balance before transfer to prevent reentrancy
        balances[_id][msg.sender] = 0;
        IERC20(commitment.tokenAddress).safeTransfer(msg.sender, amount);

        emit RewardsClaimed(_id, msg.sender, commitment.tokenAddress, amount);
    }

    /*//////////////////////////////////////////////////////////////
                            CLIENT MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    // Client registration and management
    /// @notice Registers a new client with a fee address and share
    /// @param _feeAddress The address where client fees are sent
    /// @param _feeShare The percentage of fees the client receives
    function registerClient(address _feeAddress, uint8 _feeShare) external whenNotPaused {
        if (_feeAddress == address(0)) revert InvalidAddress();
        if (_feeShare > MAX_CLIENT_FEE) revert InvalidState(CommitmentStatus.Cancelled);
        if (clients[msg.sender].isActive) revert InvalidState(CommitmentStatus.Cancelled);
        
        clients[msg.sender] = Client({
            feeAddress: _feeAddress,
            feeShare: _feeShare,
            isActive: true
        });
        
        emit ClientRegistered(msg.sender, _feeAddress, _feeShare);
    }

    /// @notice Deactivates a client, preventing them from participating in new commitments
    /// @param clientAddress The address of the client to deactivate
    function deactivateClient(address clientAddress) external onlyOwner {
        if (!clients[clientAddress].isActive) revert InvalidState(CommitmentStatus.Cancelled);
        clients[clientAddress].isActive = false;
        emit ClientDeactivated(clientAddress);
    }


    /*//////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Sets the allowance status of a token for use in commitments
    /// @param token The address of the token
    /// @param allowed Whether the token is allowed
    function setAllowedToken(address token, bool allowed) external onlyOwner {
        allowedTokens[token] = allowed;
        emit TokenAllowanceUpdated(token, allowed);
    }

	/// @notice Updates the protocol fee address
    /// @param _newAddress The new address for protocol fees
    function setProtocolFeeAddress(address _newAddress) external onlyOwner {
        _validateAddress(_newAddress);
        emit ProtocolFeeAddressUpdated(protocolFeeAddress, _newAddress);
        protocolFeeAddress = _newAddress;
    }

   
    /*//////////////////////////////////////////////////////////////
                            EMERGENCY FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emergency withdrawal of stuck tokens
    /// @param token The address of the token to withdraw
    /// @param amount The amount of tokens to withdraw
    function emergencyWithdrawToken(IERC20 token, uint256 amount) external onlyOwner {
        if (amount == 0) revert InsufficientBalance(0, amount);
        if (amount > token.balanceOf(address(this))) revert InsufficientBalance(token.balanceOf(address(this)), amount);
        token.safeTransfer(msg.sender, amount);
        emit EmergencyWithdrawal(address(token), amount);
    }

    /// @notice Emergency function to resolve stuck commitments
    /// @param _id The commitment ID to resolve
    function emergencyResolveCommitment(uint256 _id) external onlyOwner {
        Commitment storage commitment = commitments[_id];
        if (commitment.status != CommitmentStatus.Active) revert InvalidState(commitment.status);
        if (block.timestamp <= commitment.fulfillmentDeadline && !paused) revert FulfillmentPeriodNotEnded(block.timestamp, commitment.fulfillmentDeadline);

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
        
        commitment.status = CommitmentStatus.Resolved;
        emit CommitmentEmergencyResolved(_id);
    }

    /// @notice Emergency function to pause a specific commitment
    /// @param _id The ID of the commitment to pause
    function emergencyPauseCommitment(uint256 _id) external onlyOwner {
        Commitment storage commitment = commitments[_id];
        if (commitment.status != CommitmentStatus.Active) revert InvalidState(commitment.status);
        commitment.status = CommitmentStatus.Cancelled;
        emit CommitmentEmergencyPaused(_id);
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function getCommitmentDetails(uint256 _id) external view returns (
        address creator,
        address client,
        uint256 stakeAmount,
        uint256 joinFee,
        uint256 participantCount,
        CommitmentStatus status,
        uint256 timeRemaining
    ) {
        Commitment storage c = commitments[_id];
        return (
            c.creator,
            c.client,
            c.stakeAmount,
            c.joinFee,
            c.participants.length,
            c.status,
            c.joinDeadline > block.timestamp ? c.joinDeadline - block.timestamp : 0
        );
    }

    /*//////////////////////////////////////////////////////////////
                            INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _validateAddress(address addr) internal pure {
        if (addr == address(0)) revert InvalidAddress();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        if (newImplementation == address(0)) revert InvalidAddress();
    }

    /// @notice Claims accumulated fees for a specific token. Used by protocol owner and clients to withdraw their fees
    /// @param token The address of the token to claim fees for
    /// @dev Protocol owner claims via protocolFeeAddress, clients claim via their registered feeAddress
    /// @dev Protocol fees come from join fees (PROTOCOL_SHARE%) and failed stakes (PROTOCOL_SHARE%)
    /// @dev Client fees come from join fees (feeShare%) and failed stakes (feeShare%)
    function claimAccumulatedFees(address token) external nonReentrant {
        uint256 amount = accumulatedTokenFees[token][msg.sender];
        if (amount == 0) revert NoRewardsToClaim();
        
        // Clear balance before transfer to prevent reentrancy
        accumulatedTokenFees[token][msg.sender] = 0;
        
        // Transfer accumulated fees
        IERC20(token).safeTransfer(msg.sender, amount);
        
        emit FeesClaimed(msg.sender, token, amount);
    }

    /*//////////////////////////////////////////////////////////////
                            FALLBACK FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    receive() external payable {
        revert("Direct deposits not allowed");
    }
}