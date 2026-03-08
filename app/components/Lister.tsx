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
}

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
  @keyframes pulse-ring {
    0% { transform: scale(1); opacity: 0.7; }
    100% { transform: scale(2.2); opacity: 0; }
  }
  @keyframes scanline {
    0% { top: -4px; }
    100% { top: calc(100% + 4px); }
  }
  @keyframes confBar { from { width: 0; } }

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
  .badge-ai { background: var(--riri-primary); color: white; font-size: 8px; font-weight: 800; letter-spacing: 0.12em; padding: 1px 5px; border-radius: 3px; }
  .badge-ocr { background: var(--success); color: white; font-size: 8px; font-weight: 800; letter-spacing: 0.12em; padding: 1px 5px; border-radius: 3px; }

  .drop-zone {
    border: 2px dashed var(--border-medium); border-radius: var(--radius-xl);
    background: var(--bg-secondary); transition: all 0.2s; overflow: hidden; position: relative;
  }
  .drop-zone.drag-over { border-color: var(--riri-primary); background: rgba(245,80,10,0.02); }

  .scan-overlay { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
  .scan-line {
    position: absolute; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent 0%, var(--riri-primary) 50%, transparent 100%);
    animation: scanline 1.8s ease-in-out infinite; opacity: 0.8;
  }

  .step-row { display: flex; align-items: center; gap: 10px; }
  .step-dot {
    width: 24px; height: 24px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700; flex-shrink: 0;
    transition: all 0.3s; position: relative;
  }
  .step-dot.idle { background: var(--bg-tertiary); border: 1.5px solid var(--border-medium); color: var(--text-muted); }
  .step-dot.active { background: var(--riri-primary); border: 1.5px solid var(--riri-primary); color: white; }
  .step-dot.done { background: var(--success); border: 1.5px solid var(--success); color: white; }
  .step-dot.active::after {
    content: ''; position: absolute; inset: -4px; border-radius: 50%;
    border: 2px solid var(--riri-primary); opacity: 0.5;
    animation: pulse-ring 1.2s ease-out infinite;
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

  .conf-bar { height: 3px; animation: confBar 1.2s cubic-bezier(0.22,1,0.36,1) both; animation-delay: 0.4s; }

  .tag-suggestion {
    padding: 4px 10px; background: var(--bg-tertiary); border: 1px solid var(--border-medium);
    border-radius: 100px; font-size: 11px; color: var(--text-secondary); cursor: pointer; transition: all 0.15s;
  }
  .tag-suggestion:hover { background: var(--riri-primary-light); border-color: var(--riri-primary); color: var(--riri-primary); }

  .image-preview-thumb {
    width: 80px; height: 80px; border-radius: var(--radius);
    border: 1.5px solid var(--border-medium); object-fit: cover; cursor: pointer; transition: all 0.15s;
  }
  .image-preview-thumb:hover { border-color: var(--riri-primary); transform: scale(1.05); }

  details summary { list-style: none; cursor: pointer; }
  details summary::-webkit-details-marker { display: none; }

  @media (max-width: 640px) {
    .two-col { grid-template-columns: 1fr !important; }
    .three-col { grid-template-columns: 1fr 1fr !important; }
    .three-col > div:last-child { grid-column: span 2; }
    .preview-row { flex-direction: column !important; }
    .preview-img { width: 100% !important; height: 220px !important; }
    .action-row { flex-direction: column; }
    .hide-mobile { display: none !important; }
    .delivery-row { flex-direction: column; }
  }
`

const Icons = {
  Store: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  ),
  Package: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  Truck: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="3" width="15" height="13" />
      <rect x="6" y="8" width="10" height="6" />
      <circle cx="6" cy="20" r="2" />
      <circle cx="18" cy="20" r="2" />
      <path d="M2 12h3" />
    </svg>
  ),
  Camera: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  User: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Phone: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12" y2="18" strokeWidth="4" />
    </svg>
  ),
  Mail: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <path d="M22 6L12 13 2 6" />
    </svg>
  ),
  Map: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Tag: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  WhatsApp: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
  Money: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  ),
  Discount: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 12.5V8a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h4.5" />
      <path d="M15 21l6-6" />
      <path d="M15 15h6" />
    </svg>
  ),
  Student: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-2z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  Vendor: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3h18v18H3zM3 9h18M9 21V9" />
    </svg>
  ),
  Bike: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="18.5" cy="17.5" r="3.5" />
      <path d="M15 6l-3 6 6 3 2-4-5-5z" />
      <path d="M9 12l3 3 3-3" />
    </svg>
  ),
  Walk: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 4v4l-3 2 3 2 3-2-3-2V4z" />
      <path d="M5 21l3-6 3 3 2-4" />
      <path d="M19 21l-3-9-3 3" />
    </svg>
  )
}

// ── Embedded Unimart logo ──────────────────────────────────────────────────
const UNIMART_LOGO_URI = "data:image/png;base64,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";

export function Lister() {
  const [stage, setStage] = useState<Stage>('idle')
  const [step, setStep] = useState(0)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [listing, setListing] = useState<Listing | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [copied, setCopied] = useState(false)
  const [productImages, setProductImages] = useState<string[]>([])
  const [userType, setUserType] = useState<UserType>('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('')
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('')
  const [whatsappJoined, setWhatsappJoined] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

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
  const [submitted, setSubmitted] = useState(false)

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    fileRef2.current = file
    setPreview(URL.createObjectURL(file))
    setListing(null); setStage('idle'); setStep(0); setError('')
  }, [])

  const loadAdditionalImages = useCallback((files: FileList | null) => {
    if (!files) return
    const newImages: string[] = []
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) newImages.push(URL.createObjectURL(file))
    })
    setProductImages(prev => [...prev, ...newImages].slice(0, 5))
  }, [])

  const removeImage = (index: number) => {
    setProductImages(prev => prev.filter((_, i) => i !== index))
  }

  const startManualListing = () => {
    setStage('manual'); setStep(0); setError('')
    setListing({ title: '', description: '', category: '', brand: '', productType: '', condition: '', conditionNotes: '', price: 0, discount: null, tags: [], edition: '', images: [], confidence: 0, ocrText: '' })
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200)
  }

  const analyzeWithRIRI = async () => {
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
      if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Analysis failed')
      if (data.type === 'ai-analysis') {
        const l: Listing = data.listing
        setListing(l); setTitle(l.title || ''); setDescription(l.description || '')
        setCategory(l.category || ''); setBrand(l.brand || ''); setCondition(l.condition || '')
        setPrice(String(l.price || '')); setDiscount(l.discount ? String(l.discount) : '')
        setEdition(l.edition || ''); setTags(l.tags || [])
        setStep(3); setStage('done')
        setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200)
      } else { throw new Error('Unexpected response format') }
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

  const addTagSuggestion = (s: string) => {
    if (!tags.includes(s) && tags.length < 12) setTags(p => [...p, s])
  }

  const handleSubmit = async () => {
    setIsSubmitting(true); setSubmitError(''); setSubmitted(true)
    try {
      const listingData = {
        businessName: businessName || undefined, sellerName, sellerEmail, sellerPhone,
        location, userType: userType || 'student', title, description, category,
        brand: brand || undefined, condition, conditionNotes: listing?.conditionNotes || undefined,
        price: parseFloat(price) || 0, discount: discount ? parseInt(discount) : undefined,
        edition: edition || undefined, deliveryType, paymentMethod, tags,
        imageUrls: productImages, confidence: listing?.confidence || undefined, status: 'active'
      }
      const required = ['sellerName', 'sellerEmail', 'title', 'description', 'category', 'condition', 'price']
      const missing = required.filter(field => !listingData[field as keyof typeof listingData])
      if (missing.length > 0) throw new Error(`Missing required fields: ${missing.join(', ')}`)
      
      // Save to database via API - webhook is handled server-side
      const response = await fetch('/api/listings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listingData),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error || result.message || 'Failed to save listing')
      
      console.log('✅ Listing saved successfully - email notification will be sent')
      
      setTimeout(() => { setSubmitted(false) }, 3000)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save listing')
      setSubmitted(false)
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
    setQuantity('1'); setLocation(''); setSubmitted(false)
    setProductImages([]); setUserType(''); setPaymentMethod(''); setDeliveryType(''); setWhatsappJoined(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const joinWhatsApp = () => {
    window.open('https://chat.whatsapp.com/your-channel-link', '_blank')
    setWhatsappJoined(true)
  }

  const saving = price && discount ? `${discount}% off` : null
  const confPct = listing ? Math.round(listing.confidence * 100) : 0
  const confColor = confPct > 80 ? 'var(--success)' : confPct > 60 ? 'var(--riri-primary)' : 'var(--error)'

  const steps = [
    { label: 'RIRI Vision — scanning your product' },
    { label: 'RIRI OCR — extracting text & labels' },
    { label: 'RIRI AI — generating listing fields' },
  ]

  const tagSuggestions = category && category in TAG_SUGGESTIONS
    ? TAG_SUGGESTIONS[category as keyof typeof TAG_SUGGESTIONS]
    : TAG_SUGGESTIONS['Other']

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
              Snap. List. Sell.
              <br />
              <span style={{ color: 'var(--riri-primary)' }}>with RIRI AI</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 430, margin: '0 auto', lineHeight: 1.65 }}>
              RIRI AI reads your product image and fills every field instantly — title, description, price, tags, and more.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginTop: 36, flexWrap: 'wrap' }}>
              {[['⚡', '< 5s', 'Analysis'], ['🎯', '95%', 'Accuracy'], ['🆓', 'Free', 'For Students']].map(([icon, val, label]) => (
                <div key={label}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
                  <div style={{ fontFamily: 'var(--font-family)', fontWeight: 700, fontSize: 24, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{val}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-family)', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* UPLOAD ZONE */}
          <div
            className={`drop-zone fade-up d1 ${dragging ? 'drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) loadFile(f) }}
            style={{ marginBottom: 28 }}
          >
            {preview ? (
              <div className="preview-row" style={{ display: 'flex' }}>
                <div className="preview-img" style={{ width: 260, flexShrink: 0, position: 'relative', overflow: 'hidden', background: 'var(--bg-tertiary)' }}>
                  <img src={preview} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: 230 }} />
                  {stage === 'analyzing' && (
                    <>
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.5)' }} />
                      <div className="scan-overlay"><div className="scan-line" /></div>
                      <div style={{
                        position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                        background: 'rgba(255,255,255,0.95)', borderRadius: 100,
                        padding: '7px 16px', display: 'flex', alignItems: 'center', gap: 8,
                        border: '1px solid var(--riri-primary-border)', whiteSpace: 'nowrap',
                      }}>
                        <span className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--riri-primary)' }}>RIRI Scanning…</span>
                      </div>
                    </>
                  )}
                  {stage === 'done' && (
                    <div style={{
                      position: 'absolute', top: 12, right: 12,
                      background: 'var(--success)', borderRadius: 100,
                      padding: '4px 10px', fontSize: 10, fontWeight: 800,
                      color: 'white', fontFamily: 'var(--font-family)', letterSpacing: '0.08em',
                    }}>✓ RIRI DONE</div>
                  )}
                </div>

                <div style={{ flex: 1, padding: '28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 230, background: 'var(--bg-secondary)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3, fontFamily: 'var(--font-family)', letterSpacing: '-0.01em' }}>
                      {fileRef2.current?.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 }}>
                      {fileRef2.current ? (fileRef2.current.size / 1024 / 1024).toFixed(2) + ' MB' : ''}
                    </div>

                    {(stage === 'analyzing' || stage === 'done') && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {steps.map((s, i) => {
                          const idx = i + 1
                          const isActive = step === idx && stage === 'analyzing'
                          const isDone = step > idx || stage === 'done'
                          return (
                            <div key={i} className="step-row">
                              <div className={`step-dot ${isDone ? 'done' : isActive ? 'active' : 'idle'}`}>
                                {isDone ? '✓' : isActive ? <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} /> : '·'}
                              </div>
                              <span style={{ fontSize: 13, color: isDone ? 'var(--success)' : isActive ? 'var(--riri-primary)' : 'var(--text-muted)', fontWeight: isActive || isDone ? 500 : 400, transition: 'color 0.3s' }}>
                                {s.label}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {stage === 'done' && listing && (
                      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: confColor, boxShadow: `0 0 8px ${confColor}` }} />
                        <span style={{ fontSize: 12, color: confColor, fontWeight: 600, fontFamily: 'var(--font-family)' }}>
                          {confPct}% RIRI confidence · {listing.productType || 'Product'} identified
                        </span>
                      </div>
                    )}

                    {error && (
                      <div style={{
                        marginTop: 14, padding: '10px 14px',
                        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                        borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--error)', lineHeight: 1.5,
                      }}>
                        ⚠ {error}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
                    <button className="btn btn-outline" onClick={reset} style={{ fontSize: 13 }}>← Change</button>
                    <button
                      className="btn btn-primary" onClick={analyzeWithRIRI}
                      disabled={stage === 'analyzing'}
                      style={{ flex: 1, minWidth: 140, fontSize: 14 }}
                    >
                      {stage === 'analyzing'
                        ? <><span className="spinner" style={{ width: 13, height: 13, borderWidth: 2, borderTopColor: 'white' }} /> RIRI Analyzing…</>
                        : stage === 'done' ? '↺ Re-analyze' : '⚡ Analyze with RIRI'}
                    </button>
                    {stage !== 'manual' && stage !== 'analyzing' && (
                      <button className="btn btn-secondary" onClick={startManualListing} style={{ fontSize: 14 }}>
                        📝 List Manually
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div onClick={() => fileRef.current?.click()} style={{ padding: '64px 24px', textAlign: 'center', cursor: 'pointer', background: 'var(--bg-secondary)' }}>
                <div style={{
                  width: 80, height: 80, background: 'var(--bg-tertiary)',
                  border: '2px solid var(--border-medium)', borderRadius: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 24px', fontSize: 32,
                }}>📸</div>
                <div style={{ fontFamily: 'var(--font-family)', fontWeight: 700, fontSize: 22, marginBottom: 10, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
                  Drop your product photo here
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
                  JPG · PNG · WEBP · HEIC — up to 15MB
                </div>
                <button className="btn btn-primary" style={{ fontSize: 14, padding: '12px 32px' }}>
                  ⚡ Choose photo
                </button>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
                  {['📚 Textbooks', '💻 Electronics', '👕 Fashion', '📱 Phones', '🪑 Furniture', '🎮 Gaming'].map(t => (
                    <span key={t} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-medium)', borderRadius: 100, padding: '4px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { if (e.target.files?.[0]) loadFile(e.target.files[0]) }} />

          {/* LISTING FORM */}
          {(stage === 'done' || stage === 'manual') && listing && (
            <div ref={formRef} className="fade-up" style={{
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
                    <div style={{ fontFamily: 'var(--font-family)', fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>Listing Details</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                      {stage === 'done' ? 'AI-filled by RIRI · ' : 'Manual listing · '}edit any field before publishing
                    </div>
                  </div>
                  {stage === 'done' && (
                    <span style={{ background: 'var(--riri-primary)', color: 'white', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', padding: '3px 9px', borderRadius: 100, fontFamily: 'var(--font-family)' }}>RIRI AI</span>
                  )}
                </div>
              </div>

              {stage === 'done' && (
                <div style={{ height: 3, background: 'var(--bg-tertiary)' }}>
                  <div className="conf-bar" style={{ width: `${confPct}%`, background: confColor, height: '100%', boxShadow: `0 0 8px ${confColor}` }} />
                </div>
              )}

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
                    <div className="lbl"><span>Title</span>{stage === 'done' && <span className="badge-ai">RIRI</span>}</div>
                    <input className={`fi ${title ? 'filled' : ''}`} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. iPhone 13, Textbook, Sneakers" />
                  </div>

                  <div className="fade-up d2">
                    <div className="lbl"><span>Description</span>{stage === 'done' && <span className="badge-ai">RIRI</span>}</div>
                    <textarea className={`fi ${description ? 'filled' : ''}`} value={description} onChange={e => setDescription(e.target.value)} rows={4} style={{ resize: 'vertical', lineHeight: 1.65 }} placeholder="Describe your product..." />
                  </div>

                  <div className="fade-up d2 two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <div className="lbl"><span>Category</span>{stage === 'done' && <span className="badge-ai">RIRI</span>}</div>
                      <select className={`fi ${category ? 'filled' : ''}`} value={category} onChange={e => setCategory(e.target.value)}>
                        <option value="">Select category…</option>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <div className="lbl"><span>Brand</span>{stage === 'done' && <span className="badge-ai">RIRI</span>}</div>
                      <input className={`fi ${brand ? 'filled' : ''}`} value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. Apple, Nike, Samsung" />
                    </div>
                  </div>

                  <div className="fade-up d2">
                    <div className="lbl"><span>Edition / Version</span>{stage === 'done' && <span className="badge-ai">RIRI</span>}</div>
                    <input className={`fi ${edition ? 'filled' : ''}`} value={edition} onChange={e => setEdition(e.target.value)} placeholder="e.g. 3rd Edition, 2024 Model, 128GB" />
                  </div>

                  <div className="fade-up d3">
                    <div className="lbl"><span>Condition</span>{stage === 'done' && <span className="badge-ai">RIRI</span>}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {CONDITIONS.map(c => (
                        <button key={c} className={`cond-btn ${condition === c ? 'active' : ''}`} onClick={() => setCondition(c)}>{c}</button>
                      ))}
                    </div>
                    {listing.conditionNotes && (
                      <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>🔍 {listing.conditionNotes}</p>
                    )}
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
                          <button className="tag-x" onClick={e => { e.stopPropagation(); setTags(t => t.filter(x => x !== tag)) }}>×</button>
                        </span>
                      ))}
                      <input
                        id="tag-input" value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) }
                          if (e.key === 'Backspace' && !tagInput && tags.length) setTags(t => t.slice(0, -1))
                        }}
                        placeholder={tags.length === 0 ? 'Type tag and press Enter...' : ''}
                        style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: 'var(--text-primary)', minWidth: 200, flex: 1, fontFamily: 'var(--font-family)', padding: '2px 0' }}
                      />
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{tags.length}/12 tags · Click suggestions above to add</p>
                  </div>

                  {/* IMAGES */}
                  <div className="fade-up d4">
                    <div className="lbl"><Icons.Camera /> Product Images (up to 5)</div>
                    <input ref={additionalImagesRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => loadAdditionalImages(e.target.files)} />
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                      {productImages.map((img, index) => (
                        <div key={index} style={{ position: 'relative' }}>
                          <img src={img} alt={`Product ${index + 1}`} className="image-preview-thumb" />
                          <button onClick={() => removeImage(index)} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: 'var(--error)', border: 'none', color: 'white', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                        </div>
                      ))}
                      {productImages.length < 5 && (
                        <button onClick={() => additionalImagesRef.current?.click()} style={{ width: 80, height: 80, border: '2px dashed var(--border-medium)', borderRadius: 'var(--radius)', background: 'var(--bg-tertiary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', color: 'var(--text-muted)' }}>
                          <Icons.Camera />
                          <span style={{ fontSize: 10 }}>Add photo</span>
                        </button>
                      )}
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Show multiple angles, packaging, or condition details</p>
                  </div>

                  {listing.ocrText && stage === 'done' && (
                    <details className="fade-up d5">
                      <summary style={{ padding: '10px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                        <span className="badge-ocr">RIRI OCR</span>
                        View text extracted from image
                      </summary>
                      <pre style={{ padding: '14px', marginTop: 4, background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius)', fontSize: 12, fontFamily: 'monospace', lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', maxHeight: 200, overflow: 'auto' }}>
                        {listing.ocrText}
                      </pre>
                    </details>
                  )}

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
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Your listing has been saved and will appear on University Marketplace. A confirmation email will be sent shortly.</div>
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
                  </div>

                  {stage === 'manual' && (
                    <div style={{ marginTop: 8, textAlign: 'center' }}>
                      <button className="btn btn-outline" onClick={() => setStage('idle')} style={{ fontSize: 13 }}>← Back to photo upload</button>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}
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
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>RIRI AI operational</span>
          </div>
        </footer>
      </div>
    </>
  )
}