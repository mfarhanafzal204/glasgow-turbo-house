import { Purchase, Sale } from '@/types';

export interface InventoryItem {
  itemName: string;
  totalPurchased: number;
  totalSold: number;
  availableStock: number;
  averageCostPrice: number;
  totalCostValue: number;
}

export interface AvailableItem {
  itemName: string;
  availableStock: number;
  averageCostPrice: number;
  suggestedSalePrice: number; // Cost + margin
}

/**
 * Calculate inventory from purchases and sales
 */
export const calculateInventory = (purchases: Purchase[], sales: Sale[]): InventoryItem[] => {
  const inventoryMap = new Map<string, InventoryItem>();

  // Process purchases (add to inventory)
  purchases.forEach(purchase => {
    purchase.items.forEach(item => {
      const itemName = item.itemName.toLowerCase().trim();
      
      if (inventoryMap.has(itemName)) {
        const existing = inventoryMap.get(itemName)!;
        existing.totalPurchased += item.quantity;
        existing.totalCostValue += item.totalCost;
        existing.averageCostPrice = existing.totalCostValue / existing.totalPurchased;
      } else {
        inventoryMap.set(itemName, {
          itemName: item.itemName, // Keep original case
          totalPurchased: item.quantity,
          totalSold: 0,
          availableStock: item.quantity,
          averageCostPrice: item.costPerUnit,
          totalCostValue: item.totalCost
        });
      }
    });
  });

  // Process sales (subtract from inventory)
  sales.forEach(sale => {
    sale.items.forEach(item => {
      const itemName = item.itemName.toLowerCase().trim();
      
      if (inventoryMap.has(itemName)) {
        const existing = inventoryMap.get(itemName)!;
        existing.totalSold += item.quantity;
      }
    });
  });

  // Calculate available stock
  inventoryMap.forEach(item => {
    item.availableStock = item.totalPurchased - item.totalSold;
  });

  return Array.from(inventoryMap.values())
    .filter(item => item.totalPurchased > 0) // Only show items that were purchased
    .sort((a, b) => a.itemName.localeCompare(b.itemName));
};

/**
 * Get available items for sale (items with stock > 0)
 */
export const getAvailableItems = (purchases: Purchase[], sales: Sale[]): AvailableItem[] => {
  const inventory = calculateInventory(purchases, sales);
  
  return inventory
    .filter(item => item.availableStock > 0)
    .map(item => ({
      itemName: item.itemName,
      availableStock: item.availableStock,
      averageCostPrice: item.averageCostPrice,
      suggestedSalePrice: Math.round(item.averageCostPrice * 1.3) // 30% markup
    }))
    .sort((a, b) => a.itemName.localeCompare(b.itemName));
};

/**
 * Check if an item has sufficient stock for sale
 */
export const checkItemStock = (itemName: string, requestedQuantity: number, purchases: Purchase[], sales: Sale[]): {
  available: boolean;
  currentStock: number;
  message: string;
} => {
  const inventory = calculateInventory(purchases, sales);
  const item = inventory.find(inv => inv.itemName.toLowerCase() === itemName.toLowerCase());
  
  if (!item) {
    return {
      available: false,
      currentStock: 0,
      message: 'Item not found in inventory'
    };
  }
  
  if (item.availableStock >= requestedQuantity) {
    return {
      available: true,
      currentStock: item.availableStock,
      message: `${item.availableStock} units available`
    };
  } else {
    return {
      available: false,
      currentStock: item.availableStock,
      message: `Only ${item.availableStock} units available, but ${requestedQuantity} requested`
    };
  }
};

/**
 * Get low stock items (less than minimum threshold)
 */
export const getLowStockItems = (purchases: Purchase[], sales: Sale[], minThreshold: number = 5): InventoryItem[] => {
  const inventory = calculateInventory(purchases, sales);
  
  return inventory
    .filter(item => item.availableStock > 0 && item.availableStock <= minThreshold)
    .sort((a, b) => a.availableStock - b.availableStock);
};

/**
 * Get out of stock items
 */
export const getOutOfStockItems = (purchases: Purchase[], sales: Sale[]): InventoryItem[] => {
  const inventory = calculateInventory(purchases, sales);
  
  return inventory
    .filter(item => item.availableStock <= 0 && item.totalPurchased > 0)
    .sort((a, b) => a.itemName.localeCompare(b.itemName));
};