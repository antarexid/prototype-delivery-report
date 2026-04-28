export interface Customer {
  id: string;
  name: string;
  quantitySchedule: number;
  category: 'AUTO' | 'AUDIO';
}

export interface Delivery {
  id: string;
  customerId: string;
  customerName: string;
  actualQuantity: number;
  deliveryDate: { toDate: () => Date };
  barcode?: string;
  notes?: string;
}

export interface User {
  role: 'admin' | 'guest';
}
