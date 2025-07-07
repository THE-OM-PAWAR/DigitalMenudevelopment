'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Utensils, ArrowLeft, Loader2, Save, Search, Plus, Upload, X, MoreHorizontal, 
  Edit, Trash2, AlertTriangle, DollarSign, Leaf, Beef, Star, StarOff
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import DashboardHeader from '@/components/DashboardHeader';
import axios from 'axios';
import Link from 'next/link';

interface Outlet {
  _id: string;
  name: string;
  logo?: string;
}

interface Category {
  _id: string;
  name: string;
}

interface Quantity {
  _id: string;
  value: string;
  description: string;
}

interface QuantityPrice {
  quantityId: string;
  price: number;
}

interface Item {
  _id: string;
  name: string;
  description: string;
  image?: string;
  categoryId: {
    _id: string;
    name: string;
  };
  isVeg: boolean;
  isHighlighted: boolean;
  quantityPrices: {
    quantityId: {
      _id: string;
      value: string;
      description: string;
    };
    price: number;
  }[];
  createdAt: string;
}

export default function CreateItemPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [quantities, setQuantities] = useState<Quantity[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHighlighting, setIsHighlighting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    categoryId: '',
    isVeg: true,
    quantityPrices: [] as QuantityPrice[],
  });
  
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    image: '',
    categoryId: '',
    isVeg: true,
    quantityPrices: [] as QuantityPrice[],
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [outletResponse, quantitiesResponse] = await Promise.all([
        axios.get('/api/outlets'),
        axios.get('/api/quantities'),
      ]);
      
      const outletData = outletResponse.data.outlet;
      
      if (!outletData) {
        router.push('/dashboard');
        return;
      }
      
      setOutlet(outletData);
      setQuantities(quantitiesResponse.data.quantities || []);
      
      // Fetch categories after we have the outlet
      const categoriesResponse = await axios.get(`/api/categories?outletId=${outletData._id}`);
      setCategories(categoriesResponse.data.categories || []);
      
      // Fetch items for this outlet
      const itemsResponse = await axios.get(`/api/items?outletId=${outletData._id}`);
      setItems(itemsResponse.data.items || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setCategories([]);
      setQuantities([]);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
    if (editErrors[name]) {
      setEditErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrors(prev => ({ ...prev, image: '' }));

    try {
      // If there's an existing image, delete it from Cloudinary first
      if (formData.image) {
        await deleteExistingImage(formData.image);
      }

      // Upload to Cloudinary via our API
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('folder', 'menumaster/items');

      const response = await fetch('/api/cloudinary/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      setFormData(prev => ({ ...prev, image: data.data.secure_url }));
    } catch (error) {
      console.error('Error uploading image:', error);
      setErrors({ image: (error as Error).message || 'Failed to upload image. Please try again.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setEditErrors(prev => ({ ...prev, image: '' }));

    try {
      // If there's an existing image, delete it from Cloudinary first
      if (editFormData.image) {
        await deleteExistingImage(editFormData.image);
      }

      // Upload to Cloudinary via our API
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('folder', 'menumaster/items');

      const response = await fetch('/api/cloudinary/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      setEditFormData(prev => ({ ...prev, image: data.data.secure_url }));
    } catch (error) {
      console.error('Error uploading image:', error);
      setEditErrors({ image: (error as Error).message || 'Failed to upload image. Please try again.' });
    } finally {
      setIsUploading(false);
    }
  };

  const deleteExistingImage = async (imageUrl: string) => {
    try {
      const urlParts = imageUrl.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      if (uploadIndex === -1) return;
      
      const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
      const publicId = pathAfterUpload.split('.')[0];

      await axios.delete('/api/cloudinary/delete', {
        data: { publicId }
      });
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
    }
  };

  const removeImage = async () => {
    if (formData.image) {
      await deleteExistingImage(formData.image);
      setFormData(prev => ({ ...prev, image: '' }));
    }
  };

  const removeEditImage = async () => {
    if (editFormData.image) {
      await deleteExistingImage(editFormData.image);
      setEditFormData(prev => ({ ...prev, image: '' }));
    }
  };

  const addQuantityPrice = () => {
    setFormData(prev => ({
      ...prev,
      quantityPrices: [...prev.quantityPrices, { quantityId: '', price: 0 }]
    }));
  };

  const removeQuantityPrice = (index: number) => {
    setFormData(prev => ({
      ...prev,
      quantityPrices: prev.quantityPrices.filter((_, i) => i !== index)
    }));
  };

  const updateQuantityPrice = (index: number, field: 'quantityId' | 'price', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      quantityPrices: prev.quantityPrices.map((qp, i) => 
        i === index ? { ...qp, [field]: value } : qp
      )
    }));
  };

  const addEditQuantityPrice = () => {
    setEditFormData(prev => ({
      ...prev,
      quantityPrices: [...prev.quantityPrices, { quantityId: '', price: 0 }]
    }));
  };

  const removeEditQuantityPrice = (index: number) => {
    setEditFormData(prev => ({
      ...prev,
      quantityPrices: prev.quantityPrices.filter((_, i) => i !== index)
    }));
  };

  const updateEditQuantityPrice = (index: number, field: 'quantityId' | 'price', value: string | number) => {
    setEditFormData(prev => ({
      ...prev,
      quantityPrices: prev.quantityPrices.map((qp, i) => 
        i === index ? { ...qp, [field]: value } : qp
      )
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required';
    }

    if (formData.name.length > 100) {
      newErrors.name = 'Item name must be less than 100 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    if (formData.quantityPrices.length === 0) {
      newErrors.quantityPrices = 'At least one quantity and price is required';
    } else {
      for (let i = 0; i < formData.quantityPrices.length; i++) {
        const qp = formData.quantityPrices[i];
        if (!qp.quantityId || !qp.price || qp.price <= 0) {
          newErrors.quantityPrices = 'All quantity prices must have valid quantity and positive price';
          break;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEditForm = () => {
    const newErrors: Record<string, string> = {};

    if (!editFormData.name.trim()) {
      newErrors.name = 'Item name is required';
    }

    if (editFormData.name.length > 100) {
      newErrors.name = 'Item name must be less than 100 characters';
    }

    if (!editFormData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (editFormData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    if (!editFormData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    if (editFormData.quantityPrices.length === 0) {
      newErrors.quantityPrices = 'At least one quantity and price is required';
    } else {
      for (let i = 0; i < editFormData.quantityPrices.length; i++) {
        const qp = editFormData.quantityPrices[i];
        if (!qp.quantityId || !qp.price || qp.price <= 0) {
          newErrors.quantityPrices = 'All quantity prices must have valid quantity and positive price';
          break;
        }
      }
    }

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const response = await axios.post('/api/items', {
        ...formData,
        outletId: outlet?._id,
      });
      
      // Add new item to the list
      setItems(prev => [response.data.item, ...prev]);
      
      // Reset form and close modal
      setFormData({
        name: '',
        description: '',
        image: '',
        categoryId: '',
        isVeg: true,
        quantityPrices: [],
      });
      setIsModalOpen(false);
    } catch (error: any) {
      if (error.response?.data?.error) {
        setErrors({ general: error.response.data.error });
      } else {
        setErrors({ general: 'Failed to create item. Please try again.' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (item: Item) => {
    setSelectedItem(item);
    setEditFormData({
      name: item.name,
      description: item.description,
      image: item.image || '',
      categoryId: item.categoryId._id,
      isVeg: item.isVeg,
      quantityPrices: item.quantityPrices.map(qp => ({
        quantityId: qp.quantityId._id,
        price: qp.price,
      })),
    });
    setEditErrors({});
    setIsEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!validateEditForm() || !selectedItem) return;

    setIsSaving(true);
    try {
      const response = await axios.put(`/api/items/${selectedItem._id}`, editFormData);
      
      // Update the item in the list
      setItems(prev => prev.map(item => 
        item._id === selectedItem._id ? response.data.item : item
      ));
      
      // Close modal and reset form
      setIsEditModalOpen(false);
      setSelectedItem(null);
      setEditFormData({
        name: '',
        description: '',
        image: '',
        categoryId: '',
        isVeg: true,
        quantityPrices: [],
      });
    } catch (error: any) {
      if (error.response?.data?.error) {
        setEditErrors({ general: error.response.data.error });
      } else {
        setEditErrors({ general: 'Failed to update item. Please try again.' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleHighlight = async (item: Item) => {
    setIsHighlighting(true);
    try {
      const response = await axios.put(`/api/items/${item._id}/highlight`, {
        isHighlighted: !item.isHighlighted
      });
      
      // Update the item in the list
      setItems(prev => prev.map(i => 
        i._id === item._id ? response.data.item : i
      ));
    } catch (error: any) {
      console.error('Error highlighting item:', error);
    } finally {
      setIsHighlighting(false);
    }
  };

  const handleDeleteClick = (item: Item) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItem) return;

    setIsDeleting(true);
    try {
      await axios.delete(`/api/items/${selectedItem._id}`);
      
      // Remove the item from the list
      setItems(prev => prev.filter(item => item._id !== selectedItem._id));
      
      // Close dialog and reset
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      console.error('Error deleting item:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.categoryId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">Loading items...</p>
        </div>
      </div>
    );
  }

  if (!user || !outlet) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader outlet={outlet} onSignOut={handleSignOut} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/menu">
            <Button variant="ghost" className="mb-4 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Menu
            </Button>
          </Link>
          
          {/* Page Header with Search and Create Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Menu Items</h1>
              <p className="text-gray-600">Create and manage your dishes</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-80 border-gray-300"
                />
              </div>
              
              {/* Create Item Button */}
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white whitespace-nowrap">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Menu Item</DialogTitle>
                    <DialogDescription>
                      Create a new delicious menu item
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6 py-4">
                    {errors.general && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <p className="text-sm text-red-600">{errors.general}</p>
                      </div>
                    )}

                    {/* Image Upload */}
                    <div className="space-y-3">
                      <Label>Image (Optional)</Label>
                      {formData.image ? (
                        <div className="relative">
                          <img 
                            src={formData.image} 
                            alt="Item preview"
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={removeImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Label htmlFor="image-upload" className="cursor-pointer">
                          <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-orange-400 hover:bg-orange-50 transition-colors">
                            {isUploading ? (
                              <>
                                <Loader2 className="h-6 w-6 animate-spin text-orange-600 mb-2" />
                                <span className="text-sm text-gray-600">Uploading...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="h-6 w-6 text-gray-400 mb-2" />
                                <span className="text-sm text-gray-600">Click to upload</span>
                              </>
                            )}
                          </div>
                        </Label>
                      )}
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                      {errors.image && (
                        <p className="text-sm text-red-500">{errors.image}</p>
                      )}
                    </div>

                    {/* Item Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g., Grilled Chicken Sandwich"
                        className={errors.name ? 'border-red-500' : 'border-gray-300'}
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500">{errors.name}</p>
                      )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Describe your delicious dish..."
                        rows={3}
                        className={errors.description ? 'border-red-500' : 'border-gray-300'}
                      />
                      {errors.description && (
                        <p className="text-sm text-red-500">{errors.description}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {formData.description.length}/500 characters
                      </p>
                    </div>

                    {/* Category and Veg/Non-Veg */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="categoryId">Category *</Label>
                        <Select value={formData.categoryId} onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}>
                          <SelectTrigger className={errors.categoryId ? 'border-red-500' : 'border-gray-300'}>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(category => (
                              <SelectItem key={category._id} value={category._id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.categoryId && (
                          <p className="text-sm text-red-500">{errors.categoryId}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Type *</Label>
                        <div className="flex space-x-4">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="isVeg"
                              checked={formData.isVeg === true}
                              onChange={() => setFormData(prev => ({ ...prev, isVeg: true }))}
                              className="text-green-600"
                            />
                            <Leaf className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Veg</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="isVeg"
                              checked={formData.isVeg === false}
                              onChange={() => setFormData(prev => ({ ...prev, isVeg: false }))}
                              className="text-orange-600"
                            />
                            <Beef className="h-4 w-4 text-orange-600" />
                            <span className="text-sm">Non-Veg</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Prices */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Pricing *</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addQuantityPrice}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                      
                      {formData.quantityPrices.map((qp, index) => (
                        <div key={index} className="flex gap-3 items-end">
                          <div className="flex-1">
                            <Select 
                              value={qp.quantityId} 
                              onValueChange={(value) => updateQuantityPrice(index, 'quantityId', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select quantity" />
                              </SelectTrigger>
                              <SelectContent>
                                {quantities.map(quantity => (
                                  <SelectItem key={quantity._id} value={quantity._id}>
                                    {quantity.value} - {quantity.description}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex-1">
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                type="number"
                                placeholder="Price"
                                value={qp.price || ''}
                                onChange={(e) => updateQuantityPrice(index, 'price', parseFloat(e.target.value) || 0)}
                                className="pl-10"
                                step="0.01"
                                min="0"
                              />
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeQuantityPrice(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      {formData.quantityPrices.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
                          No pricing added yet. Click "Add" to get started.
                        </p>
                      )}
                      
                      {errors.quantityPrices && (
                        <p className="text-sm text-red-500">{errors.quantityPrices}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsModalOpen(false);
                        setFormData({
                          name: '',
                          description: '',
                          image: '',
                          categoryId: '',
                          isVeg: true,
                          quantityPrices: [],
                        });
                        setErrors({});
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving || isUploading}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Create
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <Card key={item._id} className="group hover:shadow-md transition-all duration-300 cursor-pointer border-0 shadow-sm">
                <div className="relative">
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-40 object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gray-100 rounded-t-lg flex items-center justify-center">
                      <Utensils className="h-10 w-10 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Veg/Non-Veg Badge */}
                  <div className="absolute top-2 left-2">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      item.isVeg 
                        ? 'bg-green-100 border-green-600' 
                        : 'bg-orange-100 border-orange-600'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        item.isVeg ? 'bg-green-600' : 'bg-orange-600'
                      }`} />
                    </div>
                  </div>

                  {/* Highlighted Badge */}
                  {item.isHighlighted && (
                    <div className="absolute top-2 left-10">
                      <Badge className="bg-yellow-500 text-white border-0 text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    </div>
                  )}
                  
                  {/* Actions Menu */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="bg-white/90 hover:bg-white shadow-md border border-gray-200 h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48" sideOffset={5}>
                        <DropdownMenuItem onClick={() => handleEdit(item)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleHighlight(item)}
                          disabled={isHighlighting}
                        >
                          {item.isHighlighted ? (
                            <>
                              <StarOff className="h-4 w-4 mr-2" />
                              Remove Highlight
                            </>
                          ) : (
                            <>
                              <Star className="h-4 w-4 mr-2" />
                              Highlight
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(item)}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 group-hover:text-gray-700 transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {item.categoryId?.name || "No Category"}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                    {item.description}
                  </p>
                  
                  {/* Pricing */}
                  <div className="space-y-1">
                    {item.quantityPrices.map((qp, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{qp.quantityId?.value || "No Value"}</span>
                        <span className="font-semibold text-gray-900">₹{qp.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-xs text-gray-400 mt-3">
                    Created {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              {searchQuery ? (
                <div>
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No items found</h3>
                  <p className="text-gray-600">Try adjusting your search</p>
                </div>
              ) : (
                <div>
                  <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No menu items yet</h3>
                  <p className="text-gray-600 mb-4">Create your first delicious menu item</p>
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Item Modal - Similar structure to create modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
            <DialogDescription>
              Update your menu item information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {editErrors.general && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{editErrors.general}</p>
              </div>
            )}

            {/* Similar form fields as create modal but with edit data */}
            {/* Image Upload */}
            <div className="space-y-3">
              <Label>Image (Optional)</Label>
              {editFormData.image ? (
                <div className="relative">
                  <img 
                    src={editFormData.image} 
                    alt="Item preview"
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeEditImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Label htmlFor="edit-image-upload" className="cursor-pointer">
                  <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-orange-400 hover:bg-orange-50 transition-colors">
                    {isUploading ? (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin text-orange-600 mb-2" />
                        <span className="text-sm text-gray-600">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">Click to upload</span>
                      </>
                    )}
                  </div>
                </Label>
              )}
              <input
                id="edit-image-upload"
                type="file"
                accept="image/*"
                onChange={handleEditImageUpload}
                className="hidden"
                disabled={isUploading}
              />
              {editErrors.image && (
                <p className="text-sm text-red-500">{editErrors.image}</p>
              )}
            </div>

            {/* Item Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                name="name"
                value={editFormData.name}
                onChange={handleEditInputChange}
                placeholder="e.g., Grilled Chicken Sandwich"
                className={editErrors.name ? 'border-red-500' : 'border-gray-300'}
              />
              {editErrors.name && (
                <p className="text-sm text-red-500">{editErrors.name}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                name="description"
                value={editFormData.description}
                onChange={handleEditInputChange}
                placeholder="Describe your delicious dish..."
                rows={3}
                className={editErrors.description ? 'border-red-500' : 'border-gray-300'}
              />
              {editErrors.description && (
                <p className="text-sm text-red-500">{editErrors.description}</p>
              )}
              <p className="text-xs text-gray-500">
                {editFormData.description.length}/500 characters
              </p>
            </div>

            {/* Category and Veg/Non-Veg */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-categoryId">Category *</Label>
                <Select value={editFormData.categoryId} onValueChange={(value) => setEditFormData(prev => ({ ...prev, categoryId: value }))}>
                  <SelectTrigger className={editErrors.categoryId ? 'border-red-500' : 'border-gray-300'}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editErrors.categoryId && (
                  <p className="text-sm text-red-500">{editErrors.categoryId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Type *</Label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="edit-isVeg"
                      checked={editFormData.isVeg === true}
                      onChange={() => setEditFormData(prev => ({ ...prev, isVeg: true }))}
                      className="text-green-600"
                    />
                    <Leaf className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Veg</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="edit-isVeg"
                      checked={editFormData.isVeg === false}
                      onChange={() => setEditFormData(prev => ({ ...prev, isVeg: false }))}
                      className="text-orange-600"
                    />
                    <Beef className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">Non-Veg</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Quantity Prices */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Pricing *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEditQuantityPrice}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              
              {editFormData.quantityPrices.map((qp, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Select 
                      value={qp.quantityId} 
                      onValueChange={(value) => updateEditQuantityPrice(index, 'quantityId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select quantity" />
                      </SelectTrigger>
                      <SelectContent>
                        {quantities.map(quantity => (
                          <SelectItem key={quantity._id} value={quantity._id}>
                            {quantity.value} - {quantity.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        placeholder="Price"
                        value={qp.price || ''}
                        onChange={(e) => updateEditQuantityPrice(index, 'price', parseFloat(e.target.value) || 0)}
                        className="pl-10"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeEditQuantityPrice(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {editFormData.quantityPrices.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
                  No pricing added yet. Click "Add" to get started.
                </p>
              )}
              
              {editErrors.quantityPrices && (
                <p className="text-sm text-red-500">{editErrors.quantityPrices}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedItem(null);
                setEditFormData({
                  name: '',
                  description: '',
                  image: '',
                  categoryId: '',
                  isVeg: true,
                  quantityPrices: [],
                });
                setEditErrors({});
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={isSaving || isUploading}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              Delete Menu Item
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedItem?.name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}