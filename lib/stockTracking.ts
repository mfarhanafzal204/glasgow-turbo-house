import { 
  collection, 
  doc, 
  updateDoc, 
  addDoc, 
  getDocs, 
  query, 
  where,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { Item, Purchase, Sale } from '@/types';

export interface ItemStock {
  id: string;
  itemId: string;
  currentStock: number;
  totalPurchased: number;
  totalSold: number;
  averageCostPrice: number;
  lastPurchaseDate?: Date;
  lastSaleDate?: Date;
  lastPurchasePrice?: number;
  lastSalePrice?: number;
  updatedAt: Date;
}

export interface ItemStockSummary {
  itemId: string;
  itemName: string;
  itemCode: string;
  category: string;
  currentStock: number;
  totalPurchased: number;
  totalSold: number;
  averageCostPrice: number;
  totalCostValue: number;
  lastPurchaseDate?: Date;
  lastSaleDate?: Date;
  suppliers: string[];
  customers: string[];
  // Profit tracking fields
  totalPurchaseCost: number;
  totalSaleRevenue: number;
  totalProfit: number;
  profitMargin: number;
  averageSalePrice: number;
  profitPerUnit: number;
}

/**
 * Update item stock when a purchase is made
 */
export const updateItemStockFromPurchase = async (purchase: Purchase) => {
  try {
    for (const item of purchase.items) {
      const linkedItemId = (item as any).itemId;
      if (linkedItemId) {
        // Get existing stock record
        const stockQuery = query(
          collection(db, 'itemStock'),
          where('itemId', '==', linkedItemId)
        );
        const stockSnapshot = await getDocs(stockQuery);
        
        if (stockSnapshot.empty) {
          // Create new stock record
          await addDoc(collection(db, 'itemStock'), {
            itemId: linkedItemId,
            currentStock: item.quantity,
            totalPurchased: item.quantity,
            totalSold: 0,
            averageCostPrice: item.costPerUnit,
            lastPurchaseDate: purchase.purchaseDate,
            lastPurchasePrice: item.costPerUnit,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } else {
          // Update existing stock record
          const stockDoc = stockSnapshot.docs[0];
          const existingStock = stockDoc.data() as ItemStock;
          
          const newTotalPurchased = existingStock.totalPurchased + item.quantity;
          const newCurrentStock = existingStock.currentStock + item.quantity;
          const newTotalCost = (existingStock.averageCostPrice * existingStock.totalPurchased) + item.totalCost;
          const newAverageCost = newTotalCost / newTotalPurchased;
          
          await updateDoc(doc(db, 'itemStock', stockDoc.id), {
            currentStock: newCurrentStock,
            totalPurchased: newTotalPurchased,
            averageCostPrice: newAverageCost,
            lastPurchaseDate: purchase.purchaseDate,
            lastPurchasePrice: item.costPerUnit,
            updatedAt: new Date()
          });
        }
      }
    }
  } catch (error) {
    console.error('Error updating item stock from purchase:', error);
    throw error;
  }
};

/**
 * Update item stock when a sale is made
 */
export const updateItemStockFromSale = async (sale: Sale) => {
  try {
    for (const item of sale.items) {
      const linkedItemId = (item as any).itemId;
      if (linkedItemId) {
        // Get existing stock record
        const stockQuery = query(
          collection(db, 'itemStock'),
          where('itemId', '==', linkedItemId)
        );
        const stockSnapshot = await getDocs(stockQuery);
        
        if (!stockSnapshot.empty) {
          // Update existing stock record
          const stockDoc = stockSnapshot.docs[0];
          const existingStock = stockDoc.data() as ItemStock;
          
          const newTotalSold = existingStock.totalSold + item.quantity;
          const newCurrentStock = existingStock.currentStock - item.quantity;
          
          await updateDoc(doc(db, 'itemStock', stockDoc.id), {
            currentStock: Math.max(0, newCurrentStock), // Prevent negative stock
            totalSold: newTotalSold,
            lastSaleDate: sale.saleDate,
            lastSalePrice: item.pricePerUnit,
            updatedAt: new Date()
          });
        }
      }
    }
  } catch (error) {
    console.error('Error updating item stock from sale:', error);
    throw error;
  }
};

/**
 * Get comprehensive stock summary for all items
 */
export const getItemStockSummary = async (): Promise<ItemStockSummary[]> => {
  try {
    // Get all items
    const itemsSnapshot = await getDocs(collection(db, 'items'));
    const items = itemsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Item[];

    // Get all stock records
    const stockSnapshot = await getDocs(collection(db, 'itemStock'));
    const stockRecords = stockSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastPurchaseDate: doc.data().lastPurchaseDate?.toDate(),
      lastSaleDate: doc.data().lastSaleDate?.toDate()
    })) as ItemStock[];

    // Get all purchases and sales for supplier/customer tracking
    const purchasesSnapshot = await getDocs(collection(db, 'purchases'));
    const purchases = purchasesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      purchaseDate: doc.data().purchaseDate?.toDate()
    })) as Purchase[];

    const salesSnapshot = await getDocs(collection(db, 'sales'));
    const sales = salesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      saleDate: doc.data().saleDate?.toDate()
    })) as Sale[];

    // Create comprehensive summary with profit calculations
    const summary: ItemStockSummary[] = items.map(item => {
      const stockRecord = stockRecords.find(stock => stock.itemId === item.id);
      
      // Find suppliers for this item
      const itemSuppliers = new Set<string>();
      purchases.forEach(purchase => {
        purchase.items.forEach(purchaseItem => {
          if ((purchaseItem as any).itemId === item.id) {
            itemSuppliers.add(purchase.supplierName);
          }
        });
      });

      // Find customers for this item
      const itemCustomers = new Set<string>();
      sales.forEach(sale => {
        sale.items.forEach(saleItem => {
          if ((saleItem as any).itemId === item.id) {
            itemCustomers.add(sale.customerName);
          }
        });
      });

      // Calculate profit metrics - CORRECTED CALCULATION
      let totalPurchaseCost = 0;
      let totalSaleRevenue = 0;
      let totalSoldQuantity = 0;

      // Calculate total purchase cost for this item
      purchases.forEach(purchase => {
        purchase.items.forEach(purchaseItem => {
          if ((purchaseItem as any).itemId === item.id) {
            totalPurchaseCost += purchaseItem.totalCost;
          }
        });
      });

      // Calculate total sale revenue for this item
      sales.forEach(sale => {
        sale.items.forEach(saleItem => {
          if ((saleItem as any).itemId === item.id) {
            totalSaleRevenue += saleItem.totalPrice;
            totalSoldQuantity += saleItem.quantity;
          }
        });
      });

      // CORRECT PROFIT CALCULATION: Use cost of sold items only
      const averageCostPrice = stockRecord?.averageCostPrice || 0;
      const costOfSoldItems = totalSoldQuantity * averageCostPrice;
      const totalProfit = totalSaleRevenue - costOfSoldItems;
      const profitMargin = totalSaleRevenue > 0 ? (totalProfit / totalSaleRevenue) * 100 : 0;
      const averageSalePrice = totalSoldQuantity > 0 ? totalSaleRevenue / totalSoldQuantity : 0;
      const profitPerUnit = totalSoldQuantity > 0 ? totalProfit / totalSoldQuantity : 0;

      return {
        itemId: item.id,
        itemName: item.itemName,
        itemCode: item.itemCode,
        category: item.category,
        currentStock: stockRecord?.currentStock || 0,
        totalPurchased: stockRecord?.totalPurchased || 0,
        totalSold: stockRecord?.totalSold || 0,
        averageCostPrice: stockRecord?.averageCostPrice || 0,
        totalCostValue: (stockRecord?.averageCostPrice || 0) * (stockRecord?.currentStock || 0),
        lastPurchaseDate: stockRecord?.lastPurchaseDate,
        lastSaleDate: stockRecord?.lastSaleDate,
        suppliers: Array.from(itemSuppliers),
        customers: Array.from(itemCustomers),
        // Profit metrics
        totalPurchaseCost,
        totalSaleRevenue,
        totalProfit,
        profitMargin,
        averageSalePrice,
        profitPerUnit
      };
    });

    return summary.sort((a, b) => a.itemName.localeCompare(b.itemName));
  } catch (error) {
    console.error('Error getting item stock summary:', error);
    throw error;
  }
};

