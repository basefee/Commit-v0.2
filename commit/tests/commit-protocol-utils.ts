import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  ClientDeactivated,
  ClientRegistered,
  CommitmentCancelled,
  CommitmentCreated,
  CommitmentEmergencyPaused,
  CommitmentEmergencyResolved,
  CommitmentJoined,
  CommitmentResolved,
  EmergencyWithdrawal,
  FeesClaimed,
  Initialized,
  OwnershipTransferred,
  Paused,
  ProtocolFeeAddressUpdated,
  RewardsClaimed,
  TokenAllowanceUpdated,
  Unpaused,
  Upgraded
} from "../generated/CommitProtocol/CommitProtocol"

export function createClientDeactivatedEvent(
  clientAddress: Address
): ClientDeactivated {
  let clientDeactivatedEvent = changetype<ClientDeactivated>(newMockEvent())

  clientDeactivatedEvent.parameters = new Array()

  clientDeactivatedEvent.parameters.push(
    new ethereum.EventParam(
      "clientAddress",
      ethereum.Value.fromAddress(clientAddress)
    )
  )

  return clientDeactivatedEvent
}

export function createClientRegisteredEvent(
  clientAddress: Address,
  feeAddress: Address,
  feeShare: i32
): ClientRegistered {
  let clientRegisteredEvent = changetype<ClientRegistered>(newMockEvent())

  clientRegisteredEvent.parameters = new Array()

  clientRegisteredEvent.parameters.push(
    new ethereum.EventParam(
      "clientAddress",
      ethereum.Value.fromAddress(clientAddress)
    )
  )
  clientRegisteredEvent.parameters.push(
    new ethereum.EventParam(
      "feeAddress",
      ethereum.Value.fromAddress(feeAddress)
    )
  )
  clientRegisteredEvent.parameters.push(
    new ethereum.EventParam(
      "feeShare",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(feeShare))
    )
  )

  return clientRegisteredEvent
}

export function createCommitmentCancelledEvent(
  id: BigInt
): CommitmentCancelled {
  let commitmentCancelledEvent = changetype<CommitmentCancelled>(newMockEvent())

  commitmentCancelledEvent.parameters = new Array()

  commitmentCancelledEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromUnsignedBigInt(id))
  )

  return commitmentCancelledEvent
}

export function createCommitmentCreatedEvent(
  id: BigInt,
  creator: Address,
  client: Address,
  tokenAddress: Address,
  stakeAmount: BigInt,
  joinFee: BigInt,
  creatorShare: i32,
  description: string
): CommitmentCreated {
  let commitmentCreatedEvent = changetype<CommitmentCreated>(newMockEvent())

  commitmentCreatedEvent.parameters = new Array()

  commitmentCreatedEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromUnsignedBigInt(id))
  )
  commitmentCreatedEvent.parameters.push(
    new ethereum.EventParam("creator", ethereum.Value.fromAddress(creator))
  )
  commitmentCreatedEvent.parameters.push(
    new ethereum.EventParam("client", ethereum.Value.fromAddress(client))
  )
  commitmentCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenAddress",
      ethereum.Value.fromAddress(tokenAddress)
    )
  )
  commitmentCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "stakeAmount",
      ethereum.Value.fromUnsignedBigInt(stakeAmount)
    )
  )
  commitmentCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "joinFee",
      ethereum.Value.fromUnsignedBigInt(joinFee)
    )
  )
  commitmentCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "creatorShare",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(creatorShare))
    )
  )
  commitmentCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "description",
      ethereum.Value.fromString(description)
    )
  )

  return commitmentCreatedEvent
}

export function createCommitmentEmergencyPausedEvent(
  id: BigInt
): CommitmentEmergencyPaused {
  let commitmentEmergencyPausedEvent = changetype<CommitmentEmergencyPaused>(
    newMockEvent()
  )

  commitmentEmergencyPausedEvent.parameters = new Array()

  commitmentEmergencyPausedEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromUnsignedBigInt(id))
  )

  return commitmentEmergencyPausedEvent
}

export function createCommitmentEmergencyResolvedEvent(
  id: BigInt
): CommitmentEmergencyResolved {
  let commitmentEmergencyResolvedEvent =
    changetype<CommitmentEmergencyResolved>(newMockEvent())

  commitmentEmergencyResolvedEvent.parameters = new Array()

  commitmentEmergencyResolvedEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromUnsignedBigInt(id))
  )

  return commitmentEmergencyResolvedEvent
}

