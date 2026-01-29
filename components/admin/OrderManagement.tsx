'use client';

import { useState } from 'react';
import { updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order } from '@/types';
import { Eye, Package, Truck, CheckCircle, X, Trash2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

interface OrderManagementProps {
  orders: Order[];
  onOrdersChange: () => void;
}

export default function OrderManagement({ orders, onOrdersChange }: OrderManagementProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Helper function to format Firestore timestamp or Date
  const formatDate = (date: any): string => {
    try {
      // Handle Firestore Timestamp
      if (date && typeof date === 'object' && date.toDate) {
        return date.toDate().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      // Handle regular Date object
      if (date instanceof Date) {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      // Handle string dates
      if (typeof date === 'string') {
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      }
      
      // Fallback
      return 'Invalid Date';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    setUpdatingStatus(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date(),
      });
      toast.success('Order status updated successfully!');
      onOrdersChange();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'orders', orderId));
      toast.success('Order deleted successfully!');
      onOrdersChange();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order. Please try again.');
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Package className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Order Management</h2>
        <div className="text-sm text-gray-500">
          Total Orders: {orders.length}
        </div>
      </div>

      {/* Mobile-First Orders List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Mobile Cards View */}
        <div className="block lg:hidden">
          <div className="divide-y divide-gray-200">
            {orders.map((order) => (
              <div key={order.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-sm font-medium text-gray-900">#{order.id.slice(-8)}</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1 capitalize">{order.status}</span>
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{order.customerName}</p>
                    <p className="text-xs text-gray-500">{order.phone || order.customerPhone}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-sm font-semibold text-gray-900">{formatPrice(order.totalAmount)}</p>
                    <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center space-x-1"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </button>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center space-x-1"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'confirmed')}
                          disabled={updatingStatus === order.id}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50 p-1"
                          title="Confirm Order"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      
                      {order.status === 'confirmed' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'shipped')}
                          disabled={updatingStatus === order.id}
                          className="text-purple-600 hover:text-purple-900 disabled:opacity-50 p-1"
                          title="Mark as Shipped"
                        >
                          <Truck className="h-4 w-4" />
                        </button>
                      )}
                      
                      {order.status === 'shipped' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          disabled={updatingStatus === order.id}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50 p-1"
                          title="Mark as Delivered"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => deleteOrder(order.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete Order"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Package className="h-12 w-12 text-gray-300 mb-4 mx-auto" />
                <p className="text-base font-medium">No orders found</p>
                <p className="text-sm">Orders will appear here when customers place them</p>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{order.id.slice(-8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.customerName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.phone || order.customerPhone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPrice(order.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize">{order.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'confirmed')}
                          disabled={updatingStatus === order.id}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          title="Confirm Order"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      
                      {order.status === 'confirmed' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'shipped')}
                          disabled={updatingStatus === order.id}
                          className="text-purple-600 hover:text-purple-900 disabled:opacity-50"
                          title="Mark as Shipped"
                        >
                          <Truck className="h-4 w-4" />
                        </button>
                      )}
                      
                      {order.status === 'shipped' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          disabled={updatingStatus === order.id}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          title="Mark as Delivered"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => deleteOrder(order.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Order"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile-First Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold">
                  Order Details - #{selectedOrder.id.slice(-8)}
                </h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* Customer Information */}
                <div>
                  <h4 className="text-sm sm:text-md font-semibold mb-2 sm:mb-3">Customer Information</h4>
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <p className="text-sm"><strong>Name:</strong> {selectedOrder.customerName}</p>
                      <p className="text-sm"><strong>Phone:</strong> {selectedOrder.phone || selectedOrder.customerPhone}</p>
                    </div>
                    <p className="text-sm"><strong>Email:</strong> {selectedOrder.email || selectedOrder.customerEmail}</p>
                    <p className="text-sm"><strong>Address:</strong> {selectedOrder.address || selectedOrder.customerAddress}</p>
                    {selectedOrder.orderDate && (
                      <p className="text-sm"><strong>Order Date:</strong> {formatDate(selectedOrder.orderDate)}</p>
                    )}
                    {selectedOrder.createdAt && (
                      <p className="text-sm"><strong>Created At:</strong> {formatDate(selectedOrder.createdAt)}</p>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="text-sm sm:text-md font-semibold mb-2 sm:mb-3">Order Items</h4>
                  <div className="space-y-2 sm:space-y-3">
                    {selectedOrder.items?.map((item, index) => {
                      // Handle both CartItem and OrderItem types
                      const isCartItem = 'product' in item;
                      const productName = isCartItem ? item.product.name : item.productName;
                      const productImage = isCartItem ? item.product.turboImage : (item.turboImage || null);
                      const itemTotal = isCartItem 
                        ? item.product.discountedPrice * item.quantity 
                        : (item.total || item.price * item.quantity);
                      
                      // Get safe image URL with fallback
                      const getSafeImageUrl = (url: string) => {
                        if (!url) {
                          return 'https://picsum.photos/64/64?random=1';
                        }
                        
                        if (url.startsWith('/placeholder')) {
                          return 'https://picsum.photos/64/64?random=2';
                        }
                        
                        if (url.includes('google.com/imgres') || url.includes('googleusercontent.com')) {
                          return 'https://picsum.photos/64/64?random=3';
                        }
                        
                        return url;
                      };
                      
                      return (
                        <div key={index} className="flex items-center space-x-3 p-2 sm:p-3 border border-gray-200 rounded-lg">
                          <img
                            src={getSafeImageUrl(productImage || '')}
                            alt={productName || 'Product'}
                            className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-sm sm:text-base truncate">{productName}</h5>
                            <p className="text-xs sm:text-sm text-gray-600">Quantity: {item.quantity}</p>
                            {!isCartItem && item.compatibleVehicles && (
                              <p className="text-xs text-gray-500 truncate">
                                Compatible: {item.compatibleVehicles.slice(0, 2).join(', ')}
                              </p>
                            )}
                            <p className="text-sm font-medium text-blue-600">
                              {formatPrice(itemTotal)}
                            </p>
                          </div>
                        </div>
                      );
                    }) || (
                      <p className="text-gray-500 text-center py-4 text-sm">No items found for this order</p>
                    )}
                  </div>
                </div>

                {/* Payment Information */}
                <div>
                  <h4 className="text-sm sm:text-md font-semibold mb-2 sm:mb-3">Payment Information</h4>
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <p className="text-sm"><strong>Payment Method:</strong> {selectedOrder.paymentMethod}</p>
                      <p className="text-sm"><strong>Total Amount:</strong> {formatPrice(selectedOrder.totalAmount)}</p>
                    </div>
                    <p className="text-sm"><strong>Status:</strong> 
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusIcon(selectedOrder.status)}
                        <span className="ml-1 capitalize">{selectedOrder.status}</span>
                      </span>
                    </p>
                    {selectedOrder.paymentProofSubmitted && (
                      <div>
                        <strong className="text-sm">Payment Proof:</strong>
                        {selectedOrder.paymentProofData ? (
                          <div className="mt-2">
                            <img 
                              src={selectedOrder.paymentProofData}
                              alt="Payment Proof"
                              className="max-w-full sm:max-w-xs max-h-32 sm:max-h-48 object-contain border border-gray-300 rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
                              onClick={() => {
                                // Create a modal to show full-size image
                                const modal = document.createElement('div');
                                modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
                                modal.onclick = () => document.body.removeChild(modal);
                                
                                const img = document.createElement('img');
                                img.src = selectedOrder.paymentProofData || '';
                                img.className = 'max-w-full max-h-full object-contain';
                                img.alt = 'Payment Proof - Full Size';
                                
                                const closeBtn = document.createElement('button');
                                closeBtn.innerHTML = '×';
                                closeBtn.className = 'absolute top-4 right-4 text-white text-4xl font-bold hover:text-gray-300';
                                closeBtn.onclick = () => document.body.removeChild(modal);
                                
                                modal.appendChild(img);
                                modal.appendChild(closeBtn);
                                document.body.appendChild(modal);
                              }}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {selectedOrder.paymentProofFileName} 
                              {selectedOrder.paymentProofSize && ` (${(selectedOrder.paymentProofSize / 1024 / 1024).toFixed(2)} MB)`}
                              <br />
                              <span className="text-blue-600">Click image to enlarge</span>
                            </p>
                          </div>
                        ) : (
                          <span className="ml-2 text-green-600 text-sm">✓ Submitted (via WhatsApp or other method)</span>
                        )}
                      </div>
                    )}
                    {selectedOrder.paymentProofUrl && (
                      <div>
                        <strong className="text-sm">Payment Proof URL:</strong>
                        <a 
                          href={selectedOrder.paymentProofUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-600 hover:text-blue-800 underline text-sm"
                        >
                          View Proof
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Update Actions */}
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
                  {selectedOrder.status === 'pending' && (
                    <button
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'confirmed');
                        setSelectedOrder(null);
                      }}
                      className="btn-primary w-full sm:w-auto"
                    >
                      Confirm Order
                    </button>
                  )}
                  
                  {selectedOrder.status === 'confirmed' && (
                    <button
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'shipped');
                        setSelectedOrder(null);
                      }}
                      className="btn-primary w-full sm:w-auto"
                    >
                      Mark as Shipped
                    </button>
                  )}
                  
                  {selectedOrder.status === 'shipped' && (
                    <button
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'delivered');
                        setSelectedOrder(null);
                      }}
                      className="btn-primary w-full sm:w-auto"
                    >
                      Mark as Delivered
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      deleteOrder(selectedOrder.id);
                      setSelectedOrder(null);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto"
                  >
                    Delete Order
                  </button>
                  
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="btn-secondary w-full sm:w-auto"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}