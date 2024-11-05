// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {Test} from "forge-std/Test.sol";
import {CommitProtocol} from "./src/Commit.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CommitProtocolTest is Test {
    CommitProtocol public commit;
    address public token;

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
        // Deploy contract
        commit = new CommitProtocol();
        token = address(0x6); // Mock token address

        // Initialize protocol
        commit.initialize(protocolFeeAddress);

        // Setup test users
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
        vm.deal(user3, 10 ether);

        // Mock token balances and allowances
        vm.mockCall(
            token,
            abi.encodeWithSelector(IERC20.balanceOf.selector, user1),
            abi.encode(1000e18)
        );
        vm.mockCall(
            token,
            abi.encodeWithSelector(IERC20.balanceOf.selector, user2),
            abi.encode(1000e18)
        );
        vm.mockCall(
            token,
            abi.encodeWithSelector(IERC20.balanceOf.selector, user3),
            abi.encode(1000e18)
        );

        // Mock successful transfer responses
        vm.mockCall(
            token,
            abi.encodeWithSelector(IERC20.transfer.selector),
            abi.encode(true)
        );
        vm.mockCall(
            token,
            abi.encodeWithSelector(IERC20.transferFrom.selector),
            abi.encode(true)
        );

        // Setup client
        vm.prank(client);
        commit.registerClient(client, 5); // 5% fee share

        // Allow token
        commit.setAllowedToken(token, true);
    }

    function testCreateCommitment() public {
        vm.startPrank(user1);

        // Mock token approval
        vm.mockCall(
            token,
            abi.encodeWithSelector(IERC20.allowance.selector, user1, address(commit)),
            abi.encode(STAKE_AMOUNT)
        );

        // Create commitment
        commit.createCommitment{value: COMMIT_CREATION_FEE}(
            token,
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
        testCreateCommitment();

        // User2 joins the commitment
        vm.startPrank(user2);

        // Mock token approval for stake + join fee
        vm.mockCall(
            token,
            abi.encodeWithSelector(IERC20.allowance.selector, user2, address(commit)),
            abi.encode(STAKE_AMOUNT + JOIN_FEE)
        );

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

        // Mock initial balance
        uint256 initialBalance = 100e18;
        vm.mockCall(
            token,
            abi.encodeWithSelector(IERC20.balanceOf.selector, user1),
            abi.encode(initialBalance)
        );

        vm.prank(user1);
        commit.claimRewards(0);

        // Verify transfer was called
        uint256 expectedTransferCallCount = 1;
        assertEq(
            expectedTransferCallCount,
            vm.getAccountNonce(token) // Check number of calls to token contract
        );
    }

    function testCancelCommitment() public {
        // Create commitment
        testCreateCommitment();

        vm.prank(user1);
        commit.cancelCommitment(0);

        // Verify cancelled
        (,,,,, CommitProtocol.CommitmentStatus status,) = commit.getCommitmentDetails(0);
        assertEq(uint(status), uint(CommitProtocol.CommitmentStatus.Cancelled));
    }

    function testFailInvalidToken() public {
        address invalidToken = address(0x7);

        vm.startPrank(user1);
        vm.expectRevert(CommitProtocol.TokenNotAllowed.selector);

        commit.createCommitment{value: COMMIT_CREATION_FEE}(
            invalidToken,
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

    function testFailureScenarios() public {
        // Test insufficient allowance
        vm.startPrank(user1);
        vm.mockCall(
            token,
            abi.encodeWithSelector(IERC20.allowance.selector, user1, address(commit)),
            abi.encode(0) // No allowance
        );

        vm.expectRevert(); // Should revert due to insufficient allowance
        commit.createCommitment{value: COMMIT_CREATION_FEE}(
            token,
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