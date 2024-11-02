import Link from 'next/link';

export default function Sidebar() {
  return (
    <nav className="w-64 bg-zinc-900 p-6 fixed h-screen">
      <img src='/logo.jpg' alt='logo' className='w-60 pb-3' />
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
          <Link href="https://www.youtube.com/@ethprotocolfellows" className="flex items-center space-x-2 text-lg text-white hover:text-green-400 group">
            <img src="/support.svg" alt="Support Icon" width={30} height={30} className="group-hover:opacity-60 transition-opacity" />
            <span>Support</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
