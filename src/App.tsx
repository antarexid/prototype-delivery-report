import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  Timestamp,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { Customer, Delivery, User } from './types';
import { CUSTOMERS_INITIAL_DATA } from './constants';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import DeliveryManager from './components/DeliveryManager';
import CustomerManager from './components/CustomerManager';
import AdminLogin from './components/AdminLogin';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthContextType {
  user: User | null;
  login: (password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'delivery' | 'customers'>('dashboard');
  const [loading, setLoading] = useState(true);

  // Initialize data if empty
  useEffect(() => {
    const checkAndSeedData = async () => {
      const q = query(collection(db, 'customers'));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log("Seeding initial customer data...");
        const batch = writeBatch(db);
        CUSTOMERS_INITIAL_DATA.forEach((cust) => {
          const newDocRef = doc(collection(db, 'customers'));
          batch.set(newDocRef, cust);
        });
        await batch.commit();
      }
    };

    checkAndSeedData();
  }, []);

  // Real-time listeners
  useEffect(() => {
    const customersUnsub = onSnapshot(collection(db, 'customers'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
      setCustomers(data);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'customers'));

    const deliveriesUnsub = onSnapshot(
      query(collection(db, 'deliveries'), orderBy('deliveryDate', 'desc')), 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          deliveryDate: doc.data().deliveryDate
        } as Delivery));
        setDeliveries(data);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'deliveries')
    );

    return () => {
      customersUnsub();
      deliveriesUnsub();
    };
  }, []);

  const login = (password: string) => {
    if (password === "admin") {
      setUser({ role: 'admin' });
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden font-sans">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="flex-1 flex flex-col min-w-0">
          <TopHeader setActiveTab={setActiveTab} />
          
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Dashboard customers={customers} deliveries={deliveries} />
                </motion.div>
              )}

              {activeTab === 'delivery' && (
                <motion.div
                  key="delivery"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <DeliveryManager customers={customers} deliveries={deliveries} />
                </motion.div>
              )}

              {activeTab === 'customers' && (
                <motion.div
                  key="customers"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {user?.role === 'admin' ? (
                    <CustomerManager customers={customers} />
                  ) : (
                    <AdminLogin onSuccess={() => setActiveTab('customers')} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Footer />
        </main>
      </div>
    </AuthContext.Provider>
  );
}

function TopHeader({ setActiveTab }: { setActiveTab: any }) {
  const { user } = useAuth();
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm relative z-10">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-2.5 py-1 rounded border border-green-200">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> 
          <span className="text-[10px] font-bold tracking-wider">REALTIME SYNC ACTIVE</span>
        </div>
        <div className="h-4 w-px bg-slate-200"></div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
          <span>Scanner:</span>
          <span className="text-blue-600 font-bold underline cursor-pointer hover:text-blue-700">READY TO SCAN</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-900 uppercase leading-none">{user?.role || 'Guest Mode'}</p>
            <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-tight font-medium">Verified Session</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs shadow-inner">
            {user?.role === 'admin' ? 'AD' : 'GS'}
          </div>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="h-10 bg-slate-900 text-slate-400 flex items-center px-6 text-[10px] justify-between border-t border-slate-800 shrink-0">
      <div className="flex items-center gap-6">
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Last Sync: 1 min ago</span>
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> System Node: Stable</span>
      </div>
      <div className="font-mono opacity-40 uppercase tracking-[0.2em] font-medium">
        E-Windo Logistics Terminal v2.4.0-P
      </div>
    </footer>
  );
}
