"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface CommitPageProps {
  params: {
    commitId: string;
  };
}

interface CommitData {
  oneLiner: string;
  description: string;
  resolution: string;
  participants: number;
  stakeAmount: string;
  deadline: string;
}

// Simulate fetching the description and resolution from a database
const getDatabaseData = async (commitId: string) => {
  const data = {
    description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
    resolution: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
  };
  return data;
};

// Simulate fetching oneliner, participants, stakeAmount, and deadline from smart contract
const getSmartContractData = async (commitId: string) => {
  const data = {
    oneLiner: `Commit ${commitId} - Achieve Goal X`,
    participants: 50, // Mocked data
    stakeAmount: "200.00", // Mocked USDC
    deadline: "November 1, 2024 5:00 PM", // Mocked deadline
  };
  return data;
};

export default function CommitPage({ params }: CommitPageProps) {
  const { commitId } = params;
  const [commitData, setCommitData] = useState<CommitData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Simulate fetching from both a database and a smart contract
        const [dbData, contractData] = await Promise.all([getDatabaseData(commitId), getSmartContractData(commitId)]);
        
        // Combine the two sets of data
        setCommitData({
          ...dbData,
          ...contractData,
        });
      } catch (error) {
        console.error('Error fetching commit data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [commitId]);

  if (loading) {
    return <div className="text-center text-white">Loading...</div>;
  }

  if (!commitData) {
    return <div className="text-center text-white">Failed to load commit data.</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Assuming the sidebar component is already rendered elsewhere */}
      <div className="flex flex-col items-center py-10">
        <div className="bg-zinc-800 rounded-lg shadow-md w-full max-w-3xl p-6 space-y-6">
          {/* Title */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">{commitData.oneLiner}</h1>
            <div className="flex items-center space-x-2">
              <Image src="/participants.svg" alt="Participants Icon" width={30} height={30} />
              <span>{commitData.participants}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-lg font-semibold">Description</h2>
            <p className="text-sm text-gray-400">{commitData.description}</p>
          </div>

          {/* Commit Resolution */}
          <div>
            <h2 className="text-lg font-semibold">Commit Resolution</h2>
            <p className="text-sm text-gray-400">{commitData.resolution}</p>
          </div>

          {/* Stake Amount and Deadline */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-1">
              <Image src="/usdc.svg" alt="Stake Icon" width={21} height={21} />
              <span className="text-sm">{commitData.stakeAmount} USDC</span>
            </div>
            <div className="flex items-center space-x-1">
              <Image src="/time.svg" alt="Deadline Icon" width={30} height={30} />
              <span className="text-sm">{commitData.deadline}</span>
            </div>
          </div>

          {/* Commit Button */}
          <div className="flex justify-center items-center space-x-4 mt-6">
            <button className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-lg text-lg font-semibold">
              Commit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
