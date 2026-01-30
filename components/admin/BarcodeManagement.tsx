'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ProductBarcode, Product } from '@/types';
import { Plus, Edit, Trash2, X, Printer, Download, BarChart3, Search, QrCode } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';

interface BarcodeManagementProps {
  products: Product[];
}

export default function BarcodeManagement({ products }: BarcodeManagementProps) {
  const [barcodes, setBarcodes] = useState<ProductBarcode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBarcode, setEditingBarcode] = useState<ProductBarcode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');

  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    barcode: '',
    barcodeType: 'CODE128' as 'CODE128' | 'EAN13' | 'UPC' | 'CODE39',
  });

  useEffect(() => {
    fetchBarcodes();
  }, []);

  const fetchBarcodes = async () => {
    try {
      const barcodesRef = collection(db, 'barcodes');
      const barcodesQuery = query(barcodesRef, orderBy('createdAt', 'desc'));
      const barcodesSnapshot = await getDocs(barcodesQuery);
      
      const barcodesData = barcodesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as ProductBarcode[];

      setBarcodes(barcodesData);
    } catch (error) {
      console.error('Error fetching barcodes:', error);
      toast.error('Failed to fetch barcodes');
    } finally {
      setLoading(false);
    }
  };

  const generateBarcode = (productId: string) => {
    // Generate barcode using product ID and timestamp
    const timestamp = Date.now().toString().slice(-6);
    return `${productId.slice(0, 8).toUpperCase()}${timestamp}`;
  };

  const generateBarcodeForAllProducts = async () => {
    if (!confirm('Generate barcodes for all products that don\'t have one? This may take a moment.')) return;

    setIsSubmitting(true);
    let generated = 0;

    try {
      for (const product of products) {
        // Check if product already has a barcode
        const existingBarcode = barcodes.find(b => b.productId === product.id);
        if (existingBarcode) continue;

        const barcodeData = {
          productId: product.id,
          productName: product.name,
          barcode: generateBarcode(product.id),
          barcodeType: 'CODE128' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await addDoc(collection(db, 'barcodes'), barcodeData);
        generated++;
      }

      toast.success(`Generated ${generated} barcodes successfully!`);
      fetchBarcodes();
    } catch (error) {
      console.error('Error generating barcodes:', error);
      toast.error('Failed to generate barcodes');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      productName: '',
      barcode: '',
      barcodeType: 'CODE128',
    });
    setEditingBarcode(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productId || !formData.barcode) {
      toast.error('Please select a product and enter a barcode');
      return;
    }

    // Check if barcode already exists
    const existingBarcode = barcodes.find(b => 
      b.barcode === formData.barcode && b.id !== editingBarcode?.id
    );
    if (existingBarcode) {
      toast.error('This barcode already exists for another product');
      return;
    }

    setIsSubmitting(true);

    try {
      const barcodeData = {
        productId: formData.productId,
        productName: formData.productName,
        barcode: formData.barcode,
        barcodeType: formData.barcodeType,
        updatedAt: new Date(),
      };

      if (editingBarcode) {
        await updateDoc(doc(db, 'barcodes', editingBarcode.id), barcodeData);
        toast.success('Barcode updated successfully!');
      } else {
        await addDoc(collection(db, 'barcodes'), {
          ...barcodeData,
          createdAt: new Date(),
        });
        toast.success('Barcode created successfully!');
      }

      resetForm();
      fetchBarcodes();
    } catch (error) {
      console.error('Error saving barcode:', error);
      toast.error('Failed to save barcode');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (barcode: ProductBarcode) => {
    setEditingBarcode(barcode);
    setFormData({
      productId: barcode.productId,
      productName: barcode.productName,
      barcode: barcode.barcode,
      barcodeType: barcode.barcodeType,
    });
    setShowForm(true);
  };

  const handleDelete = async (barcode: ProductBarcode) => {
    if (!confirm('Are you sure you want to delete this barcode?')) return;

    try {
      await deleteDoc(doc(db, 'barcodes', barcode.id));
      toast.success('Barcode deleted successfully!');
      fetchBarcodes();
    } catch (error) {
      console.error('Error deleting barcode:', error);
      toast.error('Failed to delete barcode');
    }
  };

  const selectProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setFormData(prev => ({
        ...prev,
        productId: product.id,
        productName: product.name,
        barcode: prev.barcode || generateBarcode(product.id),
      }));
    }
  };

  const printBarcode = (barcode: ProductBarcode) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode - ${barcode.productName}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .barcode-container { 
              border: 2px solid #333; 
              padding: 20px; 
              margin: 10px;
              text-align: center;
              width: 300px;
              background: white;
            }
            .product-name { 
              font-size: 14px; 
              font-weight: bold; 
              margin-bottom: 10px;
              word-wrap: break-word;
            }
            .barcode-display { 
              font-family: 'Courier New', monospace; 
              font-size: 24px; 
              font-weight: bold;
              letter-spacing: 2px;
              margin: 15px 0;
              padding: 10px;
              background: #f5f5f5;
              border: 1px solid #ddd;
            }
            .barcode-lines {
              display: flex;
              justify-content: center;
              align-items: end;
              height: 60px;
              margin: 10px 0;
              background: white;
            }
            .line {
              background: #000;
              margin: 0 1px;
              height: 100%;
            }
            .line.thin { width: 2px; }
            .line.thick { width: 4px; }
            .line.medium { width: 3px; }
            .company-name { 
              font-size: 12px; 
              color: #666; 
              margin-top: 10px;
            }
            @media print { 
              body { margin: 0; }
              .barcode-container { 
                page-break-after: always; 
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            <div class="product-name">${barcode.productName}</div>
            
            <div class="barcode-lines">
              ${Array.from({length: 30}, (_, i) => {
                const classes = ['thin', 'medium', 'thick'][i % 3];
                return `<div class="line ${classes}"></div>`;
              }).join('')}
            </div>
            
            <div class="barcode-display">${barcode.barcode}</div>
            <div class="company-name">Glasgow Turbo House</div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const printMultipleBarcodes = (selectedBarcodes: ProductBarcode[]) => {
    if (selectedBarcodes.length === 0) {
      toast.error('Please select barcodes to print');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Multiple Barcodes</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              display: flex;
              flex-wrap: wrap;
              justify-content: center;
            }
            .barcode-container { 
              border: 2px solid #333; 
              padding: 15px; 
              margin: 5px;
              text-align: center;
              width: 250px;
              background: white;
              page-break-inside: avoid;
            }
            .product-name { 
              font-size: 12px; 
              font-weight: bold; 
              margin-bottom: 8px;
              word-wrap: break-word;
              height: 30px;
              overflow: hidden;
            }
            .barcode-display { 
              font-family: 'Courier New', monospace; 
              font-size: 18px; 
              font-weight: bold;
              letter-spacing: 1px;
              margin: 10px 0;
              padding: 8px;
              background: #f5f5f5;
              border: 1px solid #ddd;
            }
            .barcode-lines {
              display: flex;
              justify-content: center;
              align-items: end;
              height: 40px;
              margin: 8px 0;
              background: white;
            }
            .line {
              background: #000;
              margin: 0 1px;
              height: 100%;
            }
            .line.thin { width: 1px; }
            .line.thick { width: 3px; }
            .line.medium { width: 2px; }
            .company-name { 
              font-size: 10px; 
              color: #666; 
              margin-top: 8px;
            }
            @media print { 
              body { margin: 0; padding: 10px; }
            }
          </style>
        </head>
        <body>
          ${selectedBarcodes.map(barcode => `
            <div class="barcode-container">
              <div class="product-name">${barcode.productName}</div>
              
              <div class="barcode-lines">
                ${Array.from({length: 25}, (_, i) => {
                  const classes = ['thin', 'medium', 'thick'][i % 3];
                  return `<div class="line ${classes}"></div>`;
                }).join('')}
              </div>
              
              <div class="barcode-display">${barcode.barcode}</div>
              <div class="company-name">Glasgow Turbo House</div>
            </div>
          `).join('')}
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredBarcodes = barcodes.filter(barcode => {
    const matchesSearch = barcode.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         barcode.barcode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProduct = selectedProduct === '' || barcode.productId === selectedProduct;
    
    return matchesSearch && matchesProduct;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Barcode Management</h2>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <button
            onClick={generateBarcodeForAllProducts}
            disabled={isSubmitting}
            className="btn-secondary flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            {isSubmitting ? <LoadingSpinner size="sm" /> : <BarChart3 className="h-4 w-4" />}
            <span>Generate All</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Add Barcode</span>
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search barcodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
          
          <div>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="input-field w-full"
            >
              <option value="">All Products</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-600 flex items-center">
            Total Barcodes: {filteredBarcodes.length}
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {filteredBarcodes.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <span className="text-sm text-gray-600">Bulk Actions:</span>
            <button
              onClick={() => printMultipleBarcodes(filteredBarcodes)}
              className="btn-secondary flex items-center justify-center space-x-2 w-full sm:w-auto"
            >
              <Printer className="h-4 w-4" />
              <span>Print All Visible</span>
            </button>
          </div>
        </div>
      )}

      {/* Barcodes List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Mobile Cards View */}
        <div className="block sm:hidden">
          <div className="divide-y divide-gray-200">
            {filteredBarcodes.map((barcode) => (
              <div key={barcode.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900 text-sm">{barcode.productName}</div>
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    {barcode.barcodeType}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  <div className="font-mono bg-gray-100 p-2 rounded text-center">
                    {barcode.barcode}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => printBarcode(barcode)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(barcode)}
                    className="text-green-600 hover:text-green-900 p-1"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(barcode)}
                    className="text-red-600 hover:text-red-900 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Barcode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBarcodes.map((barcode) => (
                <tr key={barcode.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{barcode.productName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {barcode.barcode}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {barcode.barcodeType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {barcode.createdAt.toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => printBarcode(barcode)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Print Barcode"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(barcode)}
                        className="text-green-600 hover:text-green-900"
                        title="Edit Barcode"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(barcode)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Barcode"
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

        {filteredBarcodes.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <QrCode className="h-12 w-12 text-gray-300 mb-4 mx-auto" />
            <p className="text-base font-medium">No barcodes found</p>
            <p className="text-sm">Generate barcodes for your products to get started</p>
          </div>
        )}
      </div>

      {/* Barcode Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold">
                  {editingBarcode ? 'Edit Barcode' : 'Add New Barcode'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Product *
                  </label>
                  <select
                    required
                    value={formData.productId}
                    onChange={(e) => selectProduct(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="">Choose a product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Barcode *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      required
                      value={formData.barcode}
                      onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                      className="input-field flex-1"
                      placeholder="Enter barcode or generate automatically"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (formData.productId) {
                          setFormData(prev => ({ ...prev, barcode: generateBarcode(formData.productId) }));
                        } else {
                          toast.error('Please select a product first');
                        }
                      }}
                      className="btn-secondary"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Barcode Type
                  </label>
                  <select
                    value={formData.barcodeType}
                    onChange={(e) => setFormData(prev => ({ ...prev, barcodeType: e.target.value as any }))}
                    className="input-field w-full"
                  >
                    <option value="CODE128">CODE128</option>
                    <option value="EAN13">EAN13</option>
                    <option value="UPC">UPC</option>
                    <option value="CODE39">CODE39</option>
                  </select>
                </div>

                {/* Barcode Preview */}
                {formData.barcode && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
                    <div className="text-center">
                      <div className="font-mono text-lg font-bold bg-white p-3 rounded border">
                        {formData.barcode}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formData.barcodeType}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-secondary w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 w-full sm:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingBarcode ? 'Update Barcode' : 'Create Barcode'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}