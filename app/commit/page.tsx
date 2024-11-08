"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import CommitCard from "../../components/CommitCard";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { GraphQLClient, gql } from "graphql-request";

interface Commit {
  id: string;
  oneLiner: string;
  participants: string[];
  stakeAmount: string;
  deadline: string;
}

const graphqlClient = new GraphQLClient("https://api.studio.thegraph.com/query/93948/commit/version/latest");

const GET_ACTIVE_COMMITS = gql`
  query GetActiveCommits {
  commitmentCreateds(first: 10) {
    id
    CommitProtocol_id
    creator
    client
    tokenAddress
    stakeAmount
    joinFee
    creatorShare
    blockNumber
    blockTimestamp
    transactionHash
  }
  }
`;

export default function CommitPage() {
  const { isConnected } = useAccount();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fetch active commits using TanStack React Query, with type annotation
  const { data, isLoading, error } = useQuery<{ commitmentCreateds: Commit[] }>({
    queryKey: ["activeCommits"],
    queryFn: async () => {
      const response = await graphqlClient.request<{ commitmentCreateds: Commit[] }>(GET_ACTIVE_COMMITS);
      return response;
    },
  });

  const handleProfile = () => {
    setDropdownOpen(false);
    window.location.href = "/profile";
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading commits</p>;

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
                );
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
                          setDropdownOpen(false);
                          openAccountModal();
                        }}
                        className="block w-full text-left px-4 py-2 hover:text-green-500"
                      >
                        Disconnect
                      </button>
                    </div>
                  )}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>

      <div className="space-y-4">
        {data?.commitmentCreateds.map((commit) => (
          <CommitCard
            key={commit.id}
            oneLiner={commit.oneLiner}
            participants={10}
            stakeAmount={commit.stakeAmount}
            deadline={commit.deadline}
            id={parseInt(commit.id, 10)}
          />
        ))}
      </div>
    </div>
  );
}
