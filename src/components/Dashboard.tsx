import React, { useMemo } from 'react';
import { Customer, Delivery } from '../types';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid 
} from 'recharts';
import { 
  ArrowUpRight, ArrowDownRight, Activity, TrendingUp, Download, PieChart as PieIcon, BarChart3 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface DashboardProps {
  customers: Customer[];
  deliveries: Delivery[];
}

export default function Dashboard({ customers, deliveries }: DashboardProps) {
  const stats = useMemo(() => {
    const autoSchedule = customers
      .filter(c => c.category === 'AUTO')
      .reduce((sum, c) => sum + c.quantitySchedule, 0);
    
    const audioSchedule = customers
      .filter(c => c.category === 'AUDIO')
      .reduce((sum, c) => sum + c.quantitySchedule, 0);

    const autoActual = deliveries
      .filter(d => customers.find(c => c.id === d.customerId)?.category === 'AUTO')
      .reduce((sum, d) => sum + d.actualQuantity, 0);

    const audioActual = deliveries
      .filter(d => customers.find(c => c.id === d.customerId)?.category === 'AUDIO')
      .reduce((sum, d) => sum + d.actualQuantity, 0);

    return {
      auto: { schedule: autoSchedule, actual: autoActual, balancing: autoSchedule - autoActual },
      audio: { schedule: audioSchedule, actual: audioActual, balancing: audioSchedule - audioActual },
      totalSchedule: autoSchedule + audioSchedule,
      totalActual: autoActual + audioActual
    };
  }, [customers, deliveries]);

  const autoData = [
    { name: 'Schedule', value: stats.auto.schedule },
    { name: 'Actual', value: stats.auto.actual },
    { name: 'Balancing', value: Math.max(0, stats.auto.balancing) },
  ];

  const audioData = [
    { name: 'Schedule', value: stats.audio.schedule },
    { name: 'Actual', value: stats.audio.actual },
    { name: 'Balancing', value: Math.max(0, stats.audio.balancing) },
  ];

  const COLORS = ['#2563eb', '#16a34a', '#ef4444'];

  const exportGeneralReport = () => {
    const data = customers.map(cust => {
      const actual = deliveries
        .filter(d => d.customerId === cust.id)
        .reduce((sum, d) => sum + d.actualQuantity, 0);
      return {
        'Customer Name': cust.name,
        'Category': cust.category,
        'Quantity Schedule': cust.quantitySchedule,
        'Actual Delivery': actual,
        'Balancing': cust.quantitySchedule - actual,
        'Completion %': cust.quantitySchedule > 0 ? `${((actual / cust.quantitySchedule) * 100).toFixed(2)}%` : '0%'
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Delivery Report");
    XLSX.writeFile(wb, `Delivery_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Schedule" 
          value={stats.totalSchedule.toLocaleString()} 
          icon={Activity} 
          trend="Cumulative target"
          color="blue"
        />
        <StatCard 
          title="Actual Delivered" 
          value={stats.totalActual.toLocaleString()} 
          icon={TrendingUp} 
          trend={`${((stats.totalActual / stats.totalSchedule) * 100 || 0).toFixed(1)}% fulfillment`}
          color="green"
        />
        <StatCard 
          title="Balancing Gap" 
          value={(stats.totalSchedule - stats.totalActual).toLocaleString()} 
          icon={ArrowDownRight} 
          trend="Remaining volume"
          color="red"
        />
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reports</span>
            <div className="p-1.5 bg-slate-100 rounded-lg">
              <Download className="w-4 h-4 text-slate-500" />
            </div>
          </div>
          <button 
            onClick={exportGeneralReport}
            className="w-full mt-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-2 text-[11px] font-bold transition-all shadow-md active:scale-95"
          >
            Export Comprehensive Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AUTO Profile */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <PieIcon className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase italic">PENCAPAIAN DELIVERY PART AUTO</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 border border-slate-100 px-2 py-0.5 rounded">REALTIME</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[9px] text-slate-400 font-black uppercase mb-0.5">SCHEDULED</p>
              <p className="text-xl font-black text-slate-900">{stats.auto.schedule.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-xl border border-green-100">
              <p className="text-[9px] text-green-600 font-black uppercase mb-0.5">ACTUAL</p>
              <p className="text-xl font-black text-green-700">{stats.auto.actual.toLocaleString()}</p>
            </div>
          </div>

          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={autoData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {autoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AUDIO Profile */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-100 rounded-lg">
                <PieIcon className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase italic">PENCAPAIAN DELIVERY PART AUDIO</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 border border-slate-100 px-2 py-0.5 rounded">REALTIME</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[9px] text-slate-400 font-black uppercase mb-0.5">SCHEDULED</p>
              <p className="text-xl font-black text-slate-900">{stats.audio.schedule.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-xl border border-green-100">
              <p className="text-[9px] text-green-600 font-black uppercase mb-0.5">ACTUAL</p>
              <p className="text-xl font-black text-green-700">{stats.audio.actual.toLocaleString()}</p>
            </div>
          </div>

          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={audioData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {audioData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bar Comparison */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-8">
          <div className="p-1.5 bg-orange-100 rounded-lg">
            <BarChart3 className="w-4 h-4 text-orange-600" />
          </div>
          <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase italic">QUANTITY VS ACTUAL BY DIVISION</h3>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { name: 'AUTOTRONICS', schedule: stats.auto.schedule, actual: stats.auto.actual, balancing: stats.auto.balancing },
                { name: 'AUDIOTRONICS', schedule: stats.audio.schedule, actual: stats.audio.actual, balancing: stats.audio.balancing },
              ]}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '10px' }}
              />
              <Legend verticalAlign="top" align="right" iconType="rect" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingBottom: '20px' }}/>
              <Bar dataKey="schedule" fill="#e2e8f0" radius={[2, 2, 0, 0]} barSize={32} />
              <Bar dataKey="actual" fill="#2563eb" radius={[2, 2, 0, 0]} barSize={32} />
              <Bar dataKey="balancing" fill="#ef4444" radius={[2, 2, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, color }: { title: string, value: string, icon: any, trend: string, color: 'blue' | 'green' | 'red' }) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    red: "bg-red-50 text-red-600 border-red-100"
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
        <div className={cn("p-1.5 rounded-lg border", colorMap[color])}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className="mt-4">
        <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{value}</h4>
        <p className="text-[9px] font-black text-slate-400 mt-2 uppercase tracking-tight">{trend}</p>
      </div>
    </div>
  );
}
