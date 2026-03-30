
"use client";
// Lister.tsx — Uni-Mart RIRI.ai — Complete with Security & Full Styling

import React, { useState, useEffect, useCallback, useRef } from 'react';

interface Listing {
  title: string; description: string; category: string; brand: string;
  productType: string; condition: string; conditionNotes: string;
  price: number; discount: number | null; tags: string[]; edition: string;
  images: string[]; confidence: number; ocrText: string;
}

interface EnhancedListing extends Listing {
  marketPrice?: number;
  suggestedPrice?: number;
  authenticityScore?: number;
  isFake?: boolean;
  fakeDetectionNotes?: string;
  fakeIndicators?: string[];
  authenticityIndicators?: string[];
  warnings?: Array<{type: string; severity: string; message: string}>;
}

type Stage = 'idle' | 'analyzing' | 'done' | 'error' | 'manual';
type UserType = 'student' | 'vendor' | '';
type PaymentMethod = 'mtn' | 'telecel' | '';
type DeliveryType = 'self' | 'unimart' | '';

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'] as const;
const CATEGORIES = ['Electronics','Fashion','Books','Food','Services','Events','Second Hand','Tech Gadgets','Campus Life','Home & Furniture','Other'];
const TAG_SUGGESTIONS: Record<string,string[]> = {
  'Electronics':['electronics','gadget','device','charger','cable','accessory'],
  'Fashion':['fashion','clothes','shoes','accessories','campus-wear','casual'],
  'Books':['textbook','course-material','study-guide','academic','university'],
  'Food':['food','snacks','meals','beverages','campus-eats'],
  'Services':['tutoring','printing','repairs','photography','design'],
  'Events':['event','party','workshop','seminar','networking'],
  'Second Hand':['used','second-hand','pre-owned','vintage','thrift'],
  'Tech Gadgets':['tech','gadget','smartwatch','headphones','speaker'],
  'Campus Life':['campus','student','dorm','essentials','university'],
  'Home & Furniture':['furniture','bedding','decor','kitchen','storage'],
  'Other':['general','miscellaneous'],
};

// ==================== SECURITY UTILITIES ====================

function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .slice(0, 5000);
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(0[2-9][0-9]{8}|[+][2][3][3][0-9]{9})$/;
  return phoneRegex.test(phone);
}

function isValidPrice(price: number): boolean {
  return !isNaN(price) && price >= 0 && price <= 100000;
}

function generateCSRFToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

const rateLimiter = {
  lastSubmit: 0,
  minInterval: 30000,
  canSubmit(): boolean {
    const now = Date.now();
    if (now - this.lastSubmit < this.minInterval) {
      return false;
    }
    this.lastSubmit = now;
    return true;
  }
};

// ── SVG Icon components ──
const IconCamera = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;
const IconEdit = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconZap = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>;
const IconRefresh = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>;
const IconBack = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IconCheck = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconTag = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
const IconTruck = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
const IconCard = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const IconUser = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconPin = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IconMail = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IconPhone = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3"/></svg>;
const IconSend = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const IconStar = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
const IconClose = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconPlus = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconSparkle = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M19 3l.75 2.25L22 6l-2.25.75L19 9l-.75-2.25L16 6l2.25-.75L19 3z"/><path d="M5 15l.75 2.25L8 18l-2.25.75L5 21l-.75-2.25L2 18l2.25-.75L5 15z"/></svg>;
const IconChevronDown = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
const IconAlert = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;

// ── Bot messages ──
const BOT_MESSAGES = [
  "Akwaaba! 👋 Drop a photo and I'll list it in seconds",
  "I scan, describe & price your item automatically ⚡",
  "Clear photos = more buyers. Try me! 📸",
  "3+ photos sell 40% faster on Uni-Mart 🔥",
  "AI pricing keeps your listings competitive 💰",
  "All listings get admin review before going live 🛡️",
];

