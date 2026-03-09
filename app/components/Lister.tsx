'use client'

import { useState, useCallback, useRef } from 'react'

interface Listing {
  title: string
  description: string
  category: string
  brand: string
  productType: string
  condition: string
  conditionNotes: string
  price: number
  discount: number | null
  tags: string[]
  edition: string
  images: string[]
  confidence: number
  ocrText: string
}

type Stage = 'idle' | 'analyzing' | 'done' | 'error' | 'manual'
type UserType = 'student' | 'vendor' | ''
type PaymentMethod = 'mtn' | 'telecel' | ''
type DeliveryType = 'self' | 'unimart' | ''

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'] as const
const CATEGORIES = [
  'Textbooks & Education', 'Electronics', 'Phones & Tablets',
  'Computers & Laptops', 'Clothing & Apparel', 'Furniture & Home',
  'Sports & Outdoors', 'Gaming', 'Kitchen & Dining', 'Other',
]
const TAG_SUGGESTIONS: Record<string, string[]> = {
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
}

const UNIMART_LOGO_URI = "data:image/png;base64,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"

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --primary: #f5500a;
    --primary-dark: #d94200;
    --primary-light: rgba(245,80,10,0.08);
    --primary-border: rgba(245,80,10,0.25);
    --primary-glow: 0 0 0 3px rgba(245,80,10,0.12);
    --bg: #f7f8fa;
    --surface: #ffffff;
    --surface2: #f1f3f5;
    --text: #1a1d21;
    --text2: #4a5568;
    --muted: #8a9ab0;
    --border: #e2e8f0;
    --border2: #cbd5e0;
    --success: #16a34a;
    --success-bg: rgba(22,163,74,0.08);
    --error: #dc2626;
    --mtn: #fcd116;
    --telecel: #da291c;
    --radius-sm: 8px;
    --radius: 12px;
    --radius-lg: 16px;
    --radius-xl: 20px;
    --font: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    --mono: 'DM Mono', monospace;
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    --shadow: 0 4px 12px rgba(0,0,0,0.08);
    --shadow-lg: 0 8px 24px rgba(0,0,0,0.10);
  }

  html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
  body {
    font-family: var(--font);
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
    line-height: 1.5;
    overflow-x: hidden;
  }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--primary); border-radius: 2px; }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

  .banner-track {
    display: flex;
    width: max-content;
    animation: marquee 28s linear infinite;
  }
  .banner-track:hover { animation-play-state: paused; }

  .banner-sep {
    display: inline-flex; align-items: center; justify-content: center;
    width: 4px; height: 4px; border-radius: 50%;
    background: rgba(255,255,255,0.5);
    margin: 0 20px; flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulseRing { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(2); opacity: 0; } }
  @keyframes scanline { 0% { top: -2px; } 100% { top: calc(100% + 2px); } }
  @keyframes confBar { from { width: 0; } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes popIn { from { opacity: 0; transform: scale(0.88) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  @keyframes scaleIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @keyframes starPop { from { transform: scale(0) rotate(-30deg); opacity: 0; } to { transform: scale(1) rotate(0deg); opacity: 1; } }
  @keyframes confettiFall { from { opacity: 0; transform: translateY(-20px) rotate(0deg); } to { opacity: 0.7; transform: translateY(0) rotate(var(--r, 15deg)); } }
  @keyframes drawCheck { from { stroke-dashoffset: 40; } to { stroke-dashoffset: 0; } }

  .fade-up { animation: fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }
  .d1 { animation-delay: 0.05s; }
  .d2 { animation-delay: 0.1s; }
  .d3 { animation-delay: 0.15s; }
  .d4 { animation-delay: 0.2s; }

  /* ── SPINNER ── */
  .spin {
    display: inline-block;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    width: 14px; height: 14px;
    animation: spin 0.65s linear infinite;
    flex-shrink: 0;
  }
  .spin-muted {
    border-color: var(--border2);
    border-top-color: var(--primary);
  }

  /* ── FORM INPUTS ── */
  .inp {
    width: 100%;
    padding: 12px 14px;
    background: var(--surface);
    border: 1.5px solid var(--border2);
    border-radius: var(--radius-sm);
    color: var(--text);
    font-size: 15px;
    font-family: var(--font);
    line-height: 1.4;
    outline: none;
    transition: border-color 0.18s, box-shadow 0.18s;
    -webkit-appearance: none;
    appearance: none;
    min-height: 46px;
  }
  .inp::placeholder { color: var(--muted); }
  .inp:focus { border-color: var(--primary); box-shadow: var(--primary-glow); }
  .inp.has-val { border-color: rgba(245,80,10,0.4); background: rgba(245,80,10,0.015); }
  textarea.inp { min-height: 100px; resize: vertical; }
  select.inp {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='%238a9ab0'%3E%3Cpath d='M0 0l5 6 5-6z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    padding-right: 40px;
    cursor: pointer;
  }

  /* ── LABELS ── */
  .lbl {
    display: flex; align-items: center; gap: 6px;
    font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--muted);
    margin-bottom: 7px;
  }
  .badge { font-size: 8px; font-weight: 800; letter-spacing: 0.08em; padding: 2px 6px; border-radius: 4px; }
  .badge-ai { background: var(--primary); color: white; }
  .badge-ocr { background: var(--success); color: white; }

  /* ── BUTTONS ── */
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 13px 20px; border-radius: var(--radius-sm); border: none;
    font-family: var(--font); font-size: 15px; font-weight: 600;
    cursor: pointer; transition: all 0.15s; white-space: nowrap;
    line-height: 1; min-height: 46px; touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }
  .btn:disabled { opacity: 0.45; cursor: not-allowed; pointer-events: none; }
  .btn-primary { background: var(--primary); color: white; box-shadow: 0 2px 8px rgba(245,80,10,0.3); }
  .btn-primary:active { background: var(--primary-dark); transform: scale(0.98); }
  .btn-outline { background: transparent; color: var(--text2); border: 1.5px solid var(--border2); }
  .btn-outline:active { border-color: var(--primary); color: var(--primary); }
  .btn-ghost { background: var(--surface2); color: var(--text2); border: 1.5px solid var(--border); }
  .btn-ghost:active { border-color: var(--primary); color: var(--primary); }
  .btn-success { background: var(--success); color: white; }
  .btn-mtn { background: var(--mtn); color: #1a1200; font-weight: 700; }
  .btn-telecel { background: var(--telecel); color: white; }
  .btn-full { width: 100%; }
  .btn-lg { padding: 15px 24px; font-size: 16px; min-height: 52px; border-radius: var(--radius); }

  /* ── DROP ZONE ── */
  .drop-zone {
    border: 2px dashed var(--border2);
    border-radius: var(--radius-xl);
    background: var(--surface);
    transition: border-color 0.2s, background 0.2s;
    overflow: hidden;
    position: relative;
  }
  .drop-zone.drag-over { border-color: var(--primary); background: rgba(245,80,10,0.015); }

  .scan-overlay { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
  .scan-line {
    position: absolute; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent 0%, var(--primary) 50%, transparent 100%);
    animation: scanline 1.8s ease-in-out infinite;
  }

  /* ── STEP DOTS ── */
  .step-dot {
    width: 22px; height: 22px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700; flex-shrink: 0;
    transition: all 0.3s; position: relative;
  }
  .step-dot.idle { background: var(--surface2); border: 1.5px solid var(--border2); color: var(--muted); }
  .step-dot.active { background: var(--primary); border: 1.5px solid var(--primary); color: white; }
  .step-dot.done { background: var(--success); border: 1.5px solid var(--success); color: white; }
  .step-dot.active::after {
    content: ''; position: absolute; inset: -4px; border-radius: 50%;
    border: 2px solid var(--primary); opacity: 0.5;
    animation: pulseRing 1.2s ease-out infinite;
  }

  /* ── CONDITIONS ── */
  .cond-btn {
    flex: 1; min-width: 0;
    padding: 10px 8px; border-radius: 100px;
    border: 1.5px solid var(--border2);
    background: var(--surface);
    color: var(--text2);
    font-size: 13px; font-weight: 500; font-family: var(--font);
    cursor: pointer; transition: all 0.15s; text-align: center;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    min-height: 40px; touch-action: manipulation;
  }
  .cond-btn.active { border-color: var(--primary); background: var(--primary-light); color: var(--primary); font-weight: 600; }
  .cond-btn:active { border-color: var(--primary); color: var(--primary); }

  /* ── TAGS ── */
  .tag-pill {
    display: inline-flex; align-items: center; gap: 4px;
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 100px; padding: 4px 10px;
    font-size: 12px; color: var(--text2); font-weight: 500;
  }
  .tag-x {
    background: none; border: none; cursor: pointer;
    color: var(--muted); font-size: 15px; line-height: 1;
    padding: 0; display: flex; align-items: center;
    touch-action: manipulation; min-width: 16px; min-height: 16px;
  }
  .tag-x:active { color: var(--primary); }
  .tag-sug {
    padding: 5px 11px; background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 100px; font-size: 12px; color: var(--text2);
    cursor: pointer; transition: all 0.15s; touch-action: manipulation;
    min-height: 32px; display: inline-flex; align-items: center;
  }
  .tag-sug:active { background: var(--primary-light); border-color: var(--primary); color: var(--primary); }

  /* ── DELIVERY ── */
  .del-btn {
    flex: 1; padding: 14px 10px;
    border: 2px solid var(--border2);
    border-radius: var(--radius);
    background: var(--surface); color: var(--text2);
    font-family: var(--font); font-weight: 600; font-size: 14px;
    cursor: pointer; transition: all 0.2s;
    display: flex; flex-direction: column; align-items: center;
    gap: 6px; touch-action: manipulation; min-height: 90px;
  }
  .del-btn.active { border-color: var(--primary); background: var(--primary-light); color: var(--primary); }
  .del-btn:active { border-color: var(--primary); }

  /* ── SECTION HEADER ── */
  .sec-head {
    font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--primary);
    margin-bottom: 14px; display: flex; align-items: center; gap: 7px;
  }

  /* ── CARD ── */
  .card {
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }
  .card-inner {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px;
  }

  /* ── CONF BAR ── */
  .conf-bar { height: 3px; animation: confBar 1.2s cubic-bezier(0.22,1,0.36,1) both; animation-delay: 0.3s; }

  /* ── DIVIDER ── */
  .divider {
    height: 1px; background: var(--border);
    margin: 4px 0;
  }

  /* ── THUMB IMG ── */
  .thumb {
    width: 72px; height: 72px; border-radius: var(--radius-sm);
    border: 1.5px solid var(--border2); object-fit: cover;
    flex-shrink: 0;
  }
  .add-photo-btn {
    width: 72px; height: 72px; border: 2px dashed var(--border2);
    border-radius: var(--radius-sm); background: var(--surface2);
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 4px; cursor: pointer;
    color: var(--muted); font-size: 11px; touch-action: manipulation;
    flex-shrink: 0;
  }
  .add-photo-btn:active { border-color: var(--primary); color: var(--primary); }

  /* ── ALERT BOXES ── */
  .alert {
    padding: 12px 16px; border-radius: var(--radius-sm);
    display: flex; align-items: flex-start; gap: 10px; font-size: 13px; line-height: 1.5;
  }
  .alert-success { background: var(--success-bg); border: 1px solid rgba(22,163,74,0.25); color: #15803d; }
  .alert-error { background: rgba(220,38,38,0.07); border: 1px solid rgba(220,38,38,0.25); color: var(--error); }

  /* ── PRICE DISPLAY ── */
  .price-display {
    padding: 12px 14px; border-radius: var(--radius-sm);
    display: flex; align-items: center; font-size: 15px; font-weight: 700;
    min-height: 46px;
  }

  /* ── USER TYPE BTNS ── */
  .type-btn {
    flex: 1; padding: 12px 10px; border-radius: var(--radius);
    border: 2px solid var(--border2); background: var(--surface);
    color: var(--text2); font-family: var(--font); font-weight: 600;
    font-size: 14px; cursor: pointer; transition: all 0.18s;
    display: flex; align-items: center; justify-content: center;
    gap: 8px; touch-action: manipulation; min-height: 50px;
  }
  .type-btn.active { border-color: var(--primary); background: var(--primary-light); color: var(--primary); }
  .type-btn:active { border-color: var(--primary); }

  @media (hover: hover) {
    .btn-primary:hover { background: var(--primary-dark); }
    .btn-outline:hover { border-color: var(--primary); color: var(--primary); }
    .btn-ghost:hover { border-color: var(--primary); color: var(--primary); }
    .cond-btn:hover { border-color: var(--primary); color: var(--primary); }
    .del-btn:hover { border-color: var(--primary); }
    .type-btn:hover { border-color: var(--primary); }
    .tag-sug:hover { background: var(--primary-light); border-color: var(--primary); color: var(--primary); }
    .add-photo-btn:hover { border-color: var(--primary); color: var(--primary); }
    .tag-x:hover { color: var(--primary); }
    .thumb:hover { border-color: var(--primary); }
  }

  details summary { list-style: none; cursor: pointer; }
  details summary::-webkit-details-marker { display: none; }
`

const SvgStore = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>
const SvgPkg = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
const SvgTruck = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><rect x="6" y="8" width="10" height="6"/><circle cx="6" cy="20" r="2"/><circle cx="18" cy="20" r="2"/><path d="M2 12h3"/></svg>
const SvgCam = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
const SvgUser = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const SvgPhone = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18" strokeWidth="4"/></svg>
const SvgMail = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6L12 13 2 6"/></svg>
const SvgMap = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
const SvgTag = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
const SvgWA = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
const SvgMoney = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
const SvgWalk = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="2"/><path d="M8 22l2-7 2 2 2-5 3 5"/><path d="M7 15l-1 4"/></svg>
const SvgBike = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6l-3 6 6 3 2-4-5-5z"/><path d="M9 12l3 3 3-3"/></svg>

export function Lister() {
  const [stage, setStage] = useState<Stage>('idle')
  const [step, setStep] = useState(0)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [listing, setListing] = useState<Listing | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [productImages, setProductImages] = useState<string[]>([])
  const [userType, setUserType] = useState<UserType>('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('')
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('')
  const [whatsappJoined, setWhatsappJoined] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [paymentNumber, setPaymentNumber] = useState('')

  const fileRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const fileRef2 = useRef<File | null>(null)
  const additionalImagesRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [brand, setBrand] = useState('')
  const [condition, setCondition] = useState('')
  const [price, setPrice] = useState('')
  const [discount, setDiscount] = useState('')
  const [edition, setEdition] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [sellerName, setSellerName] = useState('')
  const [sellerEmail, setSellerEmail] = useState('')
  const [sellerPhone, setSellerPhone] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [location, setLocation] = useState('')

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    fileRef2.current = file
    setPreview(URL.createObjectURL(file))
    setListing(null); setStage('idle'); setStep(0); setError('')
  }, [])

  const loadAdditionalImages = useCallback((files: FileList | null) => {
    if (!files) return
    const newImgs: string[] = []
    Array.from(files).forEach(f => { if (f.type.startsWith('image/')) newImgs.push(URL.createObjectURL(f)) })
    setProductImages(prev => [...prev, ...newImgs].slice(0, 5))
  }, [])

  const removeImage = (i: number) => setProductImages(prev => prev.filter((_, idx) => idx !== i))

  const startManual = () => {
    setStage('manual'); setStep(0); setError('')
    setListing({ title: '', description: '', category: '', brand: '', productType: '', condition: '', conditionNotes: '', price: 0, discount: null, tags: [], edition: '', images: [], confidence: 0, ocrText: '' })
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
  }

  const analyze = async () => {
    if (!fileRef2.current) return
    setStage('analyzing'); setStep(1); setError('')
    const t1 = setTimeout(() => setStep(2), 1800)
    const t2 = setTimeout(() => setStep(3), 3400)
    try {
      const form = new FormData()
      form.append('image', fileRef2.current)
      const res = await fetch('/api/listings', { method: 'POST', body: form })
      const data = await res.json()
      clearTimeout(t1); clearTimeout(t2)
      if (!res.ok || !data.success) throw new Error(data.error || 'Analysis failed')
      if (data.type === 'ai-analysis') {
        const l: Listing = data.listing
        setListing(l); setTitle(l.title || ''); setDescription(l.description || '')
        setCategory(l.category || ''); setBrand(l.brand || ''); setCondition(l.condition || '')
        setPrice(String(l.price || '')); setDiscount(l.discount ? String(l.discount) : '')
        setEdition(l.edition || ''); setTags(l.tags || [])
        setStep(3); setStage('done')
        setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200)
      } else throw new Error('Unexpected response')
    } catch (e: unknown) {
      clearTimeout(t1); clearTimeout(t2)
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setStage('error'); setStep(0)
    }
  }

  const addTag = (val: string) => {
    const clean = val.trim().replace(/^#/, '').replace(/,/g, '').trim()
    if (clean && !tags.includes(clean) && tags.length < 12) setTags(p => [...p, clean])
    setTagInput('')
  }

  const handleSubmit = async () => {
    setIsSubmitting(true); setSubmitError('')
    try {
      const payload = {
        businessName: businessName || undefined, sellerName, sellerEmail, sellerPhone,
        location, userType: userType || 'student', title, description, category,
        brand: brand || undefined, condition,
        conditionNotes: listing?.conditionNotes || undefined,
        price: parseFloat(price) || 0, discount: discount ? parseInt(discount) : undefined,
        edition: edition || undefined, deliveryType, paymentMethod, tags,
        imageUrls: productImages, confidence: listing?.confidence, status: 'active'
      }
      const required = ['sellerName', 'sellerEmail', 'title', 'description', 'category', 'condition', 'price']
      const missing = required.filter(f => !payload[f as keyof typeof payload])
      if (missing.length) throw new Error(`Missing: ${missing.join(', ')}`)
      const res = await fetch('/api/listings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.error || 'Failed to save listing')
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 4000)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save listing')
    } finally {
      setIsSubmitting(false)
    }
  }

  const reset = () => {
    setPreview(null); fileRef2.current = null; setListing(null)
    setStage('idle'); setStep(0); setError('')
    setTitle(''); setDescription(''); setCategory(''); setBrand('')
    setCondition(''); setPrice(''); setDiscount(''); setEdition(''); setTags([])
    setBusinessName(''); setSellerName(''); setSellerEmail(''); setSellerPhone('')
    setQuantity('1'); setLocation(''); setSubmitted(false); setSubmitError('')
    setProductImages([]); setUserType(''); setPaymentMethod(''); setDeliveryType(''); setWhatsappJoined(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const finalPrice = price && discount
    ? (parseFloat(price) * (1 - parseFloat(discount) / 100)).toFixed(2)
    : null

  const confPct = listing ? Math.round(listing.confidence * 100) : 0
  const confColor = confPct > 80 ? 'var(--success)' : confPct > 60 ? 'var(--primary)' : 'var(--error)'

  const steps = [
    'RIRI Vision — scanning image',
    'RIRI OCR — reading text & labels',
    'RIRI AI — generating listing',
  ]

  const tagSugs = category && category in TAG_SUGGESTIONS
    ? TAG_SUGGESTIONS[category]
    : TAG_SUGGESTIONS['Other']

  const showForm = (stage === 'done' || stage === 'manual') && listing

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

        {/* ── HEADER ── */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
          padding: '0 16px', display: 'flex', alignItems: 'center',
          height: 56, gap: 10,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <img src={UNIMART_LOGO_URI} alt="RIRI.ai" style={{ width: 34, height: 34, objectFit: 'contain' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flex: 1, minWidth: 0 }}>
            <span style={{ fontFamily: 'var(--font)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', color: 'var(--text)', lineHeight: 1 }}>
              RIRI<span style={{ color: 'var(--primary)' }}>.ai</span>
            </span>
            <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              by Uni-Mart
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 5px var(--success)' }} />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Live</span>
          </div>
        </header>

        {/* ── SHOP SMART BANNER ── */}
        <div style={{
          background: 'linear-gradient(90deg, var(--primary-dark) 0%, var(--primary) 50%, #ff7a3c 100%)',
          overflow: 'hidden',
          padding: '0',
          height: 36,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div className="banner-track">
            {[1, 2].map(n => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                {[
                  ['🛍️', 'Shop Smart, Spend Less'],
                  ['📦', 'List & Sell on Campus'],
                  ['⚡', 'Fast Campus Delivery'],
                  ['🎓', 'Built for University Students'],
                  ['💰', 'Best Campus Prices'],
                  ['🤝', 'Buy & Sell with Ease'],
                  ['📱', 'Phones · Books · Fashion · More'],
                  ['✨', 'Shop Smart, Spend Less'],
                ].map(([icon, text], i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap', fontSize: 12, fontWeight: 600, color: 'white', letterSpacing: '0.04em', padding: '0 6px' }}>
                    <span style={{ fontSize: 13 }}>{icon}</span>
                    {text}
                    <span className="banner-sep" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── MAIN ── */}
        <main style={{ maxWidth: 600, margin: '0 auto', padding: '32px 16px 80px' }}>

          {/* Hero */}
          <div className="fade-up" style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{
              fontFamily: 'var(--font)', fontWeight: 800,
              fontSize: 'clamp(30px, 9vw, 52px)',
              letterSpacing: '-0.03em', lineHeight: 1.08, marginBottom: 14,
              color: 'var(--text)'
            }}>
              Snap. List. Sell.<br />
              <span style={{ color: 'var(--primary)' }}>with RIRI.ai</span>
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: 15, maxWidth: 340, margin: '0 auto', lineHeight: 1.6 }}>
              Take a photo — RIRI fills your listing title, price, tags and more in seconds.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 28, flexWrap: 'wrap' }}>
              {/* Stat: Speed */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 12, background: 'var(--primary-light)', border: '1.5px solid var(--primary-border)', margin: '0 auto 8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                </div>
                <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', color: 'var(--text)', lineHeight: 1 }}>&lt;5s</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 3 }}>Analysis</div>
              </div>
              {/* Stat: Accuracy */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 12, background: 'var(--primary-light)', border: '1.5px solid var(--primary-border)', margin: '0 auto 8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="4"/>
                    <line x1="12" y1="2" x2="12" y2="4"/>
                    <line x1="12" y1="20" x2="12" y2="22"/>
                    <line x1="2" y1="12" x2="4" y2="12"/>
                    <line x1="20" y1="12" x2="22" y2="12"/>
                  </svg>
                </div>
                <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', color: 'var(--text)', lineHeight: 1 }}>95%</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 3 }}>Accuracy</div>
              </div>
              {/* Stat: Free */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 12, background: 'var(--primary-light)', border: '1.5px solid var(--primary-border)', margin: '0 auto 8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>
                </div>
                <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', color: 'var(--text)', lineHeight: 1 }}>Free</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 3 }}>Students</div>
              </div>
            </div>
          </div>

          {/* ── UPLOAD ZONE ── */}
          <div
            className={`drop-zone fade-up d1 ${dragging ? 'drag-over' : ''}`}
            style={{ marginBottom: 20 }}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) loadFile(f) }}
          >
            {preview ? (
              <div>
                {/* Image + status row */}
                <div style={{ position: 'relative', maxHeight: 220, overflow: 'hidden', background: 'var(--surface2)' }}>
                  <img src={preview} alt="Product" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
                  {stage === 'analyzing' && (
                    <>
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.45)' }} />
                      <div className="scan-overlay"><div className="scan-line" /></div>
                    </>
                  )}
                  {stage === 'done' && (
                    <div style={{
                      position: 'absolute', top: 10, right: 10,
                      background: 'var(--success)', borderRadius: 100,
                      padding: '3px 10px', fontSize: 10, fontWeight: 800, color: 'white', letterSpacing: '0.06em',
                    }}>✓ DONE</div>
                  )}
                </div>

                {/* Info area */}
                <div style={{ padding: '16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {fileRef2.current?.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
                    {fileRef2.current ? (fileRef2.current.size / 1024 / 1024).toFixed(2) + ' MB' : ''}
                  </div>

                  {(stage === 'analyzing' || stage === 'done') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                      {steps.map((s, i) => {
                        const idx = i + 1
                        const isActive = step === idx && stage === 'analyzing'
                        const isDone = step > idx || stage === 'done'
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className={`step-dot ${isDone ? 'done' : isActive ? 'active' : 'idle'}`}>
                              {isDone ? '✓' : isActive ? <span className="spin spin-muted" style={{ width: 10, height: 10, borderWidth: 1.5, borderTopColor: 'white' }} /> : i + 1}
                            </div>
                            <span style={{ fontSize: 13, color: isDone ? 'var(--success)' : isActive ? 'var(--primary)' : 'var(--muted)', fontWeight: isActive || isDone ? 500 : 400, transition: 'color 0.3s' }}>
                              {s}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {stage === 'done' && listing && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: confColor, boxShadow: `0 0 6px ${confColor}` }} />
                      <span style={{ fontSize: 12, color: confColor, fontWeight: 600 }}>
                        {confPct}% confidence · {listing.productType || 'Product'} detected
                      </span>
                    </div>
                  )}

                  {error && (
                    <div className="alert alert-error" style={{ marginBottom: 14 }}>
                      <span>⚠</span> <span>{error}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button className="btn btn-primary btn-full btn-lg" onClick={analyze} disabled={stage === 'analyzing'}>
                      {stage === 'analyzing'
                        ? <><span className="spin" /> Analyzing…</>
                        : stage === 'done'
                          ? <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg> Re-analyze with RIRI</>
                          : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> Analyze with RIRI.ai</>}
                    </button>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="btn btn-outline" onClick={reset} style={{ flex: 1 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                        Change
                      </button>
                      {stage !== 'manual' && stage !== 'analyzing' && (
                        <button className="btn btn-ghost" onClick={startManual} style={{ flex: 1 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          Manual
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div onClick={() => fileRef.current?.click()} style={{ padding: '48px 20px', textAlign: 'center', cursor: 'pointer' }}>
                {/* Camera SVG icon box */}
                <div style={{
                  width: 72, height: 72, background: 'var(--primary-light)',
                  border: '2px solid var(--primary-border)', borderRadius: 18,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                }}>
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
                <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8, letterSpacing: '-0.01em', color: 'var(--text)' }}>
                  Drop your product photo
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
                  JPG · PNG · WEBP · HEIC up to 15MB
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <button className="btn btn-primary btn-lg" style={{ padding: '13px 36px', width: '100%', maxWidth: 280, gap: 9 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                    Choose Photo
                  </button>
                  <button
                    className="btn btn-ghost btn-lg"
                    onClick={e => { e.stopPropagation(); startManual() }}
                    style={{ width: '100%', maxWidth: 280, gap: 9 }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    List Manually
                  </button>
                </div>
                {/* Category chips with inline SVG icons */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Books', icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
                    { label: 'Laptops', icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M0 21h24"/></svg> },
                    { label: 'Fashion', icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/></svg> },
                    { label: 'Phones', icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3"/></svg> },
                    { label: 'Furniture', icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="11" rx="2"/><path d="M2 12h20M6 7V5a1 1 0 011-1h10a1 1 0 011 1v2M6 18v2M18 18v2"/></svg> },
                    { label: 'Gaming', icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13" strokeWidth="3"/><line x1="18" y1="11" x2="18.01" y2="11" strokeWidth="3"/><rect x="2" y="8" width="20" height="12" rx="3"/></svg> },
                  ].map(({ label, icon }) => (
                    <span key={label} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 100, padding: '4px 10px', fontSize: 11, color: 'var(--text2)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      {icon}{label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { if (e.target.files?.[0]) loadFile(e.target.files[0]) }} />

          {/* ── LISTING FORM ── */}
          {showForm && (
            <div ref={formRef} className="card fade-up">

              {/* Form header */}
              <div style={{ padding: '16px 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--primary-light)', border: '1px solid var(--primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <SvgPkg />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em', color: 'var(--text)' }}>Listing Details</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                      {stage === 'done' ? 'AI-filled · ' : 'Manual · '}edit fields before posting
                    </div>
                  </div>
                  {stage === 'done' && (
                    <span className="badge badge-ai">RIRI AI</span>
                  )}
                </div>
              </div>

              {stage === 'done' && (
                <div style={{ height: 3, background: 'var(--surface2)' }}>
                  <div className="conf-bar" style={{ width: `${confPct}%`, background: confColor, height: '100%' }} />
                </div>
              )}

              <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* ── I AM A ── */}
                <div className="card-inner">
                  <div className="sec-head"><SvgUser /> I am a:</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className={`type-btn ${userType === 'student' ? 'active' : ''}`} onClick={() => setUserType('student')}>
                      🎓 Student
                    </button>
                    <button className={`type-btn ${userType === 'vendor' ? 'active' : ''}`} onClick={() => setUserType('vendor')}>
                      🏪 Vendor
                    </button>
                  </div>
                </div>

                {/* ── SELLER INFO ── */}
                <div className="card-inner">
                  <div className="sec-head"><SvgStore /> Seller Information</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <div className="lbl"><SvgStore /> Business / Your Name</div>
                      <input className="inp" value={businessName} onChange={e => setBusinessName(e.target.value)}
                        placeholder={userType === 'vendor' ? 'Business name' : 'Your name or business name'} />
                    </div>
                    <div>
                      <div className="lbl"><SvgUser /> Full Name</div>
                      <input className="inp" value={sellerName} onChange={e => setSellerName(e.target.value)} placeholder="e.g. John Mensah" />
                    </div>
                    <div>
                      <div className="lbl"><SvgMail /> Email Address</div>
                      <input className="inp" type="email" inputMode="email" value={sellerEmail} onChange={e => setSellerEmail(e.target.value)} placeholder="you@university.edu.gh" />
                    </div>
                    <div>
                      <div className="lbl"><SvgPhone /> Phone Number</div>
                      <input className="inp" type="tel" inputMode="tel" value={sellerPhone} onChange={e => setSellerPhone(e.target.value)} placeholder="+233 XX XXX XXXX" />
                    </div>
                    <div>
                      <div className="lbl"><SvgMap /> Campus Location</div>
                      <input className="inp" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Hall name, Block, Room number" />
                    </div>
                  </div>
                </div>

                {/* ── DIVIDER ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="divider" style={{ flex: 1 }} />
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <SvgPkg /> Product Details
                  </span>
                  <div className="divider" style={{ flex: 1 }} />
                </div>

                {/* Title */}
                <div>
                  <div className="lbl">Title {stage === 'done' && <span className="badge badge-ai">RIRI</span>}</div>
                  <input className={`inp ${title ? 'has-val' : ''}`} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. iPhone 13, Chemistry Textbook" />
                </div>

                {/* Description */}
                <div>
                  <div className="lbl">Description {stage === 'done' && <span className="badge badge-ai">RIRI</span>}</div>
                  <textarea className={`inp ${description ? 'has-val' : ''}`} value={description} onChange={e => setDescription(e.target.value)}
                    rows={4} placeholder="Describe your product in detail…" />
                </div>

                {/* Category + Brand */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div className="lbl">Category {stage === 'done' && <span className="badge badge-ai">RIRI</span>}</div>
                    <select className={`inp ${category ? 'has-val' : ''}`} value={category} onChange={e => setCategory(e.target.value)}>
                      <option value="">Select…</option>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="lbl">Brand {stage === 'done' && <span className="badge badge-ai">RIRI</span>}</div>
                    <input className={`inp ${brand ? 'has-val' : ''}`} value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. Apple, Nike" />
                  </div>
                </div>

                {/* Edition */}
                <div>
                  <div className="lbl">Edition / Version {stage === 'done' && <span className="badge badge-ai">RIRI</span>}</div>
                  <input className={`inp ${edition ? 'has-val' : ''}`} value={edition} onChange={e => setEdition(e.target.value)} placeholder="e.g. 3rd Edition, 2024 Model, 128GB" />
                </div>

                {/* Condition */}
                <div>
                  <div className="lbl">Condition {stage === 'done' && <span className="badge badge-ai">RIRI</span>}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {CONDITIONS.map(c => (
                      <button key={c} className={`cond-btn ${condition === c ? 'active' : ''}`} onClick={() => setCondition(c)}>
                        {c}
                      </button>
                    ))}
                  </div>
                  {listing?.conditionNotes && (
                    <p style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
                      🔍 {listing.conditionNotes}
                    </p>
                  )}
                </div>

                {/* Pricing */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div className="lbl"><SvgMoney /> Price (GH₵)</div>
                    <input type="number" inputMode="decimal" className={`inp ${price ? 'has-val' : ''}`} value={price}
                      onChange={e => setPrice(e.target.value)} min="0" step="0.01" placeholder="0.00" />
                  </div>
                  <div>
                    <div className="lbl">Discount %</div>
                    <input type="number" inputMode="numeric" className="inp" value={discount}
                      onChange={e => setDiscount(e.target.value)} min="0" max="100" placeholder="e.g. 10" />
                  </div>
                </div>

                {finalPrice && (
                  <div className="price-display" style={{ background: 'var(--success-bg)', border: '1.5px solid rgba(22,163,74,0.25)', color: 'var(--success)' }}>
                    <span style={{ fontSize: 12, fontWeight: 500, marginRight: 8, opacity: 0.8 }}>Final Price:</span>
                    GH₵{finalPrice}
                    <span style={{ marginLeft: 8, fontSize: 11, opacity: 0.75 }}>({discount}% off)</span>
                  </div>
                )}

                {/* Quantity */}
                <div style={{ maxWidth: 160 }}>
                  <div className="lbl">Quantity</div>
                  <input type="number" inputMode="numeric" className="inp" value={quantity}
                    onChange={e => setQuantity(e.target.value)} min="1" step="1" placeholder="1" />
                </div>

                {/* ── DELIVERY ── */}
                <div className="card-inner">
                  <div className="sec-head"><SvgTruck /> Delivery Method</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className={`del-btn ${deliveryType === 'self' ? 'active' : ''}`} onClick={() => setDeliveryType('self')}>
                      <SvgWalk />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Self Delivery</div>
                        <div style={{ fontSize: 11, opacity: 0.75, lineHeight: 1.4 }}>You arrange it</div>
                      </div>
                    </button>
                    <button className={`del-btn ${deliveryType === 'unimart' ? 'active' : ''}`} onClick={() => setDeliveryType('unimart')}>
                      <SvgBike />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Uni-Mart Riders</div>
                        <div style={{ fontSize: 11, opacity: 0.75, lineHeight: 1.4 }}>Pro delivery</div>
                      </div>
                    </button>
                  </div>
                  {deliveryType === 'unimart' && (
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10, lineHeight: 1.5 }}>
                      Additional fee applies based on distance. Campus riders available.
                    </p>
                  )}
                </div>

                {/* ── PAYMENT ── */}
                <div>
                  <div className="lbl"><SvgMoney /> Payment Method</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className={`btn ${paymentMethod === 'mtn' ? 'btn-mtn' : 'btn-outline'}`}
                      onClick={() => { setPaymentMethod(paymentMethod === 'mtn' ? '' : 'mtn'); setPaymentNumber('') }}
                      style={{ flex: 1, minWidth: 0 }}>
                      MTN MoMo
                    </button>
                    <button className={`btn ${paymentMethod === 'telecel' ? 'btn-telecel' : 'btn-outline'}`}
                      onClick={() => { setPaymentMethod(paymentMethod === 'telecel' ? '' : 'telecel'); setPaymentNumber('') }}
                      style={{ flex: 1, minWidth: 0 }}>
                      Telecel Cash
                    </button>
                  </div>

                  {/* Animated dropdown number field */}
                  {paymentMethod && (
                    <div style={{
                      marginTop: 12,
                      padding: '14px',
                      background: paymentMethod === 'mtn'
                        ? 'rgba(252,209,22,0.10)'
                        : 'rgba(218,41,28,0.07)',
                      border: `1.5px solid ${paymentMethod === 'mtn' ? 'rgba(252,209,22,0.5)' : 'rgba(218,41,28,0.3)'}`,
                      borderRadius: 'var(--radius)',
                      animation: 'fadeUp 0.25s cubic-bezier(0.22,1,0.36,1) both',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: paymentMethod === 'mtn' ? 'rgba(252,209,22,0.3)' : 'rgba(218,41,28,0.15)' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={paymentMethod === 'mtn' ? '#8B6200' : '#8B1A12'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3"/>
                          </svg>
                        </span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                            {paymentMethod === 'mtn' ? 'MTN Mobile Money' : 'Telecel Cash'} Number
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                            Buyers will send payment to this number
                          </div>
                        </div>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <div style={{
                          position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                          fontSize: 13, fontWeight: 600,
                          color: paymentMethod === 'mtn' ? '#8B6200' : '#8B1A12',
                          pointerEvents: 'none', zIndex: 1,
                        }}>+233</div>
                        <input
                          type="tel"
                          inputMode="tel"
                          value={paymentNumber}
                          onChange={e => setPaymentNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
                          placeholder={paymentMethod === 'mtn' ? 'e.g. 024 XXX XXXX' : 'e.g. 050 XXX XXXX'}
                          style={{
                            width: '100%',
                            padding: '12px 14px 12px 52px',
                            background: 'white',
                            border: `1.5px solid ${paymentMethod === 'mtn' ? 'rgba(252,209,22,0.6)' : 'rgba(218,41,28,0.4)'}`,
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 15,
                            fontFamily: 'var(--font)',
                            fontWeight: 600,
                            color: 'var(--text)',
                            outline: 'none',
                            letterSpacing: '0.04em',
                            minHeight: 46,
                            boxSizing: 'border-box',
                            WebkitAppearance: 'none',
                            appearance: 'none',
                          }}
                        />
                        {paymentNumber.length >= 9 && (
                          <div style={{
                            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                            width: 20, height: 20, borderRadius: '50%',
                            background: 'var(--success)', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 11, color: 'white', fontWeight: 700,
                          }}>✓</div>
                        )}
                      </div>
                      {paymentNumber.length > 0 && paymentNumber.length < 9 && (
                        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                          Enter your full {paymentMethod === 'mtn' ? '9' : '9'}-digit number
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* ── TAGS ── */}
                <div>
                  <div className="lbl"><SvgTag /> Tags</div>
                  {category && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>Tap to add suggested tags:</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {tagSugs.map(sg => (
                          <span key={sg} className="tag-sug" onClick={() => { if (!tags.includes(sg) && tags.length < 12) setTags(p => [...p, sg]) }}>#{sg}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div
                    onClick={() => document.getElementById('tag-input-riri')?.focus()}
                    style={{
                      display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 12px',
                      background: 'rgba(245,80,10,0.015)', border: '1.5px solid var(--primary-border)',
                      borderRadius: 'var(--radius-sm)', minHeight: 52, cursor: 'text',
                    }}
                  >
                    {tags.map(tag => (
                      <span key={tag} className="tag-pill">
                        #{tag}
                        <button className="tag-x" onClick={e => { e.stopPropagation(); setTags(t => t.filter(x => x !== tag)) }}>×</button>
                      </span>
                    ))}
                    <input
                      id="tag-input-riri" value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) }
                        if (e.key === 'Backspace' && !tagInput && tags.length) setTags(t => t.slice(0, -1))
                      }}
                      placeholder={tags.length === 0 ? 'Type tag, press Enter…' : ''}
                      style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: 'var(--text)', minWidth: 140, flex: 1, fontFamily: 'var(--font)', padding: '2px 0' }}
                    />
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>{tags.length}/12 tags</p>
                </div>

                {/* ── IMAGES ── */}
                <div>
                  <div className="lbl"><SvgCam /> Product Photos (up to 5)</div>
                  <input ref={additionalImagesRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
                    onChange={e => loadAdditionalImages(e.target.files)} />
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {productImages.map((img, idx) => (
                      <div key={idx} style={{ position: 'relative', flexShrink: 0 }}>
                        <img src={img} alt={`Product ${idx + 1}`} className="thumb" />
                        <button
                          onClick={() => removeImage(idx)}
                          style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: 'var(--error)', border: 'none', color: 'white', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                          ×
                        </button>
                      </div>
                    ))}
                    {productImages.length < 5 && (
                      <div className="add-photo-btn" onClick={() => additionalImagesRef.current?.click()}>
                        <SvgCam />
                        <span>Add</span>
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, lineHeight: 1.4 }}>
                    Show multiple angles, packaging, or condition
                  </p>
                </div>

                {/* OCR debug */}
                {listing?.ocrText && stage === 'done' && (
                  <details>
                    <summary style={{ padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>
                      <span className="badge badge-ocr">RIRI OCR</span>
                      View extracted text
                    </summary>
                    <pre style={{ padding: '12px', marginTop: 4, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 12, fontFamily: 'var(--mono)', lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--text2)', maxHeight: 180, overflowY: 'auto' }}>
                      {listing.ocrText}
                    </pre>
                  </details>
                )}

                {/* ── WHATSAPP ── */}
                <div style={{ background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.25)', borderRadius: 'var(--radius)', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <SvgWA />
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#075E54' }}>Join Campus Marketplace WhatsApp</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12, lineHeight: 1.5 }}>
                    Get updates on new listings, campus deals & selling tips!
                  </p>
                  <button
                    className={`btn btn-full ${whatsappJoined ? 'btn-success' : 'btn-outline'}`}
                    onClick={() => { window.open('https://chat.whatsapp.com/your-channel-link', '_blank'); setWhatsappJoined(true) }}>
                    {whatsappJoined
                      ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Joined!</>
                      : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg> Join Channel</>
                    }
                  </button>
                </div>

                <div className="divider" />

                {submitError && (
                  <div className="alert alert-error">
                    <span>❌</span>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>Submission failed</div>
                      <div style={{ fontSize: 12, opacity: 0.85 }}>{submitError}</div>
                    </div>
                  </div>
                )}

                {/* Submit */}
                <button className="btn btn-primary btn-full btn-lg" onClick={handleSubmit} disabled={isSubmitting}
                  style={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
                  {isSubmitting
                    ? <><span className="spin" /> Saving listing…</>
                    : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> Post Listing</>}
                </button>

                {stage === 'manual' && (
                  <div style={{ textAlign: 'center' }}>
                    <button className="btn btn-ghost" onClick={() => setStage('idle')} style={{ fontSize: 13 }}>
                      ← Back to photo upload
                    </button>
                  </div>
                )}

              </div>
            </div>
          )}

        </main>

        {/* ── CONGRATULATIONS MODAL ── */}
        {submitted && !submitError && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
            background: 'rgba(10,14,20,0.75)',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.3s ease both',
          }}
            onClick={() => setSubmitted(false)}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: 'white',
                borderRadius: 24,
                padding: '40px 28px 32px',
                maxWidth: 360,
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
                animation: 'popIn 0.45s cubic-bezier(0.22,1,0.36,1) both',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Confetti streaks */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                {[
                  { left: '10%', top: '8%', color: '#f5500a', delay: '0s', size: 8, rotate: '15deg' },
                  { left: '85%', top: '12%', color: '#fcd116', delay: '0.1s', size: 6, rotate: '-20deg' },
                  { left: '20%', top: '85%', color: '#16a34a', delay: '0.05s', size: 7, rotate: '30deg' },
                  { left: '75%', top: '80%', color: '#3b82f6', delay: '0.15s', size: 5, rotate: '-10deg' },
                  { left: '50%', top: '5%', color: '#da291c', delay: '0.2s', size: 6, rotate: '45deg' },
                  { left: '5%', top: '50%', color: '#8b5cf6', delay: '0.08s', size: 5, rotate: '-35deg' },
                  { left: '92%', top: '45%', color: '#f59e0b', delay: '0.18s', size: 7, rotate: '25deg' },
                ].map((c, i) => (
                  <div key={i} style={{
                    position: 'absolute',
                    left: c.left, top: c.top,
                    width: c.size, height: c.size * 2.5,
                    background: c.color,
                    borderRadius: 2,
                    transform: `rotate(${c.rotate})`,
                    opacity: 0.7,
                    animation: `confettiFall 0.8s ease ${c.delay} both`,
                  }} />
                ))}
              </div>

              {/* Checkmark SVG */}
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 8px 24px rgba(22,163,74,0.35)',
                animation: 'scaleIn 0.5s cubic-bezier(0.22,1,0.36,1) 0.15s both',
              }}>
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M8 20l9 9 15-17" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ strokeDasharray: 40, strokeDashoffset: 0, animation: 'drawCheck 0.4s ease 0.4s both' }} />
                </svg>
              </div>

              {/* Stars row */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 14 }}>
                {[0, 0.05, 0.1, 0.15, 0.2].map((d, i) => (
                  <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="#fcd116"
                    style={{ animation: `starPop 0.4s cubic-bezier(0.22,1,0.36,1) ${0.5 + d}s both`, opacity: 0 }}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>

              <div style={{
                fontFamily: 'var(--font)', fontWeight: 800,
                fontSize: 26, letterSpacing: '-0.03em',
                color: 'var(--text)', marginBottom: 8,
                lineHeight: 1.1,
                animation: 'fadeUp 0.4s ease 0.35s both', opacity: 0,
              }}>
                Listing Live! 🎉
              </div>

              <div style={{
                fontSize: 14, color: 'var(--text2)', lineHeight: 1.6,
                marginBottom: 24, maxWidth: 260, margin: '0 auto 24px',
                animation: 'fadeUp 0.4s ease 0.45s both', opacity: 0,
              }}>
                Your product is now visible to buyers on the Uni-Mart campus marketplace.
              </div>

              {/* Listing name pill */}
              {title && (
                <div style={{
                  background: 'var(--primary-light)', border: '1px solid var(--primary-border)',
                  borderRadius: 100, padding: '7px 18px', display: 'inline-flex', alignItems: 'center', gap: 7,
                  fontSize: 13, fontWeight: 600, color: 'var(--primary)',
                  marginBottom: 24, maxWidth: '100%',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  animation: 'fadeUp 0.4s ease 0.55s both', opacity: 0,
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                  {title}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'fadeUp 0.4s ease 0.6s both', opacity: 0 }}>
                <button
                  className="btn btn-primary btn-full"
                  onClick={() => { setSubmitted(false); reset() }}
                  style={{ fontWeight: 700, fontSize: 15, gap: 9 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  List Another Product
                </button>
                <button
                  className="btn btn-ghost btn-full"
                  onClick={() => setSubmitted(false)}
                  style={{ fontSize: 14, gap: 9 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  View My Listing
                </button>
              </div>

              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 16, lineHeight: 1.5 }}>
                A confirmation email has been sent to {sellerEmail || 'you'}
              </p>
            </div>
          </div>
        )}

        {/* ── FOOTER ── */}
        <footer style={{
          borderTop: '1px solid var(--border)',
          padding: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 8,
          background: 'var(--surface)',
        }}>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em', color: 'var(--text)' }}>
            RIRI<span style={{ color: 'var(--primary)' }}>.ai</span>
            <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--muted)', marginLeft: 6 }}>by Uni-Mart</span>
          </span>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>© 2025</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--success)' }} />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>RIRI.ai online</span>
          </div>
        </footer>

      </div>
    </>
  )
}