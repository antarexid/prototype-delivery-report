import React from 'react';
import { useAuth } from '../App';
import { LayoutDashboard, Truck, Users, LogOut, LogIn, Database, Shield } from 'lucide-react';
import { cn } from '../lib/utils';

interface HeaderProps {
  activeTab: 'dashboard' | 'delivery' | 'customers';
  setActiveTab: (tab: 'dashboard' | 'delivery' | 'customers') => void;
}

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Main Operations' },
    { id: 'delivery', label: 'Actual Delivery', icon: Truck, section: 'Main Operations' },
    { id: 'customers', label: 'Delivery Schedule', icon: Users, section: 'Main Operations' },
  ] as const;

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 transition-all duration-300">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-blue-400 flex items-center gap-2">
          E-WINDO
          <span className="text-slate-500 text-[9px] block font-black uppercase tracking-[0.2em] border-l border-slate-700 pl-2">System</span>
        </h1>
        <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">Factory Delivery v2.4</p>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-6">
        <div>
          <div className="px-3 mb-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Main Operations</div>
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200",
                  activeTab === item.id
                    ? "bg-blue-600 text-white shadow-xl shadow-blue-900/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                )}
              >
                <item.icon className={cn("w-4 h-4", activeTab === item.id ? "text-white" : "text-slate-500")} />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="px-3 mb-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">System Monitor</div>
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-500 hover:text-slate-300 font-medium">
              <Database className="w-4 h-4" />
              Database Logs
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-500 hover:text-slate-300 font-medium">
              <Shield className="w-4 h-4" />
              Security Audit
            </button>
          </div>
        </div>
      </nav>

      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/50">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-black text-xs shadow-lg">
            {user?.role === 'admin' ? 'AD' : 'GS'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black truncate text-white uppercase tracking-tight">{user?.role === 'admin' ? 'System Admin' : 'Guest Viewer'}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Level: {user?.role || 'Limited'}</p>
          </div>
          {user && (
            <button 
              onClick={logout}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
