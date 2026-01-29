import { Product, CustomTurboOrder } from '@/types';

// Search products by multiple criteria
export function searchProducts(products: Product[], searchTerm: string): Product[] {
  if (!searchTerm.trim()) return products;

  const term = searchTerm.toLowerCase().trim();
  
  return products.filter(product => {
    // Search in product name
    if (product.name.toLowerCase().includes(term)) return true;
    
    // Search in description
    if (product.description.toLowerCase().includes(term)) return true;
    
    // Search in category
    if (product.category.toLowerCase().includes(term)) return true;
    
    // Search in compatible vehicles
    if (product.compatibleVehicles.some(vehicle => 
      vehicle.toLowerCase().includes(term)
    )) return true;
    
    // Search by price range (if user types numbers)
    const numericTerm = parseFloat(term);
    if (!isNaN(numericTerm)) {
      if (product.discountedPrice <= numericTerm * 1.1 && 
          product.discountedPrice >= numericTerm * 0.9) return true;
    }
    
    return false;
  });
}

// Search custom orders
export function searchCustomOrders(orders: CustomTurboOrder[], searchTerm: string): CustomTurboOrder[] {
  if (!searchTerm.trim()) return orders;

  const term = searchTerm.toLowerCase().trim();
  
  return orders.filter(order => {
    // Search in turbo name
    if (order.turboName.toLowerCase().includes(term)) return true;
    
    // Search in customer name
    if (order.customerName.toLowerCase().includes(term)) return true;
    
    // Search in customer email
    if (order.customerEmail.toLowerCase().includes(term)) return true;
    
    // Search in customer phone
    if (order.customerPhone.includes(term)) return true;
    
    // Search in compatible vehicle
    if (order.compatibleVehicle.toLowerCase().includes(term)) return true;
    
    // Search in description
    if (order.description.toLowerCase().includes(term)) return true;
    
    // Search by status
    if (order.status.toLowerCase().includes(term)) return true;
    
    return false;
  });
}

// Advanced product filters
export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  compatibleVehicle?: string;
}

export function filterProducts(products: Product[], filters: ProductFilters): Product[] {
  return products.filter(product => {
    // Category filter
    if (filters.category && product.category !== filters.category) return false;
    
    // Price range filter
    if (filters.minPrice && product.discountedPrice < filters.minPrice) return false;
    if (filters.maxPrice && product.discountedPrice > filters.maxPrice) return false;
    
    // Stock filter
    if (filters.inStock !== undefined && product.inStock !== filters.inStock) return false;
    
    // Compatible vehicle filter
    if (filters.compatibleVehicle && 
        !product.compatibleVehicles.some(vehicle => 
          vehicle.toLowerCase().includes(filters.compatibleVehicle!.toLowerCase())
        )) return false;
    
    return true;
  });
}

// Get unique categories from products
export function getUniqueCategories(products: Product[]): string[] {
  const categories = products.map(product => product.category);
  return Array.from(new Set(categories)).sort();
}

// Get unique compatible vehicles from products
export function getUniqueVehicles(products: Product[]): string[] {
  const vehicles = products.flatMap(product => product.compatibleVehicles);
  return Array.from(new Set(vehicles)).sort();
}

// Search suggestions based on existing products
export function getSearchSuggestions(products: Product[], searchTerm: string): string[] {
  if (!searchTerm.trim()) return [];

  const term = searchTerm.toLowerCase();
  const suggestions = new Set<string>();
  
  products.forEach(product => {
    // Add product names that start with search term
    if (product.name.toLowerCase().startsWith(term)) {
      suggestions.add(product.name);
    }
    
    // Add categories that match
    if (product.category.toLowerCase().includes(term)) {
      suggestions.add(product.category);
    }
    
    // Add compatible vehicles that match
    product.compatibleVehicles.forEach(vehicle => {
      if (vehicle.toLowerCase().includes(term)) {
        suggestions.add(vehicle);
      }
    });
  });
  
  return Array.from(suggestions).slice(0, 5); // Limit to 5 suggestions
}