/**
 * Get stock information for a specific item
 */
export const getItemStock = async (itemId: string): Promise<ItemStock | null> => {
  try {
    const stockQuery = query(
      collection(db, 'itemStock'),
      where('itemId', '==', itemId)
    );
    const stockSnapshot = await getDocs(stockQuery);
    
    if (stockSnapshot.empty) {
      return null;
    }
    
    const stockDoc = stockSnapshot.docs[0];
    return {
      id: stockDoc.id,
      ...stockDoc.data(),
      lastPurchaseDate: stockDoc.data().lastPurchaseDate?.toDate(),
      lastSaleDate: stockDoc.data().lastSaleDate?.toDate()
    } as ItemStock;
  } catch (error) {
    console.error('Error getting item stock:', error);
    throw error;
  }
};

/**
 * Recalculate stock for a specific item from scratch
 */
export const recalculateItemStock = async (itemId: string) => {
  try {
    // Get all purchases for this item
    const purchasesSnapshot = await getDocs(collection(db, 'purchases'));
    let totalPurchased = 0;
    let totalCost = 0;
    let lastPurchaseDate: Date | undefined;
    let lastPurchasePrice = 0;

    purchasesSnapshot.docs.forEach(doc => {
      const purchaseData = doc.data();
      const purchase = {
        id: doc.id,
        supplierName: purchaseData.supplierName || '',
        supplierPhone: purchaseData.supplierPhone || '',
        purchaseDate: purchaseData.purchaseDate?.toDate() || new Date(),
        items: purchaseData.items || [],
        totalAmount: purchaseData.totalAmount || 0,
        notes: purchaseData.notes,
        createdAt: purchaseData.createdAt?.toDate() || new Date(),
        updatedAt: purchaseData.updatedAt?.toDate() || new Date()
      } as Purchase;
      
      purchase.items.forEach((item: any) => {
        if (item.itemId === itemId) {
          totalPurchased += item.quantity || 0;
          totalCost += item.totalCost || 0;
          if (!lastPurchaseDate || purchase.purchaseDate > lastPurchaseDate) {
            lastPurchaseDate = purchase.purchaseDate;
            lastPurchasePrice = item.costPerUnit || 0;
          }
        }
      });
    });

    // Get all sales for this item
    const salesSnapshot = await getDocs(collection(db, 'sales'));
    let totalSold = 0;
    let lastSaleDate: Date | undefined;
    let lastSalePrice = 0;

    salesSnapshot.docs.forEach(doc => {
      const saleData = doc.data();
      const sale = {
        id: doc.id,
        customerName: saleData.customerName || '',
        customerPhone: saleData.customerPhone || '',
        saleDate: saleData.saleDate?.toDate() || new Date(),
        items: saleData.items || [],
        totalAmount: saleData.totalAmount || 0,
        notes: saleData.notes,
        createdAt: saleData.createdAt?.toDate() || new Date(),
        updatedAt: saleData.updatedAt?.toDate() || new Date()
      } as Sale;
      
      sale.items.forEach((item: any) => {
        if (item.itemId === itemId) {
          totalSold += item.quantity || 0;
          if (!lastSaleDate || sale.saleDate > lastSaleDate) {
            lastSaleDate = sale.saleDate;
            lastSalePrice = item.pricePerUnit || 0;
          }
        }
      });
    });

    const currentStock = Math.max(0, totalPurchased - totalSold);
    const averageCostPrice = totalPurchased > 0 ? totalCost / totalPurchased : 0;

    // Update or create stock record
    const stockQuery = query(
      collection(db, 'itemStock'),
      where('itemId', '==', itemId)
    );
    const stockSnapshot = await getDocs(stockQuery);

    const stockData = {
      itemId,
      currentStock,
      totalPurchased,
      totalSold,
      averageCostPrice,
      lastPurchaseDate,
      lastPurchasePrice,
      lastSaleDate,
      lastSalePrice,
      updatedAt: new Date()
    };

    if (stockSnapshot.empty) {
      // Create new stock record
      await addDoc(collection(db, 'itemStock'), {
        ...stockData,
        createdAt: new Date()
      });
    } else {
      // Update existing stock record
      const stockDoc = stockSnapshot.docs[0];
      await updateDoc(doc(db, 'itemStock', stockDoc.id), stockData);
    }

    return stockData;
  } catch (error) {
    console.error('Error recalculating item stock:', error);
    throw error;
  }
};

