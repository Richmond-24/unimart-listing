"use client";

import React, { useState, useRef } from 'react';

// --- Icons (SVG Components) ---
const Icons = {
  ChevronRight: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
  ChevronLeft: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Upload: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>,
  Wand: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h0"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/></svg>,
  Edit: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>,
  Check: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Video: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>,
  Image: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>,
  User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Package: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>,
  Dollar: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  Truck: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><path d="M14 17h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>,
  Zap: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
};

// --- Types ---
type ModeType = 'ai' | 'manual' | null;

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

/**
 * Real AI Service - Gemini-powered analysis for video/image content
 * Transcribes video content and auto-fills seller + product details
 */
const analyzeVideoWithAI = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('video', file);

    console.log('[v0] Sending video to AI analysis API...');

    const response = await fetch('/api/analyze-video', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }

    const data = await response.json();
    console.log('[v0] AI analysis result:', data);

    if (!data.success) {
      throw new Error(data.error || 'Analysis failed');
    }

    const listing = data.listing || {};

    return {
      title: listing.title || '',
      description: listing.description || '',
      price: listing.suggestedPrice?.toString() || '',
      category: listing.category || '',
      condition: listing.condition || 'Good',
      brand: listing.brand || '',
      tags: listing.tags || [],
      confidence: listing.confidence || 0,
      // Seller info extracted from video
      sellerName: listing.sellerName || '',
      sellerEmail: listing.sellerEmail || '',
      sellerLocation: listing.sellerLocation || '',
      sellerPhone: listing.sellerPhone || '',
    };
  } catch (error) {
    console.error('[v0] AI analysis error:', error);
    throw error;
  }
};

