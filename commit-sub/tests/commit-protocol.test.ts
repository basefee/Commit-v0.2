import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { ClientDeactivated } from "../generated/schema"
import { ClientDeactivated as ClientDeactivatedEvent } from "../generated/CommitProtocol/CommitProtocol"
import { handleClientDeactivated } from "../src/commit-protocol"
import { createClientDeactivatedEvent } from "./commit-protocol-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let clientAddress = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let newClientDeactivatedEvent = createClientDeactivatedEvent(clientAddress)
    handleClientDeactivated(newClientDeactivatedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("ClientDeactivated created and stored", () => {
    assert.entityCount("ClientDeactivated", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "ClientDeactivated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "clientAddress",
      "0x0000000000000000000000000000000000000001"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
