'use client';

import { useState, useEffect } from 'react';
import { updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CustomTurboOrder } from '@/types';
import { Eye, MessageSquare, CheckCircle, Clock, Trash2 } from 'lucide-react';
import AdminSearchBar from './AdminSearchBar';
import toast from 'react-hot-toast';
import { searchCustomOrders } from '@/lib/search';

interface CustomOrderManagementProps {
  customOrders: CustomTurboOrder[];
  onOrdersChange: () => void;
}

export default function CustomOrderManagement({ customOrders, onOrdersChange }: CustomOrderManagementProps) {
  const [selectedOrder, setSelectedOrder] = useState<CustomTurboOrder | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [filteredOrders, setFilteredOrders] = useState<CustomTurboOrder[]>(customOrders);
  const [searchTerm, setSearchTerm] = useState('');

  // Update filtered orders when orders or search changes
  useEffect(() => {
    if (searchTerm.trim()) {
      setFilteredOrders(searchCustomOrders(customOrders, searchTerm));
    } else {
      setFilteredOrders(customOrders);
    }
  }, [customOrders, searchTerm]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const sorted = [...filteredOrders].sort((a, b) => {
      let aValue: any = a[sortBy as keyof CustomTurboOrder];
      let bValue: any = b[sortBy as keyof CustomTurboOrder];

      // Handle different data types
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    setFilteredOrders(sorted);
  };

  const updateOrderStatus = async (orderId: string, newStatus: CustomTurboOrder['status']) => {
    setUpdatingStatus(orderId);
    try {
      await updateDoc(doc(db, 'customOrders', orderId), {
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

  const deleteCustomOrder = async (orderId: string, customerName: string) => {
    if (confirm(`Are you sure you want to delete the custom order from ${customerName}? This action cannot be undone.`)) {
      try {
        console.log('Attempting to delete custom order:', orderId);
        await deleteDoc(doc(db, 'customOrders', orderId));
        toast.success('Custom order deleted successfully!');
        onOrdersChange();
      } catch (error) {
        console.error('Detailed error deleting custom order:', error);
        if (error instanceof Error) {
          if (error.message.includes('permission-denied')) {
            toast.error('Permission denied. Please check Firebase security rules.');
          } else {
            toast.error(`Failed to delete custom order: ${error.message}`);
          }
        } else {
          toast.error('Failed to delete custom order.');
        }
      }
    }
  };

  const getStatusIcon = (status: CustomTurboOrder['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'quoted':
        return <MessageSquare className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: CustomTurboOrder['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'quoted':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Custom Order Management</h2>
        <div className="text-sm text-gray-500">
          Total Custom Orders: {customOrders.length}
        </div>
      </div>

      {/* Search Bar */}
      <AdminSearchBar
        data={customOrders}
        onSearch={handleSearch}
        onSort={handleSort}
        placeholder="Search orders by customer, turbo name, vehicle..."
        type="orders"
      />

      {/* Custom Orders List - Mobile Responsive */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Mobile Card View (Hidden on Desktop) */}
        <div className="block lg:hidden">
          {filteredOrders.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No custom orders yet</p>
              <p className="text-sm">Custom turbo orders will appear here</p>
            </div>
          ) : (
            <div className="space-y-4 p-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">#{order.id.slice(-8)}</div>
                      <div className="text-sm text-gray-500">{order.createdAt.toLocaleDateString()}</div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize">{order.status}</span>
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                      <div className="text-sm text-gray-500">{order.customerPhone}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.turboName}</div>
                      <div className="text-sm text-gray-500">{order.compatibleVehicle}</div>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm"
                      >
                        <Eye className="h-3 w-3" />
                        <span>View</span>
                      </button>
                      
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'quoted')}
                          disabled={updatingStatus === order.id}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm disabled:opacity-50"
                        >
                          <MessageSquare className="h-3 w-3" />
                          <span>Quote</span>
                        </button>
                      )}
                      
                      {order.status === 'quoted' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'confirmed')}
                          disabled={updatingStatus === order.id}
                          className="flex items-center space-x-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-sm disabled:opacity-50"
                        >
                          <CheckCircle className="h-3 w-3" />
                          <span>Confirm</span>
                        </button>
                      )}
                      
                      {order.status === 'confirmed' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'completed')}
                          disabled={updatingStatus === order.id}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm disabled:opacity-50"
                        >
                          <CheckCircle className="h-3 w-3" />
                          <span>Complete</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => deleteCustomOrder(order.id, order.customerName)}
                        className="flex items-center space-x-1 px-3 py-1 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Table View (Hidden on Mobile) */}
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
                  Turbo Request
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
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No custom orders yet</p>
                    <p className="text-sm">Custom turbo orders will appear here</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order.id.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.customerName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.customerPhone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {order.turboName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.compatibleVehicle}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1 capitalize">{order.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-primary-600 hover:text-primary-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {order.status === 'pending' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'quoted')}
                            disabled={updatingStatus === order.id}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                            title="Mark as Quoted"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                        )}
                        
                        {order.status === 'quoted' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'confirmed')}
                            disabled={updatingStatus === order.id}
                            className="text-purple-600 hover:text-purple-900 disabled:opacity-50"
                            title="Mark as Confirmed"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'completed')}
                            disabled={updatingStatus === order.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            title="Mark as Completed"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          onClick={() => deleteCustomOrder(order.id, order.customerName)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Order"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  Custom Order Details - #{selectedOrder.id.slice(-8)}
                </h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Customer Information */}
                <div>
                  <h4 className="text-md font-semibold mb-3">Customer Information</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><strong>Name:</strong> {selectedOrder.customerName}</p>
                    <p><strong>Email:</strong> {selectedOrder.customerEmail}</p>
                    <p><strong>Phone:</strong> {selectedOrder.customerPhone}</p>
                  </div>
                </div>

                {/* Turbo Requirements */}
                <div>
                  <h4 className="text-md font-semibold mb-3">Turbo Requirements</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <strong>Turbo Name/Model:</strong>
                      <p className="mt-1">{selectedOrder.turboName}</p>
                    </div>
                    <div>
                      <strong>Compatible Vehicle:</strong>
                      <p className="mt-1">{selectedOrder.compatibleVehicle}</p>
                    </div>
                    <div>
                      <strong>Description:</strong>
                      <p className="mt-1 text-sm">{selectedOrder.description}</p>
                    </div>
                    {selectedOrder.estimatedPrice > 0 && (
                      <div>
                        <strong>Customer Budget:</strong>
                        <p className="mt-1">PKR {selectedOrder.estimatedPrice.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Status */}
                <div>
                  <h4 className="text-md font-semibold mb-3">Order Status</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusIcon(selectedOrder.status)}
                        <span className="ml-2 capitalize">{selectedOrder.status}</span>
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Created:</strong> {selectedOrder.createdAt.toLocaleDateString()} at {selectedOrder.createdAt.toLocaleTimeString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Last Updated:</strong> {selectedOrder.updatedAt.toLocaleDateString()} at {selectedOrder.updatedAt.toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {/* Status Update Actions */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      deleteCustomOrder(selectedOrder.id, selectedOrder.customerName);
                      setSelectedOrder(null);
                    }}
                    className="btn-secondary text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Order
                  </button>

                  <div className="flex space-x-3">
                    {selectedOrder.status === 'pending' && (
                      <button
                        onClick={() => {
                          updateOrderStatus(selectedOrder.id, 'quoted');
                          setSelectedOrder(null);
                        }}
                        className="btn-primary"
                      >
                        Mark as Quoted
                      </button>
                    )}
                    
                    {selectedOrder.status === 'quoted' && (
                      <button
                        onClick={() => {
                          updateOrderStatus(selectedOrder.id, 'confirmed');
                          setSelectedOrder(null);
                        }}
                        className="btn-primary"
                      >
                        Mark as Confirmed
                      </button>
                    )}
                    
                    {selectedOrder.status === 'confirmed' && (
                      <button
                        onClick={() => {
                          updateOrderStatus(selectedOrder.id, 'completed');
                          setSelectedOrder(null);
                        }}
                        className="btn-primary"
                      >
                        Mark as Completed
                      </button>
                    )}
                    
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="btn-secondary"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}