// ── Brand logos for marquee ──
const BRAND_LOGOS = [
  { name: 'Nike', svg: <svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M85 20C85 20 75 35 55 55C45 65 35 70 25 70C20 70 15 68 12 65L60 20L85 20Z" fill="currentColor"/></svg> },
  { name: 'Apple', svg: <svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M70 25C75 25 80 20 85 15C82 10 78 8 73 8C68 8 64 12 63 18C60 15 55 12 50 12C40 12 32 20 32 32C32 45 40 55 50 55C55 55 60 52 63 48C64 54 68 58 73 58C78 58 82 56 85 51C80 46 75 41 70 35C68 30 70 25 70 25Z" fill="currentColor"/></svg> },
  { name: 'Samsung', svg: <svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><rect x="15" y="30" width="70" height="40" rx="8" ry="8" fill="currentColor"/><circle cx="35" cy="50" r="8" fill="white"/><circle cx="50" cy="50" r="8" fill="white"/><circle cx="65" cy="50" r="8" fill="white"/></svg> },
  { name: 'Adidas', svg: <svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><polygon points="35,20 25,40 35,40" fill="currentColor"/><polygon points="50,20 40,40 50,40" fill="currentColor"/><polygon points="65,20 55,40 65,40" fill="currentColor"/><rect x="20" y="45" width="60" height="35" rx="4" ry="4" fill="currentColor" opacity="0.3"/></svg> },
  { name: 'Sony', svg: <svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M60 30L80 50L60 70L40 50Z" fill="currentColor"/><rect x="20" y="40" width="15" height="20" fill="currentColor" opacity="0.7"/></svg> },
  { name: 'Canon', svg: <svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="3"/><circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="50" cy="50" r="5" fill="currentColor"/></svg> },
];

export default function Lister() {
  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dpqivj65g';
  const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'unimart_folder';
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const [stage, setStage] = useState<Stage>('idle');
  const [step, setStep] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [listing, setListing] = useState<EnhancedListing | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [productImages, setProductImages] = useState<string[]>([]);
  const [userType, setUserType] = useState<UserType>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('');
  const [whatsappJoined, setWhatsappJoined] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [paymentNumber, setPaymentNumber] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key:string]:number}>({});
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [condition, setCondition] = useState('');
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [edition, setEdition] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [sellerEmail, setSellerEmail] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [location, setLocation] = useState('');
  const [botMsg, setBotMsg] = useState(0);
  const [botPop, setBotPop] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<{r:'b'|'u';t:string}[]>([
    {r:'b', t:"Hi! I'm RIRI 🤖 Ask me anything about listing on Uni-Mart!"}
  ]);
  const [chatIn, setChatIn] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const fileRef2 = useRef<File | null>(null);
  const additionalImagesRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const iv = setInterval(() => {
      setBotPop(true);
      setTimeout(() => { setBotMsg(m => (m+1) % BOT_MESSAGES.length); setBotPop(false); }, 350);
    }, 5500);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({behavior:'smooth'}); }, [chatMsgs]);

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }
    fileRef2.current = file;
    setPreview(URL.createObjectURL(file));
    setListing(null); setStage('idle'); setStep(0); setError('');
  }, []);

  const loadAdditionalImages = useCallback((files: FileList | null) => {
    if (!files) return;
    const imgs: string[] = [];
    for (let i=0; i<files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        if (file.size > 5 * 1024 * 1024) {
          setError(`Image ${i+1} exceeds 5MB limit`);
          continue;
        }
        imgs.push(URL.createObjectURL(file));
      }
    }
    setProductImages(p => [...p, ...imgs].slice(0,5));
  }, []);

  const startManual = () => {
    setStage('manual'); setStep(0); setError('');
    setListing({title:'',description:'',category:'',brand:'',productType:'',condition:'',conditionNotes:'',price:0,discount:null,tags:[],edition:'',images:[],confidence:0,ocrText:''});
    setTimeout(() => formRef.current?.scrollIntoView({behavior:'smooth',block:'start'}), 150);
  };

  const analyze = async () => {
    if (!fileRef2.current) return;
    
    const file = fileRef2.current;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPG, PNG, and WEBP images are allowed');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }
    
    setStage('analyzing'); 
    setStep(1); 
    setError('');
    const t1 = setTimeout(() => setStep(2), 1800);
    const t2 = setTimeout(() => setStep(3), 3400);
    
    try {
      const form = new FormData();
      form.append('image', file);
      const csrfToken = generateCSRFToken();
      
      const res = await fetch('/api/listings/analyze', {
        method: 'POST',
        body: form,
        headers: { 'X-CSRF-Token': csrfToken },
      });
      const data = await res.json();
      clearTimeout(t1); clearTimeout(t2);
      
      if (!res.ok || !data.success) throw new Error(data.error || 'Analysis failed');
      
      if (data.type === 'ai-analysis') {
        const l: EnhancedListing = data.listing;
        const catMap: Record<string,string> = {
          'electronics':'Electronics','fashion':'Fashion','books':'Books',
          'food':'Food','services':'Services','events':'Events',
          'second hand':'Second Hand','tech gadgets':'Tech Gadgets',
          'campus life':'Campus Life','home & furniture':'Home & Furniture',
          'other':'Other'
        };
        
        let cat = catMap[l.category?.toLowerCase()||''] || l.category || 'Other';
        if (!CATEGORIES.includes(cat)) cat = 'Other';
        
        const condMap: Record<string,string> = {
          'new':'New','like new':'Like New','like-new':'Like New',
          'good':'Good','fair':'Fair','poor':'Poor'
        };
        let cond = condMap[l.condition?.toLowerCase()||''] || l.condition || 'Good';
        if (!['New','Like New','Good','Fair','Poor'].includes(cond)) cond = 'Good';
        
        setListing(l);
        setTitle(sanitizeInput(l.title || ''));
        setDescription(sanitizeInput(l.description || ''));
        setCategory(cat);
        setBrand(sanitizeInput(l.brand || ''));
        setCondition(cond);
        
        const finalPrice = l.suggestedPrice || l.price || 0;
        setPrice(String(Math.min(Math.max(finalPrice, 0), 100000)));
        setDiscount(l.discount ? String(Math.min(Math.max(l.discount, 0), 100)) : '');
        setEdition(sanitizeInput(l.edition || ''));
        setTags((l.tags || []).slice(0, 12).map(sanitizeInput));
        setStep(3);
        setStage('done');
        
        if (l.isFake) {
          setError(`⚠️ FAKE PRODUCT DETECTED: ${sanitizeInput(l.fakeDetectionNotes || 'Please verify authenticity')}`);
          setTimeout(() => setError(''), 10000);
        }
        
        if (data.warnings && data.warnings.length > 0) {
          data.warnings.forEach((warning: any) => {
            if (warning.type === 'fake_product') {
              setError(`⚠️ ${sanitizeInput(warning.message)}`);
              setTimeout(() => setError(''), 8000);
            }
          });
        }
        
        if (l.marketPrice && l.suggestedPrice && l.suggestedPrice < l.marketPrice * 0.9) {
          const savings = ((l.marketPrice - l.suggestedPrice) / l.marketPrice * 100).toFixed(0);
          const priceMsg = `💡 Suggested price is ${savings}% below market value!`;
          setTimeout(() => setError(priceMsg), 500);
          setTimeout(() => setError(''), 6000);
        }
        
        if (l.authenticityScore && l.authenticityScore < 0.7) {
          setTimeout(() => {
            setError(`⚠️ Low authenticity score (${Math.round(l.authenticityScore! * 100)}%). Verify carefully.`);
          }, 1000);
          setTimeout(() => setError(''), 8000);
        }
        
        setTimeout(() => formRef.current?.scrollIntoView({behavior:'smooth',block:'start'}), 200);
      } else {
        throw new Error('Unexpected response');
      }
    } catch (e: unknown) {
      clearTimeout(t1); clearTimeout(t2);
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setStage('error'); 
      setStep(0);
    }
  };

  const addTag = (val: string) => {
    const sanitized = val.trim().replace(/^#/, '').replace(/,/g, '').replace(/[<>]/g, '').trim();
    const tagRegex = /^[a-zA-Z0-9\-_]+$/;
    if (sanitized && tagRegex.test(sanitized) && !tags.includes(sanitized) && tags.length < 12) {
      setTags(p => [...p, sanitized]);
    }
    setTagInput('');
  };

  const uploadToCloudinary = async (uri: string, i: number): Promise<string> => {
    if (!uri.startsWith('blob:') && !uri.startsWith('data:')) {
      throw new Error('Invalid image source');
    }
    
    setUploadProgress(p => ({ ...p, [`img-${i}`]: 0 }));
    
    try {
      const blob = await (await fetch(uri)).blob();
      if (blob.size > 5 * 1024 * 1024) throw new Error(`Image ${i + 1} exceeds 5MB limit`);
      if (!blob.type.startsWith('image/')) throw new Error(`File ${i + 1} is not an image`);
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(blob.type)) {
        throw new Error(`Image ${i + 1} type not allowed. Use JPG, PNG, or WEBP`);
      }
      
      const fd = new FormData();
      fd.append('file', blob, `product-${Date.now()}-${i}.jpg`);
      fd.append('upload_preset', UPLOAD_PRESET);
      fd.append('folder', 'unimart-products');
      fd.append('timestamp', Date.now().toString());
      
      const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: fd,
      });
      
      if (!r.ok) {
        const errorData = await r.json();
        throw new Error(errorData.error?.message || `Upload failed: ${r.status}`);
      }
      
      const result = await r.json();
      if (!result.secure_url || !result.secure_url.startsWith('https://')) {
        throw new Error('Invalid upload response');
      }
      
      setUploadProgress(p => ({ ...p, [`img-${i}`]: 100 }));
      setUploadedUrls(p => { const n = [...p]; n[i] = result.secure_url; return n; });
      return result.secure_url;
    } catch (error) {
      console.error(`Upload error for image ${i}:`, error);
      throw error;
    }
  };

  const uploadAll = async (uris: string[]): Promise<string[]> => {
    if (!uris.length) return [];
    setUploadingImages(true); setUploadProgress({}); setUploadedUrls([]);
    const urls: string[] = [];
    try {
      for (let i = 0; i < uris.length; i++) {
        try { urls.push(await uploadToCloudinary(uris[i], i)); } catch (err) { console.error(`Failed to upload image ${i}:`, err); }
      }
      if (!urls.length) throw new Error('No images uploaded');
      return urls;
    } finally { setUploadingImages(false); }
  };

  const handleSubmit = async () => {
  if (!rateLimiter.canSubmit()) {
    setSubmitError('Please wait 30 seconds before submitting another listing.');
    return;
  }

  setIsSubmitting(true);
  setSubmitError('');
  
  try {
    // Validation
    if (!sellerName || sellerName.length < 2 || sellerName.length > 100) {
      throw new Error('Name must be between 2 and 100 characters');
    }
    if (!isValidEmail(sellerEmail)) {
      throw new Error('Please enter a valid email address');
    }
    if (sellerPhone && !isValidPhone(sellerPhone)) {
      throw new Error('Please enter a valid Ghana phone number');
    }
    if (!title || title.length < 3 || title.length > 200) {
      throw new Error('Title must be between 3 and 200 characters');
    }
    if (!description || description.length < 10 || description.length > 5000) {
      throw new Error('Description must be between 10 and 5000 characters');
    }
    if (!category) {
      throw new Error('Please select a category');
    }
    
    const priceNum = parseFloat(price);
    if (!isValidPrice(priceNum)) {
      throw new Error('Please enter a valid price between 0 and 100,000');
    }
    if (discount && (parseInt(discount) < 0 || parseInt(discount) > 100)) {
      throw new Error('Discount must be between 0 and 100');
    }
    
    // Sanitize inputs
    const sanitizedTitle = sanitizeInput(title);
    const sanitizedDescription = sanitizeInput(description);
    const sanitizedBrand = sanitizeInput(brand);
    const sanitizedEdition = sanitizeInput(edition);
    const sanitizedLocation = sanitizeInput(location);
    const sanitizedBusinessName = sanitizeInput(businessName);
    const sanitizedSellerName = sanitizeInput(sellerName);
    
    // Prepare images
    const imgs = [...productImages];
    if (preview && !imgs.includes(preview)) imgs.unshift(preview);
    if (!imgs.length) throw new Error('At least one product image is required');
    if (imgs.length > 5) throw new Error('Maximum 5 images allowed');
    
    // Upload images
    const cloudUrls = await uploadAll(imgs);
    
    // Create payload object
    const payload = {
      businessName: sanitizedBusinessName || undefined,
      sellerName: sanitizedSellerName,
      sellerEmail: sellerEmail.toLowerCase().trim(),
      sellerPhone: sellerPhone || undefined,
      location: sanitizedLocation || undefined,
      userType: userType === 'vendor' ? 'vendor' : 'student',
      title: sanitizedTitle,
      description: sanitizedDescription,
      category: CATEGORIES.includes(category) ? category : 'Other',
      brand: sanitizedBrand || undefined,
      condition: condition,
      conditionNotes: listing?.conditionNotes ? sanitizeInput(listing.conditionNotes) : undefined,
      price: priceNum,
      discount: discount ? parseInt(discount) : undefined,
      edition: sanitizedEdition || undefined,
      deliveryType: deliveryType === 'unimart' ? 'unimart' : 'self',
      paymentMethod: paymentMethod || 'mtn',
      paymentNumber: paymentNumber ? sanitizeInput(paymentNumber).replace(/\D/g, '').slice(0, 9) : undefined,
      tags: tags.slice(0, 12).map(sanitizeInput),
      imageUrls: cloudUrls,
      confidence: listing?.confidence,
      quantity: Math.max(1, Math.min(parseInt(quantity) || 1, 999)),
      status: 'pending',
      authenticityScore: (listing as EnhancedListing)?.authenticityScore,
      isFake: (listing as EnhancedListing)?.isFake,
      fakeDetectionNotes: (listing as EnhancedListing)?.fakeDetectionNotes ? 
        sanitizeInput((listing as EnhancedListing).fakeDetectionNotes!).substring(0, 500) : undefined,
      marketPrice: (listing as EnhancedListing)?.marketPrice,
      suggestedPrice: (listing as EnhancedListing)?.suggestedPrice,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent.substring(0, 200),
    };
    
    console.log('📤 Sending to backend:', API_URL);
    console.log('📦 Payload:', payload);
    
    const csrfToken = generateCSRFToken();
    
    const res = await fetch(`${API_URL}/api/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify(payload),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || `HTTP ${res.status}`);
    }
    
    const result = await res.json();
    console.log('✅ Backend response:', result);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to save listing');
    }
    
    setSubmitted(true);
    setTimeout(() => { 
      reset(); 
      setSubmitted(false);
      if (fileRef2.current) fileRef2.current = null;
      if (additionalImagesRef.current) additionalImagesRef.current.value = '';
    }, 5000);
    
  } catch (err) {
    setSubmitError(err instanceof Error ? err.message : 'Failed to save listing');
    console.error('❌ Submission error:', err);
  } finally { 
    setIsSubmitting(false); 
  }
};

  const reset = () => {
    setPreview(null); fileRef2.current=null; setListing(null);
    setStage('idle'); setStep(0); setError('');
    setTitle(''); setDescription(''); setCategory(''); setBrand('');
    setCondition(''); setPrice(''); setDiscount(''); setEdition(''); setTags([]);
    setBusinessName(''); setSellerName(''); setSellerEmail(''); setSellerPhone('');
    setQuantity('1'); setLocation(''); setSubmitted(false); setSubmitError('');
    setProductImages([]); setUserType(''); setPaymentMethod(''); setDeliveryType('');
    setWhatsappJoined(false); setPaymentNumber(''); setUploadProgress({}); setUploadedUrls([]);
    if (fileRef.current) fileRef.current.value='';
    if (additionalImagesRef.current) additionalImagesRef.current.value='';
  };

  const handleChat = () => {
    if (!chatIn.trim()) return;
    const msg = chatIn.trim(); setChatIn('');
    setChatMsgs(m=>[...m,{r:'u',t:msg}]);
    setTimeout(() => {
      const lc = msg.toLowerCase();
      let reply = "Great question! Try uploading a photo to see RIRI in action 🚀";
      if (lc.includes('price')||lc.includes('cost')) reply = "Set your price by checking similar campus listings. Fair pricing = faster sales 💰";
      else if (lc.includes('photo')||lc.includes('image')) reply = "Good lighting + multiple angles = 3× more buyers! Front, back, sides 📸";
      else if (lc.includes('deliver')) reply = "Choose Self Delivery (you handle it) or Uni-Mart Riders for pro campus delivery 🏍️";
      else if (lc.includes('pay')) reply = "We support MTN MoMo & Telecel Cash — Ghana's top mobile money networks 💳";
      else if (lc.includes('fraud')||lc.includes('fake')||lc.includes('safe')) reply = "RIRI AI verifies listings + admin review before going live. We detect fakes and protect buyers & sellers 🛡️";
      else if (lc.includes('how')||lc.includes('work')) reply = "1. Upload photo 2. RIRI fills everything 3. Review & post! Under 2 minutes ⚡";
      else if (lc.includes('tag')) reply = "Tags help buyers find your item. Add at least 3 relevant tags for better reach 🏷️";
      else if (lc.includes('category')) reply = "Pick the most specific category — it places you in the right section of the marketplace 🗂️";
      setChatMsgs(m=>[...m,{r:'b',t:reply}]);
    }, 700);
  };

  const finalPrice = price && discount ? (parseFloat(price)*(1-parseFloat(discount)/100)).toFixed(2) : null;
  const confPct = listing ? Math.round(listing.confidence*100) : 0;
  const confColor = confPct>80?'#00c566':confPct>60?'#0891B2':'#ef4444';
  const tagSugs = category && TAG_SUGGESTIONS[category] ? TAG_SUGGESTIONS[category] : TAG_SUGGESTIONS['Other'];
  const showForm = (stage==='done'||stage==='manual') && listing;
  const totalImgs = productImages.length + (preview?1:0);
  const doneUploads = Object.values(uploadProgress).filter(v=>v===100).length;
  const upPct = totalImgs > 0 ? Math.round((doneUploads/totalImgs)*100) : 0;

  const marqueeItems = [...BRAND_LOGOS, ...BRAND_LOGOS];
  const enhancedListing = listing as EnhancedListing;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: CSS}}/>
      <div className="root">

        {/* HEADER */}
        <header className="header">
          <div className="header-inner">
            <a href="/" className="logo-wrap">
              <img src="/logo.png" alt="Uni-Mart Logo" className="logo-image" onError={(e) => { e.currentTarget.src = '/fallback-logo.png'; }} />
              <div className="logo-text-block">
                <span className="logo-name">RIRI<span className="logo-dot">.</span>ai</span>
                <span className="logo-sub">by Uni-Mart</span>
              </div>
            </a>
            <div className="tagline-wrap">
              <span className="tagline-text">Sell with Ease</span>
            </div>
          </div>
        </header>

        {/* HERO */}
        <section className="hero">
          <div className="hero-mesh" aria-hidden="true">
            <div className="mesh-blob blob1"/><div className="mesh-blob blob2"/><div className="mesh-blob blob3"/>
          </div>
          
          {/* Decorative E-commerce Icons */}
          <div className="hero-icons" aria-hidden="true">
            {/* Shopping Bag - Top Left */}
            <svg className="hero-icon icon-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L4 6v12a2 2 0 002 2h12a2 2 0 002-2V6l-2-4zm0 0h12M9 11v5M15 11v5"/>
            </svg>
            
            {/* Gift Box - Top Right */}
            <svg className="hero-icon icon-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L3 7v10a2 2 0 002 2h14a2 2 0 002-2V7l-9-5z"/>
              <path d="M12 11v8M4 7h16M8 11h8"/>
              <circle cx="12" cy="11" r="1" fill="currentColor"/>
            </svg>
            
            {/* Package - Middle Left */}
            <svg className="hero-icon icon-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L3 6v11a2 2 0 002 2h14a2 2 0 002-2V6l-9-4zm0 9v6M6 6l6 3 6-3M6 9l6 3 6-3"/>
            </svg>
            
            {/* Cart - Middle Right */}
            <svg className="hero-icon icon-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="9" cy="21" r="1" fill="currentColor"/><circle cx="20" cy="21" r="1" fill="currentColor"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
            </svg>
            
            {/* Star - Top Center Right */}
            <svg className="hero-icon icon-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            
            {/* Tag/Sale - Bottom Left */}
            <svg className="hero-icon icon-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
              <line x1="7" y1="7" x2="7.01" y2="7" strokeLinecap="round"/>
            </svg>
            
            {/* Truck/Delivery - Bottom Right */}
            <svg className="hero-icon icon-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5" fill="currentColor"/><circle cx="18.5" cy="18.5" r="2.5" fill="currentColor"/>
            </svg>
            
            {/* Smile/Happy - Bottom Center */}
            <svg className="hero-icon icon-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/>
            </svg>
          </div>
          
          <div className="hero-inner">
            <h1 className="hero-title">Upload product image.<br/><span className="hero-gradient">List in seconds.</span></h1>
            <p className="hero-desc">RIRI.ai reads your product photo and fills title, price, tags and description automatically. Built for Ghanaian students who hustle.</p>
            <div className="hero-stats">
              {[['500+','Campus Sellers'],['< 2min','To List'],['98%','AI Accuracy']].map(([v,l])=>(
                <div className="stat-card" key={l}><span className="stat-val">{v}</span><span className="stat-lbl">{l}</span></div>
              ))}
            </div>
          </div>
        </section>

        {/* RIRI ROBOT MASCOT */}
        <div className="robot-zone">
          <div className="chute-wrap">
            <svg className="chute-svg" viewBox="0 0 120 65" fill="none">
              <defs><linearGradient id="cg1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#0891B2" stopOpacity=".15"/><stop offset="50%" stopColor="#0891B2" stopOpacity=".3"/><stop offset="100%" stopColor="#0891B2" stopOpacity=".15"/></linearGradient></defs>
              <path d="M6 60Q6 6 60 6Q114 6 114 60" fill="url(#cg1)" stroke="#0891B2" strokeWidth="2"/>
              <path d="M6 60Q6 6 30 10Q36 55 60 60Z" fill="#1867dd" opacity=".08"/>
              <path d="M30 10Q60 6 90 10Q64 52 60 60Z" fill="#173ce0" opacity=".12"/>
              <path d="M90 10Q114 6 114 60Q86 55 60 60Z" fill="#3936e9" opacity=".08"/>
              {[20,37,60,83,100].map((x,i)=>(<line key={i} x1={x} y1={i===0||i===4?55:i===1||i===3?22:10} x2="60" y2="60" stroke="#0891B2" strokeWidth=".8" opacity=".4"/>))}
              <line x1="25" y1="60" x2="48" y2="65" stroke="#0f54d3" strokeWidth="1" opacity=".5"/>
              <line x1="60" y1="60" x2="60" y2="65" stroke="#4227db" strokeWidth="1" opacity=".5"/>
              <line x1="95" y1="60" x2="72" y2="65" stroke="#2154e0" strokeWidth="1" opacity=".5"/>
            </svg>
          </div>
          <div className="robot" onClick={()=>setChatOpen(o=>!o)}>
            <div className="r-head"><div className="r-antenna"><div className="r-antenna-orb"/></div><div className="r-visor"><div className="r-eye-l"/><div className="r-eye-r"/><div className="r-mouth-bar"/></div><div className="r-ear r-ear-l"/><div className="r-ear r-ear-r"/></div>
            <div className="r-body"><div className="r-chest"><div className="r-dot r-dot1"/><div className="r-dot r-dot2"/><div className="r-dot r-dot3"/></div><div className="r-belly"><svg width="28" height="18" viewBox="0 0 28 18" fill="none"><rect x="0" y="0" width="28" height="18" rx="4" fill="rgba(8,145,178,0.12)"/><path d="M4 9 L8 5 L12 9 L16 13 L20 9 L24 13" stroke="#0891B2" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg></div></div>
            <div className="r-arm-l"/><div className="r-arm-r"/><div className="r-legs"><div className="r-leg"/><div className="r-leg"/></div><div className="r-chat-dot"/>
          </div>
          <div className={`r-bubble ${botPop?'r-bubble-out':''}`}>
            <div className="r-bubble-text">{BOT_MESSAGES[botMsg]}</div>
            <div className="r-bubble-tap">Tap to chat →</div>
          </div>
        </div>

        {/* CHAT DRAWER */}
        {chatOpen && (
          <div className="chat-overlay" onClick={()=>setChatOpen(false)}>
            <div className="chat-drawer" onClick={e=>e.stopPropagation()}>
              <div className="chat-top"><div className="chat-avatar"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="8" r="3"/><rect x="6" y="13" width="12" height="8" rx="2"/></svg></div><div><div className="chat-name">RIRI Assistant</div><div className="chat-online">● Online now</div></div><button className="chat-x" onClick={()=>setChatOpen(false)}><IconClose/></button></div>
              <div className="chat-msgs">{chatMsgs.map((m,i)=>(<div key={i} className={`cmsg cmsg-${m.r}`}>{m.t}</div>))}<div ref={chatEndRef}/></div>
              <div className="chat-quick">{['How does it work?','Pricing tips','Fake detection','Payment info'].map(q=>(<button key={q} className="quick-btn" onClick={()=>{setChatIn(q); setTimeout(handleChat,10);}}>{q}</button>))}</div>
              <div className="chat-input-row"><input className="chat-inp" value={chatIn} onChange={e=>setChatIn(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleChat()} placeholder="Ask RIRI anything…"/><button className="chat-send-btn" onClick={handleChat}><IconSend/></button></div>
            </div>
          </div>
        )}

        {/* MAIN */}
        <main className="main">

          {/* UPLOAD ZONE */}
          <div className={`drop-zone${dragging?' dz-drag':''}`}
            onDragOver={e=>{e.preventDefault();setDragging(true);}}
            onDragLeave={()=>setDragging(false)}
            onDrop={e=>{e.preventDefault();setDragging(false);const f=e.dataTransfer.files[0];if(f && f.type.startsWith('image/'))loadFile(f);}}>
            {preview ? (
              <>
                <div className="preview-img-box">
                  <img src={preview} alt="Product" className="preview-img"/>
                  {stage==='analyzing' && <><div className="scan-dim"/><div className="scan-beam"/></>}
                  {stage==='done' && <div className="done-pill"><IconCheck/> Done</div>}
                </div>
                <div className="preview-body">
                  <p className="preview-name">{fileRef2.current?.name?.substring(0, 50) || 'Product'}</p>
                  <p className="preview-sz">{fileRef2.current ? (fileRef2.current.size/1024/1024).toFixed(2)+' MB' : ''}</p>
                  {(stage==='analyzing'||stage==='done') && (
                    <div className="steps">
                      {['Vision scan','OCR reading','AI generation'].map((s,i)=>{
                        const idx=i+1; const isDone=step>idx||stage==='done'; const isActive=step===idx&&stage==='analyzing';
                        return (<div className="step-row" key={i}><div className={`step-pip${isDone?' pip-done':isActive?' pip-active':''}`}>{isDone ? <IconCheck/> : isActive ? <span className="spin-sm"/> : <span>{idx}</span>}</div><span className={`step-txt${isDone?' txt-done':isActive?' txt-active':''}`}>{s}</span></div>);
                      })}
                    </div>
                  )}
                  {stage==='done'&&listing&&(<div className="conf-line"><span className="conf-dot" style={{background:confColor}}/><span className="conf-txt" style={{color:confColor}}>{confPct}% confidence · {listing.productType||'Product'}</span></div>)}
                  {error && <div className="err-box">⚠ {error}</div>}
                  <div className="preview-actions">
                    <button className="btn-primary w-full" onClick={analyze} disabled={stage==='analyzing'}>
                      {stage==='analyzing' ? <><span className="spin-sm spin-w"/>Analyzing…</> : stage==='done' ? <><IconRefresh/>Re-analyze</> : <><IconZap/>Analyze with RIRI.ai</>}
                    </button>
                    <div className="row-btns">
                      <button className="btn-outline" onClick={reset}><IconBack/>Change</button>
                      {stage!=='manual'&&stage!=='analyzing'&&(<button className="btn-ghost" onClick={startManual}><IconEdit/>Manual</button>)}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="dz-idle" onClick={()=>fileRef.current?.click()}>
                <div className="dz-icon-ring"><IconCamera/></div>
                <p className="dz-title">Drop your product photo</p>
                <p className="dz-hint">JPG · PNG · WEBP — up to 5MB</p>
                <div className="dz-btns">
                  <button className="btn-primary"><IconZap/>Choose Photo</button>
                  <button className="btn-outline" onClick={e=>{e.stopPropagation();startManual();}}><IconEdit/>List Manually</button>
                </div>
                <div className="cat-chips">{['Books','Phones','Fashion','Laptops','Food','Furniture'].map(c=><span className="cat-chip" key={c}>{c}</span>)}</div>
              </div>
            )}
          </div>

          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{display:'none'}} onChange={e=>{if(e.target.files?.[0])loadFile(e.target.files[0]);}}/>

          {/* LISTING FORM */}
          {showForm && (
            <div ref={formRef} className="form-card">
              <div className="form-head"><div className="form-head-left"><div className="form-icon-box"><IconZap/></div><div><p className="form-title">Listing Details</p><p className="form-sub">{stage==='done'?'AI-filled':'Manual'} · edit before posting</p></div></div>{stage==='done'&&<span className="ai-chip"><IconSparkle/>RIRI AI</span>}</div>
              {stage==='done'&&<div className="conf-track"><div className="conf-fill" style={{width:`${confPct}%`,background:confColor}}/></div>}
              <div className="form-body">
                {/* WARNINGS DISPLAY */}
                {enhancedListing?.isFake && (<div className="fake-warning" style={{background:'rgba(239,68,68,0.1)',border:'1px solid #ef4444',borderRadius:'12px',padding:'12px',marginBottom:'12px',display:'flex',gap:'10px',alignItems:'flex-start'}}><IconAlert/><div style={{flex:1}}><strong style={{color:'#ef4444'}}>⚠️ POTENTIAL COUNTERFEIT DETECTED</strong><p style={{fontSize:'12px',color:'#ef4444',marginTop:'4px'}}>{enhancedListing.fakeDetectionNotes || 'This product shows signs of being counterfeit. Buyers will see this warning.'}</p>{enhancedListing.fakeIndicators && enhancedListing.fakeIndicators.length > 0 && <div style={{fontSize:'11px',color:'#ef4444',marginTop:'6px',paddingTop:'6px',borderTop:'1px solid rgba(239,68,68,0.3)'}}>Red flags: {enhancedListing.fakeIndicators.slice(0,3).join(', ')}</div>}</div></div>)}
                {enhancedListing?.authenticityScore && enhancedListing.authenticityScore < 0.75 && !enhancedListing.isFake && (<div style={{background:'rgba(249,115,22,0.08)',border:'1px solid rgba(249,115,22,0.3)',borderRadius:'12px',padding:'12px',marginBottom:'12px',display:'flex',gap:'10px',alignItems:'flex-start'}}><div style={{color:'#ea580c',fontSize:'18px',flex:'0 0 auto'}}>⚠️</div><div style={{flex:1}}><strong style={{color:'#ea580c'}}>Low Authenticity Score</strong><p style={{fontSize:'12px',color:'#ea580c',marginTop:'4px'}}>This product scored {Math.round(enhancedListing.authenticityScore * 100)}% on authenticity checks. Buyers should verify carefully.</p>{enhancedListing.fakeIndicators && enhancedListing.fakeIndicators.length > 0 && <div style={{fontSize:'11px',color:'#ea580c',marginTop:'6px',paddingTop:'6px',borderTop:'1px solid rgba(249,115,22,0.2)'}}>Concerns: {enhancedListing.fakeIndicators.slice(0,2).join(', ')}</div>}</div></div>)}

                <fieldset className="fieldset"><legend className="legend"><IconUser/>I am a</legend><div className="type-row"><button className={`type-btn${userType==='student'?' t-active':''}`} onClick={()=>setUserType('student')}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10-5-10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>Student</button><button className={`type-btn${userType==='vendor'?' t-active':''}`} onClick={()=>setUserType('vendor')}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>Vendor</button></div></fieldset>

                {/* PRODUCT DETAILS SECTION - NOW APPEARS FIRST */}
                <div className="sec-div"><span className="sec-div-line"/><span className="sec-div-txt">Product Details {stage==='done'&&<span style={{fontSize:'12px',fontWeight:'500',color:'var(--or)'}}>Auto-filled by RIRI</span>}</span><span className="sec-div-line"/></div>
                <div className="field"><label className="lbl">Title {stage==='done'&&<span className="riri-tag"><IconSparkle/>RIRI</span>}</label><input className={`inp${title?' inp-ok':''}`} value={title} onChange={e=>setTitle(sanitizeInput(e.target.value))} placeholder="e.g. iPhone 13, Chemistry Textbook" maxLength={200}/></div>
                <div className="field"><label className="lbl">Description {stage==='done'&&<span className="riri-tag"><IconSparkle/>RIRI</span>}</label><textarea className={`inp inp-ta${description?' inp-ok':''}`} value={description} onChange={e=>setDescription(sanitizeInput(e.target.value))} rows={4} placeholder="Describe your product in detail…" maxLength={5000}/></div>
                <div className="grid2"><div className="field"><label className="lbl">Category {stage==='done'&&<span className="riri-tag"><IconSparkle/>RIRI</span>}</label><div className="sel-wrap"><select className={`inp inp-sel${category?' inp-ok':''}`} value={category} onChange={e=>setCategory(e.target.value)}><option value="">Select…</option>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select><span className="sel-arr"><IconChevronDown/></span></div></div><div className="field"><label className="lbl">Brand {stage==='done'&&<span className="riri-tag"><IconSparkle/>RIRI</span>}</label><input className={`inp${brand?' inp-ok':''}`} value={brand} onChange={e=>setBrand(sanitizeInput(e.target.value))} placeholder="e.g. Apple, Nike" maxLength={100}/></div></div>
                <div className="field"><label className="lbl">Edition / Version {stage==='done'&&<span className="riri-tag"><IconSparkle/>RIRI</span>}</label><input className={`inp${edition?' inp-ok':''}`} value={edition} onChange={e=>setEdition(sanitizeInput(e.target.value))} placeholder="3rd Ed, 2024 Model, 128GB…" maxLength={100}/></div>
                <div className="field"><label className="lbl">Condition {stage==='done'&&<span className="riri-tag"><IconSparkle/>RIRI</span>}</label><div className="cond-row">{CONDITIONS.map(c=><button key={c} className={`cond-btn${condition===c?' cond-active':''}`} onClick={()=>setCondition(c)}>{c}</button>)}</div>{listing?.conditionNotes && <div className="condition-ai-note" style={{fontSize:'12px',padding:'8px 12px',background:'rgba(8,145,178,0.05)',borderRadius:'var(--r-sm)',marginTop:'8px'}}><span style={{fontWeight:600}}>🤖 AI detected:</span> {listing.conditionNotes}</div>}</div>
                <div className="grid2"><div className="field"><label className="lbl">Price (GH₵) *</label><div className="inp-prefix-wrap"><span className="inp-prefix">GH₵</span><input type="number" inputMode="decimal" className={`inp inp-prefixed${price?' inp-ok':''}`} value={price} onChange={e=>setPrice(e.target.value)} min="0" max="100000" step="0.01" placeholder="0.00"/></div></div><div className="field"><label className="lbl">Discount % <span style={{fontWeight:'normal',opacity:0.7}}>(optional)</span></label><input type="number" inputMode="numeric" className="inp" value={discount} onChange={e=>setDiscount(e.target.value)} min="0" max="100" placeholder="e.g. 10"/></div></div>

                {/* PRICE CAUTION NOTICE */}
                <div className="price-caution">
                  <div className="pc-icon-col">
                    <div className="pc-icon-ring">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <div className="pc-vline"/>
                  </div>
                  <div className="pc-body">
                    <p className="pc-heading">Set Your Price Carefully</p>
                    <p className="pc-text">The price you enter is the <strong>final amount buyers will pay</strong>. Once your listing goes live, price changes require re-submission for admin review. We recommend researching comparable items on campus before publishing.</p>
                    <div className="pc-tips">
                      <div className="pc-tip"><span className="pc-tip-dot"/>Check similar listings for market rate</div>
                      <div className="pc-tip"><span className="pc-tip-dot"/>Factor in condition, age &amp; demand</div>
                      <div className="pc-tip"><span className="pc-tip-dot"/>A fair price sells up to 3× faster</div>
                    </div>
                  </div>
                </div>
                {enhancedListing?.marketPrice && parseFloat(price) < enhancedListing.marketPrice && (<div className="price-comparison" style={{fontSize:'11px',color:'var(--txt3)',marginTop:'-4px',marginBottom:'8px',padding:'8px 12px',background:'rgba(0,197,102,0.05)',borderRadius:'var(--r-sm)',display:'flex',justifyContent:'space-between'}}><span>Market value: GH₵{enhancedListing.marketPrice}</span><span style={{color:'var(--ok)'}}>Save GH₵{(enhancedListing.marketPrice - parseFloat(price)).toFixed(2)}</span></div>)}
                {enhancedListing?.authenticityScore && (<div className="authenticity-score" style={{fontSize:'11px',padding:'8px 12px',background:enhancedListing.authenticityScore > 0.8 ? 'rgba(0,197,102,0.08)' : 'rgba(239,68,68,0.08)',borderRadius:'var(--r-sm)',display:'flex',alignItems:'center',gap:'8px'}}><span>🔍 Authenticity Score: {Math.round(enhancedListing.authenticityScore * 100)}%</span>{enhancedListing.authenticityScore > 0.8 ? <span style={{color:'var(--ok)'}}>✓ Verified</span> : <span style={{color:'var(--err)'}}>⚠️ Low confidence</span>}</div>)}
                {finalPrice && (<div className="final-price-box"><span className="fp-label">Final Price</span><span className="fp-val">GH₵{finalPrice}</span><span className="fp-off">{discount}% off</span></div>)}
                <div className="field" style={{maxWidth:160}}><label className="lbl">Quantity</label><input type="number" inputMode="numeric" className="inp" value={quantity} onChange={e=>setQuantity(e.target.value)} min="1" max="999"/></div>
                <fieldset className="fieldset"><legend className="legend"><IconTruck/>Delivery Method</legend><div className="del-row"><button className={`del-btn${deliveryType==='self'?' del-active':''}`} onClick={()=>setDeliveryType('self')}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="2"/><path d="M8 22l2-7 2 2 2-5 3 5"/><path d="M7 15l-1 4"/></svg><span className="del-name">Self Delivery</span><span className="del-desc">You arrange</span></button><button className={`del-btn${deliveryType==='unimart'?' del-active':''}`} onClick={()=>setDeliveryType('unimart')}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="18.5" cy="17.5" r="2.5"/><path d="M15 6l-3 6 6 3 2-4-5-5z"/><path d="M2 8h13"/></svg><span className="del-name">Uni-Mart Riders</span><span className="del-desc">Pro delivery</span></button></div>{deliveryType==='unimart'&&<p className="del-note">Campus riders — extra fee based on distance</p>}</fieldset>
                <div className="field"><label className="lbl"><IconCard/>Payment Method</label><div className="pay-row"><button className={`pay-btn${paymentMethod==='mtn'?' pay-mtn':''}`} onClick={()=>{setPaymentMethod(p=>p==='mtn'?'':'mtn');setPaymentNumber('');}}><svg width="20" height="20" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="15" fill="#FCD116" stroke="#E8C000" strokeWidth="1"/><text x="16" y="21" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1a1200">MTN</text></svg>MTN MoMo</button><button className={`pay-btn${paymentMethod==='telecel'?' pay-tel':''}`} onClick={()=>{setPaymentMethod(p=>p==='telecel'?'':'telecel');setPaymentNumber('');}}><svg width="20" height="20" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="15" fill="#DA291C" stroke="#B02015" strokeWidth="1"/><text x="16" y="21" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="white">TCEL</text></svg>Telecel Cash</button></div>
                {paymentMethod && (<div className={`pay-detail ${paymentMethod}`}><p className="pay-detail-label">{paymentMethod==='mtn'?'MTN MoMo':'Telecel Cash'} Number</p><div className="pay-inp-wrap"><span className="pay-prefix">+233</span><input type="tel" inputMode="tel" className="pay-inp" value={paymentNumber} onChange={e=>setPaymentNumber(e.target.value.replace(/\D/g,'').slice(0,9))} placeholder={paymentMethod==='mtn'?'024 XXX XXXX':'050 XXX XXXX'}/>{paymentNumber.length>=9&&<span className="pay-ok"><IconCheck/></span>}</div></div>)}</div>
                <div className="field"><label className="lbl"><IconTag/>Tags</label>{category && (<div className="tag-sugs">{tagSugs.map(s=><button key={s} className="tag-sug-btn" onClick={()=>{if(!tags.includes(s)&&tags.length<12)setTags(p=>[...p,s]);}}>#{s}</button>)}</div>)}<div className="tags-box" onClick={()=>document.getElementById('ti')?.focus()}>{tags.map(t=><span key={t} className="tag-pill">#{t}<button className="tag-rm" onClick={e=>{e.stopPropagation();setTags(p=>p.filter(x=>x!==t));}}>×</button></span>)}<input id="ti" className="tags-inp" value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'||e.key===','){e.preventDefault();addTag(tagInput);}if(e.key==='Backspace'&&!tagInput&&tags.length)setTags(p=>p.slice(0,-1));}} placeholder={!tags.length?'Type tag, Enter to add…':''}/></div><p className="tags-count">{tags.length}/12 tags</p></div>
                <div className="field"><label className="lbl"><IconCamera/>Product Photos (up to 5)</label><input ref={additionalImagesRef} type="file" accept="image/jpeg,image/png,image/webp" multiple style={{display:'none'}} onChange={e=>loadAdditionalImages(e.target.files)}/><div className="photos-row">{productImages.map((img,i)=>(<div key={i} className="thumb-wrap"><img src={img} alt="" className="thumb"/><button className="thumb-rm" onClick={()=>setProductImages(p=>p.filter((_,j)=>j!==i))}>×</button></div>))}{productImages.length<5&&(<button className="add-photo" onClick={()=>additionalImagesRef.current?.click()}><IconPlus/></button>)}</div></div>
                {uploadingImages&&(<div className="upload-prog"><div className="up-top"><span className="spin-sm spin-g"/><span>Uploading to cloud… {upPct}%</span></div><div className="prog-track"><div className="prog-fill" style={{width:`${upPct}%`}}/></div></div>)}

                {/* PROMPT TO FILL SELLER INFO AFTER ANALYSIS COMPLETE */}
                {stage==='done' && (<div style={{background:'linear-gradient(135deg,rgba(8,145,178,0.12),rgba(6,214,212,0.08))',border:`2px solid var(--or)`,borderRadius:'14px',padding:'16px',marginBottom:'16px',display:'flex',gap:'12px',alignItems:'flex-start'}}><div style={{fontSize:'24px',flex:'0 0 auto'}}>👋</div><div style={{flex:1}}><strong style={{color:'var(--txt)',fontSize:'15px'}}>Great! Your product details are ready</strong><p style={{fontSize:'13px',color:'var(--txt2)',marginTop:'4px',lineHeight:1.5}}>Now tell us about yourself so buyers know who they're buying from. Complete your seller information below.</p></div><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--or)" strokeWidth="2.5" style={{flex:'0 0 auto',marginTop:'2px'}}><path d="M9 5l7 7-7 7"/></svg></div>)}

                {/* SELLER INFO SECTION - NOW APPEARS AFTER PRODUCT DETAILS */}
                <fieldset className="fieldset"><legend className="legend"><IconUser/>Seller Info</legend><div className="fields-stack"><div className="field"><label className="lbl">Business / Name</label><input className="inp" value={businessName} onChange={e=>setBusinessName(sanitizeInput(e.target.value))} placeholder="Your name or business" maxLength={100}/></div><div className="field"><label className="lbl">Full Name *</label><input className="inp" value={sellerName} onChange={e=>setSellerName(sanitizeInput(e.target.value))} placeholder="e.g. John Mensah" maxLength={100}/></div><div className="field"><label className="lbl"><IconMail/>Email *</label><input className="inp" type="email" inputMode="email" value={sellerEmail} onChange={e=>setSellerEmail(e.target.value.toLowerCase().trim())} placeholder="you@university.edu.gh"/></div><div className="field"><label className="lbl"><IconPhone/>Phone</label><input className="inp" type="tel" inputMode="tel" value={sellerPhone} onChange={e=>setSellerPhone(e.target.value.replace(/[^0-9+]/g, ''))} placeholder="+233 XX XXX XXXX" maxLength={15}/></div><div className="field"><label className="lbl"><IconPin/>Location</label><input className="inp" value={location} onChange={e=>setLocation(sanitizeInput(e.target.value))} placeholder="Hall, Block, Room number" maxLength={200}/></div></div></fieldset>
                <div className="wa-box"><div className="wa-row"><svg width="20" height="20" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.998 2.004C6.478 2.004 2 6.48 2 12c0 1.898.51 3.67 1.4 5.195L2 22.002l4.95-1.376A9.958 9.958 0 0 0 12 21.998c5.522 0 10-4.476 10-9.998 0-5.52-4.478-9.996-10.002-9.996z" fillRule="evenodd"/></svg><span className="wa-title">Join Campus Marketplace on WhatsApp</span></div><p className="wa-desc">Deals, restocks & selling tips straight to your phone</p><button className={`btn-wa${whatsappJoined?' btn-wa-joined':''}`} onClick={()=>{window.open('https://chat.whatsapp.com/your-channel','_blank');setWhatsappJoined(true);}}>{whatsappJoined?<><IconCheck/>Joined!</>: <>Join Channel</>}</button></div>
                {submitError&&<div className="err-box err-big">❌ {submitError}</div>}
                <button className="btn-primary w-full btn-xl" onClick={handleSubmit} disabled={isSubmitting||uploadingImages}>{uploadingImages?<><span className="spin-sm spin-w"/>Uploading… {upPct}%</>:isSubmitting?<><span className="spin-sm spin-w"/>Saving…</>:<><IconZap/>Post Listing</>}</button>
                {stage==='manual'&&<div style={{textAlign:'center',marginTop:8}}><button className="btn-ghost sm" onClick={()=>setStage('idle')}><IconBack/> Back to photo upload</button></div>}
              </div>
            </div>
          )}

          {/* HOW IT WORKS */}
          <section className="how-sec"><div className="sec-badge sec-badge-dark">3 Easy Steps</div><h2 className="sec-title">Post your listing<br/>in under 2 minutes</h2><div className="how-steps">{[{n:'01',icon:<IconCamera/>,t:'Snap or Upload',d:'Take a clear photo of your item on any phone. Any angle works.'},{n:'02',icon:<IconSparkle/>,t:'RIRI Analyzes',d:'AI reads the image, detects fakes, and fills your listing.'},{n:'03',icon:<IconZap/>,t:'Review & Post',d:'Check details, add your info, and go live in seconds.'}].map((s,i)=><div className="how-step" key={s.n}><div className="how-num">{s.n}</div><div className="how-icon-box">{s.icon}</div><p className="how-t">{s.t}</p><p className="how-d">{s.d}</p>{i<2&&<div className="how-arr">→</div>}</div>)}</div></section>

        </main>

        {/* BRAND MARQUEE */}
        <div className="marquee-section"><p className="marquee-label">Trusted brands listed on Uni-Mart</p><div className="marquee-outer"><div className="marquee-fade marquee-fade-left"/><div className="marquee-fade marquee-fade-right"/><div className="marquee-track"><div className="marquee-inner">{marqueeItems.map((brand, i) => (<div key={`${brand.name}-${i}`} className="marquee-item"><div className="brand-logo-svg">{brand.svg}</div><span className="brand-logo-name">{brand.name}</span></div>))}</div></div></div></div>

        {/* FOOTER */}
        <footer className="footer"><div className="footer-grid"><div className="footer-brand-col"><div className="footer-logo"><div className="footer-logo-mark"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" fill="white"/><path d="M2 17l10 5 10-5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M2 12l10 5 10-5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".6"/></svg></div><span className="footer-logo-name">RIRI.ai <span className="footer-logo-riri">· by Uni-Mart</span></span></div><p className="footer-tagline">Ghana's AI-powered campus marketplace with fake detection & smart pricing.</p><div className="footer-status"><span className="f-dot"/><span>RIRI.ai is online</span></div></div><div className="footer-links"><div className="fl-col"><p className="fl-head">Platform</p><a href="https://uni-mart.com" className="fl">Home</a><a href="https://uni-mart.com/marketplace" className="fl">Marketplace</a><a href="https://uni-mart.com/sell" className="fl">Sell</a></div><div className="fl-col"><p className="fl-head">Company</p><a href="https://uni-mart.com/about" className="fl">About</a><a href="https://uni-mart.com/blog" className="fl">Blog</a><a href="https://uni-mart.com/careers" className="fl">Careers</a></div><div className="fl-col"><p className="fl-head">Legal</p><a href="https://uni-mart.com/trust" className="fl">Trust & Safety</a><a href="https://uni-mart.com/privacy" className="fl">Privacy</a><a href="https://uni-mart.com/terms" className="fl">Terms</a></div></div></div><div className="footer-bottom"><span>© 2025 Uni-Mart Ghana</span><span>·</span><span>AI-Powered Listings</span></div></footer>

        {/* SUCCESS MODAL */}
        {submitted && !submitError && (<div className="modal-bg" onClick={()=>setSubmitted(false)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-check"><IconCheck/></div><div className="modal-stars">{[...Array(5)].map((_,i)=><IconStar key={i}/>)}</div><h2 className="modal-h">Listing Live! 🎉</h2><p className="modal-p">Your item is now visible to buyers across the Uni-Mart campus marketplace.</p>{title&&<div className="modal-item">{title}</div>}<button className="btn-primary w-full" onClick={()=>{setSubmitted(false);reset();}}><IconZap/>List Another</button><button className="btn-ghost w-full mt8" onClick={()=>setSubmitted(false)}>View My Listing</button><p className="modal-note">Confirmation sent to {sellerEmail||'your email'}</p></div></div>)}

      </div>
    </>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --or:#0891B2;--or-d:#067A8C;--or-l:rgba(8,145,178,0.08);--or-b:rgba(8,145,178,0.2);
  --bg:#F8F8F6;--card:#FFFFFF;--card2:#F4F3EF;
  --txt:#1A1A18;--txt2:#5A5A52;--txt3:#9A9A8E;
  --bdr:#E8E6E0;--bdr2:#D4D2CC;
  --ok:#00C566;--err:#EF4444;
  --shadow:0 2px 16px rgba(0,0,0,0.07);
  --shadow-lg:0 8px 32px rgba(0,0,0,0.1);
  --r:14px;--r-sm:10px;--r-lg:20px;--r-xl:24px;
  --font:'Plus Jakarta Sans',system-ui,sans-serif;
}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%;}
body{font-family:var(--font);background:var(--bg);color:var(--txt);min-height:100vh;-webkit-font-smoothing:antialiased;overflow-x:hidden;}
.root{min-height:100vh;display:flex;flex-direction:column;}

/* HEADER */
.header{position:sticky;top:0;z-index:300;background:rgba(255,255,255,0.96);backdrop-filter:blur(24px);border-bottom:1px solid var(--bdr);}
.header-inner{max-width:1200px;margin:0 auto;padding:0 20px;height:70px;display:flex;align-items:center;justify-content:space-between;gap:20px;}
.logo-wrap{display:flex;align-items:center;gap:12px;text-decoration:none;flex-shrink:0;transition:transform 0.2s ease;}
.logo-wrap:hover{transform:scale(1.02);}
.logo-image{width:40px;height:40px;border-radius:12px;object-fit:cover;box-shadow:0 4px 12px rgba(8,145,178,0.35);flex-shrink:0;}
.logo-text-block{display:flex;flex-direction:column;line-height:1.2;}
.logo-name{font-size:18px;font-weight:800;color:var(--txt);letter-spacing:-0.03em;}
.logo-dot{color:var(--or);font-size:20px;}
.logo-sub{font-size:10px;font-weight:600;color:var(--txt3);letter-spacing:0.04em;margin-top:1px;}
.tagline-wrap{display:flex;align-items:center;margin-left:auto;flex-shrink:0;}
.tagline-text{font-size:14px;font-weight:700;background:linear-gradient(135deg,#0891B2 0%,#06B6D4 50%,#06D6D0 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:0.02em;position:relative;padding:8px 0;white-space:nowrap;}
.tagline-text::after{content:'';position:absolute;bottom:0;left:0;width:0;height:2px;background:linear-gradient(90deg,#0891B2,#06D6D0);transition:width 0.3s ease;}
.tagline-wrap:hover .tagline-text::after{width:100%;}
@media (max-width:768px){.header-inner{padding:0 16px;height:60px;}.logo-image{width:34px;height:34px;}.logo-name{font-size:16px;}.logo-sub{font-size:9px;}.tagline-text{font-size:12px;}}

/* ── MOBILE: "Sell with Ease" styled border box ── */
@media (max-width:640px){
  .tagline-wrap{
    display:flex;
    align-items:center;
    justify-content:center;
    border:1.5px solid var(--or);
    border-radius:8px;
    padding:5px 11px;
    background:var(--or-l);
    box-shadow:0 2px 8px rgba(8,145,178,0.15);
    position:relative;
    overflow:hidden;
  }
  .tagline-wrap::before{
    content:'';
    position:absolute;
    inset:0;
    background:linear-gradient(135deg,rgba(8,145,178,0.12) 0%,transparent 65%);
    pointer-events:none;
  }
  .tagline-text{
    font-size:11px;
    font-weight:800;
    letter-spacing:0.04em;
    white-space:nowrap;
    position:relative;
    z-index:1;
    padding:0;
  }
  .tagline-text::after{display:none;}
  .tagline-wrap:hover .tagline-text::after{width:0;}
}

/* HERO */
.hero{position:relative;overflow:hidden;background:linear-gradient(160deg,#FFFAF7 0%,#FFF3EC 40%,#F8F8F6 100%);padding:48px 16px 40px;}
.hero-mesh{position:absolute;inset:0;pointer-events:none;overflow:hidden;}
.hero-icons{position:absolute;inset:0;pointer-events:none;overflow:hidden;}
.hero-icon{position:absolute;width:48px;height:48px;color:rgba(8,145,178,0.15);opacity:0.7;transition:all 0.3s ease;animation:floatIcon 6s ease-in-out infinite;}
.hero-icon-1,.icon-1{top:10%;left:5%;width:40px;height:40px;animation-delay:0s;}
.hero-icon-2,.icon-2{top:15%;right:8%;width:45px;height:45px;animation-delay:1s;}
.hero-icon-3,.icon-3{top:50%;left:3%;width:38px;height:38px;animation-delay:2s;}
.hero-icon-4,.icon-4{top:55%;right:5%;width:42px;height:42px;animation-delay:1.5s;}
.hero-icon-5,.icon-5{top:8%;right:25%;width:35px;height:35px;animation-delay:0.5s;}
.hero-icon-6,.icon-6{bottom:15%;left:8%;width:40px;height:40px;animation-delay:2.5s;}
.hero-icon-7,.icon-7{bottom:20%;right:10%;width:44px;height:44px;animation-delay:1.8s;}
.hero-icon-8,.icon-8{bottom:25%;left:45%;width:36px;height:36px;animation-delay:3s;}
.mesh-blob{position:absolute;border-radius:50%;filter:blur(60px);opacity:.25;}
.blob1{width:280px;height:280px;background:#0891B2;top:-80px;right:-60px;}
.blob2{width:200px;height:200px;background:#FCD116;bottom:-60px;left:-40px;}
.blob3{width:160px;height:160px;background:#006B3F;top:40%;right:10%;}
.hero-inner{position:relative;max-width:680px;margin:0 auto;text-align:center;}
.hero-title{font-size:clamp(34px,9vw,60px);font-weight:800;letter-spacing:-0.04em;line-height:1.06;color:var(--txt);margin-bottom:16px;}
.hero-gradient{background:linear-gradient(135deg,#0891B2,#067A8C);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.hero-desc{font-size:16px;color:var(--txt2);line-height:1.7;max-width:480px;margin:0 auto 28px;}
.hero-stats{display:flex;justify-content:center;gap:0;flex-wrap:wrap;}
.stat-card{display:flex;flex-direction:column;align-items:center;padding:10px 18px;border-right:1px solid var(--bdr);}
.stat-card:last-child{border-right:none;}
.stat-val{font-size:20px;font-weight:800;color:var(--or);letter-spacing:-0.02em;}
.stat-lbl{font-size:11px;color:var(--txt3);margin-top:2px;white-space:nowrap;}

/* ROBOT ZONE */
.robot-zone{display:flex;flex-direction:column;align-items:center;padding:0 0 8px;position:relative;background:var(--bg);}
.chute-wrap{width:120px;}
.chute-svg{width:100%;height:auto;animation:sway 4s ease-in-out infinite;transform-origin:60px 6px;}
.robot{margin-top:-10px;cursor:pointer;display:flex;flex-direction:column;align-items:center;position:relative;transition:transform .2s;-webkit-tap-highlight-color:transparent;}
.robot:hover{transform:scale(1.04);}
.robot:active{transform:scale(.97);}
.r-head{width:52px;height:44px;background:white;border:2.5px solid var(--or);border-radius:14px;position:relative;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(8,145,178,0.22);}
.r-antenna{position:absolute;top:-14px;left:50%;transform:translateX(-50%);width:2.5px;height:12px;background:var(--or);}
.r-antenna-orb{width:9px;height:9px;border-radius:50%;background:var(--or);position:absolute;top:-9px;left:50%;transform:translateX(-50%);box-shadow:0 0 8px var(--or);animation:orbPulse 1.5s ease-in-out infinite;}
.r-visor{width:38px;height:22px;border-radius:8px;background:linear-gradient(135deg,#F0FAFB,#E0F7FA);border:1.5px solid rgba(8,145,178,.3);display:flex;align-items:center;justify-content:center;gap:8px;position:relative;}
.r-eye-l,.r-eye-r{width:9px;height:9px;border-radius:50%;background:var(--or);box-shadow:0 0 5px rgba(8,145,178,.7);animation:eyeBlink 4s ease-in-out infinite;}
.r-eye-r{animation-delay:.15s;}
.r-mouth-bar{position:absolute;bottom:4px;left:50%;transform:translateX(-50%);width:16px;height:3px;background:rgba(8,145,178,.5);border-radius:2px;}
.r-ear{position:absolute;top:50%;transform:translateY(-50%);width:7px;height:14px;border-radius:4px;background:white;border:2px solid var(--or);}
.r-ear-l{left:-8px;} .r-ear-r{right:-8px;}
.r-body{width:46px;height:40px;background:white;border:2.5px solid var(--or);border-radius:10px;margin-top:4px;display:flex;flex-direction:column;align-items:center;justify-content:space-around;padding:5px 4px;box-shadow:0 3px 10px rgba(8,145,178,.15);}
.r-chest{display:flex;gap:5px;}
.r-dot{width:6px;height:6px;border-radius:50%;}
.r-dot1{background:var(--or);animation:dotPulse 1.2s ease-in-out infinite;}
.r-dot2{background:#FCD116;animation:dotPulse 1.2s ease-in-out infinite .2s;}
.r-dot3{background:var(--ok);animation:dotPulse 1.2s ease-in-out infinite .4s;}
.r-belly{display:flex;align-items:center;justify-content:center;}
.r-arm-l,.r-arm-r{position:absolute;top:54px;width:9px;height:22px;background:white;border:2px solid var(--or);border-radius:5px;}
.r-arm-l{left:-10px;border-radius:6px 6px 4px 10px;transform:rotate(-18deg);}
.r-arm-r{right:-10px;border-radius:6px 6px 10px 4px;transform:rotate(18deg);}
.r-legs{display:flex;gap:8px;margin-top:4px;}
.r-leg{width:10px;height:16px;background:white;border:2px solid var(--or);border-radius:0 0 6px 6px;}
.r-chat-dot{position:absolute;top:-4px;right:-4px;width:14px;height:14px;border-radius:50%;background:var(--or);border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:7px;color:white;font-weight:800;animation:chatBounce 2s ease-in-out infinite;}
.r-chat-dot::after{content:'!';}
.r-bubble{max-width:260px;background:white;border:1.5px solid var(--bdr);border-radius:18px;border-top-left-radius:5px;padding:11px 15px;margin-top:10px;box-shadow:var(--shadow);transition:opacity .3s,transform .3s;}
.r-bubble-out{opacity:0;transform:translateY(6px);}
.r-bubble-text{font-size:13px;font-weight:500;color:var(--txt2);line-height:1.55;margin-bottom:4px;}
.r-bubble-tap{font-size:11px;font-weight:600;color:var(--or);}

/* CHAT DRAWER */
.chat-overlay{position:fixed;inset:0;z-index:400;background:rgba(0,0,0,.4);backdrop-filter:blur(4px);display:flex;align-items:flex-end;justify-content:center;padding:0 12px 12px;}
.chat-drawer{width:100%;max-width:420px;background:white;border-radius:var(--r-xl);overflow:hidden;box-shadow:var(--shadow-lg);animation:slideUp .3s cubic-bezier(.22,1,.36,1) both;}
.chat-top{background:var(--or);padding:14px 16px;display:flex;align-items:center;gap:12px;}
.chat-avatar{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.chat-name{color:white;font-weight:700;font-size:14px;}
.chat-online{color:rgba(255,255,255,.8);font-size:11px;margin-top:1px;}
.chat-x{margin-left:auto;background:none;border:none;color:rgba(255,255,255,.8);cursor:pointer;padding:4px;border-radius:6px;display:flex;}
.chat-x:hover{color:white;}
.chat-msgs{padding:14px 14px 8px;display:flex;flex-direction:column;gap:10px;max-height:240px;overflow-y:auto;}
.cmsg{max-width:88%;padding:9px 13px;border-radius:14px;font-size:13px;line-height:1.55;font-weight:450;}
.cmsg-b{background:var(--card2);color:var(--txt);border-bottom-left-radius:4px;align-self:flex-start;}
.cmsg-u{background:var(--or);color:white;border-bottom-right-radius:4px;align-self:flex-end;}
.chat-quick{padding:0 14px 8px;display:flex;gap:6px;overflow-x:auto;padding-bottom:10px;}
.chat-quick::-webkit-scrollbar{display:none;}
.quick-btn{white-space:nowrap;padding:6px 12px;border-radius:100px;border:1px solid var(--bdr);background:var(--card2);font-size:12px;font-weight:600;color:var(--txt2);cursor:pointer;flex-shrink:0;font-family:var(--font);}
.quick-btn:hover{border-color:var(--or);color:var(--or);}
.chat-input-row{padding:10px 12px;border-top:1px solid var(--bdr);display:flex;gap:8px;}
.chat-inp{flex:1;padding:10px 14px;border:1.5px solid var(--bdr);border-radius:100px;font-size:14px;font-family:var(--font);outline:none;background:var(--card2);}
.chat-inp:focus{border-color:var(--or);}
.chat-send-btn{width:38px;height:38px;border-radius:50%;background:var(--or);border:none;color:white;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}

/* MAIN & DROP ZONE */
.main{max-width:620px;margin:0 auto;padding:24px 14px 60px;width:100%;}
.drop-zone{border:2px dashed var(--bdr2);border-radius:var(--r-xl);background:var(--card);overflow:hidden;transition:border-color .2s,box-shadow .2s;margin-bottom:20px;box-shadow:var(--shadow);}
.dz-drag{border-color:var(--or)!important;background:var(--or-l)!important;box-shadow:0 0 0 4px var(--or-b)!important;}
.dz-idle{padding:44px 18px;text-align:center;cursor:pointer;}
.dz-icon-ring{width:72px;height:72px;border-radius:20px;background:var(--or-l);border:2px solid var(--or-b);display:flex;align-items:center;justify-content:center;margin:0 auto 18px;color:var(--or);}
.dz-title{font-size:20px;font-weight:800;letter-spacing:-.02em;color:var(--txt);margin-bottom:6px;}
.dz-hint{font-size:13px;color:var(--txt3);margin-bottom:22px;}
.dz-btns{display:flex;flex-direction:column;align-items:center;gap:10px;margin-bottom:20px;}
.cat-chips{display:flex;justify-content:center;gap:6px;flex-wrap:wrap;}
.cat-chip{background:var(--card2);border:1px solid var(--bdr);border-radius:100px;padding:4px 12px;font-size:11px;font-weight:500;color:var(--txt2);}

/* Preview */
.preview-img-box{position:relative;height:210px;overflow:hidden;background:#f0ede6;}
.preview-img{width:100%;height:100%;object-fit:cover;display:block;}
.scan-dim{position:absolute;inset:0;background:rgba(255,255,255,.38);}
.scan-beam{position:absolute;left:0;right:0;height:2.5px;background:linear-gradient(90deg,transparent,var(--or),transparent);animation:scan 1.8s ease-in-out infinite;}
.done-pill{position:absolute;top:12px;right:12px;background:var(--ok);color:white;border-radius:100px;padding:4px 12px;font-size:11px;font-weight:700;display:flex;align-items:center;gap:5px;}
.preview-body{padding:16px;}
.preview-name{font-size:13px;font-weight:600;color:var(--txt);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.preview-sz{font-size:12px;color:var(--txt3);margin:2px 0 14px;}
.steps{display:flex;flex-direction:column;gap:10px;margin-bottom:14px;}
.step-row{display:flex;align-items:center;gap:10px;}
.step-pip{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;border:1.5px solid var(--bdr2);background:var(--card2);color:var(--txt3);}
.pip-active{background:var(--or)!important;border-color:var(--or)!important;color:white!important;}
.pip-done{background:var(--ok)!important;border-color:var(--ok)!important;color:white!important;}
.step-txt{font-size:13px;color:var(--txt3);}
.txt-active{color:var(--or)!important;font-weight:600;}
.txt-done{color:var(--ok)!important;font-weight:600;}
.conf-line{display:flex;align-items:center;gap:7px;margin-bottom:12px;}
.conf-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
.conf-txt{font-size:12px;font-weight:600;}
.err-box{background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.25);border-radius:var(--r-sm);padding:10px 14px;font-size:13px;color:var(--err);margin-bottom:12px;}
.preview-actions{display:flex;flex-direction:column;gap:9px;}
.row-btns{display:flex;gap:9px;}

/* Buttons */
.btn-primary{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 22px;border-radius:var(--r);border:none;background:var(--or);color:white;font-family:var(--font);font-size:15px;font-weight:700;cursor:pointer;transition:all .15s;min-height:48px;text-decoration:none;white-space:nowrap;box-shadow:0 3px 12px rgba(8,145,178,.3);}
.btn-primary:hover,.btn-primary:active{background:var(--or-d);}
.btn-primary:disabled{opacity:.45;cursor:not-allowed;pointer-events:none;}
.btn-outline{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:12px 18px;border-radius:var(--r);border:1.5px solid var(--bdr2);background:transparent;color:var(--txt2);font-family:var(--font);font-size:14px;font-weight:600;cursor:pointer;transition:all .15s;min-height:46px;white-space:nowrap;text-decoration:none;}
.btn-outline:hover{border-color:var(--or);color:var(--or);}
.btn-ghost{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:12px 18px;border-radius:var(--r);border:1.5px solid var(--bdr);background:var(--card2);color:var(--txt2);font-family:var(--font);font-size:14px;font-weight:600;cursor:pointer;transition:all .15s;min-height:46px;white-space:nowrap;}
.btn-ghost:hover{border-color:var(--or);color:var(--or);}
.btn-ghost.sm{font-size:13px;padding:9px 14px;min-height:38px;}
.btn-xl{min-height:54px;font-size:16px;border-radius:var(--r-lg);}
.w-full{width:100%;}
.mt8{margin-top:8px;}
.btn-wa{display:flex;align-items:center;justify-content:center;gap:7px;width:100%;padding:12px;border-radius:var(--r);border:none;background:#25d366;color:white;font-family:var(--font);font-size:14px;font-weight:700;cursor:pointer;min-height:44px;}
.btn-wa-joined{background:var(--ok)!important;}

/* FORM */
.form-card{background:var(--card);border:1.5px solid var(--bdr);border-radius:var(--r-xl);overflow:hidden;box-shadow:var(--shadow);margin-bottom:24px;}
.form-head{padding:16px;border-bottom:1px solid var(--bdr);display:flex;align-items:center;gap:10px;}
.form-head-left{display:flex;align-items:center;gap:10px;flex:1;min-width:0;}
.form-icon-box{width:34px;height:34px;border-radius:10px;background:var(--or-l);border:1px solid var(--or-b);display:flex;align-items:center;justify-content:center;color:var(--or);flex-shrink:0;}
.form-title{font-size:15px;font-weight:700;color:var(--txt);}
.form-sub{font-size:11px;color:var(--txt3);margin-top:1px;}
.ai-chip{display:flex;align-items:center;gap:5px;background:var(--or);color:white;font-size:10px;font-weight:700;padding:4px 10px;border-radius:100px;white-space:nowrap;letter-spacing:.04em;}
.conf-track{height:3px;background:var(--card2);}
.conf-fill{height:100%;transition:width .8s ease;}
.form-body{padding:18px 14px;display:flex;flex-direction:column;gap:18px;}
.fieldset{border:1px solid var(--bdr);border-radius:var(--r);padding:14px;background:var(--card2);}
.legend{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--or);margin-bottom:12px;}
.type-row{display:flex;gap:10px;}
.type-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:13px 10px;border-radius:var(--r);border:2px solid var(--bdr2);background:var(--card);color:var(--txt2);font-family:var(--font);font-size:14px;font-weight:600;cursor:pointer;transition:all .18s;min-height:52px;}
.t-active{border-color:var(--or)!important;background:var(--or-l)!important;color:var(--or)!important;}
.fields-stack{display:flex;flex-direction:column;gap:11px;}
.field{display:flex;flex-direction:column;gap:6px;}
.lbl{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--txt3);}
.riri-tag{display:inline-flex;align-items:center;gap:3px;background:var(--or);color:white;font-size:8px;font-weight:700;padding:2px 6px;border-radius:4px;vertical-align:middle;}
.inp{width:100%;padding:12px 14px;background:var(--card);border:1.5px solid var(--bdr2);border-radius:var(--r-sm);color:var(--txt);font-size:15px;font-family:var(--font);line-height:1.4;outline:none;transition:border-color .18s,box-shadow .18s;-webkit-appearance:none;appearance:none;min-height:48px;}
.inp::placeholder{color:var(--txt3);}
.inp:focus{border-color:var(--or);box-shadow:0 0 0 3px rgba(8,145,178,.1);}
.inp-ok{border-color:rgba(8,145,178,.35);background:rgba(8,145,178,.015);}
.inp-ta{min-height:100px;resize:vertical;}
.inp-sel{padding-right:40px;cursor:pointer;}
.sel-wrap{position:relative;}
.sel-arr{position:absolute;right:14px;top:50%;transform:translateY(-50%);color:var(--txt3);pointer-events:none;}
.inp-prefix-wrap{position:relative;}
.inp-prefix{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:14px;font-weight:700;color:var(--txt2);pointer-events:none;z-index:1;}
.inp-prefixed{padding-left:52px;}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.sec-div{display:flex;align-items:center;gap:10px;}
.sec-div-line{flex:1;height:1px;background:var(--bdr);}
.sec-div-txt{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--txt3);white-space:nowrap;}
.cond-row{display:flex;gap:6px;flex-wrap:wrap;}
.cond-btn{padding:9px 12px;border-radius:100px;border:1.5px solid var(--bdr2);background:var(--card);color:var(--txt2);font-size:12px;font-weight:600;font-family:var(--font);cursor:pointer;transition:all .15s;white-space:nowrap;}
.cond-active{border-color:var(--or)!important;background:var(--or-l)!important;color:var(--or)!important;}
.cond-note{font-size:12px;color:var(--txt3);font-style:italic;line-height:1.5;margin-top:6px;}
.final-price-box{display:flex;align-items:center;gap:10px;padding:12px 16px;background:rgba(0,197,102,.07);border:1.5px solid rgba(0,197,102,.22);border-radius:var(--r-sm);}
.fp-label{font-size:12px;font-weight:600;color:var(--ok);opacity:.85;}
.fp-val{font-size:16px;font-weight:800;color:var(--ok);}
.fp-off{font-size:11px;color:var(--ok);opacity:.7;margin-left:auto;}
.del-row{display:flex;gap:10px;}
.del-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;padding:14px 10px;border:2px solid var(--bdr2);border-radius:var(--r);background:var(--card);color:var(--txt2);font-family:var(--font);cursor:pointer;transition:all .2s;min-height:96px;}
.del-active{border-color:var(--or)!important;background:var(--or-l)!important;color:var(--or)!important;}
.del-name{font-size:13px;font-weight:700;}
.del-desc{font-size:11px;opacity:.7;line-height:1.4;}
.del-note{font-size:12px;color:var(--txt3);margin-top:10px;line-height:1.5;}
.pay-row{display:flex;gap:10px;}
.pay-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 10px;border-radius:var(--r-sm);border:1.5px solid var(--bdr2);background:var(--card);font-family:var(--font);font-size:13px;font-weight:700;cursor:pointer;transition:all .15s;color:var(--txt2);min-height:46px;}
.pay-mtn{background:#FCD116!important;border-color:#E8C000!important;color:#1a1200!important;}
.pay-tel{background:#DA291C!important;border-color:#B02015!important;color:white!important;}
.pay-detail{margin-top:12px;padding:14px;border-radius:var(--r);border:1.5px solid;}
.pay-detail.mtn{background:rgba(252,209,22,.08);border-color:rgba(252,209,22,.4);}
.pay-detail.telecel{background:rgba(218,41,28,.06);border-color:rgba(218,41,28,.28);}
.pay-detail-label{font-size:12px;font-weight:700;color:var(--txt);margin-bottom:10px;}
.pay-inp-wrap{position:relative;}
.pay-prefix{position:absolute;left:13px;top:50%;transform:translateY(-50%);font-size:13px;font-weight:700;color:var(--txt2);pointer-events:none;z-index:1;}
.pay-inp{width:100%;padding:12px 14px 12px 52px;background:white;border:1.5px solid var(--bdr2);border-radius:var(--r-sm);font-size:15px;font-family:var(--font);font-weight:600;color:var(--txt);outline:none;min-height:48px;}
.pay-inp:focus{border-color:var(--or);}
.pay-ok{position:absolute;right:12px;top:50%;transform:translateY(-50%);width:22px;height:22px;border-radius:50%;background:var(--ok);display:flex;align-items:center;justify-content:center;color:white;}
.tag-sugs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;}
.tag-sug-btn{padding:5px 11px;background:var(--card2);border:1px solid var(--bdr);border-radius:100px;font-size:12px;font-weight:600;color:var(--txt2);cursor:pointer;font-family:var(--font);transition:all .15s;}
.tag-sug-btn:hover{background:var(--or-l);border-color:var(--or);color:var(--or);}
.tags-box{display:flex;flex-wrap:wrap;gap:6px;padding:10px 12px;background:rgba(8,145,178,.012);border:1.5px solid var(--or-b);border-radius:var(--r-sm);min-height:52px;cursor:text;}
.tag-pill{display:inline-flex;align-items:center;gap:4px;background:var(--card2);border:1px solid var(--bdr);border-radius:100px;padding:4px 10px;font-size:12px;font-weight:600;color:var(--txt2);}
.tag-rm{background:none;border:none;cursor:pointer;color:var(--txt3);font-size:15px;line-height:1;padding:0;display:flex;align-items:center;}
.tags-inp{border:none;outline:none;background:transparent;font-size:14px;color:var(--txt);min-width:100px;flex:1;font-family:var(--font);padding:2px 0;}
.tags-count{font-size:11px;color:var(--txt3);}
.photos-row{display:flex;gap:10px;flex-wrap:wrap;}
.thumb-wrap{position:relative;flex-shrink:0;}
.thumb{width:76px;height:76px;border-radius:var(--r-sm);border:1.5px solid var(--bdr2);object-fit:cover;display:block;}
.thumb-rm{position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:var(--err);border:2px solid white;color:white;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;line-height:1;}
.add-photo{width:76px;height:76px;border:2px dashed var(--bdr2);border-radius:var(--r-sm);background:var(--card2);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--txt3);flex-shrink:0;transition:all .15s;}
.add-photo:hover{border-color:var(--or);color:var(--or);}
.upload-prog{background:rgba(0,197,102,.07);border:1px solid rgba(0,197,102,.2);border-radius:var(--r-sm);padding:12px 14px;}
.up-top{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--ok);margin-bottom:8px;}
.prog-track{height:4px;background:var(--card2);border-radius:2px;}
.prog-fill{height:100%;background:var(--ok);border-radius:2px;transition:width .3s;}
.wa-box{background:rgba(37,211,102,.05);border:1px solid rgba(37,211,102,.2);border-radius:var(--r);padding:16px;}
.wa-row{display:flex;align-items:center;gap:9px;margin-bottom:7px;}
.wa-title{font-weight:700;font-size:14px;color:#075E54;}
.wa-desc{font-size:13px;color:var(--txt2);margin-bottom:12px;line-height:1.5;}
.spin-sm{display:inline-block;width:14px;height:14px;border-radius:50%;border:2px solid rgba(8,145,178,.3);border-top-color:var(--or);animation:spin .65s linear infinite;flex-shrink:0;}

/* PRICE CAUTION NOTICE */
.price-caution{display:flex;gap:0;background:linear-gradient(135deg,rgba(8,145,178,0.06) 0%,rgba(8,145,178,0.04) 100%);border:1px solid rgba(8,145,178,0.3);border-left:3px solid #0891B2;border-radius:var(--r-sm);overflow:hidden;}
.pc-icon-col{display:flex;flex-direction:column;align-items:center;padding:14px 0 14px 14px;gap:0;flex-shrink:0;}
.pc-icon-ring{width:28px;height:28px;border-radius:50%;background:rgba(245,158,11,0.15);border:1.5px solid rgba(245,158,11,0.35);display:flex;align-items:center;justify-content:center;color:#D97706;flex-shrink:0;}
.pc-vline{flex:1;width:1.5px;background:linear-gradient(to bottom,rgba(245,158,11,0.25),transparent);margin-top:8px;}
.pc-body{padding:14px 14px 14px 12px;flex:1;min-width:0;}
.pc-heading{font-size:12px;font-weight:800;color:#92400E;letter-spacing:0.04em;text-transform:uppercase;margin-bottom:6px;display:flex;align-items:center;gap:6px;}
.pc-heading::before{content:'';display:inline-block;width:5px;height:5px;border-radius:50%;background:#F59E0B;flex-shrink:0;}
.pc-text{font-size:12.5px;color:#78350F;line-height:1.65;margin-bottom:10px;}
.pc-text strong{font-weight:700;color:#92400E;}
.pc-tips{display:flex;flex-direction:column;gap:5px;}
.pc-tip{display:flex;align-items:center;gap:7px;font-size:11.5px;color:#A16207;font-weight:500;line-height:1.4;}
.pc-tip-dot{width:4px;height:4px;border-radius:50%;background:#F59E0B;flex-shrink:0;}
.spin-w{border-color:rgba(255,255,255,.3)!important;border-top-color:white!important;}
.spin-g{border-color:rgba(0,197,102,.3)!important;border-top-color:var(--ok)!important;}
.how-sec{margin-top:28px;background:var(--card);border:1.5px solid var(--bdr);border-radius:var(--r-xl);padding:24px 18px;box-shadow:var(--shadow);}
.sec-badge{display:inline-flex;align-items:center;gap:7px;background:var(--or-l);border:1px solid var(--or-b);border-radius:100px;padding:6px 14px;font-size:12px;font-weight:700;color:var(--or);margin-bottom:14px;}
.sec-badge-dark{background:rgba(26,26,24,.07);border-color:rgba(26,26,24,.12);color:var(--txt2);}
.sec-title{font-size:clamp(22px,6vw,32px);font-weight:800;letter-spacing:-.03em;color:var(--txt);line-height:1.15;margin-bottom:20px;}
.how-steps{display:flex;flex-direction:column;gap:24px;}
@media(min-width:500px){.how-steps{flex-direction:row;align-items:flex-start;}.how-step{flex:1;}}
.how-step{position:relative;text-align:center;}
.how-num{font-size:40px;font-weight:800;color:rgba(8,145,178,.12);letter-spacing:-.04em;line-height:1;margin-bottom:8px;-webkit-text-stroke:1.5px rgba(8,145,178,.2);}
.how-icon-box{width:44px;height:44px;border-radius:14px;background:var(--or);display:flex;align-items:center;justify-content:center;color:white;margin:0 auto 10px;box-shadow:0 3px 10px rgba(8,145,178,.3);}
.how-t{font-size:14px;font-weight:700;color:var(--txt);margin-bottom:5px;}
.how-d{font-size:12px;color:var(--txt2);line-height:1.6;}
.how-arr{font-size:20px;color:var(--or-b);position:absolute;right:-14px;top:40px;display:none;}
@media(min-width:500px){.how-arr{display:block;}}
.marquee-section{padding:36px 0 40px;background:white;border-top:1px solid var(--bdr);border-bottom:1px solid var(--bdr);overflow:hidden;}
.marquee-label{text-align:center;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--txt3);margin-bottom:20px;}
.marquee-outer{position:relative;overflow:hidden;}
.marquee-fade{position:absolute;top:0;bottom:0;width:100px;z-index:2;pointer-events:none;}
.marquee-fade-left{left:0;background:linear-gradient(to right, white 0%, transparent 100%);}
.marquee-fade-right{right:0;background:linear-gradient(to left, white 0%, transparent 100%);}
.marquee-track{overflow:hidden;width:100%;}
.marquee-inner{display:flex;align-items:center;gap:0;width:max-content;animation:marqueeScroll 38s linear infinite;}
.marquee-inner:hover{animation-play-state:paused;}
.marquee-item{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:0 32px;border-right:1px solid var(--bdr);opacity:0.55;transition:opacity .3s, transform .3s;cursor:default;flex-shrink:0;}
.marquee-item:hover{opacity:1;transform:scale(1.08);}
.brand-logo-svg{height:36px;display:flex;align-items:center;justify-content:center;}
.brand-logo-svg svg{height:36px;width:auto;max-width:120px;}
.brand-logo-name{font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--txt3);}
@keyframes marqueeScroll{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
.footer{background:#1A1A18;padding:24px 16px 20px;margin-top:0;}
.footer-grid{display:flex;flex-direction:column;gap:20px;margin-bottom:18px;padding-bottom:18px;border-bottom:1px solid rgba(255,255,255,.1);}
@media(min-width:500px){.footer-grid{flex-direction:row;}}
.footer-brand-col{flex-shrink:0;}
.footer-logo{display:flex;align-items:center;gap:9px;margin-bottom:8px;}
.footer-logo-mark{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#0891B2,#067A8C);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.footer-logo-name{font-size:15px;font-weight:800;color:white;letter-spacing:-.02em;}
.footer-logo-riri{font-size:12px;font-weight:500;color:rgba(255,255,255,.4);}
.footer-tagline{font-size:12px;color:rgba(255,255,255,.45);line-height:1.6;max-width:200px;margin-bottom:10px;}
.footer-status{display:flex;align-items:center;gap:6px;font-size:11px;color:rgba(255,255,255,.4);}
.f-dot{width:6px;height:6px;border-radius:50%;background:#22c55e;box-shadow:0 0 6px #22c55e;flex-shrink:0;}
.footer-links{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;flex:1;}
.fl-col{display:flex;flex-direction:column;gap:7px;}
.fl-head{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.35);margin-bottom:3px;}
.fl{font-size:12px;color:rgba(255,255,255,.55);text-decoration:none;transition:color .15s;}
.fl:hover{color:var(--or);}
.footer-bottom{display:flex;align-items:center;justify-content:center;gap:6px;font-size:11px;color:rgba(255,255,255,.3);}
.modal-bg{position:fixed;inset:0;z-index:999;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);animation:fadeIn .3s ease both;}
.modal{background:white;border-radius:var(--r-xl);padding:32px 22px 24px;max-width:340px;width:100%;text-align:center;box-shadow:0 32px 80px rgba(0,0,0,.22);animation:popIn .4s cubic-bezier(.22,1,.36,1) both;}
.modal-check{width:68px;height:68px;border-radius:50%;background:linear-gradient(135deg,#00C566,#00a855);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;color:white;box-shadow:0 8px 24px rgba(0,197,102,.3);}
.modal-stars{display:flex;justify-content:center;gap:3px;color:#FCD116;margin-bottom:12px;}
.modal-h{font-size:24px;font-weight:800;letter-spacing:-.03em;color:var(--txt);margin-bottom:8px;}
.modal-p{font-size:14px;color:var(--txt2);line-height:1.65;margin-bottom:16px;}
.modal-item{background:var(--or-l);border:1px solid var(--or-b);border-radius:100px;padding:7px 16px;display:inline-block;font-size:13px;font-weight:700;color:var(--or);margin-bottom:18px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.modal-note{font-size:11px;color:var(--txt3);margin-top:12px;line-height:1.5;}
@keyframes sway{0%,100%{transform:rotate(-2.5deg);}50%{transform:rotate(2.5deg);}}
@keyframes floatIcon{0%,100%{transform:translateY(0px);}50%{transform:translateY(-12px);}}
@keyframes orbPulse{0%,100%{transform:translateX(-50%) scale(1);box-shadow:0 0 8px var(--or);}50%{transform:translateX(-50%) scale(1.35);box-shadow:0 0 14px var(--or);}}
@keyframes eyeBlink{0%,94%,100%{transform:scaleY(1);}97%{transform:scaleY(.08);}}
@keyframes dotPulse{0%,100%{opacity:1;}50%{opacity:.35;}}
@keyframes chatBounce{0%,100%{transform:scale(1);}50%{transform:scale(1.2);}}
@keyframes scan{0%{top:-3px;}100%{top:calc(100% + 3px);}}
@keyframes spin{to{transform:rotate(360deg);}}
@keyframes slideUp{from{transform:translateY(100%);opacity:0;}to{transform:translateY(0);opacity:1;}}
@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
@keyframes popIn{from{transform:scale(.88) translateY(18px);opacity:0;}to{transform:scale(1) translateY(0);opacity:1;}}
input,textarea,select{font-size:16px!important;}
@media(max-width:359px){.hero-title{font-size:30px;}.grid2{grid-template-columns:1fr;}}
@media(min-width:600px){.main{padding:28px 20px 80px;}.dz-idle{padding:52px 24px;}.form-body{padding:22px 20px;}}
`;