export default function Lister() {
  const [step, setStep] = useState<number>(0); 
  const [mode, setMode] = useState<ModeType>(null); 
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Form State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: 'New',
    sellerName: '',
    sellerEmail: '',
    deliveryMethod: 'pickup',
    paymentMethod: 'momo'
  });

  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Handlers
  const handleModeSelect = (selectedMode: ModeType) => {
    setMode(selectedMode);
    setStep(1);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoFile(file);
    
    if (mode === 'ai') {
      setIsLoading(true);
      try {
        console.log('[v0] Starting AI video analysis...');
        const aiData = await analyzeVideoWithAI(file);
        console.log('[v0] AI data received:', aiData);
        setFormData(prev => ({ 
          ...prev, 
          ...aiData,
          // Auto-fill seller info if available from video analysis
          sellerName: aiData.sellerName || prev.sellerName,
          sellerEmail: aiData.sellerEmail || prev.sellerEmail,
        }));
      } catch (error) {
        console.error('[v0] AI Error:', error);
        alert('Failed to analyze video. Please try again or fill details manually.');
      } finally {
        setIsLoading(false);
        setStep(2); 
      }
    } else {
      setStep(2); 
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setImageFiles(prev => [...prev, ...files]);

    // If in AI mode and this is the first image and we haven't analyzed yet, analyze it
    if (mode === 'ai' && files.length > 0 && !formData.title) {
      const firstImage = files[0];
      setIsLoading(true);
      try {
        console.log('[v0] Analyzing first image with AI...');
        const aiData = await analyzeVideoWithAI(firstImage);
        console.log('[v0] Image AI data received:', aiData);
        setFormData(prev => ({
          ...prev,
          ...aiData,
          sellerName: aiData.sellerName || prev.sellerName,
          sellerEmail: aiData.sellerEmail || prev.sellerEmail,
        }));
      } catch (error) {
        console.error('[v0] Image analysis error:', error);
        // Continue without AI analysis
      } finally {
        setIsLoading(false);
      }
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert("Listing Created Successfully!");
    }, 1500);
  };

  // Render Helpers
  const renderProgressBar = () => {
    const steps = ['Start', 'Video', 'Photos', 'Details', 'Finish'];
    return (
      <div className="w-full max-w-2xl mx-auto mb-8 px-4 relative z-10">
        <div className="flex justify-between relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-10 transform -translate-y-1/2 rounded-full"></div>
          {/* Animated Progress Line */}
          <div 
            className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-orange-400 to-red-500 -z-10 transform -translate-y-1/2 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
          ></div>
          
          {steps.map((label, idx) => {
            const isActive = idx <= step;
            const isCurrent = idx === step;
            return (
              <div key={idx} className="flex flex-col items-center gap-2 group cursor-default">
                <div className={`relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                  isActive ? 'bg-white border-2 border-orange-500 text-orange-600 scale-110 shadow-lg shadow-orange-100' : 'bg-gray-50 border-2 border-gray-200 text-gray-400'
                }`}>
                  {isActive && !isCurrent && <Icons.Check />}
                  {!isActive && idx + 1}
                  {isCurrent && (
                    <span className="absolute inset-0 rounded-full border-2 border-orange-500 animate-ping opacity-20"></span>
                  )}
                </div>
                <span className={`text-xs font-medium transition-colors duration-300 ${isCurrent ? 'text-orange-600 font-bold' : 'text-gray-400'}`}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-slate-800 selection:bg-orange-100 overflow-x-hidden">
      
      {/* Background Ambient Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-orange-100/40 rounded-full blur-[100px] animate-blob"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-100/40 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-blue-100/30 rounded-full blur-[80px] animate-blob animation-delay-4000"></div>
      </div>

      {/* Header - Static/Fixed */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/50 px-6 py-4 flex items-center justify-between transition-all duration-300 hover:bg-white/90 shadow-sm">
        <div className="flex items-center gap-2.5 group cursor-pointer">
          {/* Replaced Logo with Image - Reduced Size */}
          <div className="transition-transform duration-500 group-hover:scale-110 h-8 w-auto">
             <img src="/swoop.png" alt="Swoop Logo" className="h-full w-auto object-contain" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900 leading-none hidden sm:block">
            swoop
            <span className="ml-1.5 align-middle text-[10px] font-extrabold tracking-widest uppercase text-white bg-gradient-to-r from-orange-500 to-red-600 px-1.5 py-0.5 rounded-md shadow-sm">RIRI.ai</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500">
          <span className="hover:text-orange-500 cursor-pointer transition-colors relative after:content-[''] after:absolute after:w-0 after:h-0.5 after:bg-orange-500 after:left-0 after:-bottom-1 after:transition-all hover:after:w-full">Dashboard</span>
          <span className="hover:text-orange-500 cursor-pointer transition-colors relative after:content-[''] after:absolute after:w-0 after:h-0.5 after:bg-orange-500 after:left-0 after:-bottom-1 after:transition-all hover:after:w-full">My Listings</span>
          <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-md hover:shadow-lg hover:scale-105 transition-all cursor-pointer">
             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto pt-32 pb-12 px-4 relative z-10">
        
        {renderProgressBar()}

        {/* STEP 0: MODE SELECTION WITH LOTTIE & FIGMA DESIGN */}
        {step === 0 && (
          <div className="animate-fade-in-up space-y-8 text-center perspective-1000">
            
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[2rem] bg-white p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/60 group hover:shadow-[0_30px_60px_rgba(249,115,22,0.1)] transition-all duration-500">
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-200/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none animate-pulse-slow"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-200/20 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none animate-pulse-slow animation-delay-2000"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="text-left space-y-6 flex-1">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-orange-100 shadow-sm text-orange-600 text-xs font-bold uppercase tracking-wider hover:border-orange-300 transition-colors cursor-default">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                    Powered by Riri AI
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                    List it in<br className="hidden md:block" /> 
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 animate-gradient-x"> seconds.</span>
                  </h1>
                  <p className="text-lg text-slate-500 max-w-md leading-relaxed">
                    Take a video of your product, and Riri writes the title, price, and description for you. Or fill it in yourself — either way, you're live in minutes.
                  </p>
                  
                  <div className="flex items-center gap-4 pt-2">
                     <div className="flex -space-x-2">
                        {[1,2,3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i*123}`} alt="user" />
                            </div>
                        ))}
                     </div>
                     <span className="text-sm text-slate-400 font-medium">Join 10k+ sellers today</span>
                  </div>
                </div>

                {/* Lottie Animation Container - Using standard img tag or div to avoid TSX errors with custom elements if script isn't loaded in global types */}
                <div className="w-64 h-64 md:w-80 md:h-80 flex-shrink-0 relative group-hover:scale-105 transition-transform duration-700">
                   {/* Note: In a real Next.js app, you would import the player or use next/dynamic. 
                       Here we use a placeholder div that would be replaced by the script in layout.tsx or head.
                       To fix the TS error strictly without external config changes, we use a standard div with a ref or class.
                   */}
                   <div className="w-full h-full flex items-center justify-center">
                      <img 
                        src="https://cdn.lottiefiles.com/animations/1Pqj0W9yGm.json" 
                        alt="Animation Placeholder" 
                        className="opacity-0" 
                        onLoad={(e) => {
                           // This is a hack to show an image if lottie fails, but ideally you want the script.
                           // For this code block, we will use a high quality SVG/CSS animation as fallback which is TS safe.
                        }}
                      />
                      {/* CSS/SVG Fallback Animation that looks like Lottie */}
                      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl animate-float">
                         <defs>
                            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" style={{stopColor:'#FB923C', stopOpacity:1}} />
                              <stop offset="100%" style={{stopColor:'#DC2626', stopOpacity:1}} />
                            </linearGradient>
                         </defs>
                         <circle cx="100" cy="100" r="80" fill="url(#grad1)" className="animate-pulse-slow" />
                         <path d="M60 100 Q100 40 140 100 T180 100" stroke="white" strokeWidth="8" fill="none" strokeLinecap="round" className="animate-dash" />
                      </svg>
                   </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <button 
                onClick={() => handleModeSelect('ai')}
                className="group relative p-8 bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:rotate-12">
                  <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h0"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/></svg>
                </div>
                
                <div className="relative z-10">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-inner">
                    <Icons.Wand />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-purple-700 transition-colors">Auto-Fill with RIRI AI</h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-6">Upload a video of your product. Our AI will detect the item and fill in the details for you instantly.</p>
                    
                    <div className="inline-flex items-center text-purple-600 font-bold text-sm group-hover:translate-x-2 transition-transform duration-300">
                    Try Magic Fill <span className="ml-2 text-lg">→</span>
                    </div>
                </div>
              </button>

              <button 
                onClick={() => handleModeSelect('manual')}
                className="group relative p-8 bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
              >
                 <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                 <div className="relative z-10">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-inner">
                    <Icons.Edit />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-blue-700 transition-colors">Fill Manually</h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-6">Enter all product details yourself. Best if you have specific specifications to include.</p>
                    <div className="inline-flex items-center text-blue-600 font-bold text-sm group-hover:translate-x-2 transition-transform duration-300">
                    Start Form <span className="ml-2 text-lg">→</span>
                    </div>
                 </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: VIDEO UPLOAD */}
        {step === 1 && (
          <div className="animate-slide-in-right max-w-xl mx-auto">
            <div className="bg-white rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-white/60 overflow-hidden backdrop-blur-sm">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><Icons.Video /></div> 
                  Upload Video
                </h2>
                <span className="text-xs font-bold px-3 py-1.5 bg-orange-100 text-orange-600 rounded-full uppercase tracking-wide animate-pulse">Required</span>
              </div>
              
              <div className="p-10">
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-3xl p-12 text-center hover:bg-orange-50/30 hover:border-orange-400 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                  onClick={() => videoInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={videoInputRef} 
                    className="hidden" 
                    accept="video/*"
                    onChange={handleVideoUpload}
                  />
                  
                  {/* Ripple Effect on Hover */}
                  <div className="absolute inset-0 bg-orange-500/5 scale-0 group-hover:scale-100 transition-transform duration-500 rounded-3xl"></div>
                  
                  <div className="relative z-10">
                    <div className="w-20 h-20 bg-white text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg shadow-orange-100">
                        <Icons.Upload />
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-orange-600 transition-colors">Click to upload video</h3>
                    <p className="text-slate-400 text-sm mb-6">MP4, MOV, WebM (Max 100MB)</p>
                    
                    {mode === 'ai' && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 text-xs font-bold rounded-full border border-purple-100 shadow-sm">
                        <Icons.Wand /> AI Auto-fill enabled
                        </div>
                    )}
                  </div>
                </div>

                {videoFile && (
                   <div className="mt-8 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-4 animate-scale-in shadow-sm">
                     <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><Icons.Check /></div>
                     <div className="flex-1">
                       <p className="text-sm font-bold text-green-800">{videoFile.name}</p>
                       <p className="text-xs text-green-600">{(videoFile.size / 1024 / 1024).toFixed(2)} MB • Ready to process</p>
                     </div>
                   </div>
                )}
              </div>

              <div className="p-6 bg-gray-50/50 flex justify-between items-center border-t border-gray-100">
                <button onClick={prevStep} className="text-slate-500 font-bold hover:text-slate-800 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors">Back</button>
              </div>
            </div>
          </div>
        )}

        {/* LOADING STATE (AI) */}
        {isLoading && mode === 'ai' && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-xl z-50 flex flex-col items-center justify-center animate-fade-in">
            <div className="relative w-32 h-32 mb-8">
               {/* Rotating Rings */}
               <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
               <div className="absolute inset-0 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
               <div className="absolute inset-4 border-4 border-purple-500 rounded-full border-b-transparent animate-spin-reverse"></div>
               
               <div className="absolute inset-0 flex items-center justify-center text-4xl animate-bounce">✨</div>
            </div>
            <h3 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">RIRI is analyzing...</h3>
            <p className="text-slate-500 font-medium animate-pulse">Identifying product features and pricing</p>
            
            {/* Scanning Line Animation */}
            <div className="mt-8 w-64 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-purple-600 w-1/2 animate-loading-bar"></div>
            </div>
          </div>
        )}

        {/* STEP 2: IMAGE UPLOAD */}
        {step === 2 && !isLoading && (
          <div className="animate-slide-in-right max-w-xl mx-auto">
            <div className="bg-white rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-white/60 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Icons.Image /></div> 
                  Add Photos
                </h2>
                <span className="text-xs font-bold px-3 py-1.5 bg-blue-100 text-blue-600 rounded-full uppercase tracking-wide">Recommended</span>
              </div>
              
              <div className="p-10">
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-3xl p-8 text-center hover:bg-blue-50/30 hover:border-blue-400 transition-all duration-300 cursor-pointer group mb-8"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={imageInputRef} 
                    className="hidden" 
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                  />
                  
                  <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm">
                    <Icons.Image />
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-700 mb-1">Add More Photos</h3>
                  <p className="text-slate-400 text-xs">JPG, PNG (Max 10MB each)</p>
                </div>

                {imageFiles.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    {imageFiles.map((file, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 group shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={`Preview ${idx}`} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                        <button 
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 bg-gray-50/50 flex justify-between items-center border-t border-gray-100">
                <button onClick={prevStep} className="text-slate-500 font-bold hover:text-slate-800 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors">Back</button>
                <button 
                  onClick={nextStep}
                  className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 hover:scale-105 hover:shadow-lg hover:shadow-slate-300 transition-all"
                >
                  Next Step <Icons.ChevronRight />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PRODUCT DETAILS */}
        {step === 3 && !isLoading && (
          <div className="animate-slide-in-right max-w-2xl mx-auto">
             <div className="bg-white rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-white/60 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Icons.Package /></div> 
                  Product Details
                </h2>
                {mode === 'ai' && <span className="text-xs font-bold px-3 py-1.5 bg-purple-100 text-purple-600 rounded-full uppercase tracking-wide animate-pulse">AI Filled</span>}
              </div>

              <div className="p-10 space-y-8">
                {/* Title */}
                <div className="space-y-3 group">
                  <label className="text-sm font-bold text-slate-700 ml-1 group-focus-within:text-orange-600 transition-colors">Product Title</label>
                  <input 
                    type="text" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-5 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100 outline-none transition-all font-medium text-slate-800 placeholder:text-gray-400 shadow-inner"
                    placeholder="e.g. iPhone 13 Pro Max 256GB"
                  />
                </div>

                {/* Category & Condition Row */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3 group">
                    <label className="text-sm font-bold text-slate-700 ml-1 group-focus-within:text-orange-600 transition-colors">Category</label>
                    <div className="relative">
                        <select 
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-5 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100 outline-none transition-all font-medium text-slate-800 appearance-none shadow-inner cursor-pointer"
                        >
                        <option value="">Select Category</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Fashion">Fashion</option>
                        <option value="Books">Books</option>
                        <option value="Furniture">Furniture</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                    </div>
                  </div>
                  <div className="space-y-3 group">
                    <label className="text-sm font-bold text-slate-700 ml-1 group-focus-within:text-orange-600 transition-colors">Condition</label>
                    <div className="relative">
                        <select 
                        value={formData.condition}
                        onChange={(e) => setFormData({...formData, condition: e.target.value})}
                        className="w-full px-5 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100 outline-none transition-all font-medium text-slate-800 appearance-none shadow-inner cursor-pointer"
                        >
                        <option value="New">Brand New</option>
                        <option value="Like New">Like New</option>
                        <option value="Used">Used</option>
                        <option value="Fair">Fair Condition</option>
                        </select>
                         <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-3 group">
                  <label className="text-sm font-bold text-slate-700 ml-1 group-focus-within:text-orange-600 transition-colors">Description</label>
                  <textarea 
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-5 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100 outline-none transition-all font-medium text-slate-800 resize-none shadow-inner"
                    placeholder="Tell buyers more about the item..."
                  />
                </div>

                {/* Price */}
                <div className="space-y-3 group">
                  <label className="text-sm font-bold text-slate-700 ml-1 group-focus-within:text-orange-600 transition-colors">Price (GHS)</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg group-focus-within:text-orange-500 transition-colors">₵</span>
                    <input 
                      type="number" 
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="w-full pl-12 pr-5 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100 outline-none transition-all font-bold text-xl text-slate-800 shadow-inner"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50/50 flex justify-between items-center border-t border-gray-100">
                <button onClick={prevStep} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors">
                  <Icons.ChevronLeft /> Back
                </button>
                <button 
                  onClick={nextStep}
                  className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 hover:scale-105 hover:shadow-lg hover:shadow-slate-300 transition-all"
                >
                  Next Step <Icons.ChevronRight />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: DELIVERY & SELLER INFO */}
        {step === 4 && (
          <div className="animate-slide-in-right max-w-2xl mx-auto">
             <div className="bg-white rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-white/60 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                  <div className="p-2 bg-green-100 text-green-600 rounded-lg"><Icons.Truck /></div> 
                  Delivery & Info
                </h2>
              </div>

              <div className="p-10 space-y-10">
                
                {/* Delivery Method Cards */}
                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-700 ml-1">Delivery Preference</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div 
                      onClick={() => setFormData({...formData, deliveryMethod: 'pickup'})}
                      className={`cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden ${formData.deliveryMethod === 'pickup' ? 'border-orange-500 bg-orange-50 shadow-lg shadow-orange-100' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'}`}
                    >
                      {formData.deliveryMethod === 'pickup' && (
                          <div className="absolute top-2 right-2 text-orange-500 animate-scale-in"><Icons.Check /></div>
                      )}
                      <div className="font-bold text-slate-800 mb-1 text-lg">Campus Pickup</div>
                      <div className="text-sm text-slate-500">Meet on campus safely</div>
                    </div>
                    <div 
                      onClick={() => setFormData({...formData, deliveryMethod: 'delivery'})}
                      className={`cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden ${formData.deliveryMethod === 'delivery' ? 'border-orange-500 bg-orange-50 shadow-lg shadow-orange-100' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'}`}
                    >
                      {formData.deliveryMethod === 'delivery' && (
                          <div className="absolute top-2 right-2 text-orange-500 animate-scale-in"><Icons.Check /></div>
                      )}
                      <div className="font-bold text-slate-800 mb-1 text-lg">Swoop Delivery</div>
                      <div className="text-sm text-slate-500">We ship it for you</div>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Seller Info */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Icons.User /> Contact Information
                    </h3>
                    {mode === 'ai' && formData.sellerName && (
                      <span className="text-xs font-bold px-3 py-1.5 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                        ✓ Auto-filled from video
                      </span>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="group">
                        <input 
                        type="text" 
                        placeholder="Full Name"
                        value={formData.sellerName}
                        onChange={(e) => setFormData({...formData, sellerName: e.target.value})}
                        className="w-full px-5 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100 outline-none transition-all text-sm font-medium shadow-inner"
                        />
                    </div>
                    <div className="group">
                        <input 
                        type="email" 
                        placeholder="Email Address"
                        value={formData.sellerEmail}
                        onChange={(e) => setFormData({...formData, sellerEmail: e.target.value})}
                        className="w-full px-5 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100 outline-none transition-all text-sm font-medium shadow-inner"
                        />
                    </div>
                  </div>
                </div>

                {/* Payment */}
                <div className="space-y-3 group">
                   <label className="text-sm font-bold text-slate-700 ml-1 group-focus-within:text-orange-600 transition-colors">Preferred Payment</label>
                   <div className="relative">
                       <select 
                          value={formData.paymentMethod}
                          onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                          className="w-full px-5 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100 outline-none transition-all font-medium text-slate-800 appearance-none shadow-inner cursor-pointer"
                        >
                          <option value="momo">Mobile Money (MTN/Telecel/Vodafone)</option>
                          <option value="cash">Cash on Delivery</option>
                          <option value="bank">Bank Transfer</option>
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                   </div>
                </div>

              </div>

              <div className="p-6 bg-gray-50/50 flex justify-between items-center border-t border-gray-100">
                <button onClick={prevStep} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors">
                  <Icons.ChevronLeft /> Back
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="group relative overflow-hidden flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 text-white px-10 py-4 rounded-xl font-bold shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 hover:-translate-y-1 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {isLoading ? 'Publishing...' : 'Publish Listing'} <Icons.Check />
                  </span>
                  {/* Button Shine Effect */}
                  <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] group-hover:animate-shine"></div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HOW IT WORKS SECTION */}
        {step === 0 && (
          <div className="mt-20 mb-10 animate-fade-in-up">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black text-slate-900 mb-4">How Swoop Listing Works</h2>
              <p className="text-slate-500 max-w-lg mx-auto">Our AI-powered flow ensures your items get maximum visibility with minimal effort.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 Card */}
              <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 relative group hover:-translate-y-2 transition-transform duration-300">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg rotate-[-10deg] group-hover:rotate-0 transition-transform">1</div>
                <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-6">
                  <Icons.Video />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Take a Video</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-4">
                  Record a 10-15 second video showing your item from all angles. Good lighting helps our AI see details clearly.
                </p>
                <div className="bg-orange-50 rounded-xl p-3 text-xs text-orange-700 font-medium border border-orange-100">
                  💡 Tip: Rotate the item slowly in natural light.
                </div>
              </div>

              {/* Step 2 Card */}
              <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 relative group hover:-translate-y-2 transition-transform duration-300">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-purple-500 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg rotate-[-10deg] group-hover:rotate-0 transition-transform">2</div>
                <div className="w-14 h-14 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mb-6">
                  <Icons.Zap />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">AI Analysis</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-4">
                  RIRI.ai analyzes your video to identify the product, estimate its condition, and suggest a competitive market price.
                </p>
                <div className="bg-purple-50 rounded-xl p-3 text-xs text-purple-700 font-medium border border-purple-100">
                  ⚡ Speed: Details filled in under 5 seconds.
                </div>
              </div>

              {/* Step 3 Card */}
              <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 relative group hover:-translate-y-2 transition-transform duration-300">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg rotate-[-10deg] group-hover:rotate-0 transition-transform">3</div>
                <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
                  <Icons.Check />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Review & Publish</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-4">
                  Verify the auto-filled details, add your contact info, and hit publish. Your listing goes live instantly across campus.
                </p>
                <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 font-medium border border-blue-100">
                  🚀 Reach: Visible to 10,000+ students immediately.
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scale-in {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-in-right {
            animation: slide-in-right 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-scale-in {
            animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
          animation: fade-in-up 0.3s ease-out forwards;
        }
        
        /* Blob Animations */
        @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
            animation: blob 10s infinite;
        }
        .animation-delay-2000 {
            animation-delay: 2s;
        }
        .animation-delay-4000 {
            animation-delay: 4s;
        }
        .animate-pulse-slow {
            animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        /* Utility Animations */
        .animate-spin-reverse {
            animation: spin 1.5s linear infinite reverse;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        @keyframes loading-bar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
        }
        .animate-loading-bar {
            animation: loading-bar 1.5s infinite ease-in-out;
        }
        @keyframes shine {
            100% { left: 125%; }
        }
        .animate-shine {
            animation: shine 1s;
        }
        @keyframes gradient-x {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
            background-size: 200% 200%;
            animation: gradient-x 3s ease infinite;
        }
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        .animate-float {
            animation: float 6s ease-in-out infinite;
        }
        @keyframes dash {
            0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
            50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
            100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
        }
        .animate-dash {
            animation: dash 1.5s ease-in-out infinite;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .animate-blob, .animate-shine, .animate-float, .animate-dash {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
