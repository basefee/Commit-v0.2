import Link from 'next/link';

export default function Sidebar() {
  return (
    <nav className="w-64 bg-zinc-900 p-6 fixed h-screen flex flex-col justify-between">
      <div>
        <img src='/logo.svg' alt='logo' className='w-60 pb-7 pt-4' />
        <ul className="space-y-3 px-3">
          {/* Home Link */}
          <li>
            <Link href="/commit" className="flex items-center space-x-2 text-lg text-white hover:text-green-400 group">
              <img src="/home.svg" alt="Home Icon" width={30} height={30} className="group-hover:opacity-60 transition-opacity" />
              <span>Home</span>
            </Link>
          </li>
          {/* Create Link */}
          <li>
            <Link href="/create" className="flex items-center space-x-2 text-lg text-white hover:text-green-400 group">
              <img src="/create.svg" alt="Create Icon" width={30} height={30} className="group-hover:opacity-60 transition-opacity" />
              <span>Create</span>
            </Link>
          </li>
          {/* Support Link */}
          <li>
            <Link href="https://t.me/revmiller" className="flex items-center space-x-2 text-lg text-white hover:text-green-400 group">
              <img src="/support.svg" alt="Support Icon" width={29} height={29} className="group-hover:opacity-60 transition-opacity px-1" />
              <span>Support</span>
            </Link>
          </li>
          {/* About Link */}
          <li>
            <Link href="https://commitwtf.notion.site/Commit-wiki-133ff6ac3d18809092f6fdcc85958bc3?pvs=4" className="flex items-center space-x-2 text-lg text-white hover:text-green-400 group">
              <img src="/about.svg" alt="About Icon" width={30} height={30} className="group-hover:opacity-60 transition-opacity" />
              <span>About</span>
            </Link>
          </li>
        </ul>
      </div>
      
      {/* Social Icons */}
      <div className="flex justify-center space-x-4 mt-4">
        <a href="https://t.me/+e0yHv2tdDG40ZTZi" target="_blank" rel="noopener noreferrer" className="text-white hover:text-green-400">
        <img src="/telegram.svg" alt="Telegram Icon" width={27} height={27} className="group-hover:opacity-60 transition-opacity" />
        </a>
        <a href="https://warpcast.com/~/channel/commit" target="_blank" rel="noopener noreferrer" className="text-white hover:text-green-400">
        <img src="/warp.svg" alt="Warpcast Icon" width={27} height={27} className="group-hover:opacity-60 transition-opacity" />
        </a>
        <a href="https://x.com/commitwtf" target="_blank" rel="noopener noreferrer" className="text-white hover:text-green-400">
        <img src="/x.svg" alt="X Icon" width={27} height={27} className="group-hover:opacity-60 transition-opacity" />
        </a>
      </div>
    </nav>
  );
}