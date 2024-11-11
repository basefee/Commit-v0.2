'use client'

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import CommitCard from "../../components/CommitCard"
import { useAccount, useReadContracts } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { GraphQLClient, gql } from "graphql-request"
import { Loader2 } from "lucide-react"
import { useRouter } from 'next/navigation'
import abi from "../../contract/abi.json";
import { Abi } from "viem";

// Define types for Commit and CommitmentDetails
interface Commit {
  id: string
  description: string
  stakeAmount: string
  CommitProtocol_id: number
}

interface CommitmentDetails {
  participantCount: bigint
  timeRemaining: bigint
}

// GraphQL Client setup
const graphqlClient = new GraphQLClient("https://api.studio.thegraph.com/query/93948/commit/version/latest")

// Define GraphQL query
const GET_ACTIVE_COMMITS = gql`
  query Subgraphs {
    commitmentCreateds(first: 10) {
      CommitProtocol_id
      description
      stakeAmount
    }
  }
`

// Contract address and ABI for interacting with smart contract
const contractAddress: `0x${string}` = "0x15ef602D45B42c63402af795bD2A96742ee936a7";
const contractABI: Abi = abi as Abi;

export default function CommitPage() {
  const { isConnected } = useAccount()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const router = useRouter()

  // Fetch active commits using GraphQL
  const { data: graphqlData, isLoading: graphqlLoading, error: graphqlError } = useQuery<{ commitmentCreateds: Commit[] }>({
    queryKey: ["data"],
    queryFn: async () => {
      return await graphqlClient.request(GET_ACTIVE_COMMITS)
    },
  })

  // Use wagmi to read contract data for each commit
  const contractReadConfigs =
    graphqlData?.commitmentCreateds.map((commit) => ({
      address: contractAddress,
      abi: contractABI,
      functionName: "getCommitmentDetails",
      args: [BigInt(commit.CommitProtocol_id)],
    })) || []

  const { data: contractDataResults, isLoading: contractsLoading, error: contractsError } = useReadContracts({
    contracts: contractReadConfigs,
  })

  // Combine GraphQL data with contract results
  const combinedCommitments =
    graphqlData?.commitmentCreateds.map((commit, index) => {
      const contractResult = contractDataResults?.[index]

      if (contractResult && 'result' in contractResult && Array.isArray(contractResult.result)) {
        const [participantCount, timeRemaining] = contractResult.result as [bigint, bigint]
        return {
          ...commit,
          participants: participantCount.toString(),
          timeRemaining: `${BigInt(timeRemaining) / BigInt(60)} minutes`,
        }
      } else {
        return {
          ...commit,
          participants: "0",
          timeRemaining: "N/A", // Fallback for missing data
        }
      }
    }) ?? []

  const handleProfile = () => {
    setDropdownOpen(false)
    window.location.href = "/profile"
  }

  // Return loading and error UI
  if (graphqlLoading || contractsLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
  if (graphqlError || contractsError) return <p>Error loading data. Please try again later.</p>

  return (
    <div className="flex flex-col space-y-8 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-semibold">Active Commits</h2>
        <div className="relative">
          <ConnectButton.Custom>
            {({ account, chain, openAccountModal, openConnectModal }) => {
              if (!account || !chain) {
                return (
                  <button
                    onClick={openConnectModal}
                    className="bg-blue-500 text-white px-4 rounded-lg font-semibold py-2"
                  >
                    Connect Wallet
                  </button>
                )
              }
              return (
                <div>
                  <button
                    className="rounded-full bg-gray-800 p-2"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <img src="/profile.svg" alt="Profile" width={30} height={30} />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-500 rounded-lg shadow-lg">
                      <button
                        onClick={handleProfile}
                        className="block w-full text-left px-4 py-2 hover:text-green-500"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => {
                          setDropdownOpen(false)
                          openAccountModal()
                        }}
                        className="block w-full text-left px-4 py-2 hover:text-green-500"
                      >
                        Disconnect
                      </button>
                    </div>
                  )}
                </div>
              )
            }}
          </ConnectButton.Custom>
        </div>
      </div>

      <div className="space-y-4">
        {combinedCommitments.map((commit) => (
          <div
            key={commit.CommitProtocol_id}
            onClick={() => router.push(`/commit/${commit.CommitProtocol_id}`)}
            className="cursor-pointer"
          >
            <CommitCard
              oneLiner={commit.description}
              participants={commit.participants}
              stakeAmount={(BigInt(commit.stakeAmount) / BigInt(10**18)).toString()}
              deadline={commit.timeRemaining}
              id={commit.CommitProtocol_id}
            />
          </div>
        ))}
      </div>
    </div>
  )
}