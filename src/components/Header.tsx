import { Bell, Search, UserCircle } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6 sticky top-0 z-10 ml-64">
      <div className="flex items-center bg-slate-100 rounded-md px-3 py-1.5 w-96">
        <Search size={18} className="text-slate-400 mr-2" />
        <input 
          type="text" 
          placeholder="Search guests, reservations, rooms..." 
          className="bg-transparent border-none outline-none w-full text-sm placeholder:text-slate-500"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        <div className="flex items-center gap-3 border-l pl-4">
          <div className="text-right">
            <p className="text-sm font-medium leading-none">Admin User</p>
            <p className="text-xs text-slate-500 mt-1">Manager</p>
          </div>
          <UserCircle size={32} className="text-slate-400" />
        </div>
      </div>
    </header>
  );
}
