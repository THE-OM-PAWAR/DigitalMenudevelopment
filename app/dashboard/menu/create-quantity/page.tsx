'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Package, ArrowLeft, Loader2, Save, Search, Plus, MoreHorizontal, 
  Edit, Trash2, AlertTriangle 
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

interface Quantity {
  _id: string;
  value: string;
  description: string;
  createdAt: string;
}

export default function CreateQuantityPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [quantities, setQuantities] = useState<Quantity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState<Quantity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    value: '',
    description: '',
  });
  const [editFormData, setEditFormData] = useState({
    value: '',
    description: '',
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
      const outletResponse = await axios.get('/api/outlets');
      const outlet = outletResponse.data.outlet;
      
      if (!outlet) {
        router.push('/dashboard');
        return;
      }
      
      setOutlet(outlet);
      
      // Fetch quantities for this outlet
      const quantitiesResponse = await axios.get(`/api/quantities?outletId=${outlet._id}`);
      setQuantities(quantitiesResponse.data.quantities || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setQuantities([]);
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.value.trim()) {
      newErrors.value = 'Quantity value is required';
    } else {
      if (formData.value.length > 10) {
        newErrors.value = 'Quantity value must be less than 10 characters';
      }
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEditForm = () => {
    const newErrors: Record<string, string> = {};

    if (!editFormData.value.trim()) {
      newErrors.value = 'Quantity value is required';
    } else {
      if (editFormData.value.length > 50) {
        newErrors.value = 'Quantity value must be less than 10 characters';
      }
    }

    if (!editFormData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (editFormData.description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters';
    }

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const response = await axios.post('/api/quantities', {
        value: formData.value,
        description: formData.description,
        outletId: outlet?._id,
      });
      
      // Add new quantity to the list
      setQuantities(prev => [response.data.quantity, ...prev]);
      
      // Reset form and close modal
      setFormData({ value: '', description: '' });
      setIsModalOpen(false);
    } catch (error: any) {
      if (error.response?.data?.error) {
        setErrors({ general: error.response.data.error });
      } else {
        setErrors({ general: 'Failed to create quantity. Please try again.' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (quantity: Quantity) => {
    setSelectedQuantity(quantity);
    setEditFormData({
      value: quantity.value,
      description: quantity.description,
    });
    setEditErrors({});
    setIsEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!validateEditForm() || !selectedQuantity) return;

    setIsSaving(true);
    try {
      const response = await axios.put(`/api/quantities/${selectedQuantity._id}`, {
        value: editFormData.value,
        description: editFormData.description,
      });
      
      // Update the quantity in the list
      setQuantities(prev => prev.map(qty => 
        qty._id === selectedQuantity._id ? response.data.quantity : qty
      ));
      
      // Close modal and reset form
      setIsEditModalOpen(false);
      setSelectedQuantity(null);
      setEditFormData({ value: '', description: '' });
    } catch (error: any) {
      if (error.response?.data?.error) {
        setEditErrors({ general: error.response.data.error });
      } else {
        setEditErrors({ general: 'Failed to update quantity. Please try again.' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (quantity: Quantity) => {
    setSelectedQuantity(quantity);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedQuantity) return;

    setIsDeleting(true);
    try {
      await axios.delete(`/api/quantities/${selectedQuantity._id}`);
      
      // Remove the quantity from the list
      setQuantities(prev => prev.filter(qty => qty._id !== selectedQuantity._id));
      
      // Close dialog and reset
      setIsDeleteDialogOpen(false);
      setSelectedQuantity(null);
    } catch (error: any) {
      console.error('Error deleting quantity:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const filteredQuantities = quantities.filter(quantity =>
    quantity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    quantity.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading quantities...</p>
        </div>
      </div>
    );
  }

  if (!user || !outlet) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <DashboardHeader outlet={outlet} onSignOut={handleSignOut} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/menu">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Menu Management
            </Button>
          </Link>
          
          {/* Page Header with Search and Create Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quantities</h1>
              <p className="text-gray-600">Manage quantity options for your menu items</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search quantities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-80"
                />
              </div>
              
              {/* Create Quantity Button */}
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 whitespace-nowrap">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Quantity
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create New Quantity</DialogTitle>
                    <DialogDescription>
                      Add a new quantity option for your menu items
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6 py-4">
                    {errors.general && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <p className="text-sm text-red-600">{errors.general}</p>
                      </div>
                    )}

                    {/* Quantity Value */}
                    <div className="space-y-2">
                      <Label htmlFor="value">Quantity Value *</Label>
                      <Input
                        id="value"
                        name="value"
                        type="text"
                        value={formData.value}
                        onChange={handleInputChange}
                        placeholder="Quantity Value"
                        step="0.1"
                        min="0"
                        className={errors.value ? 'border-red-500' : ''}
                      />
                      {errors.value && (
                        <p className="text-sm text-red-500">{errors.value}</p>
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
                        placeholder="e.g., Single serving, Double portion, Half size..."
                        rows={3}
                        className={errors.description ? 'border-red-500' : ''}
                      />
                      {errors.description && (
                        <p className="text-sm text-red-500">{errors.description}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {formData.description.length}/200 characters
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsModalOpen(false);
                        setFormData({ value: '', description: '' });
                        setErrors({});
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Create Quantity
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Quantities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredQuantities.length > 0 ? (
            filteredQuantities.map((quantity) => (
              <Card key={quantity._id} className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-emerald-200">
                <CardHeader className="p-0">
                  <div className="relative">
                    <div className="w-full h-32 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-t-lg flex items-center justify-center">
                      <div className="text-center">
                        <Package className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                        <span className="text-2xl font-bold text-emerald-700">{quantity.value}</span>
                      </div>
                    </div>
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
                          <DropdownMenuItem onClick={() => handleEdit(quantity)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Quantity
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(quantity)}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Quantity
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                    {quantity.description}
                  </h3>
                  <p className="text-xs text-gray-400 mt-2">
                    Created {new Date(quantity.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              {searchQuery ? (
                <div>
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No quantities found</h3>
                  <p className="text-gray-600">Try adjusting your search terms</p>
                </div>
              ) : (
                <div>
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No quantities yet</h3>
                  <p className="text-gray-600 mb-4">Create your first quantity option to get started</p>
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Quantity
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Quantity Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Quantity</DialogTitle>
            <DialogDescription>
              Update your quantity information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {editErrors.general && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{editErrors.general}</p>
              </div>
            )}

            {/* Quantity Value */}
            <div className="space-y-2">
              <Label htmlFor="edit-value">Quantity Value *</Label>
              <Input
                id="edit-value"
                name="value"
                type="text"
                value={editFormData.value}
                onChange={handleEditInputChange}
                placeholder="e.g., 1, 2, 0.5"
                step="0.1"
                min="0"
                className={editErrors.value ? 'border-red-500' : ''}
              />
              {editErrors.value && (
                <p className="text-sm text-red-500">{editErrors.value}</p>
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
                placeholder="e.g., Single serving, Double portion, Half size..."
                rows={3}
                className={editErrors.description ? 'border-red-500' : ''}
              />
              {editErrors.description && (
                <p className="text-sm text-red-500">{editErrors.description}</p>
              )}
              <p className="text-xs text-gray-500">
                {editFormData.description.length}/200 characters
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedQuantity(null);
                setEditFormData({ value: '', description: '' });
                setEditErrors({});
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={isSaving}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Quantity
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
              Delete Quantity
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the quantity "{selectedQuantity?.description}" with value {selectedQuantity?.value}? 
              This action cannot be undone and will permanently remove the quantity option.
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
                  Delete Quantity
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}