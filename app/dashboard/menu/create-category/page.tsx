'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ChefHat, ArrowLeft, Loader2, Save, Search, Plus, Upload, X, MoreHorizontal, 
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

interface Category {
  _id: string;
  name: string;
  description: string;
  image?: string;
  createdAt: string;
}

export default function CreateCategoryPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    image: '',
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
      
      // Fetch categories for this outlet
      const categoriesResponse = await axios.get(`/api/categories?outletId=${outlet._id}`);
      setCategories(categoriesResponse.data.categories || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setCategories([]);
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
      uploadFormData.append('folder', 'menumaster/categories');

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
      uploadFormData.append('folder', 'menumaster/categories');

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
      // Extract public_id from Cloudinary URL
      const urlParts = imageUrl.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      if (uploadIndex === -1) return;
      
      const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
      const publicId = pathAfterUpload.split('.')[0];

      // Call your backend API to delete from Cloudinary
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }

    if (formData.name.length > 50) {
      newErrors.name = 'Category name must be less than 50 characters';
    }

    if (formData.description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEditForm = () => {
    const newErrors: Record<string, string> = {};

    if (!editFormData.name.trim()) {
      newErrors.name = 'Category name is required';
    }

    if (editFormData.name.length > 50) {
      newErrors.name = 'Category name must be less than 50 characters';
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
      const response = await axios.post('/api/categories', {
        ...formData,
        outletId: outlet?._id,
      });
      
      // Add new category to the list
      setCategories(prev => [response.data.category, ...prev]);
      
      // Reset form and close modal
      setFormData({ name: '', description: '', image: '' });
      setIsModalOpen(false);
    } catch (error: any) {
      if (error.response?.data?.error) {
        setErrors({ general: error.response.data.error });
      } else {
        setErrors({ general: 'Failed to create category. Please try again.' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setEditFormData({
      name: category.name,
      description: category.description || '',
      image: category.image || '',
    });
    setEditErrors({});
    setIsEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!validateEditForm() || !selectedCategory) return;

    setIsSaving(true);
    try {
      const response = await axios.put(`/api/categories/${selectedCategory._id}`, editFormData);
      
      // Update the category in the list
      setCategories(prev => prev.map(cat => 
        cat._id === selectedCategory._id ? response.data.category : cat
      ));
      
      // Close modal and reset form
      setIsEditModalOpen(false);
      setSelectedCategory(null);
      setEditFormData({ name: '', description: '', image: '' });
    } catch (error: any) {
      if (error.response?.data?.error) {
        setEditErrors({ general: error.response.data.error });
      } else {
        setEditErrors({ general: 'Failed to update category. Please try again.' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCategory) return;

    setIsDeleting(true);
    try {
      await axios.delete(`/api/categories/${selectedCategory._id}`);
      
      // Remove the category from the list
      setCategories(prev => prev.filter(cat => cat._id !== selectedCategory._id));
      
      // Close dialog and reset
      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);
    } catch (error: any) {
      console.error('Error deleting category:', error);
      // You might want to show an error toast here
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">Loading categories...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
              <p className="text-gray-600">Organize your menu</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-80 border-gray-300"
                />
              </div>
              
              {/* Create Category Button */}
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gray-900 hover:bg-gray-800 whitespace-nowrap">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add Category</DialogTitle>
                    <DialogDescription>
                      Create a new category to organize your menu
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
                            alt="Category preview"
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
                          <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 transition-colors">
                            {isUploading ? (
                              <>
                                <Loader2 className="h-6 w-6 animate-spin text-gray-600 mb-2" />
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

                    {/* Category Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g., Appetizers, Main Courses"
                        className={errors.name ? 'border-red-500' : 'border-gray-300'}
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500">{errors.name}</p>
                      )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Brief description..."
                        rows={3}
                        className={errors.description ? 'border-red-500' : 'border-gray-300'}
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
                        setFormData({ name: '', description: '', image: '' });
                        setErrors({});
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving || isUploading}
                      className="bg-gray-900 hover:bg-gray-800"
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

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
              <Card key={category._id} className="group hover:shadow-md transition-all duration-300 cursor-pointer border-0 shadow-sm">
                <div className="relative">
                  {category.image ? (
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="w-full h-40 object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gray-100 rounded-t-lg flex items-center justify-center">
                      <ChefHat className="h-10 w-10 text-gray-400" />
                    </div>
                  )}
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
                        <DropdownMenuItem onClick={() => handleEdit(category)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(category)}
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
                  <h3 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {category.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Created {new Date(category.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              {searchQuery ? (
                <div>
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No categories found</h3>
                  <p className="text-gray-600">Try adjusting your search</p>
                </div>
              ) : (
                <div>
                  <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No categories yet</h3>
                  <p className="text-gray-600 mb-4">Create your first category</p>
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-gray-900 hover:bg-gray-800"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Category Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update your category information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {editErrors.general && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{editErrors.general}</p>
              </div>
            )}

            {/* Image Upload */}
            <div className="space-y-3">
              <Label>Image (Optional)</Label>
              {editFormData.image ? (
                <div className="relative">
                  <img 
                    src={editFormData.image} 
                    alt="Category preview"
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
                  <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 transition-colors">
                    {isUploading ? (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin text-gray-600 mb-2" />
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

            {/* Category Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                name="name"
                value={editFormData.name}
                onChange={handleEditInputChange}
                placeholder="e.g., Appetizers, Main Courses"
                className={editErrors.name ? 'border-red-500' : 'border-gray-300'}
              />
              {editErrors.name && (
                <p className="text-sm text-red-500">{editErrors.name}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                name="description"
                value={editFormData.description}
                onChange={handleEditInputChange}
                placeholder="Brief description..."
                rows={3}
                className={editErrors.description ? 'border-red-500' : 'border-gray-300'}
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
                setSelectedCategory(null);
                setEditFormData({ name: '', description: '', image: '' });
                setEditErrors({});
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={isSaving || isUploading}
              className="bg-gray-900 hover:bg-gray-800"
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
              Delete Category
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedCategory?.name || "No Value"}"? 
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