/**
 * Recalculate all item stocks from scratch
 */
export const recalculateAllItemStocks = async () => {
  try {
    // Get all items
    const itemsSnapshot = await getDocs(collection(db, 'items'));
    const items = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Recalculate stock for each item
    for (const item of items) {
      await recalculateItemStock(item.id);
    }

    return true;
  } catch (error) {
    console.error('Error recalculating all item stocks:', error);
    throw error;
  }
};

/**
 * Debug function to check stock data for a specific item
 */
export const debugItemStock = async (itemId: string, itemName: string) => {
  try {
    console.log(`=== DEBUGGING STOCK FOR ITEM: ${itemName} (${itemId}) ===`);
    
    // Check purchases
    const purchasesSnapshot = await getDocs(collection(db, 'purchases'));
    let purchaseCount = 0;
    let purchaseQuantity = 0;
    
    purchasesSnapshot.docs.forEach(docSnapshot => {
      const purchaseData = docSnapshot.data();
      const purchase = {
        id: docSnapshot.id,
        supplierName: purchaseData.supplierName || '',
        supplierPhone: purchaseData.supplierPhone || '',
        purchaseDate: purchaseData.purchaseDate?.toDate() || new Date(),
        items: purchaseData.items || [],
        totalAmount: purchaseData.totalAmount || 0,
        notes: purchaseData.notes,
        createdAt: purchaseData.createdAt?.toDate() || new Date(),
        updatedAt: purchaseData.updatedAt?.toDate() || new Date()
      } as Purchase;
      
      purchase.items.forEach((item: any) => {
        if (item.itemId === itemId || item.itemName?.toLowerCase() === itemName.toLowerCase()) {
          purchaseCount++;
          purchaseQuantity += item.quantity || 0;
          console.log(`Purchase found: ${item.quantity} units from ${purchase.supplierName} on ${purchase.purchaseDate?.toLocaleDateString()}`);
        }
      });
    });
    
    // Check sales
    const salesSnapshot = await getDocs(collection(db, 'sales'));
    let saleCount = 0;
    let saleQuantity = 0;
    
    salesSnapshot.docs.forEach(docSnapshot => {
      const saleData = docSnapshot.data();
      const sale = {
        id: docSnapshot.id,
        customerName: saleData.customerName || '',
        customerPhone: saleData.customerPhone || '',
        saleDate: saleData.saleDate?.toDate() || new Date(),
        items: saleData.items || [],
        totalAmount: saleData.totalAmount || 0,
        notes: saleData.notes,
        createdAt: saleData.createdAt?.toDate() || new Date(),
        updatedAt: saleData.updatedAt?.toDate() || new Date()
      } as Sale;
      
      sale.items.forEach((item: any) => {
        if (item.itemId === itemId || item.itemName?.toLowerCase() === itemName.toLowerCase()) {
          saleCount++;
          saleQuantity += item.quantity || 0;
          console.log(`Sale found: ${item.quantity} units to ${sale.customerName} on ${sale.saleDate?.toLocaleDateString()}`);
        }
      });
    });
    
    // Check stock record
    const stockQuery = query(collection(db, 'itemStock'), where('itemId', '==', itemId));
    const stockSnapshot = await getDocs(stockQuery);
    
    console.log(`Purchase transactions: ${purchaseCount}, Total purchased: ${purchaseQuantity}`);
    console.log(`Sale transactions: ${saleCount}, Total sold: ${saleQuantity}`);
    console.log(`Expected stock: ${purchaseQuantity - saleQuantity}`);
    
    if (!stockSnapshot.empty) {
      const stockData = stockSnapshot.docs[0].data();
      console.log(`Current stock record:`, stockData);
    } else {
      console.log(`No stock record found for this item`);
    }
    
    console.log(`=== END DEBUG ===`);
    
    return {
      purchaseCount,
      purchaseQuantity,
      saleCount,
      saleQuantity,
      expectedStock: purchaseQuantity - saleQuantity
    };
  } catch (error) {
    console.error('Error debugging item stock:', error);
    throw error;
  }
};

