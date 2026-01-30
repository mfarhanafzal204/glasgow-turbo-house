'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types';
import { Plus, Edit, Trash2, X, Package } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import AdminSearchBar from './AdminSearchBar';
import toast from 'react-hot-toast';
import { uploadImageToFirebaseStorage, validateImageFile, compressImage, getSafeImageUrl } from '@/lib/imageUpload';
import { searchProducts } from '@/lib/search';

interface ProductManagementProps {
  products: Product[];
  onProductsChange: () => void;
}

export default function ProductManagement({ products, onProductsChange }: ProductManagementProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    originalPrice: '',
    discountedPrice: '',
    compatibleVehicles: '',
    category: '',
    inStock: true,
    turboImageUrl: '',
    carImageUrl: '',
  });
  const [uploadingImages, setUploadingImages] = useState({
    turbo: false,
    car: false
  });

  // Update filtered products when products or search changes
  useEffect(() => {
    if (searchTerm.trim()) {
      setFilteredProducts(searchProducts(products, searchTerm));
    } else {
      setFilteredProducts(products);
    }
  }, [products, searchTerm]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const sorted = [...filteredProducts].sort((a, b) => {
      let aValue: any = a[sortBy as keyof Product];
      let bValue: any = b[sortBy as keyof Product];

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
    setFilteredProducts(sorted);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      originalPrice: '',
      discountedPrice: '',
      compatibleVehicles: '',
      category: '',
      inStock: true,
      turboImageUrl: '',
      carImageUrl: '',
    });
    setEditingProduct(null);
    setShowForm(false);
    setUploadingImages({ turbo: false, car: false });
  };

  // Handle file upload with proper error handling
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'turbo' | 'car') => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('🔄 Starting file upload:', file.name, file.type, `${(file.size / 1024 / 1024).toFixed(2)}MB`);

    // Validate file first
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file');
      console.error('❌ File validation failed:', validation.error);
      return;
    }

    setUploadingImages(prev => ({ ...prev, [type]: true }));

    try {
      // Show file size info
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      toast.loading(`Processing ${fileSizeMB}MB image...`, { id: `upload-${type}` });
      
      console.log('✅ File validation passed, starting upload...');
      
      // Upload image (uses base64 encoding - works immediately)
      const imageUrl = await uploadImageToFirebaseStorage(file, 'products');
      
      console.log('✅ Upload completed successfully');
      
      if (type === 'turbo') {
        setFormData(prev => ({ ...prev, turboImageUrl: imageUrl }));
      } else {
        setFormData(prev => ({ ...prev, carImageUrl: imageUrl }));
      }
      
      toast.dismiss(`upload-${type}`);
      toast.success('✅ Image uploaded successfully! Ready to save product.');
    } catch (error) {
      console.error('❌ Upload error:', error);
      toast.dismiss(`upload-${type}`);
      
      // More specific error messages
      let errorMessage = 'Failed to upload image. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('Invalid file')) {
          errorMessage = 'File type not supported. Please use JPG, PNG, WebP, or GIF.';
        } else if (error.message.includes('size')) {
          errorMessage = 'File too large. Please use an image smaller than 50MB.';
        } else if (error.message.includes('process')) {
          errorMessage = 'Could not process image. Please try a different image file.';
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setUploadingImages(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      originalPrice: product.originalPrice.toString(),
      discountedPrice: product.discountedPrice.toString(),
      compatibleVehicles: product.compatibleVehicles.join(', '),
      category: product.category,
      inStock: product.inStock,
      turboImageUrl: product.turboImage || '',
      carImageUrl: product.compatibleCarImage || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        originalPrice: parseFloat(formData.originalPrice),
        discountedPrice: parseFloat(formData.discountedPrice),
        compatibleVehicles: formData.compatibleVehicles.split(',').map(v => v.trim()),
        category: formData.category,
        inStock: formData.inStock,
        turboImage: formData.turboImageUrl || 'https://via.placeholder.com/400x400/3B82F6/FFFFFF?text=Turbo',
        compatibleCarImage: formData.carImageUrl || 'https://via.placeholder.com/400x400/10B981/FFFFFF?text=Car',
        updatedAt: new Date(),
      };

      if (editingProduct) {
        // Update existing product
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        toast.success('Product updated successfully!');
      } else {
        // Create new product
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: new Date(),
        });
        toast.success('Product added successfully!');
      }

      resetForm();
      onProductsChange();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await deleteDoc(doc(db, 'products', product.id));
      toast.success('Product deleted successfully!');
      onProductsChange();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product.');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Product Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Search Bar */}
      <AdminSearchBar
        data={products}
        onSearch={handleSearch}
        onSort={handleSort}
        placeholder="Search products by name, category, vehicle..."
        type="products"
      />

      {/* Mobile-First Products List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Mobile Cards View */}
        <div className="block sm:hidden">
          <div className="divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <div key={product.id} className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <img
                      className="h-12 w-12 rounded-lg object-cover"
                      src={getSafeImageUrl(product.turboImage, 'turbo')}
                      alt={product.name}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {product.category}
                    </div>
                    <div className="text-sm text-gray-900 mt-1">
                      PKR {product.discountedPrice.toLocaleString()}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        product.inStock 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="text-red-600 hover:text-red-900 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Package className="h-12 w-12 text-gray-300 mb-4 mx-auto" />
                <p className="text-base font-medium">No products found</p>
                <p className="text-sm">Try adjusting your search or add a new product</p>
              </div>
            )}
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
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-lg object-cover"
                          src={getSafeImageUrl(product.turboImage, 'turbo')}
                          alt={product.name}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.category}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      PKR {product.discountedPrice.toLocaleString()}
                    </div>
                    {product.originalPrice > product.discountedPrice && (
                      <div className="text-sm text-gray-500 line-through">
                        PKR {product.originalPrice.toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.inStock 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="text-red-600 hover:text-red-900"
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

      {/* Mobile-First Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="input-field w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="input-field w-full"
                      placeholder="e.g., Turbocharger, Parts"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="input-field w-full"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Original Price (PKR) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: e.target.value }))}
                      className="input-field w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discounted Price (PKR) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.discountedPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, discountedPrice: e.target.value }))}
                      className="input-field w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Compatible Vehicles *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.compatibleVehicles}
                    onChange={(e) => setFormData(prev => ({ ...prev, compatibleVehicles: e.target.value }))}
                    className="input-field w-full"
                    placeholder="Toyota Hilux, Suzuki Swift, Honda Civic (comma separated)"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Turbo Image
                    </label>
                    
                    {/* Image Preview */}
                    {formData.turboImageUrl && (
                      <div className="mb-2">
                        <img
                          src={formData.turboImageUrl}
                          alt="Turbo preview"
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                    
                    {/* File Upload */}
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp"
                        onChange={(e) => {
                          handleFileUpload(e, 'turbo');
                          // Reset input to allow same file upload again
                          e.target.value = '';
                        }}
                        className="input-field w-full text-sm"
                        disabled={uploadingImages.turbo}
                      />
                      {uploadingImages.turbo && (
                        <div className="flex items-center space-x-2 text-sm text-blue-600">
                          <LoadingSpinner size="sm" />
                          <span>Processing image...</span>
                        </div>
                      )}
                    </div>
                    
                    {/* OR URL Input */}
                    <div className="mt-2">
                      <div className="text-xs text-gray-500 mb-1">OR paste image URL:</div>
                      <input
                        type="url"
                        value={formData.turboImageUrl || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, turboImageUrl: e.target.value }))}
                        className="input-field w-full text-sm"
                        placeholder="https://i.ibb.co/abc123/turbo-image.jpg"
                      />
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-1">
                      Upload from your device (laptop/phone/tablet) or paste image URL.
                      <br />
                      <strong>Supported:</strong> JPG, JPEG, PNG, WebP, GIF, BMP (up to 50MB - will be compressed automatically)
                      <br />
                      <strong>Best quality:</strong> High-resolution images from your device camera or gallery
                      <br />
                      <strong>Tip:</strong> If you get "types not supported", try saving your image as JPG or PNG first
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Compatible Car Image
                    </label>
                    
                    {/* Image Preview */}
                    {formData.carImageUrl && (
                      <div className="mb-2">
                        <img
                          src={formData.carImageUrl}
                          alt="Car preview"
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                    
                    {/* File Upload */}
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp"
                        onChange={(e) => {
                          handleFileUpload(e, 'car');
                          // Reset input to allow same file upload again
                          e.target.value = '';
                        }}
                        className="input-field w-full text-sm"
                        disabled={uploadingImages.car}
                      />
                      {uploadingImages.car && (
                        <div className="flex items-center space-x-2 text-sm text-blue-600">
                          <LoadingSpinner size="sm" />
                          <span>Processing image...</span>
                        </div>
                      )}
                    </div>
                    
                    {/* OR URL Input */}
                    <div className="mt-2">
                      <div className="text-xs text-gray-500 mb-1">OR paste image URL:</div>
                      <input
                        type="url"
                        value={formData.carImageUrl || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, carImageUrl: e.target.value }))}
                        className="input-field w-full text-sm"
                        placeholder="https://i.ibb.co/def456/car-image.jpg"
                      />
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-1">
                      Upload from your device (laptop/phone/tablet) or paste image URL.
                      <br />
                      <strong>Supported:</strong> JPG, JPEG, PNG, WebP, GIF, BMP (up to 50MB - will be compressed automatically)
                      <br />
                      <strong>Best quality:</strong> High-resolution images from your device camera or gallery
                      <br />
                      <strong>Tip:</strong> If you get "types not supported", try saving your image as JPG or PNG first
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="inStock"
                    checked={formData.inStock}
                    onChange={(e) => setFormData(prev => ({ ...prev, inStock: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="inStock" className="ml-2 block text-sm text-gray-900">
                    In Stock
                  </label>
                </div>

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
                      <span>{editingProduct ? 'Update Product' : 'Add Product'}</span>
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