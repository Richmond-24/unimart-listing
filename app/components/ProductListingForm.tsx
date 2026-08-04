'use client';

import React, { useState, useRef } from 'react';
import { SuccessModal } from './SuccessModal';

// Icons SVG Components
const Icons = {
  Upload: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>,
  Image: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>,
  Video: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>,
  X: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>,
  Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
};

interface FormData {
  title: string;
  description: string;
  price: string;
  category: string;
  condition: string;
  sellerName: string;
  sellerEmail: string;
  deliveryMethod: string;
  paymentMethod: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function ProductListingForm() {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: 'New',
    sellerName: '',
    sellerEmail: '',
    deliveryMethod: 'pickup',
    paymentMethod: 'momo',
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Validation rules
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Product title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.sellerName.trim()) newErrors.sellerName = 'Seller name is required';
    if (!formData.sellerEmail.trim()) newErrors.sellerEmail = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.sellerEmail)) newErrors.sellerEmail = 'Valid email is required';
    if (imageFiles.length === 0) newErrors.images = 'At least one product image is required';
    if (!formData.deliveryMethod) newErrors.deliveryMethod = 'Delivery method is required';
    if (!formData.paymentMethod) newErrors.paymentMethod = 'Payment method is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Input handlers
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImageFiles((prev) => [...prev, ...files]);
      
      // Create previews
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          setImagePreviews((prev) => [...prev, event.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
    // Clear error
    if (errors.images) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.images;
        return newErrors;
      });
    }
  };

  // Video upload handler
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setVideoPreviews(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Remove video
  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreviews(null);
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Create FormData for multipart upload
      const formDataToSend = new FormData();
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      // Add images
      imageFiles.forEach((file) => {
        formDataToSend.append('images', file);
      });

      // Add video if present
      if (videoFile) {
        formDataToSend.append('video', videoFile);
      }

      // Submit to API
      const response = await fetch('/api/listings', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('Failed to create listing');
      }

      // Show success modal
      setShowSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        setFormData({
          title: '',
          description: '',
          price: '',
          category: '',
          condition: 'New',
          sellerName: '',
          sellerEmail: '',
          deliveryMethod: 'pickup',
          paymentMethod: 'momo',
        });
        setImageFiles([]);
        setImagePreviews([]);
        setVideoFile(null);
        setVideoPreviews(null);
      }, 2000);
    } catch (error) {
      console.error('Listing submission error:', error);
      setErrors({ submit: 'Failed to create listing. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="transition-transform duration-500 group-hover:scale-110 h-8 w-auto">
            <img src="/swoop.png" alt="Swoop Logo" className="h-full w-auto object-contain" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900 leading-none hidden sm:block">
            swoop
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500">
          <span className="hover:text-orange-500 cursor-pointer transition-colors">Dashboard</span>
          <span className="hover:text-orange-500 cursor-pointer transition-colors">My Listings</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto pt-24 pb-16 px-4">
        {/* Page Title */}
        <div className="mb-12 text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            List Your Product
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Fill in the details below and upload photos and videos to get your product listed instantly.
          </p>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Product Information Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">1</span>
              Product Information
            </h2>

            <div className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Product Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Premium Wireless Headphones"
                  className={`w-full px-4 py-3 rounded-lg border-2 bg-white transition-colors ${
                    errors.title ? 'border-red-500' : 'border-slate-300 focus:border-orange-500'
                  } focus:outline-none`}
                  maxLength={100}
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your product in detail..."
                  rows={5}
                  className={`w-full px-4 py-3 rounded-lg border-2 bg-white transition-colors resize-none ${
                    errors.description ? 'border-red-500' : 'border-slate-300 focus:border-orange-500'
                  } focus:outline-none`}
                  maxLength={1000}
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>

              {/* Price & Category Row */}
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-slate-600 font-semibold">GHS</span>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className={`w-full pl-12 pr-4 py-3 rounded-lg border-2 bg-white transition-colors ${
                        errors.price ? 'border-red-500' : 'border-slate-300 focus:border-orange-500'
                      } focus:outline-none`}
                    />
                  </div>
                  {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-lg border-2 bg-white transition-colors ${
                      errors.category ? 'border-red-500' : 'border-slate-300 focus:border-orange-500'
                    } focus:outline-none`}
                  >
                    <option value="">Select a category</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Home & Garden">Home & Garden</option>
                    <option value="Sports">Sports</option>
                    <option value="Books">Books</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Condition
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 bg-white focus:border-orange-500 focus:outline-none transition-colors"
                >
                  <option value="New">New</option>
                  <option value="Like New">Like New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                </select>
              </div>
            </div>
          </div>

          {/* Media Upload Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">2</span>
              Product Media
            </h2>

            <div className="space-y-6">
              {/* Images Upload */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Product Images <span className="text-red-500">*</span>
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    errors.images
                      ? 'border-red-500 bg-red-50'
                      : 'border-orange-300 bg-orange-50 hover:bg-orange-100'
                  }`}
                  onClick={() => imageInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-orange-500 text-white rounded-lg">
                      <Icons.Image />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Drag and drop images here</p>
                      <p className="text-sm text-slate-600">or click to browse</p>
                    </div>
                  </div>
                  <input
                    ref={imageInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                {errors.images && <p className="text-red-500 text-sm mt-2">{errors.images}</p>}

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-slate-300"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Icons.X />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Videos Upload */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Product Video <span className="text-slate-500 text-xs">(Optional)</span>
                </label>
                <div
                  className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer transition-all hover:bg-slate-50 hover:border-slate-400"
                  onClick={() => videoInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-slate-500 text-white rounded-lg">
                      <Icons.Video />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Upload a video</p>
                      <p className="text-sm text-slate-600">or click to browse</p>
                    </div>
                  </div>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </div>

                {/* Video Preview */}
                {videoPreviews && (
                  <div className="mt-6 relative group">
                    <video
                      src={videoPreviews}
                      className="w-full max-w-md rounded-lg border border-slate-300 mx-auto"
                      controls
                    />
                    <button
                      type="button"
                      onClick={removeVideo}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Icons.X />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Seller Information Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">3</span>
              Seller Information
            </h2>

            <div className="space-y-5">
              {/* Seller Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Seller Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="sellerName"
                  value={formData.sellerName}
                  onChange={handleInputChange}
                  placeholder="Your name"
                  className={`w-full px-4 py-3 rounded-lg border-2 bg-white transition-colors ${
                    errors.sellerName ? 'border-red-500' : 'border-slate-300 focus:border-orange-500'
                  } focus:outline-none`}
                />
                {errors.sellerName && <p className="text-red-500 text-sm mt-1">{errors.sellerName}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="sellerEmail"
                  value={formData.sellerEmail}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  className={`w-full px-4 py-3 rounded-lg border-2 bg-white transition-colors ${
                    errors.sellerEmail ? 'border-red-500' : 'border-slate-300 focus:border-orange-500'
                  } focus:outline-none`}
                />
                {errors.sellerEmail && <p className="text-red-500 text-sm mt-1">{errors.sellerEmail}</p>}
              </div>
            </div>
          </div>

          {/* Delivery & Payment Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">4</span>
              Delivery & Payment
            </h2>

            <div className="grid md:grid-cols-2 gap-5">
              {/* Delivery Method */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Delivery Method <span className="text-red-500">*</span>
                </label>
                <select
                  name="deliveryMethod"
                  value={formData.deliveryMethod}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg border-2 bg-white transition-colors ${
                    errors.deliveryMethod ? 'border-red-500' : 'border-slate-300 focus:border-orange-500'
                  } focus:outline-none`}
                >
                  <option value="pickup">Pickup</option>
                  <option value="delivery">Delivery</option>
                  <option value="both">Both</option>
                </select>
                {errors.deliveryMethod && <p className="text-red-500 text-sm mt-1">{errors.deliveryMethod}</p>}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg border-2 bg-white transition-colors ${
                    errors.paymentMethod ? 'border-red-500' : 'border-slate-300 focus:border-orange-500'
                  } focus:outline-none`}
                >
                  <option value="momo">Mobile Money</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="cash">Cash</option>
                </select>
                {errors.paymentMethod && <p className="text-red-500 text-sm mt-1">{errors.paymentMethod}</p>}
              </div>
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 text-red-700">
              {errors.submit}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Creating Listing...
              </span>
            ) : (
              'Create Listing'
            )}
          </button>
        </form>
      </main>

      {/* Success Modal */}
      {showSuccess && <SuccessModal onClose={() => setShowSuccess(false)} listingData={formData} />}
    </div>
  );
}
