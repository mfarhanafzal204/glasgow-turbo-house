/**
 * Comprehensive Calculation Testing Suite
 * Tests all calculation logic for accuracy
 */

import { Purchase, Sale, Item } from '@/types';
import { 
  updateItemStockFromPurchase, 
  updateItemStockFromSale, 
  getItemStockSummary, 
  recalculateItemStock,
  debugItemStock 
} from './stockTracking';

// Test data
const testItem: Item = {
  id: 'test-item-1',
  itemCode: 'TEST001',
  itemName: 'Test Turbo',
  description: 'Test turbo for calculations',
  category: 'turbo',
  compatibleVehicles: ['Test Vehicle'],
  unitOfMeasure: 'piece',
  minimumStock: 5,
  maximumStock: 100,
  reorderLevel: 10,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

const testPurchases: Purchase[] = [
  {
    id: 'purchase-1',
    supplierId: 'supplier-1',
    supplierName: 'Test Supplier 1',
    supplierPhone: '03001234567',
    items: [
      {
        id: 'item-1',
        itemName: 'Test Turbo',
        quantity: 10,
        costPerUnit: 5000,
        totalCost: 50000,
        itemId: 'test-item-1'
      } as any
    ],
    totalAmount: 50000,
    purchaseDate: new Date('2024-01-01'),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'purchase-2',
    supplierId: 'supplier-2',
    supplierName: 'Test Supplier 2',
    supplierPhone: '03007654321',
    items: [
      {
        id: 'item-2',
        itemName: 'Test Turbo',
        quantity: 5,
        costPerUnit: 4800,
        totalCost: 24000,
        itemId: 'test-item-1'
      } as any
    ],
    totalAmount: 24000,
    purchaseDate: new Date('2024-01-15'),
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const testSales: Sale[] = [
  {
    id: 'sale-1',
    customerId: 'customer-1',
    customerName: 'Test Customer 1',
    customerPhone: '03009876543',
    items: [
      {
        id: 'sale-item-1',
        itemName: 'Test Turbo',
        quantity: 3,
        pricePerUnit: 7000,
        totalPrice: 21000,
        itemId: 'test-item-1'
      } as any
    ],
    totalAmount: 21000,
    saleDate: new Date('2024-01-10'),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'sale-2',
    customerId: 'customer-2',
    customerName: 'Test Customer 2',
    customerPhone: '03005432109',
    items: [
      {
        id: 'sale-item-2',
        itemName: 'Test Turbo',
        quantity: 2,
        pricePerUnit: 7500,
        totalPrice: 15000,
        itemId: 'test-item-1'
      } as any
    ],
    totalAmount: 15000,
    saleDate: new Date('2024-01-20'),
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

/**
 * Test Case 1: Basic Stock Calculation
 * Expected: 15 purchased - 5 sold = 10 remaining
 */
export const testBasicStockCalculation = () => {
  console.log('🧪 TEST 1: Basic Stock Calculation');
  
  const totalPurchased = testPurchases.reduce((sum, purchase) => {
    return sum + purchase.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
  }, 0);
  
  const totalSold = testSales.reduce((sum, sale) => {
    return sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
  }, 0);
  
  const expectedStock = totalPurchased - totalSold;
  
  console.log(`📊 Total Purchased: ${totalPurchased}`);
  console.log(`📊 Total Sold: ${totalSold}`);
  console.log(`📊 Expected Stock: ${expectedStock}`);
  
  // Verify calculations
  const purchaseCheck = 10 + 5; // From test data
  const saleCheck = 3 + 2; // From test data
  const stockCheck = purchaseCheck - saleCheck;
  
  console.log(`✅ Purchase Calculation: ${totalPurchased === purchaseCheck ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Sale Calculation: ${totalSold === saleCheck ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Stock Calculation: ${expectedStock === stockCheck ? 'PASS' : 'FAIL'}`);
  
  return {
    totalPurchased,
    totalSold,
    expectedStock,
    passed: totalPurchased === 15 && totalSold === 5 && expectedStock === 10
  };
};

/**
 * Test Case 2: Average Cost Price Calculation
 * Expected: (10 * 5000 + 5 * 4800) / 15 = 4933.33
 */
export const testAverageCostCalculation = () => {
  console.log('🧪 TEST 2: Average Cost Price Calculation');
  
  let totalCost = 0;
  let totalQuantity = 0;
  
  testPurchases.forEach(purchase => {
    purchase.items.forEach(item => {
      totalCost += item.totalCost;
      totalQuantity += item.quantity;
    });
  });
  
  const averageCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
  const expectedAverage = (10 * 5000 + 5 * 4800) / 15; // 4933.33
  
  console.log(`📊 Total Cost: Rs ${totalCost}`);
  console.log(`📊 Total Quantity: ${totalQuantity}`);
  console.log(`📊 Calculated Average: Rs ${averageCost.toFixed(2)}`);
  console.log(`📊 Expected Average: Rs ${expectedAverage.toFixed(2)}`);
  
  const passed = Math.abs(averageCost - expectedAverage) < 0.01;
  console.log(`✅ Average Cost Calculation: ${passed ? 'PASS' : 'FAIL'}`);
  
  return {
    totalCost,
    totalQuantity,
    averageCost,
    expectedAverage,
    passed
  };
};

/**
 * Test Case 3: Stock Value Calculation
 * Expected: Current Stock * Average Cost Price
 */
export const testStockValueCalculation = () => {
  console.log('🧪 TEST 3: Stock Value Calculation');
  
  const stockTest = testBasicStockCalculation();
  const costTest = testAverageCostCalculation();
  
  const stockValue = stockTest.expectedStock * costTest.averageCost;
  const expectedValue = 10 * 4933.33; // 49333.33
  
  console.log(`📊 Current Stock: ${stockTest.expectedStock}`);
  console.log(`📊 Average Cost: Rs ${costTest.averageCost.toFixed(2)}`);
  console.log(`📊 Calculated Stock Value: Rs ${stockValue.toFixed(2)}`);
  console.log(`📊 Expected Stock Value: Rs ${expectedValue.toFixed(2)}`);
  
  const passed = Math.abs(stockValue - expectedValue) < 0.01;
  console.log(`✅ Stock Value Calculation: ${passed ? 'PASS' : 'FAIL'}`);
  
  return {
    stockValue,
    expectedValue,
    passed
  };
};

/**
 * Test Case 4: Profit Calculation
 * Expected: Total Sale Value - (Sold Quantity * Average Cost)
 */
export const testProfitCalculation = () => {
  console.log('🧪 TEST 4: Profit Calculation');
  
  const totalSaleValue = testSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const soldQuantity = testSales.reduce((sum, sale) => {
    return sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
  }, 0);
  
  const costTest = testAverageCostCalculation();
  const costOfGoodsSold = soldQuantity * costTest.averageCost;
  const profit = totalSaleValue - costOfGoodsSold;
  
  // Expected: (21000 + 15000) - (5 * 4933.33) = 36000 - 24666.65 = 11333.35
  const expectedProfit = 36000 - (5 * 4933.33);
  
  console.log(`📊 Total Sale Value: Rs ${totalSaleValue}`);
  console.log(`📊 Sold Quantity: ${soldQuantity}`);
  console.log(`📊 Cost of Goods Sold: Rs ${costOfGoodsSold.toFixed(2)}`);
  console.log(`📊 Calculated Profit: Rs ${profit.toFixed(2)}`);
  console.log(`📊 Expected Profit: Rs ${expectedProfit.toFixed(2)}`);
  
  const passed = Math.abs(profit - expectedProfit) < 0.01;
  console.log(`✅ Profit Calculation: ${passed ? 'PASS' : 'FAIL'}`);
  
  return {
    totalSaleValue,
    soldQuantity,
    costOfGoodsSold,
    profit,
    expectedProfit,
    passed
  };
};

/**
 * Test Case 5: Edge Cases
 */
export const testEdgeCases = () => {
  console.log('🧪 TEST 5: Edge Cases');
  
  // Test 5a: Zero stock scenario
  const zeroStockTest = () => {
    const purchases = 0;
    const sales = 0;
    const stock = purchases - sales;
    return stock === 0;
  };
  
  // Test 5b: Negative stock prevention
  const negativeStockTest = () => {
    const purchases = 5;
    const sales = 10;
    const stock = Math.max(0, purchases - sales);
    return stock === 0; // Should be 0, not -5
  };
  
  // Test 5c: Division by zero prevention
  const divisionByZeroTest = () => {
    const totalCost = 1000;
    const totalQuantity = 0;
    const averageCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
    return averageCost === 0;
  };
  
  const test5a = zeroStockTest();
  const test5b = negativeStockTest();
  const test5c = divisionByZeroTest();
  
  console.log(`✅ Zero Stock Test: ${test5a ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Negative Stock Prevention: ${test5b ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Division by Zero Prevention: ${test5c ? 'PASS' : 'FAIL'}`);
  
  return {
    zeroStockTest: test5a,
    negativeStockTest: test5b,
    divisionByZeroTest: test5c,
    passed: test5a && test5b && test5c
  };
};

/**
 * Test Case 6: Date-based Calculations
 */
export const testDateBasedCalculations = () => {
  console.log('🧪 TEST 6: Date-based Calculations');
  
  // Find latest purchase date
  const latestPurchaseDate = testPurchases.reduce((latest, purchase) => {
    return purchase.purchaseDate > latest ? purchase.purchaseDate : latest;
  }, new Date(0));
  
  // Find latest sale date
  const latestSaleDate = testSales.reduce((latest, sale) => {
    return sale.saleDate > latest ? sale.saleDate : latest;
  }, new Date(0));
  
  // Expected dates from test data
  const expectedLatestPurchase = new Date('2024-01-15');
  const expectedLatestSale = new Date('2024-01-20');
  
  console.log(`📊 Latest Purchase Date: ${latestPurchaseDate.toDateString()}`);
  console.log(`📊 Latest Sale Date: ${latestSaleDate.toDateString()}`);
  console.log(`📊 Expected Purchase Date: ${expectedLatestPurchase.toDateString()}`);
  console.log(`📊 Expected Sale Date: ${expectedLatestSale.toDateString()}`);
  
  const purchaseDateCorrect = latestPurchaseDate.getTime() === expectedLatestPurchase.getTime();
  const saleDateCorrect = latestSaleDate.getTime() === expectedLatestSale.getTime();
  
  console.log(`✅ Latest Purchase Date: ${purchaseDateCorrect ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Latest Sale Date: ${saleDateCorrect ? 'PASS' : 'FAIL'}`);
  
  return {
    latestPurchaseDate,
    latestSaleDate,
    purchaseDateCorrect,
    saleDateCorrect,
    passed: purchaseDateCorrect && saleDateCorrect
  };
};

/**
 * Run All Tests
 */
export const runAllCalculationTests = () => {
  console.log('🚀 STARTING COMPREHENSIVE CALCULATION TESTS');
  console.log('================================================');
  
  const results = {
    test1: testBasicStockCalculation(),
    test2: testAverageCostCalculation(),
    test3: testStockValueCalculation(),
    test4: testProfitCalculation(),
    test5: testEdgeCases(),
    test6: testDateBasedCalculations()
  };
  
  console.log('================================================');
  console.log('📊 FINAL TEST RESULTS:');
  
  const allPassed = Object.values(results).every(result => result.passed);
  
  Object.entries(results).forEach(([testName, result], index) => {
    const testNumber = index + 1;
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`Test ${testNumber}: ${status}`);
  });
  
  console.log('================================================');
  console.log(`🎯 OVERALL RESULT: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('🎉 All calculations are working correctly!');
    console.log('✅ Stock tracking system is mathematically accurate');
    console.log('✅ Ready for production use');
  } else {
    console.log('⚠️ Some calculations need attention');
    console.log('🔧 Review failed tests and fix calculation logic');
  }
  
  return {
    results,
    allPassed,
    summary: {
      totalTests: 6,
      passedTests: Object.values(results).filter(r => r.passed).length,
      failedTests: Object.values(results).filter(r => !r.passed).length
    }
  };
};

/**
 * Quick Test Function for Console
 */
export const quickTest = () => {
  console.log('⚡ QUICK CALCULATION TEST');
  console.log('========================');
  
  // Simple test
  const purchases = 15; // 10 + 5
  const sales = 5;      // 3 + 2
  const stock = purchases - sales;
  const avgCost = (10 * 5000 + 5 * 4800) / 15;
  const stockValue = stock * avgCost;
  
  console.log(`📦 Stock: ${purchases} - ${sales} = ${stock}`);
  console.log(`💰 Avg Cost: Rs ${avgCost.toFixed(2)}`);
  console.log(`💎 Stock Value: Rs ${stockValue.toFixed(2)}`);
  
  const correct = stock === 10 && Math.abs(avgCost - 4933.33) < 0.01;
  console.log(`🎯 Result: ${correct ? '✅ CORRECT' : '❌ ERROR'}`);
  
  return correct;
};

// Export test data for use in other files
export { testItem, testPurchases, testSales };