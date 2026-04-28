import React, { useState } from 'react';
import { Customer, Delivery } from '../types';
import { 
  Plus, Search, Calendar, Scan, Trash2, Download, Filter, 
  MapPin, Clock, Tag, FileText, ChevronRight, X, Truck, Activity, Upload
} from 'lucide-react';
import { useAuth } from '../App';
import BarcodeScanner from './BarcodeScanner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { cn } from '../lib/utils';

interface DeliveryManagerProps {
  customers: Customer[];
  deliveries: Delivery[];
}

export default function DeliveryManager({ customers, deliveries }: DeliveryManagerProps) {
  const { user, createDelivery, deleteDelivery, importDeliveries } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'AUTO' | 'AUDIO'>('ALL');

  const [formData, setFormData] = useState({
    customerId: '',
    actualQuantity: '',
    barcode: '',
    notes: ''
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" }) as any[];

        const toImport: Omit<Delivery, 'id'>[] = [];
        let count = 0;
        let skipped = 0;

        for (const row of jsonData) {
          const custName = String(row.Customer || row['Customer Name'] || row.PT || '').trim();
          const partName = String(row['Part Name'] || row.Part || '').trim();
          const qty = Number(row.Quantity || row.Qty || row.Actual || 0);
          const rawDate = row['Tanggal Pengiriman'] || row.Date || row.Tanggal;
          const barcode = String(row.Barcode || row.BC || '').trim();
          const notesFromExcel = String(row.Notes || row.Keterangan || '').trim();
          
          if (!custName && !qty && !barcode) continue;

          const finalNotesArr = [];
          if (partName) finalNotesArr.push(`Part: ${partName}`);
          if (notesFromExcel) finalNotesArr.push(notesFromExcel);
          const finalNotes = finalNotesArr.join(" | ");

          const cleanExcelName = custName.toLowerCase();
          const customer = customers.find(c => {
            const cleanDbName = c.name.toLowerCase();
            return cleanDbName === cleanExcelName || 
                   cleanDbName.includes(cleanExcelName) || 
                   cleanExcelName.includes(cleanDbName);
          });

          if (!customer) {
            skipped++;
            continue;
          }

          let deliveryDate = new Date();
          if (rawDate) {
            const parsedDate = rawDate instanceof Date ? rawDate : new Date(rawDate);
            if (!isNaN(parsedDate.getTime())) {
              deliveryDate = parsedDate;
            }
          }

          toImport.push({
            customerId: customer.id,
            customerName: customer.name,
            actualQuantity: qty,
            barcode: barcode,
            notes: finalNotes,
            deliveryDate: { toDate: () => deliveryDate } as any
          });
          count++;
        }

        if (count > 0) {
          await importDeliveries(toImport);
          let msg = `Successfully imported ${count} records.`;
          if (skipped > 0) msg += ` (${skipped} rows skipped due to unknown customer names)`;
          alert(msg);
        } else {
          alert('No records imported. Make sure customer names match the master list.');
        }
      } catch (error) {
        console.error("Excel import failed:", error);
        alert("Failed to parse Excel file.");
      } finally {
        setIsImporting(false);
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const filteredDeliveries = deliveries.filter(d => {
    const matchesSearch = d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         d.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
    const customer = customers.find(c => c.id === d.customerId);
    const matchesCategory = selectedCategory === 'ALL' || customer?.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.actualQuantity) return;

    const selectedCustomer = customers.find(c => c.id === formData.customerId);
    if (!selectedCustomer) return;

    try {
      await createDelivery({
        customerId: formData.customerId,
        customerName: selectedCustomer.name,
        actualQuantity: Number(formData.actualQuantity),
        barcode: formData.barcode,
        notes: formData.notes,
        deliveryDate: new Date() as any
      });

      setFormData({ customerId: '', actualQuantity: '', barcode: '', notes: '' });
      setIsAdding(false);
    } catch (error) {
      console.error("Create delivery failed", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || user.role !== 'admin') return;
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await deleteDelivery(id);
    } catch (error) {
      console.error("Delete delivery failed", error);
    }
  };

  const downloadTemplate = () => {
    const templateData = [{
      'Customer': 'PT. CUSTOMER NAME',
      'Part Name': 'Optional Part Info',
      'Quantity': 100,
      'Tanggal Pengiriman': format(new Date(), 'yyyy-MM-dd'),
      'Barcode': 'BC123456',
      'Notes': 'Extra info here'
    }];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "E-Windo_Import_Template.xlsx");
  };

  const exportToExcel = () => {
    const data = filteredDeliveries.map(d => ({
      'Date': format(d.deliveryDate.toDate(), 'yyyy-MM-dd HH:mm'),
      'Customer': d.customerName,
      'Quantity': d.actualQuantity,
      'Barcode': d.barcode || '-',
      'Notes': d.notes || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Deliveries");
    XLSX.writeFile(wb, `Delivery_History_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
  };

  const handleScanSuccess = (decodedText: string) => {
    setFormData(prev => ({ ...prev, barcode: decodedText }));
    setIsScanning(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight italic uppercase">ACTUAL DELIVERY LOGS</h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Fulfillment tracking terminal</p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          {user?.role === 'admin' && (
            <>
              <button 
                onClick={downloadTemplate}
                className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-xs font-black hover:bg-slate-200 transition-all shadow-sm"
                title="Download Import Template"
              >
                <Download className="w-3.5 h-3.5 mr-2" />
                TEMPLATE
              </button>
              <label className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-black hover:bg-slate-800 transition-all shadow-md cursor-pointer">

                <Upload className="w-3.5 h-3.5 mr-2" />
                IMPORT
                <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
              </label>
              <button 
                onClick={() => setIsAdding(true)}
                className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-black hover:bg-blue-700 shadow-md active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5 mr-2" />
                NEW ENTRY
              </button>
            </>
          )}
          <button 
            onClick={exportToExcel}
            className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 mr-2" />
            EXPORT
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-3 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Quick search (Customer/Barcode)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-xs font-semibold transition-all"
          />
        </div>
        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          {(['ALL', 'AUTO', 'AUDIO'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-4 py-1.5 rounded-md text-[10px] font-black tracking-widest transition-all",
                selectedCategory === cat ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Delivery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredDeliveries.map((delivery) => (
          <div key={delivery.id} className="bg-white rounded-xl p-4 border border-slate-200 relative group transition-all hover:border-blue-300 hover:shadow-md">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {user?.role === 'admin' && (
                <button 
                  onClick={() => handleDelete(delivery.id)}
                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                <Truck className="w-4 h-4 text-slate-600" />
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-black text-slate-900 truncate pr-6 uppercase italic tracking-tight">{delivery.customerName}</h4>
                <div className="flex items-center text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                  <Clock className="w-2.5 h-2.5 mr-1" />
                  {format(delivery.deliveryDate.toDate(), 'HH:mm • dd MMM')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                <p className="text-[8px] text-slate-400 font-black uppercase mb-0.5">QTY</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-slate-900 font-mono tracking-tighter">{delivery.actualQuantity.toLocaleString()}</span>
                  <div className="w-1 h-1 rounded-full bg-green-500"></div>
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                <p className="text-[8px] text-slate-400 font-black uppercase mb-0.5">ID/BC</p>
                <span className="text-[10px] font-bold text-slate-600 truncate block font-mono">{delivery.barcode || '---'}</span>
              </div>
            </div>

            {delivery.notes && (
              <div className="mt-3 pt-3 border-t border-slate-50">
                <p className="text-[10px] text-slate-400 italic line-clamp-1">
                  "{delivery.notes}"
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredDeliveries.length === 0 && (
        <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <div className="inline-flex p-4 bg-slate-50 rounded-full mb-4">
            <Filter className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No delivery records found</h3>
          <p className="text-slate-500 text-sm mt-1">Try adjusting your search or filters.</p>
        </div>
      )}

      {/* Add Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-xl">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 italic">LOG NEW DELIVERY</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manual entry or barcode scan</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAdding(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Customer PT</label>
                  <select 
                    required
                    value={formData.customerId}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none text-sm font-semibold transition-all appearance-none"
                  >
                    <option value="">Select Customer...</option>
                    {customers.sort((a,b) => a.name.localeCompare(b.name)).map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.category})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Quantity</label>
                  <input 
                    type="number" 
                    required
                    placeholder="Enter units..."
                    value={formData.actualQuantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, actualQuantity: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none text-sm font-semibold transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Barcode / ID</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Scan or type barcode..."
                    value={formData.barcode}
                    onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none text-sm font-semibold transition-all"
                  />
                  <button 
                    type="button"
                    onClick={() => setIsScanning(true)}
                    className="p-3 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors"
                  >
                    <Scan className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Delivery Notes</label>
                <textarea 
                  placeholder="Additional details, truck plate, etc..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none text-sm font-semibold transition-all h-24 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-[2] px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
                >
                  CONFIRM DELIVERY
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {isScanning && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-900 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Scan className="w-5 h-5 text-blue-400" />
                <span className="text-white font-bold text-sm">Align Barcode in Frame</span>
              </div>
              <button 
                onClick={() => setIsScanning(false)}
                className="text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <BarcodeScanner onResult={handleScanSuccess} />
            </div>
            <div className="p-6 bg-slate-50 text-center">
              <p className="text-xs text-slate-500 font-medium">Scanning for E-Windo logistics barcodes...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