export function createCommitmentJoinedEvent(
  id: BigInt,
  participant: Address
): CommitmentJoined {
  let commitmentJoinedEvent = changetype<CommitmentJoined>(newMockEvent())

  commitmentJoinedEvent.parameters = new Array()

  commitmentJoinedEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromUnsignedBigInt(id))
  )
  commitmentJoinedEvent.parameters.push(
    new ethereum.EventParam(
      "participant",
      ethereum.Value.fromAddress(participant)
    )
  )

  return commitmentJoinedEvent
}

export function createCommitmentResolvedEvent(
  id: BigInt,
  winners: Array<Address>
): CommitmentResolved {
  let commitmentResolvedEvent = changetype<CommitmentResolved>(newMockEvent())

  commitmentResolvedEvent.parameters = new Array()

  commitmentResolvedEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromUnsignedBigInt(id))
  )
  commitmentResolvedEvent.parameters.push(
    new ethereum.EventParam("winners", ethereum.Value.fromAddressArray(winners))
  )

  return commitmentResolvedEvent
}

export function createEmergencyWithdrawalEvent(
  token: Address,
  amount: BigInt
): EmergencyWithdrawal {
  let emergencyWithdrawalEvent = changetype<EmergencyWithdrawal>(newMockEvent())

  emergencyWithdrawalEvent.parameters = new Array()

  emergencyWithdrawalEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  emergencyWithdrawalEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return emergencyWithdrawalEvent
}

export function createFeesClaimedEvent(
  recipient: Address,
  token: Address,
  amount: BigInt
): FeesClaimed {
  let feesClaimedEvent = changetype<FeesClaimed>(newMockEvent())

  feesClaimedEvent.parameters = new Array()

  feesClaimedEvent.parameters.push(
    new ethereum.EventParam("recipient", ethereum.Value.fromAddress(recipient))
  )
  feesClaimedEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  feesClaimedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return feesClaimedEvent
}

export function createInitializedEvent(version: BigInt): Initialized {
  let initializedEvent = changetype<Initialized>(newMockEvent())

  initializedEvent.parameters = new Array()

  initializedEvent.parameters.push(
    new ethereum.EventParam(
      "version",
      ethereum.Value.fromUnsignedBigInt(version)
    )
  )

  return initializedEvent
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent = changetype<OwnershipTransferred>(
    newMockEvent()
  )

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createPausedEvent(account: Address): Paused {
  let pausedEvent = changetype<Paused>(newMockEvent())

  pausedEvent.parameters = new Array()

  pausedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return pausedEvent
}

export function createProtocolFeeAddressUpdatedEvent(
  oldAddress: Address,
  newAddress: Address
): ProtocolFeeAddressUpdated {
  let protocolFeeAddressUpdatedEvent = changetype<ProtocolFeeAddressUpdated>(
    newMockEvent()
  )

  protocolFeeAddressUpdatedEvent.parameters = new Array()

  protocolFeeAddressUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "oldAddress",
      ethereum.Value.fromAddress(oldAddress)
    )
  )
  protocolFeeAddressUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newAddress",
      ethereum.Value.fromAddress(newAddress)
    )
  )

  return protocolFeeAddressUpdatedEvent
}

export function createRewardsClaimedEvent(
  id: BigInt,
  user: Address,
  token: Address,
  amount: BigInt
): RewardsClaimed {
  let rewardsClaimedEvent = changetype<RewardsClaimed>(newMockEvent())

  rewardsClaimedEvent.parameters = new Array()

  rewardsClaimedEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromUnsignedBigInt(id))
  )
  rewardsClaimedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  rewardsClaimedEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  rewardsClaimedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return rewardsClaimedEvent
}

export function createTokenAllowanceUpdatedEvent(
  token: Address,
  allowed: boolean
): TokenAllowanceUpdated {
  let tokenAllowanceUpdatedEvent = changetype<TokenAllowanceUpdated>(
    newMockEvent()
  )

  tokenAllowanceUpdatedEvent.parameters = new Array()

  tokenAllowanceUpdatedEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  tokenAllowanceUpdatedEvent.parameters.push(
    new ethereum.EventParam("allowed", ethereum.Value.fromBoolean(allowed))
  )

  return tokenAllowanceUpdatedEvent
}

export function createUnpausedEvent(account: Address): Unpaused {
  let unpausedEvent = changetype<Unpaused>(newMockEvent())

  unpausedEvent.parameters = new Array()

  unpausedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return unpausedEvent
}

export function createUpgradedEvent(implementation: Address): Upgraded {
  let upgradedEvent = changetype<Upgraded>(newMockEvent())

  upgradedEvent.parameters = new Array()

  upgradedEvent.parameters.push(
    new ethereum.EventParam(
      "implementation",
      ethereum.Value.fromAddress(implementation)
    )
  )

  return upgradedEvent
}
