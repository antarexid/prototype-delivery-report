import React, { useState } from 'react';
import { Customer } from '../types';
import { useAuth } from '../App';
import { Edit2, Trash2, Plus, Save, X, Search, UserPlus } from 'lucide-react';
import { cn } from '../lib/utils';

interface CustomerManagerProps {
  customers: Customer[];
}

export default function CustomerManager({ customers }: CustomerManagerProps) {
  const { updateCustomer, deleteCustomer, createCustomer } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', quantitySchedule: '', category: 'AUTO' as const });

  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'AUTO' | 'AUDIO'>('ALL');

  const handleUpdate = async (id: string) => {
    try {
      await updateCustomer(id, { quantitySchedule: Number(editValue) });
      setEditingId(null);
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this customer? This will not remove their previous delivery logs.')) return;
    try {
      await deleteCustomer(id);
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCustomer({
        name: newCustomer.name,
        quantitySchedule: Number(newCustomer.quantitySchedule),
        category: newCustomer.category
      });
      setIsAdding(false);
      setNewCustomer({ name: '', quantitySchedule: '', category: 'AUTO' });
    } catch (error) {
      console.error("Create failed", error);
    }
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight italic uppercase">MASTER SCHEDULE TERMINAL</h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Volume targets and partner registries</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-black hover:bg-blue-700 shadow-md active:scale-95 transition-all"
        >
          <UserPlus className="w-3.5 h-3.5 mr-2" />
          ADD PARTNER
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-3 bg-slate-50/80 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter master list..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500 outline-none text-[11px] font-semibold transition-all"
            />
          </div>
          
          <div className="flex bg-slate-200 p-0.5 rounded-lg border border-slate-300 w-full md:w-auto">
            {(['ALL', 'AUTO', 'AUDIO'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "flex-1 md:flex-none px-4 py-1.5 rounded-md text-[9px] font-black tracking-widest transition-all",
                  selectedCategory === cat ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          <span className="text-[10px] font-bold text-slate-400 hidden lg:block">{filteredCustomers.length} RECORDS INDEXED</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50/50">
                <th className="px-6 py-3 border-b border-slate-100">Customer (PT) Name</th>
                <th className="px-6 py-3 border-b border-slate-100">Division</th>
                <th className="px-6 py-3 border-b border-slate-100 text-center">Schedule Qty</th>
                <th className="px-6 py-3 border-b border-slate-100 text-right">Terminal Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.sort((a,b) => a.name.localeCompare(b.name)).map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-3">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-900 italic tracking-tight">{cust.name}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">ID: {cust.id.substring(0, 8)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase border",
                      cust.category === 'AUTO' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-purple-50 text-purple-600 border-purple-100"
                    )}>
                      {cust.category}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    {editingId === cust.id ? (
                      <input 
                        type="number" 
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-24 px-2 py-1 border border-blue-500 rounded bg-white text-xs font-bold text-center"
                        autoFocus
                      />
                    ) : (
                      <span className="text-[11px] font-black text-slate-700 font-mono tracking-tighter">{cust.quantitySchedule.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {editingId === cust.id ? (
                        <>
                          <button 
                            onClick={() => handleUpdate(cust.id)}
                            className="p-1 px-2 bg-green-500 text-white rounded text-[10px] font-bold hover:bg-green-600"
                          >
                            SAVE
                          </button>
                          <button 
                            onClick={() => setEditingId(null)}
                            className="p-1 px-2 bg-slate-200 text-slate-600 rounded text-[10px] font-bold hover:bg-slate-300"
                          >
                            X
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => {
                              setEditingId(cust.id);
                              setEditValue(cust.quantitySchedule.toString());
                            }}
                            className="text-[10px] font-black text-blue-600 hover:underline px-2"
                          >
                            EDIT
                          </button>
                          <button 
                            onClick={() => handleDelete(cust.id)}
                            className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-xl">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase italic">NEW PARTNER</h3>
              </div>
              <button 
                onClick={() => setIsAdding(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Customer Name (PT.)</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. PT. NEW CUSTOMER"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none text-sm font-bold transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Initial Target</label>
                  <input 
                    type="number" 
                    required
                    placeholder="Enter qty..."
                    value={newCustomer.quantitySchedule}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, quantitySchedule: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none text-sm font-bold transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Division</label>
                  <select 
                    value={newCustomer.category}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, category: e.target.value as 'AUTO' | 'AUDIO' }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none text-sm font-bold transition-all"
                  >
                    <option value="AUTO">AUTO</option>
                    <option value="AUDIO">AUDIO</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                 <button 
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-50"
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  className="flex-[2] px-4 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all"
                >
                  SAVE PARTNER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
