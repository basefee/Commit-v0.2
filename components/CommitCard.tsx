import Image from 'next/image';
import Link from 'next/link';

interface CommitCardProps {
  oneLiner: string;
  participants: string;
  stakeAmount?: string; // Optional
  deadline?: string;    // Optional
  id: number;           // Add an ID to know which page to redirect to
}

export default function CommitCard({ oneLiner, participants, stakeAmount, deadline, id }: CommitCardProps) {
  return (
    <Link href={`/commit/${id}`} passHref>
      <div className="bg-zinc-800 p-4 rounded-lg shadow-md w-full max-w-3xl mx-auto text-white cursor-pointer mb-4">
        {/* Card Contents */}
        <div className="flex items-center justify-between">
          
          {/* One Liner (Title) - Left Aligned */}
          <span className="text-lg font-semibold text-left">{oneLiner}</span>

          {/* Right Aligned Section */}
          <div className="flex items-center space-x-6">
            {/* Number of Participants */}
            <div className="flex items-center space-x-1">
              <Image src="/participants.svg" alt="Participants Icon" width={30} height={30} />
              <span className="text-sm">{participants}</span>
            </div>

            {/* Amount to Stake */}
            {stakeAmount && (
              <div className="flex items-center space-x-1">
                <Image src="/usdc.svg" alt="Stake Icon" width={21} height={21} />
                <span className="text-sm">{stakeAmount}</span>
              </div>
            )}

            {/* Deadline Timer */}
            {deadline && (
              <div className="flex items-center space-x-1">
                <Image src="/time.svg" alt="Deadline Icon" width={30} height={30} />
                <span className="text-sm">{deadline}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
