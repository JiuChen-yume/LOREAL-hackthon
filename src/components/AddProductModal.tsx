import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Camera, 
  QrCode, 
  Barcode, 
  Sparkles, 
  Plus, 
  Check, 
  Upload, 
  Layers, 
  Zap, 
  ZapOff, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { BeautyProduct, ProductCategory } from '../types/beauty';

interface AddProductModalProps {
  initialMode: 'camera' | 'barcode' | 'manual' | 'batch';
  onClose: () => void;
  onAddProduct: (product: BeautyProduct) => void;
  onAddBatchProducts: (products: BeautyProduct[]) => void;
}

interface ScannedProductResult {
  barcode: string;
  scan_type: 'barcode' | 'qr_code';
  source?: string;
  product: {
    brand: string;
    product_name: string;
    category: ProductCategory;
    subcategory: string;
    size?: string;
    shade_name?: string;
    pao_months?: number;
    ingredients?: string[];
    allergen_tags?: string[];
    user_notes?: string;
    price?: number;
    shelf_location?: string;
  };
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  initialMode,
  onClose,
  onAddProduct,
  onAddBatchProducts
}) => {
  const [mode, setMode] = useState<'camera' | 'barcode' | 'manual' | 'batch'>(initialMode);
  
  // OCR & Recognition State
  const [isScanning, setIsScanning] = useState(false);
  const [scanPreviewImage, setScanPreviewImage] = useState<string | null>(null);
  const [detectedProducts, setDetectedProducts] = useState<Array<{ name?: string; parents?: string; confidence?: number; bbox?: { xMin?: number; yMin?: number; xMax?: number; yMax?: number } }>>([]);
  const [detectedCodes, setDetectedCodes] = useState<Array<{ content: string; type: string; position?: { left: number; top: number; right: number; bottom: number } | null }>>([]);
  const [productDetectMessage, setProductDetectMessage] = useState<string | null>(null);

  // Barcode & QR Code Scanner Overlay State
  const [scannerType, setScannerType] = useState<'barcode' | 'qr'>('barcode');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [useLiveCamera, setUseLiveCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<ScannedProductResult | null>(null);
  const [unmatchedCode, setUnmatchedCode] = useState<{ content: string; type: string } | null>(null);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [showManualCodeInput, setShowManualCodeInput] = useState(false);
  const [scanSuccessAnimation, setScanSuccessAnimation] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Form fields
  const [brand, setBrand] = useState('');
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('skincare');
  const [subcategory, setSubcategory] = useState('精华');
  const [shadeName, setShadeName] = useState('');
  const [paoMonths, setPaoMonths] = useState<number>(12);
  const [openedDate, setOpenedDate] = useState(new Date().toISOString().split('T')[0]);
  const [shelfLocation, setShelfLocation] = useState('主化妆台·上层');
  const [userNotes, setUserNotes] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [allergenTagsText, setAllergenTagsText] = useState('');

  // Stop video stream on unmount or mode change
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (mode !== 'barcode' && mode !== 'camera' && streamRef.current) {
      stopCamera();
    }
  }, [mode]);

  useEffect(() => {
    if (useLiveCamera && videoRef.current && streamRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play();
    }
  }, [useLiveCamera, mode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setUseLiveCamera(true);
      } else {
        setCameraError('当前浏览器不支持摄像头，请使用下方“从相册选择照片”上传。');
      }
    } catch (err: any) {
      console.warn('Camera access not granted or not available:', err);
      setCameraError('未获取摄像头权限或设备无可用镜头，请检查浏览器权限，或使用相册上传。');
      setUseLiveCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setUseLiveCamera(false);
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError('摄像头画面尚未准备好，请稍候再拍摄。');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.9);
    setScanPreviewImage(imageBase64);
    stopCamera();
    await handleRecognize(imageBase64);
  };

  const captureBarcodeFrame = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError('摄像头画面尚未准备好，请稍候再扫描。');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.9);
    setScanPreviewImage(imageBase64);
    await handleBarcodeImageRecognize(imageBase64);
  };

  // Play gentle scan beep using Web Audio API
  const playScanBeep = () => {
    if (!isSoundOn) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.18);
    } catch (e) {
      // Audio not permitted without interaction
    }
  };

  // Trigger Barcode/QR Code API
  const handleScanCode = async (code: string, type: 'barcode' | 'qr_code' = 'barcode') => {
    setIsScanning(true);
    setScanSuccessAnimation(true);
    playScanBeep();

    try {
      setUnmatchedCode(null);
      const response = await fetch('/api/scanner/barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: type === 'barcode' ? code : undefined,
          qrData: type === 'qr_code' ? code : undefined
        })
      });

      const data = await response.json() as any;
      if (data.success && data.product) {
        setScannedResult({
          barcode: data.barcode || code,
          scan_type: type,
          source: data.source,
          product: data.product
        });
      } else {
        setUnmatchedCode({ content: code, type });
      }
    } catch (e) {
      console.error('Scan error:', e);
    } finally {
      setIsScanning(false);
      setTimeout(() => setScanSuccessAnimation(false), 800);
    }
  };

  // Apply scanned product to manual form
  const handleApplyToForm = (p: ScannedProductResult['product']) => {
    setBrand(p.brand || '');
    setProductName(p.product_name || '');
    setCategory(p.category || 'skincare');
    setSubcategory(p.subcategory || '精华');
    setShadeName(p.shade_name || '');
    setPaoMonths(p.pao_months || 12);
    setShelfLocation(p.shelf_location || '主化妆台');
    setIngredientsText((p.ingredients || []).join(', '));
    setAllergenTagsText((p.allergen_tags || []).join(', '));
    setUserNotes(p.user_notes || '');
    setMode('manual');
    setScannedResult(null);
  };

  // Direct commit to vanity from scan
  const handleDirectCommitScanned = () => {
    if (!scannedResult) return;
    const p = scannedResult.product;
    const pao = p.pao_months || 12;
    const expiry = calculateExpiry(openedDate, pao);

    const newProduct: BeautyProduct = {
      id: `prod_${Date.now()}`,
      brand: p.brand || '自选品牌',
      product_name: p.product_name,
      category: p.category || 'skincare',
      subcategory: p.subcategory || '日常护理',
      shade_name: p.shade_name || undefined,
      purchase_date: openedDate,
      opened_date: openedDate,
      pao_months: pao,
      expiry_date: expiry,
      quantity: 1,
      status: 'in_use',
      ingredients: p.ingredients || [],
      allergen_tags: p.allergen_tags || [],
      user_notes: p.user_notes || `通过${scannedResult.scan_type === 'barcode' ? '条形码' : '包装盒二维码'}智能录入`,
      shelf_location: p.shelf_location || '主化妆台',
      list_status: 'none',
      usage_count: 0,
      price: p.price
    };

    onAddProduct(newProduct);
    onClose();
  };

  // Handle OCR recognition
  const handleRecognize = async (imageOverride?: string) => {
    const image = imageOverride || scanPreviewImage;
    if (!image) {
      setCameraError('请先拍摄或选择一张真实包装照片。');
      return;
    }
    setIsScanning(true);
    try {
      const response = await fetch('/api/ocr/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: image
        })
      });
      const data = await response.json() as any;
      if (data.success && data.product) {
        const p = Array.isArray(data.product.products) ? (data.product.products[0] || {}) : data.product;
        setBrand(p.brand || '');
        setProductName(p.product_name || p.complete_product_name || '');
        setCategory(p.category || 'skincare');
        setSubcategory(p.subcategory || '精华');
        setShadeName(p.shade_name || '');
        setPaoMonths(p.pao_months || 12);
        setIngredientsText((p.ingredients || []).join(', '));
        setAllergenTagsText((p.allergen_tags || []).join(', '));
        setUserNotes(p.user_notes || '');
        setMode('manual');
      } else {
        setCameraError(data.error || '腾讯云未识别到可用的包装文字，请换一张更清晰的照片。');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) { setCameraError('请选择 JPG、PNG 或 WEBP 图片。'); return; }
      if (file.size > 10 * 1024 * 1024) { setCameraError('图片不能超过 10MB，请先压缩后上传。'); return; }
      setCameraError(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setScanPreviewImage(result);
        if (mode === 'barcode') {
          void handleBarcodeImageRecognize(result);
        } else if (mode === 'camera') {
          void handleRecognize(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBarcodeImageRecognize = async (imageBase64: string) => {
    setIsScanning(true);
    setScanSuccessAnimation(false);
    try {
      const response = await fetch('/api/barcode/recognize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageBase64 }) });
      const data = await response.json() as any;
      if (!response.ok || !data.success) throw new Error(data.error || '二维码/条形码识别失败');
      const code = data.codes?.[0];
      if (!code?.content) {
        setScannedResult(null);
        console.info('Tencent QrcodeOCR: no code detected', data.requestId);
        return;
      }
      const isBarcode = String(code.type || '').startsWith('EAN') || /UPC|CODE|PDF_417|DATA_MATRIX/i.test(String(code.type || ''));
      await handleScanCode(code.content, isBarcode ? 'barcode' : 'qr_code');
    } catch (error: any) {
      console.error('Tencent barcode image recognition failed:', error);
      setCameraError(error?.message || '腾讯云二维码/条形码识别失败，请重试。');
    } finally {
      setIsScanning(false);
    }
  };

  const calculateExpiry = (opened: string, pao: number) => {
    const d = new Date(opened || Date.now());
    d.setMonth(d.getMonth() + pao);
    return d.toISOString().split('T')[0];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;

    const expiry = calculateExpiry(openedDate, paoMonths);
    const newProduct: BeautyProduct = {
      id: `prod_${Date.now()}`,
      brand: brand.trim() || '自选品牌',
      product_name: productName.trim(),
      category,
      subcategory,
      shade_name: shadeName.trim() || undefined,
      purchase_date: openedDate,
      opened_date: openedDate,
      pao_months: paoMonths,
      expiry_date: expiry,
      quantity: 1,
      status: 'in_use',
      ingredients: ingredientsText ? ingredientsText.split(/[,，、]/).map(s => s.trim()).filter(Boolean) : [],
      allergen_tags: allergenTagsText ? allergenTagsText.split(/[,，、]/).map(s => s.trim()).filter(Boolean) : [],
      user_notes: userNotes.trim() || undefined,
      shelf_location: shelfLocation.trim() || '主化妆台',
      list_status: 'none',
      usage_count: 0
    };

    onAddProduct(newProduct);
    onClose();
  };

  // Batch import demo simulation
  const handleBatchImport = () => {
    const sampleBatch: BeautyProduct[] = [
      {
        id: `prod_${Date.now()}_1`,
        brand: 'CPB (肌肤之钥)',
        product_name: '光透白密集焕亮隔离乳 (长管防晒隔离)',
        category: 'base',
        subcategory: '隔离霜',
        size: '37ml',
        purchase_date: '2026-08-01',
        opened_date: '2026-08-10',
        pao_months: 12,
        expiry_date: '2027-08-10',
        quantity: 1,
        status: 'in_use',
        ingredients: ['亮肌复合精华EX', '二氧化钛', '甘油'],
        allergen_tags: [],
        shelf_location: '主台·防晒区',
        list_status: 'none',
        usage_count: 12
      },
      {
        id: `prod_${Date.now()}_2`,
        brand: 'NARS',
        product_name: '流光美肌清透蜜粉饼 (大白饼)',
        category: 'base',
        subcategory: '蜜粉饼',
        purchase_date: '2026-05-10',
        opened_date: '2026-05-20',
        pao_months: 24,
        expiry_date: '2028-05-20',
        quantity: 1,
        status: 'in_use',
        ingredients: ['微晶矿物粉体', '角鲨烷', '维生素E'],
        allergen_tags: [],
        shelf_location: '抽屉一阶',
        list_status: 'none',
        usage_count: 35
      }
    ];
    onAddBatchProducts(sampleBatch);
    onClose();
  };

  const handleProductShelfUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setProductDetectMessage('请选择 JPG、PNG 或 WEBP 图片。'); return; }
    if (file.size > 10 * 1024 * 1024) { setProductDetectMessage('图片不能超过 10MB，请先压缩后上传。'); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      const imageBase64 = String(reader.result || '');
      setIsScanning(true);
      setProductDetectMessage('正在调用腾讯云商品识别，定位图片中的多个商品…');
      try {
        const [productResponse, barcodeResponse, ocrResponse] = await Promise.allSettled([
          fetch('/api/product/recognize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageBase64 }) }),
          fetch('/api/barcode/recognize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageBase64 }) }),
          fetch('/api/ocr/recognize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageBase64 }) })
        ]);
        const productData = productResponse.status === 'fulfilled' ? await productResponse.value.json() as any : { success: false };
        const barcodeData = barcodeResponse.status === 'fulfilled' ? await barcodeResponse.value.json() as any : { success: false };
        const ocrData = ocrResponse.status === 'fulfilled' ? await ocrResponse.value.json() as any : { success: false };
        if (!productData.success && !barcodeData.success && !ocrData.success) throw new Error('商品、条码和 OCR 均未返回结果');
        const detectedByProductApi = Array.isArray(productData.products) ? productData.products : [];
        const ocrProducts = Array.isArray(ocrData.product?.products) ? ocrData.product.products : [];
        const products = detectedByProductApi.length ? detectedByProductApi : ocrProducts.map((item: any) => ({ name: item.complete_product_name || item.product_name || item.brand || '待确认商品', parents: item.brand || item.category || 'AI/OCR 辅助识别', confidence: Number(item.confidence || 0), bbox: null }));
        const codes = Array.isArray(barcodeData.codes) ? barcodeData.codes : [];
        setDetectedProducts(products);
        setDetectedCodes(codes);
        const parts = [`商品 ${products.length} 件`, `条码 ${codes.length} 个`];
        if (ocrData.success) parts.push('OCR 已完成');
        setProductDetectMessage(`${parts.join(' · ')}，请逐件核对后录入。`);
      } catch (error: any) {
        setDetectedProducts([]);
        setDetectedCodes([]);
        setProductDetectMessage(error?.message || '腾讯云商品识别失败，请检查密钥和图片。');
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const codeForProduct = (product: { bbox?: { xMin?: number; yMin?: number; xMax?: number; yMax?: number } }) => {
    const box = product.bbox;
    if (!box) return undefined;
    const centerX = (Number(box.xMin || 0) + Number(box.xMax || 0)) / 2;
    const centerY = (Number(box.yMin || 0) + Number(box.yMax || 0)) / 2;
    return detectedCodes.find((code) => {
      const pos = code.position;
      if (!pos) return false;
      const codeCenterX = (pos.left + pos.right) / 2;
      const codeCenterY = (pos.top + pos.bottom) / 2;
      return codeCenterX >= Number(box.xMin || 0) && codeCenterX <= Number(box.xMax || 0) && codeCenterY >= Number(box.yMin || 0) && codeCenterY <= Number(box.yMax || 0);
    }) || detectedCodes.filter((code) => code.position).sort((a, b) => {
      const ac = a.position!; const bc = b.position!;
      return Math.hypot((ac.left + ac.right) / 2 - centerX, (ac.top + ac.bottom) / 2 - centerY) - Math.hypot((bc.left + bc.right) / 2 - centerX, (bc.top + bc.bottom) / 2 - centerY);
    })[0];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="text-base font-serif font-bold text-stone-900 flex items-center gap-2">
              <span>录入产品至化妆台</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF6F3] text-[#962F43] font-sans font-semibold border border-[#F0EBE5]">
                数据中心入口
              </span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              支持包装 OCR、条形码/盒装二维码快扫、手动与批量导入
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Entry Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-stone-100 rounded-2xl text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode('barcode')}
            className={`py-2 px-1 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              mode === 'barcode' ? 'bg-[#962F43] text-white shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="text-[11px] whitespace-nowrap">扫码录入</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('camera')}
            className={`py-2 px-1 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              mode === 'camera' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="text-[11px] whitespace-nowrap">拍照识别</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`py-2 px-1 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              mode === 'manual' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[11px] whitespace-nowrap">手动录入</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('batch')}
            className={`py-2 px-1 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              mode === 'batch' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="text-[11px] whitespace-nowrap">批量导入</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* Mode 1: Barcode & QR Code Scanner Overlay                 */}
        {/* ======================================================== */}
        {mode === 'barcode' && (
          <div className="space-y-3.5">
            {/* Viewfinder Container */}
            <div className="relative w-full h-[320px] rounded-2xl overflow-hidden bg-stone-950 flex flex-col items-center justify-between shadow-inner select-none">
              {/* Optional real camera video feed */}
              {useLiveCamera ? (
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                /* Ambient luxury backdrop simulation */
                <div className="absolute inset-0 bg-radial from-stone-900 via-stone-950 to-black opacity-95">
                  {/* Subtle cosmetic bottle silhouette */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <div className="w-24 h-48 border-2 border-dashed border-white rounded-t-3xl rounded-b-lg" />
                  </div>
                </div>
              )}

              {/* Torch Light simulation overlay */}
              {isTorchOn && (
                <div className="absolute inset-0 bg-white/20 pointer-events-none mix-blend-screen transition-opacity" />
              )}

              {/* Top Viewfinder Controls */}
              <div className="relative z-20 w-full pt-3 px-4 flex items-center justify-between text-white text-xs">
                {/* Switcher: Barcode vs QR code */}
                <div className="flex items-center bg-black/60 backdrop-blur-md rounded-full p-0.5 border border-white/20 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setScannerType('barcode')}
                    className={`px-3 py-1 rounded-full text-[11px] transition-all flex items-center gap-1 ${
                      scannerType === 'barcode' ? 'bg-[#962F43] text-white font-semibold' : 'text-stone-300 hover:text-white'
                    }`}
                  >
                    <Barcode className="w-3 h-3" />
                    <span>条形码 (EAN-13)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScannerType('qr')}
                    className={`px-3 py-1 rounded-full text-[11px] transition-all flex items-center gap-1 ${
                      scannerType === 'qr' ? 'bg-[#962F43] text-white font-semibold' : 'text-stone-300 hover:text-white'
                    }`}
                  >
                    <QrCode className="w-3 h-3" />
                    <span>溯源二维码</span>
                  </button>
                </div>

                {/* Torch & Sound Toggles */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsTorchOn(!isTorchOn)}
                    title={isTorchOn ? "关闭补光灯" : "开启补光灯"}
                    className={`p-1.5 rounded-full backdrop-blur-md border transition-colors ${
                      isTorchOn ? 'bg-amber-400 text-stone-900 border-amber-300' : 'bg-black/60 text-white border-white/20 hover:bg-black/80'
                    }`}
                  >
                    {isTorchOn ? <Zap className="w-3.5 h-3.5" /> : <ZapOff className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSoundOn(!isSoundOn)}
                    title={isSoundOn ? "静音扫描提示" : "开启提示音"}
                    className={`p-1.5 rounded-full backdrop-blur-md border transition-colors ${
                      isSoundOn ? 'bg-[#52B5A5] text-white border-emerald-400' : 'bg-black/60 text-stone-400 border-white/20'
                    }`}
                  >
                    {isSoundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Viewfinder Center Scanning Cutout with Corners & Laser */}
              <div className="relative z-10 flex flex-col items-center justify-center my-auto">
                <div 
                  className={`relative transition-all duration-300 ${
                    scannerType === 'barcode' 
                      ? 'w-64 h-36' 
                      : 'w-48 h-48'
                  } ${scanSuccessAnimation ? 'ring-4 ring-emerald-400 scale-105' : ''}`}
                >
                  {/* Corner Brackets */}
                  {/* Top-Left */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-[#D9534F] rounded-tl-sm" />
                  {/* Top-Right */}
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-[#D9534F] rounded-tr-sm" />
                  {/* Bottom-Left */}
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-[#D9534F] rounded-bl-sm" />
                  {/* Bottom-Right */}
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-[#D9534F] rounded-br-sm" />

                  {/* Animated Laser Scanning Beam */}
                  <div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-[#E85D75] to-transparent shadow-[0_0_12px_#E85D75] animate-scan-laser pointer-events-none" />

                  {/* Aiming Reticle Dots */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                    <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                  </div>
                </div>

                {/* Subtitle guide */}
                <p className="text-[11px] text-white/90 font-medium tracking-wide drop-shadow-md mt-2 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>
                    {scannerType === 'barcode' 
                      ? '将条形码对准红框内即可自动秒级解析' 
                      : '将包装盒上的正品溯源二维码对准取景框'}
                  </span>
                </p>
              </div>

              {useLiveCamera && <button type="button" onClick={() => { void captureBarcodeFrame(); }} disabled={isScanning} className="relative z-20 mb-2 px-4 py-2 rounded-full bg-[#962F43] text-white text-xs font-semibold shadow-lg">拍摄当前画面并识别</button>}

              {/* Bottom Viewfinder Bar */}
              <div className="relative z-20 w-full pb-3 px-4 flex items-center justify-between text-white/90 text-xs">
                {/* Switch to real camera if available */}
                <button
                  type="button"
                  onClick={() => {
                    if (useLiveCamera) stopCamera();
                    else startCamera();
                  }}
                  className="px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-[11px] flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{useLiveCamera ? '关闭镜头' : '启动实景镜头'}</span>
                </button>

                {/* Upload from album */}
                <label className="px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-[11px] flex items-center gap-1 cursor-pointer transition-colors">
                  <Upload className="w-3 h-3" />
                  <span>相册识码</span>
                  <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
                </label>

                {/* Manual text input toggle */}
                <button
                  type="button"
                  onClick={() => setShowManualCodeInput(!showManualCodeInput)}
                  className="px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-[11px] flex items-center gap-1 transition-colors"
                >
                  <Barcode className="w-3 h-3" />
                  <span>输码</span>
                </button>
              </div>
            </div>

            {/* Camera error message if permission denied */}
            {cameraError && (
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200">
                {cameraError}
              </p>
            )}

            {/* Manual Code Input Bar (in case barcode is scratched or dirty) */}
            {showManualCodeInput && (
              <div className="p-3 bg-[#FAF6F3] rounded-2xl border border-[#EDE5DE] space-y-2">
                <span className="text-xs font-bold text-stone-800 block">
                  手动输入商品条码 (13位数字或溯源链接)
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualCodeInput}
                    onChange={(e) => setManualCodeInput(e.target.value)}
                    placeholder="如：6923700941829"
                    className="flex-1 px-3 py-1.5 text-xs bg-white rounded-xl border border-[#EDE5DE] focus:outline-none focus:ring-1 focus:ring-[#962F43]"
                  />
                  <button
                    type="button"
                    onClick={() => handleScanCode(manualCodeInput, manualCodeInput.length > 15 ? 'qr_code' : 'barcode')}
                    className="px-4 py-1.5 bg-[#962F43] text-white rounded-xl text-xs font-medium hover:bg-[#832637] transition-colors"
                  >
                    查询
                  </button>
                </div>
              </div>
            )}

            {/* Scanned Result Card */}
            {scannedResult && (
              <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 shadow-sm space-y-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-950">
                        {scannedResult.scan_type === 'barcode' ? '条形码识别成功' : '包装盒溯源二维码解析成功'}
                      </h4>
                      <span className="text-[10px] text-emerald-700 font-mono">
                        {scannedResult.barcode} · 国家化妆品条码库已配准
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-medium">
                    PAO {scannedResult.product.pao_months || 12}M
                  </span>
                </div>

                {/* Product Card Details */}
                <div className="p-3 bg-white rounded-xl border border-emerald-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900 text-sm">
                      {scannedResult.product.brand} · {scannedResult.product.product_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-stone-500">
                    <span className="bg-stone-100 px-2 py-0.5 rounded-md font-medium">
                      品类: {scannedResult.product.subcategory}
                    </span>
                    {scannedResult.product.size && (
                      <span className="bg-stone-100 px-2 py-0.5 rounded-md font-mono">
                        规格: {scannedResult.product.size}
                      </span>
                    )}
                    {scannedResult.product.price && (
                      <span className="text-[#962F43] font-bold font-serif">
                        ¥{scannedResult.product.price}
                      </span>
                    )}
                  </div>

                  {scannedResult.product.ingredients && scannedResult.product.ingredients.length > 0 && (
                    <p className="text-[10px] text-stone-500 line-clamp-1 pt-0.5">
                      <strong className="text-stone-700">核心成分：</strong>
                      {scannedResult.product.ingredients.join('、')}
                    </p>
                  )}

                  <p className="text-[11px] text-stone-600 pt-0.5 leading-relaxed">
                    {scannedResult.product.user_notes}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDirectCommitScanned}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#962F43] text-white text-xs font-semibold hover:bg-[#832637] transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>立即一键存入化妆台</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyToForm(scannedResult.product)}
                    className="py-2.5 px-3 rounded-xl bg-white border border-stone-300 text-stone-700 text-xs font-medium hover:bg-stone-50 transition-colors flex items-center gap-1"
                  >
                    <span>核对微调</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {unmatchedCode && !scannedResult && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 text-xs font-semibold"><AlertCircle className="w-4 h-4" />已识别编码，但商品库暂无匹配</div>
                <div className="text-[11px] font-mono break-all">{unmatchedCode.type === 'barcode' ? '条形码' : '二维码'}：{unmatchedCode.content}</div>
                <button type="button" onClick={() => { setBrand(''); setProductName(''); setUserNotes(`已识别编码：${unmatchedCode.content}，商品信息待人工补充。`); setMode('manual'); }} className="w-full py-2 rounded-xl bg-amber-700 text-white text-xs font-semibold">手动补充商品信息</button>
              </div>
            )}

            {/* Quick Demo Scan Targets (Simulate scanning real cosmetics) */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#962F43]" />
                  <span>现场演示快捷扫码 (点击模拟摄像头扫入条形码/二维码)</span>
                </span>
                <span className="text-[10px] text-stone-400">已内置GS1条码库</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={isScanning}
                  onClick={() => handleScanCode('6923700941829', 'barcode')}
                  className="p-2.5 rounded-xl border border-stone-200 hover:border-[#962F43] hover:bg-[#FAF6F3] text-left text-xs bg-white transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-50 text-[#962F43] font-semibold">条形码</span>
                    <span className="text-[9px] font-mono text-stone-400">69237...</span>
                  </div>
                  <span className="font-bold block truncate text-stone-900 group-hover:text-[#962F43]">欧莱雅 注光小黑瓶</span>
                  <span className="text-[10px] text-stone-500">二裂酵母·PAO 12M</span>
                </button>

                <button
                  type="button"
                  disabled={isScanning}
                  onClick={() => handleScanCode('3337875588302', 'barcode')}
                  className="p-2.5 rounded-xl border border-stone-200 hover:border-[#962F43] hover:bg-[#FAF6F3] text-left text-xs bg-white transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-semibold">进口条码</span>
                    <span className="text-[9px] font-mono text-stone-400">33378...</span>
                  </div>
                  <span className="font-bold block truncate text-stone-900 group-hover:text-[#962F43]">理肤泉 B5 修复霜</span>
                  <span className="text-[10px] text-stone-500">维生素B5·PAO 6M</span>
                </button>

                <button
                  type="button"
                  disabled={isScanning}
                  onClick={() => handleScanCode('3614272890637', 'barcode')}
                  className="p-2.5 rounded-xl border border-stone-200 hover:border-[#962F43] hover:bg-[#FAF6F3] text-left text-xs bg-white transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-semibold">彩妆条码</span>
                    <span className="text-[9px] font-mono text-stone-400">36142...</span>
                  </div>
                  <span className="font-bold block truncate text-stone-900 group-hover:text-[#962F43]">YSL 小金条 #1966</span>
                  <span className="text-[10px] text-stone-500">红棕口红·PAO 18M</span>
                </button>

                <button
                  type="button"
                  disabled={isScanning}
                  onClick={() => handleScanCode('https://hr-cosmetics.com/trace/3605521415349', 'qr_code')}
                  className="p-2.5 rounded-xl border border-stone-200 hover:border-[#962F43] hover:bg-[#FAF6F3] text-left text-xs bg-white transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 font-semibold">溯源二维码</span>
                    <span className="text-[9px] font-mono text-stone-400">QR-Code</span>
                  </div>
                  <span className="font-bold block truncate text-stone-900 group-hover:text-[#962F43]">赫莲娜 黑绷带面霜</span>
                  <span className="text-[10px] text-stone-500">30%玻色因·PAO 12M</span>
                </button>

                <button
                  type="button"
                  disabled={isScanning}
                  onClick={() => handleScanCode('6902395729103', 'barcode')}
                  className="p-2.5 rounded-xl border border-stone-200 hover:border-[#962F43] hover:bg-[#FAF6F3] text-left text-xs bg-white transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-700 font-semibold">底妆条码</span>
                    <span className="text-[9px] font-mono text-stone-400">69023...</span>
                  </div>
                  <span className="font-bold block truncate text-stone-900 group-hover:text-[#962F43]">兰蔻 菁纯粉底液</span>
                  <span className="text-[10px] text-stone-500">#100-PO 瓷白·PAO 12M</span>
                </button>

                <button
                  type="button"
                  disabled={isScanning}
                  onClick={() => handleScanCode('8809581471329', 'barcode')}
                  className="p-2.5 rounded-xl border border-stone-200 hover:border-[#962F43] hover:bg-[#FAF6F3] text-left text-xs bg-white transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-50 text-orange-700 font-semibold">眼影条码</span>
                    <span className="text-[9px] font-mono text-stone-400">88095...</span>
                  </div>
                  <span className="font-bold block truncate text-stone-900 group-hover:text-[#962F43]">3CE 九宫格眼影</span>
                  <span className="text-[10px] text-stone-500">#OVERTAKE·PAO 24M</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* Mode 2: Camera AI OCR (Package Text Recognition)          */}
        {/* ======================================================== */}
        {mode === 'camera' && (
          <div className="space-y-4">
            <div className="p-6 border-2 border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden bg-stone-50">
              {useLiveCamera ? (
                <div className="relative w-full h-44 rounded-xl overflow-hidden bg-stone-950">
                  <video ref={videoRef} playsInline autoPlay muted className="w-full h-full object-cover" />
                  <div className="absolute inset-x-8 top-1/2 border-t-2 border-[#962F43]" />
                  <div className="absolute bottom-2 inset-x-0 text-center text-[10px] text-white">确认包装清晰后点击下方“拍摄并识别”</div>
                </div>
              ) : scanPreviewImage ? (
                <div className="relative w-full h-44 rounded-xl overflow-hidden">
                  <img src={scanPreviewImage} alt="包装照片" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setScanPreviewImage(null)}
                    className="absolute top-2 right-2 p-1.5 bg-stone-900/80 text-white rounded-full hover:bg-stone-900 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <Camera className="w-8 h-8 text-stone-400 mb-2" />
                  <span className="text-xs font-bold text-stone-800">拍摄护肤品/彩妆外包装</span>
                  <p className="text-[11px] text-stone-500 mt-0.5 max-w-xs">
                    智能提取品牌、产品全称、规格、PAO 开盖罐子图标与核心成分
                  </p>
                  <div className="flex gap-2 mt-3">
                    <label className="px-4 py-2 bg-white border border-stone-200 text-stone-700 text-xs font-medium rounded-xl hover:bg-stone-50 cursor-pointer shadow-2xs">
                      <span>从相册选择照片</span>
                      <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
                    </label>

                    <button type="button" onClick={() => { void startCamera(); }} className="px-4 py-2 bg-stone-900 text-white text-xs font-medium rounded-xl hover:bg-stone-800 shadow-2xs flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5" /><span>打开摄像头</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode('barcode')}
                      className="px-4 py-2 bg-[#962F43] text-white text-xs font-medium rounded-xl hover:bg-[#832637] shadow-2xs flex items-center gap-1"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>切换扫条码/二维码</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {useLiveCamera && <div className="flex gap-2"><button type="button" onClick={() => { void capturePhoto(); }} disabled={isScanning} className="flex-1 py-2.5 bg-[#962F43] text-white rounded-xl text-xs font-semibold">拍摄并识别</button><button type="button" onClick={stopCamera} className="px-4 py-2.5 border border-stone-200 rounded-xl text-xs">取消</button></div>}

            <p className="text-[11px] text-stone-500">识别结果只来自你拍摄或选择的真实图片；如果识别失败，请调整光线、距离后重新拍摄。</p>

            {isScanning && (
              <div className="p-3 bg-amber-50 text-amber-900 rounded-xl text-xs flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin text-amber-600" />
                <span>AI 正在识别包装文字与 PAO 符号，并提取成分表...</span>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* Mode 3: Manual Form Confirmation                         */}
        {/* ======================================================== */}
        {mode === 'manual' && (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">品牌</label>
                <input
                  type="text"
                  required
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="如：巴黎欧莱雅"
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">产品全称</label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="如：第二代黑精华肌底液"
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">大类</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProductCategory)}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                >
                  <option value="skincare">护肤</option>
                  <option value="base">底妆</option>
                  <option value="eye">眼妆</option>
                  <option value="lip">唇妆</option>
                  <option value="tool">工具</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">细分子类别</label>
                <input
                  type="text"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  placeholder="如：精华/面霜"
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">色号 (彩妆可选)</label>
                <input
                  type="text"
                  value={shadeName}
                  onChange={(e) => setShadeName(e.target.value)}
                  placeholder="如：#1966"
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">开封日期</label>
                <input
                  type="date"
                  value={openedDate}
                  onChange={(e) => setOpenedDate(e.target.value)}
                  className="w-full px-2 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  开盖保质期 PAO
                </label>
                <select
                  value={paoMonths}
                  onChange={(e) => setPaoMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                >
                  <option value={3}>3M (3个月)</option>
                  <option value={6}>6M (半年)</option>
                  <option value={12}>12M (1年)</option>
                  <option value={18}>18M (1.5年)</option>
                  <option value={24}>24M (2年)</option>
                  <option value={36}>36M (3年)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">计算到期日</label>
                <div className="px-3 py-2 text-xs bg-stone-100 rounded-xl text-stone-600 font-mono">
                  {calculateExpiry(openedDate, paoMonths)}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">存放位置 (梳妆台收纳)</label>
              <input
                type="text"
                value={shelfLocation}
                onChange={(e) => setShelfLocation(e.target.value)}
                placeholder="如：梳妆台一层·常用区 / 避光抽屉"
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                主要成分 (用逗号分隔，用于兼容性检测与避雷拦截)
              </label>
              <input
                type="text"
                value={ingredientsText}
                onChange={(e) => setIngredientsText(e.target.value)}
                placeholder="如：二裂酵母, 水杨酰植物鞘氨醇, 透明质酸钠"
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                个人使用感受或购买备注
              </label>
              <textarea
                rows={2}
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="如：质地清爽，上脸好吸收，适合搭配修护类面霜"
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-xl"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs"
              >
                确认录入我的化妆台
              </button>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* Mode 4: Batch Import Simulation                          */}
        {/* ======================================================== */}
        {mode === 'batch' && (
          <div className="space-y-4">
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-xs text-stone-700">
              <span className="font-bold text-stone-900 block">批量导入功能说明</span>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                适合化妆品数量较多的用户，支持通过电商购物记录截图、全家福梳妆台拍照、或批量扫码连投一次性导入多件宝贝。
              </p>
              <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                <span className="font-semibold text-stone-800 text-[11px]">演示示例批次包含：</span>
                <ul className="list-disc pl-4 text-[10px] text-stone-600 space-y-0.5">
                  <li>CPB (肌肤之钥) 光透白密集焕亮长管隔离乳 37ml</li>
                  <li>NARS 流光美肌清透蜜粉饼 (大白饼)</li>
                </ul>
              </div>
            </div>

            <label className="w-full py-3 px-4 bg-stone-900 text-white rounded-2xl text-xs font-semibold hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>{isScanning ? '识别中…' : '上传化妆柜照片并识别商品'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleProductShelfUpload} disabled={isScanning} />
            </label>
            {productDetectMessage && <p className="text-[11px] text-stone-600 bg-stone-50 rounded-xl p-3">{productDetectMessage}</p>}
            {detectedProducts.length > 0 && (
              <div className="space-y-2">
                {detectedProducts.map((product, index) => (
                  <div key={`${product.name}-${index}`} className="flex items-center justify-between rounded-xl border border-stone-200 p-3 text-xs">
                    <div><span className="font-semibold text-stone-800">{product.name || '待确认商品'}</span><span className="block text-[10px] text-stone-500">{product.parents || '腾讯云商品识别'} · 置信度 {Math.round(Number(product.confidence || 0))}%</span>{codeForProduct(product) && <span className="block text-[10px] text-emerald-700">{codeForProduct(product)!.type} · {codeForProduct(product)!.content}</span>}</div>
                    <button type="button" onClick={() => { setProductName(product.name || ''); setBrand(product.parents || ''); setMode('manual'); }} className="px-3 py-1.5 rounded-lg bg-[#962F43] text-white text-[10px]">补充并录入</button>
                  </div>
                ))}
                {detectedProducts.length === 0 && detectedCodes.map((code, index) => <div key={`${code.content}-${index}`} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs"><span className="font-semibold">已识别 {code.type}</span><span className="block text-[10px] break-all">{code.content}</span><span className="block text-[10px] text-stone-500">未能可靠关联到商品，请手动确认</span></div>)}
              </div>
            )}
            <button type="button" onClick={handleBatchImport} className="w-full py-2.5 px-4 border border-stone-200 text-stone-600 rounded-2xl text-xs font-medium hover:bg-stone-50 transition-colors flex items-center justify-center gap-2">
              <Layers className="w-4 h-4" /><span>使用演示数据快速导入</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
