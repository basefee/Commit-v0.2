import {
  ClientDeactivated as ClientDeactivatedEvent,
  ClientRegistered as ClientRegisteredEvent,
  CommitmentCancelled as CommitmentCancelledEvent,
  CommitmentCreated as CommitmentCreatedEvent,
  CommitmentEmergencyPaused as CommitmentEmergencyPausedEvent,
  CommitmentEmergencyResolved as CommitmentEmergencyResolvedEvent,
  CommitmentJoined as CommitmentJoinedEvent,
  CommitmentResolved as CommitmentResolvedEvent,
  EmergencyWithdrawal as EmergencyWithdrawalEvent,
  FeesClaimed as FeesClaimedEvent,
  Initialized as InitializedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  Paused as PausedEvent,
  ProtocolFeeAddressUpdated as ProtocolFeeAddressUpdatedEvent,
  RewardsClaimed as RewardsClaimedEvent,
  TokenAllowanceUpdated as TokenAllowanceUpdatedEvent,
  Unpaused as UnpausedEvent,
  Upgraded as UpgradedEvent
} from "../generated/CommitProtocol/CommitProtocol"
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
} from "../generated/schema"

import { Bytes } from "@graphprotocol/graph-ts"

export function handleClientDeactivated(event: ClientDeactivatedEvent): void {
  let entity = new ClientDeactivated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.clientAddress = event.params.clientAddress

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleClientRegistered(event: ClientRegisteredEvent): void {
  let entity = new ClientRegistered(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.clientAddress = event.params.clientAddress
  entity.feeAddress = event.params.feeAddress
  entity.feeShare = event.params.feeShare

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleCommitmentCancelled(
  event: CommitmentCancelledEvent
): void {
  let entity = new CommitmentCancelled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.CommitProtocol_id = event.params.id

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleCommitmentCreated(event: CommitmentCreatedEvent): void {
  let entity = new CommitmentCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.CommitProtocol_id = event.params.id
  entity.creator = event.params.creator
  entity.client = event.params.client
  entity.tokenAddress = event.params.tokenAddress
  entity.stakeAmount = event.params.stakeAmount
  entity.joinFee = event.params.joinFee
  entity.creatorShare = event.params.creatorShare
  entity.description = event.params.description

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleCommitmentEmergencyPaused(
  event: CommitmentEmergencyPausedEvent
): void {
  let entity = new CommitmentEmergencyPaused(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.CommitProtocol_id = event.params.id

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleCommitmentEmergencyResolved(
  event: CommitmentEmergencyResolvedEvent
): void {
  let entity = new CommitmentEmergencyResolved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.CommitProtocol_id = event.params.id

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleCommitmentJoined(event: CommitmentJoinedEvent): void {
  let entity = new CommitmentJoined(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.CommitProtocol_id = event.params.id
  entity.participant = event.params.participant

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleCommitmentResolved(event: CommitmentResolvedEvent): void {
  let entity = new CommitmentResolved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.CommitProtocol_id = event.params.id
  entity.winners = changetype<Bytes[]>(event.params.winners)

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleEmergencyWithdrawal(
  event: EmergencyWithdrawalEvent
): void {
  let entity = new EmergencyWithdrawal(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.token = event.params.token
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleFeesClaimed(event: FeesClaimedEvent): void {
  let entity = new FeesClaimed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.recipient = event.params.recipient
  entity.token = event.params.token
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleInitialized(event: InitializedEvent): void {
  let entity = new Initialized(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.version = event.params.version

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePaused(event: PausedEvent): void {
  let entity = new Paused(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.account

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleProtocolFeeAddressUpdated(
  event: ProtocolFeeAddressUpdatedEvent
): void {
  let entity = new ProtocolFeeAddressUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.oldAddress = event.params.oldAddress
  entity.newAddress = event.params.newAddress

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRewardsClaimed(event: RewardsClaimedEvent): void {
  let entity = new RewardsClaimed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.CommitProtocol_id = event.params.id
  entity.user = event.params.user
  entity.token = event.params.token
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTokenAllowanceUpdated(
  event: TokenAllowanceUpdatedEvent
): void {
  let entity = new TokenAllowanceUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.token = event.params.token
  entity.allowed = event.params.allowed

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUnpaused(event: UnpausedEvent): void {
  let entity = new Unpaused(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.account

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUpgraded(event: UpgradedEvent): void {
  let entity = new Upgraded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.implementation = event.params.implementation

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
