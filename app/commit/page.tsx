"use client";

import { useState } from "react";
import CommitCard from '../../components/CommitCard';
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const activeCommits = [
  {
    oneLiner: 'Support public goods by donating to 3 projects.',
    participants: ['0x123', '0x456', '0x789'],
    stakeAmount: '15 USDC',
    deadline: '5d left',
    id: 1,
  },
  {
    oneLiner: 'Complete 5km run every day for a week.',
    participants: ['0xabc', '0xdef'],
    stakeAmount: '10 USDC',
    deadline: '2d left',
    id: 2,
  },
];

export default function CommitPage() {
  const { isConnected } = useAccount();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleProfile = () => {
    setDropdownOpen(false);
    window.location.href = "/profile";
  };

  return (
    <div className="flex flex-col space-y-8 p-6">
      {/* Top navigation */}
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
                    <img
                      src="/profile.svg"
                      alt="Profile"
                      width={30}
                      height={30}
                    />
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
                          openAccountModal(); // Open the disconnect modal
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

      {/* Commit cards */}
      <div className="space-y-4">
        {activeCommits.map((commit) => (
          <CommitCard
            key={commit.id}
            oneLiner={commit.oneLiner}
            participants={commit.participants.length}
            stakeAmount={commit.stakeAmount}
            deadline={commit.deadline}
            id={commit.id}
          />
        ))}
      </div>
    </div>
  );
}
