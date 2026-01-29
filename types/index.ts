export interface Product {
  id: string;
  name: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  turboImage: string;
  compatibleCarImage: string;
  compatibleVehicles: string[];
  category: string;
  inStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail?: string; // Legacy field
  customerPhone?: string; // Legacy field
  customerAddress?: string; // Legacy field
  email?: string; // New field
  phone?: string; // New field
  address?: string; // New field
  items: (CartItem | OrderItem)[];
  totalAmount: number;
  originalTotal?: number;
  savings?: number;
  paymentMethod: 'meezan-bank' | 'jazzcash' | string;
  paymentStatus?: 'pending' | 'verified' | 'failed';
  paymentProofUrl?: string; // Legacy field
  paymentProofSubmitted?: boolean;
  paymentProofData?: string; // Base64 encoded image
  paymentProofFileName?: string;
  paymentProofSize?: number;
  paymentProofType?: string;
  orderDate?: Date;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  originalPrice?: number;
  total: number;
  turboImage?: string;
  compatibleVehicles?: string[];
}

export interface ContactMessage {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomTurboOrder {
  id: string;
  turboName: string;
  compatibleVehicle: string;
  description: string;
  estimatedPrice: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  status: 'pending' | 'quoted' | 'confirmed' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentInfo {
  meezanBank: {
    accountTitle: string;
    accountNumber: string;
  };
  jazzCash: {
    accountTitle: string;
    mobileNumber: string;
  };
}

// New types for inventory management
export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseItem {
  id: string;
  itemName: string;
  quantity: number;
  costPerUnit: number;
  totalCost: number;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierPhone: string;
  items: PurchaseItem[];
  totalAmount: number;
  purchaseDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleItem {
  id: string;
  itemName: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
}

export interface Sale {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerCity?: string;
  items: SaleItem[];
  totalAmount: number;
  saleDate: Date;
  paymentMethod?: 'cash' | 'bank' | 'jazzcash' | 'other';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// New types for comprehensive item management
export interface Item {
  id: string;
  itemCode: string; // Unique item code (e.g., GT3576-TURBO)
  itemName: string;
  description: string;
  category: 'turbo' | 'core' | 'cartridge' | 'engine' | 'filter' | 'oil' | 'brake' | 'other';
  subcategory?: string; // e.g., 'diesel-turbo', 'petrol-turbo'
  brand?: string; // e.g., 'Garrett', 'Holset', 'BorgWarner'
  model?: string; // e.g., 'GT3576', 'HX40'
  compatibleVehicles: string[];
  specifications?: {
    [key: string]: string; // e.g., { "Power": "300HP", "Size": "Large" }
  };
  unitOfMeasure: 'piece' | 'kg' | 'liter' | 'meter' | 'set';
  minimumStock: number;
  maximumStock: number;
  reorderLevel: number;
  storageLocation?: string;
  barcode?: string;
  images?: string[];
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemSupplier {
  id: string;
  itemId: string;
  supplierId: string;
  supplierItemCode?: string; // Supplier's own code for this item
  supplierItemName?: string; // Supplier's name for this item
  lastPurchasePrice: number;
  averagePurchasePrice: number;
  minimumOrderQuantity: number;
  leadTimeDays: number;
  isPreferredSupplier: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemStock {
  id: string;
  itemId: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  totalPurchased: number;
  totalSold: number;
  lastPurchaseDate?: Date;
  lastSaleDate?: Date;
  averageCostPrice: number;
  totalCostValue: number;
  updatedAt: Date;
}
export interface FinancialTransaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  subcategory?: string;
  amount: number;
  description: string;
  paymentMethod: 'cash' | 'bank' | 'jazzcash' | 'easypaisa' | 'card' | 'other';
  transactionDate: Date;
  fromPerson?: string; // For income: who paid you
  toPerson?: string;   // For expense: who you paid
  reference?: string;  // Receipt number, invoice number, etc.
  notes?: string;
  attachments?: string[]; // URLs to receipt images
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialCategory {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'both';
  description?: string;
  color: string;
  icon: string;
  subcategories?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  currentCashFlow: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyBalance: number;
  topIncomeCategories: { category: string; amount: number; percentage: number }[];
  topExpenseCategories: { category: string; amount: number; percentage: number }[];
  recentTransactions: FinancialTransaction[];
  upcomingRecurring: FinancialTransaction[];
}

export interface MonthlyFinancialReport {
  month: string;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  transactionCount: number;
  topIncomeSource: string;
  topExpenseCategory: string;
  cashFlowTrend: 'positive' | 'negative' | 'stable';
}