/**
 * Get comprehensive profit analysis for a specific item
 */
export const getItemProfitAnalysis = async (itemId: string) => {
  try {
    // Get all purchases for this item
    const purchasesSnapshot = await getDocs(collection(db, 'purchases'));
    const purchaseTransactions: any[] = [];
    let totalPurchaseCost = 0;
    let totalPurchased = 0;

    purchasesSnapshot.docs.forEach(doc => {
      const purchaseData = doc.data();
      const purchase = {
        id: doc.id,
        supplierName: purchaseData.supplierName || '',
        supplierPhone: purchaseData.supplierPhone || '',
        purchaseDate: purchaseData.purchaseDate?.toDate() || new Date(),
        items: purchaseData.items || [],
        totalAmount: purchaseData.totalAmount || 0,
        notes: purchaseData.notes,
        createdAt: purchaseData.createdAt?.toDate() || new Date(),
        updatedAt: purchaseData.updatedAt?.toDate() || new Date()
      } as Purchase;
      
      purchase.items.forEach((item: any) => {
        if (item.itemId === itemId) {
          const transaction = {
            supplier: purchase.supplierName,
            date: purchase.purchaseDate,
            quantity: item.quantity || 0,
            costPerUnit: item.costPerUnit || 0,
            totalCost: item.totalCost || 0
          };
          purchaseTransactions.push(transaction);
          totalPurchaseCost += transaction.totalCost;
          totalPurchased += transaction.quantity;
        }
      });
    });

    // Get all sales for this item
    const salesSnapshot = await getDocs(collection(db, 'sales'));
    const saleTransactions: any[] = [];
    let totalSaleRevenue = 0;
    let totalSold = 0;

    salesSnapshot.docs.forEach(doc => {
      const saleData = doc.data();
      const sale = {
        id: doc.id,
        customerName: saleData.customerName || '',
        customerPhone: saleData.customerPhone || '',
        saleDate: saleData.saleDate?.toDate() || new Date(),
        items: saleData.items || [],
        totalAmount: saleData.totalAmount || 0,
        notes: saleData.notes,
        createdAt: saleData.createdAt?.toDate() || new Date(),
        updatedAt: saleData.updatedAt?.toDate() || new Date()
      } as Sale;
      
      sale.items.forEach((item: any) => {
        if (item.itemId === itemId) {
          // Calculate cost per unit for this sale (FIFO method)
          const averageCostPrice = totalPurchased > 0 ? totalPurchaseCost / totalPurchased : 0;
          const costForThisSale = averageCostPrice * (item.quantity || 0);
          
          const transaction = {
            customer: sale.customerName,
            date: sale.saleDate,
            quantity: item.quantity || 0,
            pricePerUnit: item.pricePerUnit || 0,
            totalPrice: item.totalPrice || 0,
            costPerUnit: averageCostPrice,
            totalProfit: (item.totalPrice || 0) - costForThisSale
          };
          saleTransactions.push(transaction);
          totalSaleRevenue += transaction.totalPrice;
          totalSold += transaction.quantity;
        }
      });
    });

    // Calculate summary
    const averageCostPrice = totalPurchased > 0 ? totalPurchaseCost / totalPurchased : 0;
    const averageSalePrice = totalSold > 0 ? totalSaleRevenue / totalSold : 0;
    
    // CORRECT PROFIT CALCULATION: Use actual cost of sold items, not all purchased items
    const costOfSoldItems = totalSold * averageCostPrice;
    const totalProfit = totalSaleRevenue - costOfSoldItems;
    const profitMargin = totalSaleRevenue > 0 ? (totalProfit / totalSaleRevenue) * 100 : 0;
    const profitPerUnit = totalSold > 0 ? totalProfit / totalSold : 0;

    return {
      profitBreakdown: {
        summary: {
          totalProfit,
          profitMargin,
          profitPerUnit,
          totalSold,
          totalPurchased,
          totalPurchaseCost,
          totalSaleRevenue,
          averageCostPrice,
          averageSalePrice
        },
        purchaseTransactions: purchaseTransactions.sort((a, b) => b.date.getTime() - a.date.getTime()),
        saleTransactions: saleTransactions.sort((a, b) => b.date.getTime() - a.date.getTime())
      }
    };
  } catch (error) {
    console.error('Error getting item profit analysis:', error);
    throw error;
  }
};

/**
 * Clear all stock data and recalculate from scratch
 */
export const resetAllStockData = async () => {
  try {
    // Delete all existing stock records
    const stockSnapshot = await getDocs(collection(db, 'itemStock'));
    const deletePromises = stockSnapshot.docs.map(docSnapshot => 
      deleteDoc(doc(db, 'itemStock', docSnapshot.id))
    );
    await Promise.all(deletePromises);

    // Recalculate all stocks
    await recalculateAllItemStocks();

    return true;
  } catch (error) {
    console.error('Error resetting all stock data:', error);
    throw error;
  }
};