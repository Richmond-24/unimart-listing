"use client";
// Lister.tsx — Uni-Mart RIRI.ai — Instant Form Access (No Image Upload)

import React, { useState } from 'react';

type UserType = 'student' | 'vendor' | '';
type PaymentMethod = 'mtn' | 'telecel' | '';
type DeliveryType = 'self' | 'unimart' | '';

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'] as const;
const CATEGORIES = [
  'Textbooks & Education', 'Electronics', 'Phones & Tablets',
  'Computers & Laptops', 'Clothing & Apparel', 'Furniture & Home',
  'Sports & Outdoors', 'Gaming', 'Kitchen & Dining', 'Other',
];

const TAG_SUGGESTIONS = {
  'Textbooks & Education': ['textbook', 'course-material', 'study-guide', 'academic', 'university', 'lecture-notes', 'past-questions'],
  'Electronics': ['electronics', 'gadget', 'device', 'charger', 'cable', 'accessory', 'portable'],
  'Phones & Tablets': ['smartphone', 'mobile', 'android', 'iphone', 'tablet', 'charger', 'screen-protector'],
  'Computers & Laptops': ['laptop', 'computer', 'desktop', 'keyboard', 'mouse', 'monitor', 'accessories'],
  'Clothing & Apparel': ['fashion', 'clothes', 'shoes', 'accessories', 'campus-wear', 'traditional', 'casual'],
  'Furniture & Home': ['furniture', 'bedding', 'decor', 'kitchen', 'storage', 'dorm-essentials'],
  'Sports & Outdoors': ['sports', 'fitness', 'gym', 'football', 'basketball', 'training'],
  'Gaming': ['gaming', 'console', 'playstation', 'xbox', 'games', 'controller'],
  'Kitchen & Dining': ['kitchen', 'cooking', 'utensils', 'dining', 'food-storage'],
  'Other': ['general', 'miscellaneous', 'accessory']
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --riri-primary: #f5500a;
    --riri-primary-dark: #d94200;
    --riri-primary-light: rgba(245,80,10,0.1);
    --riri-primary-border: rgba(245,80,10,0.3);
    --riri-primary-glow: 0 0 0 3px rgba(245,80,10,0.15);
    --bg-primary: #f8f9fa;
    --bg-secondary: #ffffff;
    --bg-tertiary: #f1f3f5;
    --text-primary: #212529;
    --text-secondary: #495057;
    --text-muted: #6c757d;
    --border-light: #e9ecef;
    --border-medium: #dee2e6;
    --success: #22c55e;
    --error: #ef4444;
    --mtn: #fcd116;
    --telecel: #da291c;
    --radius: 8px;
    --radius-lg: 14px;
    --radius-xl: 18px;
    --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --shadow-sm: 0 2px 4px rgba(0,0,0,0.05);
    --shadow-md: 0 4px 8px rgba(0,0,0,0.1);
    --shadow-lg: 0 8px 16px rgba(0,0,0,0.1);
  }

  html { scroll-behavior: smooth; }
  body {
    font-family: var(--font-family);
    background: var(--bg-primary);
    color: var(--text-primary);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
    line-height: 1.5;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--bg-tertiary); }
  ::-webkit-scrollbar-thumb { background: var(--riri-primary); border-radius: 2px; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .fade-up { animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
  .d1 { animation-delay: 0.05s; }
  .d2 { animation-delay: 0.1s; }
  .d3 { animation-delay: 0.15s; }
  .d4 { animation-delay: 0.2s; }
  .d5 { animation-delay: 0.25s; }

  .spinner {
    display: inline-block;
    border: 2px solid var(--border-medium);
    border-top-color: var(--riri-primary);
    border-radius: 50%;
    width: 16px; height: 16px;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  .fi {
    width: 100%;
    padding: 11px 14px;
    background: var(--bg-secondary);
    border: 1.5px solid var(--border-medium);
    border-radius: var(--radius);
    color: var(--text-primary);
    font-size: 14px;
    font-family: var(--font-family);
    line-height: 1.5;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  }
  .fi::placeholder { color: var(--text-muted); }
  .fi:focus { border-color: var(--riri-primary); box-shadow: var(--riri-primary-glow); }
  .fi.filled { border-color: rgba(245,80,10,0.45); background: rgba(245,80,10,0.02); }
  .fi.filled:focus { border-color: var(--riri-primary); box-shadow: var(--riri-primary-glow); }
  select.fi {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='%23495057'%3E%3Cpath d='M0 0l5 6 5-6z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    cursor: pointer; padding-right: 36px;
  }
  select.fi option { background: var(--bg-secondary); color: var(--text-primary); }

  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 11px 22px; border-radius: var(--radius); border: none;
    font-family: var(--font-family); font-size: 14px; font-weight: 600;
    cursor: pointer; transition: all 0.18s; white-space: nowrap; letter-spacing: 0.01em;
  }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-primary { background: var(--riri-primary); color: white; box-shadow: var(--shadow-sm); }
  .btn-primary:not(:disabled):hover { background: var(--riri-primary-dark); transform: translateY(-1px); box-shadow: var(--shadow-md); }
  .btn-primary:not(:disabled):active { transform: translateY(0); }
  .btn-outline { background: transparent; color: var(--text-secondary); border: 1.5px solid var(--border-medium); }
  .btn-outline:hover { border-color: var(--riri-primary); color: var(--riri-primary); }
  .btn-secondary { background: var(--bg-tertiary); color: var(--text-primary); border: 1.5px solid var(--border-medium); }
  .btn-secondary:hover { border-color: var(--riri-primary); color: var(--riri-primary); }
  .btn-success { background: var(--success); color: white; }
  .btn-success:not(:disabled):hover { background: #16a34a; }
  .btn-mtn { background: var(--mtn); color: #000; font-weight: 700; }
  .btn-telecel { background: var(--telecel); color: white; }

  .delivery-btn {
    flex: 1; padding: 14px; border: 2px solid var(--border-medium);
    border-radius: var(--radius-lg); background: var(--bg-secondary);
    color: var(--text-secondary); font-weight: 600; cursor: pointer;
    transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 8px;
  }
  .delivery-btn.active { border-color: var(--riri-primary); background: var(--riri-primary-light); color: var(--riri-primary); }
  .delivery-btn svg { width: 24px; height: 24px; }

  .lbl {
    display: flex; align-items: center; gap: 7px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--text-muted); margin-bottom: 8px; font-family: var(--font-family);
  }

  .cond-btn {
    padding: 8px 18px; border-radius: 100px; border: 1.5px solid var(--border-medium);
    background: var(--bg-secondary); color: var(--text-secondary);
    font-size: 13px; font-weight: 500; font-family: var(--font-family); cursor: pointer; transition: all 0.15s;
  }
  .cond-btn.active { border-color: var(--riri-primary); background: var(--riri-primary-light); color: var(--riri-primary); font-weight: 600; }
  .cond-btn:not(.active):hover { border-color: var(--riri-primary); color: var(--riri-primary); }

  .tag-pill {
    display: inline-flex; align-items: center; gap: 5px;
    background: var(--bg-tertiary); border: 1px solid var(--border-medium);
    border-radius: 100px; padding: 4px 12px;
    font-size: 12px; color: var(--text-secondary); font-weight: 500;
  }
  .tag-x {
    background: none; border: none; cursor: pointer;
    color: var(--text-muted); font-size: 14px; line-height: 1;
    padding: 0; display: flex; align-items: center; transition: color 0.15s;
  }
  .tag-x:hover { color: var(--riri-primary); }

  .tag-suggestion {
    padding: 4px 10px; background: var(--bg-tertiary); border: 1px solid var(--border-medium);
    border-radius: 100px; font-size: 11px; color: var(--text-secondary); cursor: pointer; transition: all 0.15s;
  }
  .tag-suggestion:hover { background: var(--riri-primary-light); border-color: var(--riri-primary); color: var(--riri-primary); }

  @media (max-width: 640px) {
    .two-col { grid-template-columns: 1fr !important; }
    .three-col { grid-template-columns: 1fr 1fr !important; }
    .three-col > div:last-child { grid-column: span 2; }
    .action-row { flex-direction: column; }
    .hide-mobile { display: none !important; }
    .delivery-row { flex-direction: column; }
  }
`;

const Icons = {
  Store: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>),
  Package: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>),
  Truck: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><rect x="6" y="8" width="10" height="6"/><circle cx="6" cy="20" r="2"/><circle cx="18" cy="20" r="2"/><path d="M2 12h3"/></svg>),
  Camera: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>),
  User: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>),
  Phone: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12" y2="18" strokeWidth="4"/></svg>),
  Mail: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6L12 13 2 6"/></svg>),
  Map: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>),
  Tag: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>),
  WhatsApp: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>),
  Money: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>),
  Discount: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12.5V8a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h4.5"/><path d="M15 21l6-6"/><path d="M15 15h6"/></svg>),
  Student: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-2z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>),
  Vendor: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3zM3 9h18M9 21V9"/></svg>),
  Bike: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6l-3 6 6 3 2-4-5-5z"/><path d="M9 12l3 3 3-3"/></svg>),
  Walk: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 4v4l-3 2 3 2 3-2-3-2V4z"/><path d="M5 21l3-6 3 3 2-4"/><path d="M19 21l-3-9-3 3"/></svg>)
};

// ── Embedded Unimart logo ──────────────────────────────────────────────────
const UNIMART_LOGO_URI = "data:image/png;base64,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";

export function Lister() {
  const [userType, setUserType] = useState<UserType>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('');
  const [whatsappJoined, setWhatsappJoined] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Pre-filled form fields for instant access
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
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const reset = () => {
    setTitle(''); setDescription(''); setCategory(''); setBrand('');
    setCondition(''); setPrice(''); setDiscount(''); setEdition(''); setTags([]);
    setBusinessName(''); setSellerName(''); setSellerEmail(''); setSellerPhone('');
    setQuantity('1'); setLocation(''); setSubmitted(false);
    setUserType(''); setPaymentMethod(''); setDeliveryType(''); setWhatsappJoined(false);
  };

  const addTag = (val: string) => {
    const clean = val.trim().replace(/^#/, '').replace(/,/g, '').trim();
    if (clean && !tags.includes(clean) && tags.length < 12) setTags(p => [...p, clean]);
    setTagInput('');
  };

  const addTagSuggestion = (s: string) => {
    if (!tags.includes(s) && tags.length < 12) setTags(p => [...p, s]);
  };

  const joinWhatsApp = () => {
    window.open('https://chat.whatsapp.com/your-channel-link', '_blank');
    setWhatsappJoined(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true); setSubmitError(''); setSubmitted(true);
    try {
      const listingData = {
        businessName: businessName || undefined, sellerName, sellerEmail, sellerPhone,
        location, userType: userType || 'student', title, description, category,
        brand: brand || undefined, condition, price: parseFloat(price) || 0,
        discount: discount ? parseInt(discount) : undefined, edition: edition || undefined,
        deliveryType, paymentMethod, tags, status: 'active', quantity: parseInt(quantity) || 1
      };
      
      const required = ['sellerName', 'sellerEmail', 'title', 'description', 'category', 'condition', 'price'];
      const missing = required.filter(field => !listingData[field as keyof typeof listingData]);
      if (missing.length > 0) throw new Error(`Missing required fields: ${missing.join(', ')}`);
      
      const response = await fetch('/api/listings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listingData),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || result.message || 'Failed to save listing');
      
      console.log('✅ Listing saved successfully');
      setTimeout(() => { setSubmitted(false) }, 3000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save listing');
      setSubmitted(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const saving = price && discount ? `${discount}% off` : null;
  const tagSuggestions = category && category in TAG_SUGGESTIONS
    ? TAG_SUGGESTIONS[category as keyof typeof TAG_SUGGESTIONS]
    : TAG_SUGGESTIONS['Other'];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>

        {/* HEADER */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border-light)',
          padding: '0 28px', display: 'flex', alignItems: 'center', height: 60,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', background: 'transparent',
            }}>
              <img
                src={UNIMART_LOGO_URI}
                alt="RIRIAI Logo"
                style={{ width: 40, height: 40, objectFit: 'contain' }}
              />
            </div>
            <span style={{ fontFamily: 'var(--font-family)', fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              RIRI<span style={{ color: 'var(--riri-primary)' }}>AI</span>
              <span style={{ fontSize: 12, marginLeft: 8, color: 'var(--text-muted)', fontWeight: 400 }}>by Uni-Mart Africa</span>
            </span>
          </div>

          <div className="hide-mobile" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-family)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              RIRIAI · by Uni-Mart Africa
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 5px var(--success)' }} />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Live</span>
          </div>
        </header>

        {/* MAIN */}
        <main style={{ maxWidth: 900, margin: '0 auto', padding: '56px 20px 100px' }}>

          {/* Hero */}
          <div className="fade-up" style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--riri-primary-light)', border: '1px solid var(--riri-primary-border)',
              borderRadius: 100, padding: '5px 16px', marginBottom: 24,
            }}>
              <span style={{ fontSize: 14 }}>⚡</span>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--riri-primary)', fontFamily: 'var(--font-family)' }}>
                University Campus Marketplace · Uni-Mart Africa
              </span>
            </div>

            <h1 style={{
              fontFamily: 'var(--font-family)', fontWeight: 700,
              fontSize: 'clamp(36px, 7vw, 64px)',
              letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 18,
              color: 'var(--text-primary)'
            }}>
              List Your Item Instantly
              <br />
              <span style={{ color: 'var(--riri-primary)' }}>with RIRI AI</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 430, margin: '0 auto', lineHeight: 1.65 }}>
              Fill in your product details below and post to the University Marketplace.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginTop: 36, flexWrap: 'wrap' }}>
              {[['⚡', '< 2min', 'Listing'], ['🎯', 'Simple', 'Process'], ['🆓', 'Free', 'For Students']].map(([icon, val, label]) => (
                <div key={label}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
                  <div style={{ fontFamily: 'var(--font-family)', fontWeight: 700, fontSize: 24, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{val}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-family)', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* INSTANT FORM - Always visible */}
          <div className="fade-up" style={{
            background: 'var(--bg-secondary)', border: '1.5px solid var(--border-light)',
            borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{
              padding: '20px 28px', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--riri-primary-light)', border: '1px solid var(--riri-primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.Package />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-family)', fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>Create New Listing</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                    Fill in the details below to post your item
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '32px 28px 40px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* USER TYPE */}
                <div className="fade-up d1" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
                  <div style={{ fontFamily: 'var(--font-family)', fontWeight: 700, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--riri-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icons.User /> I am a:
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button className={`cond-btn ${userType === 'student' ? 'active' : ''}`} onClick={() => setUserType('student')} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icons.Student /> Student
                    </button>
                    <button className={`cond-btn ${userType === 'vendor' ? 'active' : ''}`} onClick={() => setUserType('vendor')} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icons.Vendor /> Vendor
                    </button>
                  </div>
                </div>

                {/* SELLER INFO */}
                <div className="fade-up d1" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '20px 20px 16px' }}>
                  <div style={{ fontFamily: 'var(--font-family)', fontWeight: 700, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--riri-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icons.Store /> Seller Information
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="two-col">
                    <div>
                      <div className="lbl"><Icons.Store /> Business Name</div>
                      <input className="fi" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder={userType === 'student' ? 'Your name / Business name' : 'Business name'} />
                    </div>
                    <div>
                      <div className="lbl"><Icons.User /> Your Name</div>
                      <input className="fi" value={sellerName} onChange={e => setSellerName(e.target.value)} placeholder="e.g. John Mensah" />
                    </div>
                    <div>
                      <div className="lbl"><Icons.Mail /> Email Address</div>
                      <input className="fi" type="email" value={sellerEmail} onChange={e => setSellerEmail(e.target.value)} placeholder="student@university.edu.gh" />
                    </div>
                    <div>
                      <div className="lbl"><Icons.Phone /> Phone Number</div>
                      <input className="fi" type="tel" value={sellerPhone} onChange={e => setSellerPhone(e.target.value)} placeholder="+233 XX XXX XXXX" />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <div className="lbl"><Icons.Map /> Location on Campus</div>
                      <input className="fi" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. University Campus, Hall Name, Block" />
                    </div>
                  </div>
                </div>

                {/* PRODUCT DETAILS DIVIDER */}
                <div style={{ fontFamily: 'var(--font-family)', fontWeight: 700, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', paddingBottom: 4, borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icons.Package /> Product Details
                </div>

                <div className="fade-up d1">
                  <div className="lbl"><span>Title</span></div>
                  <input className={`fi ${title ? 'filled' : ''}`} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. iPhone 13, Textbook, Sneakers" />
                </div>

                <div className="fade-up d2">
                  <div className="lbl"><span>Description</span></div>
                  <textarea className={`fi ${description ? 'filled' : ''}`} value={description} onChange={e => setDescription(e.target.value)} rows={4} style={{ resize: 'vertical', lineHeight: 1.65 }} placeholder="Describe your product in detail..." />
                </div>

                <div className="fade-up d2 two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div className="lbl"><span>Category</span></div>
                    <select className={`fi ${category ? 'filled' : ''}`} value={category} onChange={e => setCategory(e.target.value)}>
                      <option value="">Select category…</option>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="lbl"><span>Brand</span></div>
                    <input className={`fi ${brand ? 'filled' : ''}`} value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. Apple, Nike, Samsung" />
                  </div>
                </div>

                <div className="fade-up d2">
                  <div className="lbl"><span>Edition / Version</span></div>
                  <input className={`fi ${edition ? 'filled' : ''}`} value={edition} onChange={e => setEdition(e.target.value)} placeholder="e.g. 3rd Edition, 2024 Model, 128GB" />
                </div>

                <div className="fade-up d3">
                  <div className="lbl"><span>Condition</span></div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {CONDITIONS.map(c => (
                      <button key={c} className={`cond-btn ${condition === c ? 'active' : ''}`} onClick={() => setCondition(c)}>{c}</button>
                    ))}
                  </div>
                </div>

                <div className="fade-up d3 three-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div>
                    <div className="lbl"><Icons.Money /> Price (GH₵)</div>
                    <input type="number" className={`fi ${price ? 'filled' : ''}`} value={price} onChange={e => setPrice(e.target.value)} min="0" step="0.01" placeholder="0.00" />
                  </div>
                  <div>
                    <div className="lbl"><Icons.Discount /> Discount %</div>
                    <input type="number" className="fi" value={discount} onChange={e => setDiscount(e.target.value)} min="0" max="100" step="1" placeholder="e.g. 10" />
                  </div>
                  <div>
                    <div className="lbl">Final Price</div>
                    <div style={{
                      padding: '11px 14px', borderRadius: 'var(--radius)', height: 44,
                      display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 700,
                      fontFamily: 'var(--font-family)',
                      background: saving ? 'rgba(34,197,94,0.08)' : 'var(--bg-tertiary)',
                      border: `1.5px solid ${saving ? 'rgba(34,197,94,0.3)' : 'var(--border-medium)'}`,
                      color: saving ? 'var(--success)' : 'var(--text-muted)',
                    }}>
                      {saving ? `GH₵${(parseFloat(price) * (1 - parseFloat(discount)/100)).toFixed(2)}` : '—'}
                    </div>
                  </div>
                </div>

                <div className="fade-up d3" style={{ width: '50%' }}>
                  <div className="lbl">Quantity Available</div>
                  <input type="number" className="fi" value={quantity} onChange={e => setQuantity(e.target.value)} min="1" step="1" placeholder="1" />
                </div>

                {/* DELIVERY */}
                <div className="fade-up d3" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
                  <div style={{ fontFamily: 'var(--font-family)', fontWeight: 700, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--riri-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icons.Truck /> Delivery Method
                  </div>
                  <div className="delivery-row" style={{ display: 'flex', gap: 16 }}>
                    <button className={`delivery-btn ${deliveryType === 'self' ? 'active' : ''}`} onClick={() => setDeliveryType('self')}>
                      <Icons.Walk />
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>Self Delivery</div>
                        <div style={{ fontSize: 12, opacity: 0.8 }}>You arrange pickup/delivery</div>
                      </div>
                    </button>
                    <button className={`delivery-btn ${deliveryType === 'unimart' ? 'active' : ''}`} onClick={() => setDeliveryType('unimart')}>
                      <Icons.Bike />
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>Uni-Mart Riders</div>
                        <div style={{ fontSize: 12, opacity: 0.8 }}>Professional delivery service</div>
                      </div>
                    </button>
                  </div>
                  {deliveryType === 'unimart' && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
                      Additional fee applies based on distance. Riders available on campus.
                    </p>
                  )}
                </div>

                {/* PAYMENT */}
                <div className="fade-up d4">
                  <div className="lbl"><Icons.Money /> Payment Method</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <button className={`btn ${paymentMethod === 'mtn' ? 'btn-mtn' : 'btn-outline'}`} onClick={() => setPaymentMethod('mtn')} style={{ flex: 1, minWidth: 140 }}>MTN MoMo</button>
                    <button className={`btn ${paymentMethod === 'telecel' ? 'btn-telecel' : 'btn-outline'}`} onClick={() => setPaymentMethod('telecel')} style={{ flex: 1, minWidth: 140 }}>Telecel Cash</button>
                  </div>
                </div>

                {/* TAGS */}
                <div className="fade-up d4">
                  <div className="lbl"><Icons.Tag /> Tags</div>
                  {category && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Suggested tags:</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {tagSuggestions.map(sg => (
                          <span key={sg} className="tag-suggestion" onClick={() => addTagSuggestion(sg)}>#{sg}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div
                    onClick={() => document.getElementById('tag-input')?.focus()}
                    style={{
                      display: 'flex', flexWrap: 'wrap', gap: 7, padding: '10px 12px',
                      background: 'rgba(245,80,10,0.02)', border: '1.5px solid var(--riri-primary-border)',
                      borderRadius: 'var(--radius)', minHeight: 50, cursor: 'text',
                    }}
                  >
                    {tags.map(tag => (
                      <span key={tag} className="tag-pill">
                        #{tag}
                        <button className="tag-x" onClick={e => { e.stopPropagation(); setTags(t => t.filter(x => x !== tag)); }}>×</button>
                      </span>
                    ))}
                    <input
                      id="tag-input" value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); }
                        if (e.key === 'Backspace' && !tagInput && tags.length) setTags(t => t.slice(0, -1));
                      }}
                      placeholder={tags.length === 0 ? 'Type tag and press Enter...' : ''}
                      style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: 'var(--text-primary)', minWidth: 200, flex: 1, fontFamily: 'var(--font-family)', padding: '2px 0' }}
                    />
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{tags.length}/12 tags · Click suggestions above to add</p>
                </div>

                {/* WHATSAPP */}
                <div className="fade-up d5" style={{ background: 'linear-gradient(135deg, #25D36610 0%, #128C7E10 100%)', border: '1px solid #25D36630', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <Icons.WhatsApp />
                    <span style={{ fontWeight: 700, color: '#075E54' }}>Join University Marketplace WhatsApp Channel</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Get updates on new listings, campus deals, and selling tips!</p>
                  <button className={`btn ${whatsappJoined ? 'btn-success' : 'btn-outline'}`} onClick={joinWhatsApp} style={{ width: '100%' }}>
                    {whatsappJoined ? '✓ Joined!' : 'Join Channel'}
                  </button>
                </div>

                <div style={{ height: 1, background: 'var(--border-light)' }} />

                {submitted && !submitError && (
                  <div style={{ padding: '14px 20px', borderRadius: 'var(--radius)', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>✅</span>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--success)', fontSize: 14, fontFamily: 'var(--font-family)' }}>Listing submitted!</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Your listing has been saved and will appear on University Marketplace.</div>
                    </div>
                  </div>
                )}

                {submitError && (
                  <div style={{ padding: '14px 20px', borderRadius: 'var(--radius)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>❌</span>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--error)', fontSize: 14, fontFamily: 'var(--font-family)' }}>Submission failed</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{submitError}</div>
                    </div>
                  </div>
                )}

                <div className="fade-up d5 action-row" style={{ display: 'flex', gap: 12 }}>
                  <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}
                    style={{ flex: 1, padding: '14px', fontSize: 14, fontWeight: 700, opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                    {isSubmitting ? <><span className="spinner" style={{ width: 13, height: 13, borderWidth: 2, borderTopColor: 'white' }} /> Saving...</> : submitted ? '✓ Submitted!' : '⚡ Post Listing'}
                  </button>
                  <button className="btn btn-outline" onClick={reset} style={{ fontSize: 13 }}>Clear All</button>
                </div>

              </div>
            </div>
          </div>
        </main>

        {/* FOOTER */}
        <footer style={{
          borderTop: '1px solid var(--border-light)', padding: '20px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12, background: 'var(--bg-secondary)',
        }}>
          <span style={{ fontFamily: 'var(--font-family)', fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
            RIRI<span style={{ color: 'var(--riri-primary)' }}>AI</span> · by Uni-Mart Africa
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>© 2025 · Uni-Mart Africa</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ready to list</span>
          </div>
        </footer>
      </div>
    </>
  );
}