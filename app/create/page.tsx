"use client";

import { useState, ChangeEvent, FormEvent } from "react";

export default function CreateCommitPage() {
  const [oneLiner, setOneLiner] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [resolutionRules, setResolutionRules] = useState<string>("");
  const [deadline, setDeadline] = useState<string>("");
  const [creatorFee, setCreatorFee] = useState<number>(1);
  const [commitStake, setCommitStake] = useState<number>(10);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    switch (name) {
      case "oneLiner":
        setOneLiner(value);
        break;
      case "description":
        setDescription(value);
        break;
      case "resolutionRules":
        setResolutionRules(value);
        break;
      case "deadline":
        setDeadline(value);
        break;
      case "creatorFee":
        setCreatorFee(Number(value));
        break;
      case "commitStake":
        setCommitStake(Number(value));
        break;
      default:
        break;
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Handle the form submission
    console.log({
      oneLiner,
      description,
      resolutionRules,
      deadline,
      creatorFee,
      commitStake,
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-zinc-950 text-white">
      <h1 className="text-4xl font-semibold mb-8">Commit to Something</h1>
      
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
        <div>
          <label className="block text-lg mb-2">I'm committing to ...</label>
          <input
            type="text"
            name="oneLiner"
            value={oneLiner}
            onChange={handleInputChange}
            placeholder="one-liner description"
            className="w-full p-3 rounded bg-zinc-800 text-white placeholder-gray-500 border border-zinc-800 focus:outline-none focus:border-green-500"
            required
          />
        </div>

        <div>
          <label className="block text-lg mb-2">Description</label>
          <textarea
            name="description"
            value={description}
            onChange={handleInputChange}
            placeholder="Detailed overview"
            className="w-full p-3 rounded bg-zinc-800 text-white placeholder-gray-500 border border-zinc-800 focus:outline-none focus:border-green-500"
            rows={4}
            required
          />
        </div>

        <div>
          <label className="block text-lg mb-2">Resolution Rules</label>
          <textarea
            name="resolutionRules"
            value={resolutionRules}
            onChange={handleInputChange}
            placeholder="What would count as success?"
            className="w-full p-3 rounded bg-zinc-800 text-white placeholder-gray-500 border border-zinc-800 focus:outline-none focus:border-green-500"
            rows={4}
            required
          />
        </div>

        <div>
          <label className="block text-lg mb-2">Deadline</label>
          <input
            type="datetime-local"
            name="deadline"
            value={deadline}
            onChange={handleInputChange}
            className="w-full p-3 rounded bg-zinc-800 text-white placeholder-gray-500 border border-zinc-800 focus:outline-none focus:border-green-500"
            required
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="block text-lg mb-2">Creator Fee</label>
            <input
              type="number"
              name="creatorFee"
              value={creatorFee}
              onChange={handleInputChange}
              className="w-20 p-3 rounded bg-zinc-800 text-white placeholder-gray-500 border border-zinc-800 focus:outline-none focus:border-green-500"
              required
            />
          </div>

          <span className="text-lg text-green-500">$HIGHER</span>

          <div>
            <label className="block text-lg mb-2">Commit Stake</label>
            <input
              type="number"
              name="commitStake"
              value={commitStake}
              onChange={handleInputChange}
              className="w-20 p-3 rounded bg-zinc-800 text-white placeholder-gray-500 border border-zinc-800 focus:outline-none focus:border-green-500"
              required
            />
          </div>

          <span className="text-lg text-green-500">$HIGHER</span>
        </div>

        <p className="text-gray-500 text-sm mt-4">
          Note: to prevent spam, creating a commit costs 0.001 ETH. Thank you for your support. Let’s commit!
        </p>

        <button
          type="submit"
          className="w-full p-3 mt-4 bg-green-500 text-white font-semibold rounded hover:bg-green-600 focus:outline-none"
        >
          Commit
        </button>
      </form>
    </div>
  );
}
