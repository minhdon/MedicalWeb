export interface Medicine {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  unit: string;
  manufacturer: string;
  ingredients?: string;
  usage?: string;
  dosage?: string;
  preservation?: string;
  sideEffects?: string;
  precautions?: string;
  brand?: string;
  origin?: string;
  expiryDate?: string;
  imageUrl?: string;
  requiresPrescription: boolean;
  createdAt: string;
  updatedAt: string;
  variants?: { unit: string; price: number }[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
}

export interface OrderItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipping' | 'delivered' | 'cancelled';
  deliveryBranch?: string;
  paymentMethod: 'cash' | 'card' | 'transfer';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  manager: string;
  isActive: boolean;
}

export interface InventoryLog {
  id: string;
  medicineId: string;
  medicineName: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  createdAt: string;
  createdBy: string;
}
