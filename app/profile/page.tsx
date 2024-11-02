"use client";

import { useState } from "react";

export default function ProfilePage() {
  // Sample data for profile stats and commits
  const committed = 123;
  const earned = 12;
  const successRate = 100;

  const createdCommits = [
    { description: "One liner description of commit", reward: 200, stake: 4000, time: "23:59:59" },
    { description: "One liner description of commit", reward: 97, stake: 1000, time: "15:23:45" },
  ];

  const activeCommits = [
    { description: "One liner description of commit", reward: 200, stake: 4000, time: "23:59:59" },
    { description: "One liner description of commit", reward: 97, stake: 1000, time: "15:23:45" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-zinc-950 text-white">
      <h1 className="text-4xl font-semibold mb-8">Profile</h1>
      
      <div className="flex justify-around w-full max-w-md mb-8">
        <div className="text-center">
          <p className="text-xl font-semibold">Committed</p>
          <p className="text-lg">${committed}</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold">Earned</p>
          <p className="text-lg">${earned}</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold">Success Rate</p>
          <p className="text-lg">{successRate}%</p>
        </div>
      </div>

      <div className="w-full max-w-md space-y-6">
        <Section title="Created by Me" commits={createdCommits} />
        <Section title="Active Commits" commits={activeCommits} />
      </div>
    </div>
  );
}

type Commit = {
  description: string;
  reward: number;
  stake: number;
  time: string;
};

type SectionProps = {
  title: string;
  commits: Commit[];
};

function Section({ title, commits }: SectionProps) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>
      {commits.map((commit, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-4 mb-4 rounded bg-gray-800 border border-gray-700"
        >
          <p className="flex-grow text-lg">{commit.description}</p>
          <div className="flex items-center space-x-2">
            <span className="text-green-500">${commit.reward}</span>
            <span className="text-gray-400">•</span>
            <span className="text-yellow-500">{commit.stake}</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">{commit.time}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
