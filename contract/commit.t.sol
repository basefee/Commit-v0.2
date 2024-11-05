// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {Test} from "forge-std/Test.sol";
import {CommitProtocol} from "./commit.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract CommitProtocolTest is Test {
    CommitProtocol public commit;
    MockERC20 public token;

    address public owner = address(this);
    address public user1 = address(0x1);
    address public user2 = address(0x2);
    address public user3 = address(0x3);
    address public client = address(0x4);
    address public protocolFeeAddress = address(0x5);

    uint256 constant COMMIT_CREATION_FEE = 0.001 ether;
    uint256 constant STAKE_AMOUNT = 100e18;
    uint256 constant JOIN_FEE = 10e18;

    function setUp() public {
        // Deploy contracts
        commit = new CommitProtocol();
        token = new MockERC20("Test Token", "TEST");

        // Initialize protocol
        commit.initialize(protocolFeeAddress);

        // Setup test users
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
        vm.deal(user3, 10 ether);

        // Mint tokens to users
        token.mint(user1, 1000e18);
        token.mint(user2, 1000e18);
        token.mint(user3, 1000e18);

        // Setup client
        vm.prank(client);
        commit.registerClient(client, 5); // 5% fee share

        // Allow token
        commit.setAllowedToken(address(token), true);
    }

    function testCreateCommitment() public {
        vm.startPrank(user1);

        // Approve tokens
        token.approve(address(commit), STAKE_AMOUNT);

        // Create commitment
        commit.createCommitment{value: COMMIT_CREATION_FEE}(
            address(token),
            STAKE_AMOUNT,
            JOIN_FEE,
            500, // 5% creator share
            "Test Commitment",
            block.timestamp + 1 days, // join deadline
            block.timestamp + 2 days, // fulfillment deadline
            client
        );

        vm.stopPrank();

        // Verify commitment was created
        (
            address creator,
            address clientAddr,
            uint256 stakeAmt,
            uint256 joinFeeAmt,
            uint256 participantCount,
            CommitProtocol.CommitmentStatus status,
        ) = commit.getCommitmentDetails(0);

        assertEq(creator, user1);
        assertEq(clientAddr, client);
        assertEq(stakeAmt, STAKE_AMOUNT);
        assertEq(joinFeeAmt, JOIN_FEE);
        assertEq(participantCount, 1);
        assertEq(uint(status), uint(CommitProtocol.CommitmentStatus.Active));
    }

    function testJoinCommitment() public {
        // First create a commitment
        vm.startPrank(user1);
        token.approve(address(commit), STAKE_AMOUNT);
        commit.createCommitment{value: COMMIT_CREATION_FEE}(
            address(token),
            STAKE_AMOUNT,
            JOIN_FEE,
            500,
            "Test Commitment",
            block.timestamp + 1 days,
            block.timestamp + 2 days,
            client
        );
        vm.stopPrank();

        // User2 joins the commitment
        vm.startPrank(user2);
        token.approve(address(commit), STAKE_AMOUNT + JOIN_FEE);
        commit.joinCommitment(0);
        vm.stopPrank();

        // Verify user2 joined
        (,,,, uint256 participantCount,,) = commit.getCommitmentDetails(0);
        assertEq(participantCount, 2);
        assertTrue(commit.hasJoined(0, user2));
    }

    function testResolveCommitment() public {
        // Setup commitment and participants
        testJoinCommitment();

        // Fast forward past fulfillment deadline
        vm.warp(block.timestamp + 3 days);

        // Creator resolves commitment
        address[] memory winners = new address[](1);
        winners[0] = user1; // Only creator wins

        vm.prank(user1);
        commit.resolveCommitment(0, winners);

        // Verify commitment resolved
        (,,,,, CommitProtocol.CommitmentStatus status,) = commit.getCommitmentDetails(0);
        assertEq(uint(status), uint(CommitProtocol.CommitmentStatus.Resolved));
    }

    function testClaimRewards() public {
        // Setup and resolve commitment
        testResolveCommitment();

        // Winner claims rewards
        uint256 balanceBefore = token.balanceOf(user1);

        vm.prank(user1);
        commit.claimRewards(0);

        uint256 balanceAfter = token.balanceOf(user1);
        assertTrue(balanceAfter > balanceBefore);
    }

    function testCancelCommitment() public {
        // Create commitment
        vm.startPrank(user1);
        token.approve(address(commit), STAKE_AMOUNT);
        commit.createCommitment{value: COMMIT_CREATION_FEE}(
            address(token),
            STAKE_AMOUNT,
            JOIN_FEE,
            500,
            "Test Commitment",
            block.timestamp + 1 days,
            block.timestamp + 2 days,
            client
        );

        // Cancel commitment
        commit.cancelCommitment(0);
        vm.stopPrank();

        // Verify cancelled
        (,,,,, CommitProtocol.CommitmentStatus status,) = commit.getCommitmentDetails(0);
        assertEq(uint(status), uint(CommitProtocol.CommitmentStatus.Cancelled));
    }

    function testFailInvalidToken() public {
        vm.startPrank(user1);
        MockERC20 invalidToken = new MockERC20("Invalid", "INV");

        vm.expectRevert(CommitProtocol.TokenNotAllowed.selector);
        commit.createCommitment{value: COMMIT_CREATION_FEE}(
            address(invalidToken),
            STAKE_AMOUNT,
            JOIN_FEE,
            500,
            "Test Commitment",
            block.timestamp + 1 days,
            block.timestamp + 2 days,
            client
        );
        vm.stopPrank();
    }
}

// Basic Mock ERC20 contract for testing
contract MockERC20 {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }

    function mint(address to, uint256 amount) public {
        balanceOf[to] += amount;
        totalSupply += amount;
    }

    function approve(address spender, uint256 amount) public returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) public returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        require(balanceOf[from] >= amount, "Insufficient balance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}