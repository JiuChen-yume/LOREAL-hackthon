import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Check, 
  Sparkles, 
  RotateCcw, 
  Upload, 
  Link2, 
  Wand2, 
  ZoomIn, 
  ZoomOut, 
  SlidersHorizontal,
  ChevronRight,
  BookOpen,
  Image as ImageIcon,
  Heart,
  Plus,
  Download
} from 'lucide-react';
import { BeautyProduct } from '../../types/beauty';
import { 
  homePortraitImg, 
  makeupGlamourImg, 
  makeupLookImg 
} from '../../data/mockData';
import { ArSdk } from 'tencentcloud-webar';
import { LocalLipMaskRenderer } from '../../services/tryOn/LocalLipMaskRenderer';

export type BeautyCategory = 
  | '套装' 
  | '睫毛' 
  | '眉毛' 
  | '眼线' 
  | '口红' 
  | '腮红' 
  | '修容' 
  | '眼影' 
  | '高光' 
  | '美瞳';

interface Image4BeautyEditorProps {
  userPhotoUrl: string;
  /** Optional Seedream result. It is shown as the actual AI preview while the original remains the WebAR input. */
  generatedImage?: string;
  onClose: () => void;
  products: BeautyProduct[];
  onSaveLook?: (lookTitle: string, rating: 'red' | 'yellow' | 'black') => void;
  onConfirmFollowAlong?: () => void;
  initialSet?: string;
}

export const Image4BeautyEditor: React.FC<Image4BeautyEditorProps> = ({
  userPhotoUrl: initialPhoto,
  generatedImage,
  onClose,
  products,
  onSaveLook,
  onConfirmFollowAlong,
  initialSet = '韩蕾妆'
}) => {
  const [photoUrl, setPhotoUrl] = useState(initialPhoto);
  const [activeCategory, setActiveCategory] = useState<BeautyCategory>('套装');

  // View modes: 'normal' | 'split' | '3d' | 'zoom'
  const [viewMode, setViewMode] = useState<'normal' | 'split' | 'zoom'>('normal');
  const [splitPos, setSplitPos] = useState(50);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const startPanRef = useRef({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const webarCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const webarSdkRef = useRef<ArSdk | null>(null);
  const [webarStatus, setWebarStatus] = useState<'idle' | 'starting' | 'ready' | 'error'>('idle');
  const [webarMessage, setWebarMessage] = useState('正在准备腾讯 WebAR…');
  const [webarEffects, setWebarEffects] = useState<Array<{ EffectId?: string; Name?: string; CoverUrl?: string; Label?: string | string[] }>>([]);
  const [webarFaceDetected, setWebarFaceDetected] = useState(false);
  const localLipRendererRef = useRef<LocalLipMaskRenderer | null>(null);
  const [localLipStatus, setLocalLipStatus] = useState<'idle' | 'starting' | 'ready' | 'error'>('idle');
  const [localLipFaceDetected, setLocalLipFaceDetected] = useState(false);
  const [activeTencentEffectId, setActiveTencentEffectId] = useState('');
  const webarEffectForSetRef = useRef<Record<string, string>>({});

  // Toast notice
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Use the uploaded portrait as Tencent WebAR's image input. This is the
  // full-screen studio path shown in the user's screenshot; the older CSS
  // overlays remain available while the SDK is loading or unavailable.
  useEffect(() => {
    let disposed = false;
    const startWebAR = async () => {
      if (!webarCanvasRef.current || webarSdkRef.current) return;
      setWebarStatus('starting');
      setWebarMessage('正在识别人脸并加载妆效…');
      try {
        const configResponse = await fetch('/api/webar/config');
        if (!configResponse.ok) throw new Error('WEBAR_CONFIG_MISSING');
        const config = await configResponse.json() as { success: boolean; config?: { appId: string; licenseKey: string } };
        if (!config.success || !config.config?.appId || !config.config.licenseKey) throw new Error('WEBAR_CONFIG_MISSING');
        // Tencent's still-image pipeline is more reliable with a decoded
        // HTMLImageElement plus explicit dimensions than with a raw data URL.
        // This matters especially for photos selected from a local file input.
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.src = initialPhoto;
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error('WEBAR_IMAGE_LOAD_FAILED'));
        });
        if (!image.naturalWidth || !image.naturalHeight) throw new Error('WEBAR_IMAGE_LOAD_FAILED');
        const sdk = new ArSdk({
          auth: {
            appId: config.config.appId,
            licenseKey: config.config.licenseKey,
            authFunc: async () => {
              const response = await fetch('/api/webar/signature');
              if (!response.ok) throw new Error('WEBAR_SIGNATURE_FAILED');
              return response.json();
            }
          },
          module: { beautify: true },
          input: { src: image, width: image.naturalWidth, height: image.naturalHeight },
          mirror: false,
          output: webarCanvasRef.current,
          language: 'zh',
          resolution: 720
        });
        webarSdkRef.current = sdk;
        const loadMakeupMaterials = async () => {
          try {
            const list = await sdk.getEffectList({ Type: 'Preset', Label: ['Makeup', 'Woman'] });
            if (!disposed) setWebarEffects(Array.isArray(list) ? list : []);
          } catch (error) {
            console.warn('Unable to load Tencent makeup materials', error);
          }
        };
        const markWebARReady = () => {
          if (disposed) return;
          try {
            sdk.updateInputImage({ width: image.naturalWidth, height: image.naturalHeight, input: image });
          } catch (error) {
            console.warn('Unable to update WebAR image input', error);
          }
          setWebarStatus('ready');
          setWebarMessage('已识别人脸 · 点击下方妆容即可修改');
          void loadMakeupMaterials();
        };
        // `resourceReady` is the documented event for image processing. Keep
        // `ready` as a compatibility fallback for older SDK builds.
        sdk.on('resourceReady', markWebARReady);
        sdk.on('created', loadMakeupMaterials);
        sdk.on('ready', markWebARReady);
        sdk.on('detectStatusChange', (data) => setWebarFaceDetected(Boolean(data?.faceDetected ?? data?.status ?? true)));
        sdk.on('result', () => setWebarFaceDetected(true));
        sdk.on('error', (error) => {
          console.error('Tencent WebAR error', error);
          if (!disposed) { setWebarStatus('error'); setWebarMessage('WebAR 初始化失败，当前显示本地回退效果'); }
        });
      } catch (error) {
        console.error(error);
        if (!disposed) {
          setWebarStatus('error');
          setWebarMessage(error instanceof Error && error.message === 'WEBAR_CONFIG_MISSING'
            ? '当前本地服务未配置 WebAR Secret，使用回退预览'
            : error instanceof Error && error.message === 'WEBAR_IMAGE_LOAD_FAILED'
              ? '图片无法解码，请上传 JPG、PNG 或清晰正面照片'
              : 'WebAR 初始化失败，使用回退预览');
        }
      }
    };
    startWebAR();
    return () => {
      disposed = true;
      webarSdkRef.current?.destroy();
      webarSdkRef.current = null;
    };
  }, [initialPhoto]);

  const applyWebAREffect = (id?: string) => {
    if (!id || webarStatus !== 'ready') return;
    setActiveTencentEffectId(id);
    webarSdkRef.current?.setEffect({ id, intensity: 1, filterIntensity: 1 });
  };

  const matchWebAREffect = (setName: string) => {
    const existing = webarEffectForSetRef.current[setName];
    if (existing) return existing;
    const normalized = setName.replace(/妆|感|式|新|中/g, '').toLowerCase();
    const match = webarEffects.find(effect => `${effect.Name || ''}${Array.isArray(effect.Label) ? effect.Label.join('') : effect.Label || ''}`.toLowerCase().includes(normalized));
    const id = match?.EffectId;
    if (id) webarEffectForSetRef.current[setName] = id;
    return id;
  };

  // 1. 套装 (Sets)
  const [activeSetId, setActiveSetId] = useState<string>(initialSet);
  const [customSets, setCustomSets] = useState<Array<{
    id: string;
    name: string;
    avatar: string;
    tag: string;
    lipHex: string;
    blushHex: string;
    eyeHex: string;
    lashStyle: string;
    linerStyle: string;
    fromTutorial?: boolean;
    tutorialTitle?: string;
  }>>([
    { id: 'none', name: '无 / 裸妆', avatar: homePortraitImg, tag: '素颜原生', lipHex: '#B2382D', blushHex: '#F5A4AC', eyeHex: '#A67B6F', lashStyle: 'none', linerStyle: 'none' },
    { id: '韩蕾妆', name: '韩蕾妆', avatar: makeupLookImg, tag: '水光清冷', lipHex: '#C45868', blushHex: '#F5A4AC', eyeHex: '#A67B6F', lashStyle: 'sunflower', linerStyle: 'natural' },
    { id: '清透', name: '清透', avatar: homePortraitImg, tag: '白开水妆', lipHex: '#E0735E', blushHex: '#F5A4AC', eyeHex: '#C27C72', lashStyle: 'slim', linerStyle: 'inner' },
    { id: '氧气感', name: '氧气感', avatar: makeupGlamourImg, tag: '初恋元气', lipHex: '#B2382D', blushHex: '#E2847A', eyeHex: '#A67B6F', lashStyle: 'clusters', linerStyle: 'natural' },
    { id: '伪素颜', name: '伪素颜', avatar: homePortraitImg, tag: '通透自然', lipHex: '#C45868', blushHex: '#E8A48B', eyeHex: '#9C6858', lashStyle: 'slim', linerStyle: 'none' },
    { id: '甜酷混血', name: '轻欧美混血', avatar: makeupGlamourImg, tag: '骨相深邃', lipHex: '#9E4B3E', blushHex: '#D08770', eyeHex: '#6E4E42', lashStyle: 'winged', linerStyle: 'winged' },
    { id: '漫展COS', name: '漫展COS', avatar: makeupLookImg, tag: '二次元大眼', lipHex: '#8B1E3F', blushHex: '#E85D75', eyeHex: '#522039', lashStyle: 'anime', linerStyle: 'anime' },
    { id: '新中式千金', name: '新中式千金', avatar: homePortraitImg, tag: '端庄朱砂', lipHex: '#B3262E', blushHex: '#E5928F', eyeHex: '#82594E', lashStyle: 'slim', linerStyle: 'natural' }
  ]);

  // Modal: Import Tutorial Link or Picture
  const [showImportModal, setShowImportModal] = useState(false);
  const [tutorialInput, setTutorialInput] = useState('');
  const [isAnalyzingTutorial, setIsAnalyzingTutorial] = useState(false);

  // 2. 睫毛 (Eyelashes)
  const [activeLash, setActiveLash] = useState<string>('sunflower');
  const [lashDensity, setLashDensity] = useState(70);

  // 3. 眉毛 (Eyebrows)
  const [activeBrow, setActiveBrow] = useState<string>('wild');
  const [browColor, setBrowColor] = useState<string>('#4A3728'); // 灰棕

  // 4. 眼线 (Eyeliner)
  const [activeLiner, setActiveLiner] = useState<string>('natural');
  const [linerColor, setLinerColor] = useState<string>('#2B1E1A');

  // 5. 口红 (Lipstick)
  // Pull existing vanity lipsticks from products!
  const demoLipSkus = [
    { id: 'tryon-demo-br784', brand: '植村秀', product_name: '小黑方绢感唇膏', category: 'lip' as const, subcategory: '口红', shade_name: 'BR784 赤狐红棕', shade_hex: '#8d2d2a', try_on: { provider: 'local-lip-mask' as const, status: 'fallback' as const, defaultIntensity: 75, finish: 'dewy' as const } },
    { id: 'tryon-demo-rd01', brand: '植村秀', product_name: '小黑方绢感唇膏', category: 'lip' as const, subcategory: '口红', shade_name: 'RD01 朱砂正红', shade_hex: '#b3262e', try_on: { provider: 'local-lip-mask' as const, status: 'fallback' as const, defaultIntensity: 70, finish: 'matte' as const } },
    { id: 'tryon-demo-pk04', brand: '植村秀', product_name: '小黑方绢感唇膏', category: 'lip' as const, subcategory: '口红', shade_name: 'PK04 豆沙粉', shade_hex: '#c45868', try_on: { provider: 'local-lip-mask' as const, status: 'fallback' as const, defaultIntensity: 60, finish: 'dewy' as const } },
  ] as BeautyProduct[];
  const vanityLipsticks = [...products.filter(p => p.category === 'lip' || p.subcategory.includes('口红') || p.subcategory.includes('唇')), ...demoLipSkus]
    .filter((product, index, list) => list.findIndex(item => item.id === product.id) === index);
  const [activeLipProduct, setActiveLipProduct] = useState<string>(vanityLipsticks[0]?.product_name || '植村秀小黑方 BR784');
  const [lipHex, setLipHex] = useState<string>(vanityLipsticks[0]?.shade_hex || '#8d2d2a');
  const [lipDepth, setLipDepth] = useState<number>(75);
  const [lipTexture, setLipTexture] = useState<'dewy' | 'matte' | 'gloss'>('dewy');
  const [lipEnabled, setLipEnabled] = useState(true);

  // 6. 腮红 (Blush)
  const vanityBlushes = products.filter(p => p.category === 'eye' || p.subcategory.includes('腮红') || p.product_name.includes('腮红') || p.repurpose_ideas?.some(r => r.includes('腮红')));
  const [activeBlushProduct, setActiveBlushProduct] = useState<string>(vanityBlushes[0]?.product_name || '植村秀同色系膏状腮红');
  const [blushHex, setBlushHex] = useState<string>('#F5A4AC');
  const [blushAmount, setBlushAmount] = useState<number>(60);
  const [blushPlacement, setBlushPlacement] = useState<'center' | 'cheekbone' | 'undereye' | 'nose'>('center');
  const [blushEnabled, setBlushEnabled] = useState(true);

  // 7. 修容 (Contour)
  const [contourStyle, setContourStyle] = useState<'nose' | 'jaw' | 'full'>('full');
  const [contourIntensity, setContourIntensity] = useState(50);
  const [contourEnabled, setContourEnabled] = useState(true);

  // 8. 眼影 (Eyeshadow)
  const vanityEyeShadows = products.filter(p => p.category === 'eye' || p.subcategory.includes('眼影'));
  const [activeEyeProduct, setActiveEyeProduct] = useState<string>(vanityEyeShadows[0]?.product_name || '3CE九宫格眼影 OVERTAKE');
  const [eyeHex, setEyeHex] = useState<string>(vanityEyeShadows[0]?.shade_hex || '#A67B6F');
  const [eyeIntensity, setEyeIntensity] = useState<number>(65);
  const [eyeEnabled, setEyeEnabled] = useState(true);

  // 9. 高光 (Highlighter)
  const [highlighterArea, setHighlighterArea] = useState<'nose_bridge' | 'triangle' | 'all'>('all');
  const [highlighterIntensity, setHighlighterIntensity] = useState(60);
  const [highlighterEnabled, setHighlighterEnabled] = useState(true);

  // 10. 美瞳 (Contact Lenses)
  const [activeLens, setActiveLens] = useState<string>('water_black'); // 'none' | 'water_black' | 'olive_green' | 'amber_brown' | 'cos_blue'

  const renderLocalMakeup = async (color = lipHex, intensity = lipDepth) => {
    if (!localLipRendererRef.current || !webarCanvasRef.current) return false;
    const image = new Image();
    image.src = photoUrl;
    await new Promise<void>((resolve, reject) => {
      if (image.complete && image.naturalWidth) return resolve();
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('TRY_ON_IMAGE_LOAD_FAILED'));
    });
    const detected = localLipRendererRef.current.renderMakeup(image, webarCanvasRef.current, {
      lip: lipEnabled ? { color, intensity, finish: lipTexture } : undefined,
      blush: blushEnabled ? { color: blushHex, intensity: blushAmount, placement: blushPlacement } : undefined,
      eye: eyeEnabled ? { color: eyeHex, intensity: eyeIntensity } : undefined,
      brow: activeBrow !== 'none' ? { color: browColor, intensity: 65, style: activeBrow } : undefined,
      liner: activeLiner !== 'none' ? { color: linerColor, intensity: 70, style: activeLiner } : undefined,
      contour: contourEnabled ? { intensity: contourIntensity, style: contourStyle } : undefined,
      highlight: highlighterEnabled ? { intensity: highlighterIntensity, area: highlighterArea } : undefined,
      lens: activeLens !== 'none' ? { color: activeLens === 'olive_green' ? '#4A6B53' : activeLens === 'cos_blue' ? '#2A6F97' : '#5C4033', intensity: 65 } : undefined,
      lash: activeLash !== 'none' ? { intensity: lashDensity, style: activeLash } : undefined,
    });
    setLocalLipFaceDetected(detected);
    setActiveTencentEffectId('');
    return detected;
  };

  useEffect(() => {
    let disposed = false;
    const initializeLocalRenderer = async () => {
      setLocalLipStatus('starting');
      try {
        const renderer = new LocalLipMaskRenderer();
        await renderer.initialize();
        if (disposed) { renderer.dispose(); return; }
        localLipRendererRef.current = renderer;
        setLocalLipStatus('ready');
        await renderLocalMakeup();
      } catch (error) {
        console.error('Local lip renderer failed', error);
        if (!disposed) setLocalLipStatus('error');
      }
    };
    initializeLocalRenderer();
    return () => {
      disposed = true;
      localLipRendererRef.current?.dispose();
      localLipRendererRef.current = null;
    };
  }, [photoUrl]);

  useEffect(() => {
    if (localLipStatus === 'ready') void renderLocalMakeup(lipHex, lipDepth);
  }, [lipHex, lipDepth, lipTexture, lipEnabled, blushHex, blushAmount, blushPlacement, blushEnabled, eyeHex, eyeIntensity, eyeEnabled, activeBrow, browColor, activeLiner, linerColor, contourEnabled, contourIntensity, contourStyle, highlighterEnabled, highlighterIntensity, highlighterArea, activeLens, activeLash, lashDensity]);

  // Categories list matching Image 4
  const categories: BeautyCategory[] = [
    '套装', '睫毛', '眉毛', '眼线', '口红', '腮红', '修容', '眼影', '高光', '美瞳'
  ];

  // Eraser (擦除): resets all makeup to bare skin
  const handleEraser = () => {
    setActiveSetId('none');
    setActiveLash('none');
    setActiveBrow('none');
    setActiveLiner('none');
    setLipEnabled(false);
    setBlushEnabled(false);
    setContourEnabled(false);
    setEyeEnabled(false);
    setHighlighterEnabled(false);
    setActiveLens('none');
    webarSdkRef.current?.setEffect(null as any);
    setActiveTencentEffectId('');
    if (localLipStatus === 'ready') void renderLocalMakeup(lipHex, 0);
    showToast('已擦除全脸彩妆，还原清爽素颜状态');
  };

  // Select a preset set
  const handleSelectSet = (set: typeof customSets[0]) => {
    setActiveSetId(set.id);
    if (set.id === 'none') {
      handleEraser();
      return;
    }
    setLipHex(set.lipHex);
    setLipEnabled(true);
    setBlushHex(set.blushHex);
    setBlushEnabled(true);
    setEyeHex(set.eyeHex);
    setEyeEnabled(true);
    setActiveLash(set.lashStyle);
    setActiveLiner(set.linerStyle);
    const effectId = matchWebAREffect(set.name);
    if (effectId) {
      setActiveTencentEffectId(effectId);
      applyWebAREffect(effectId);
    } else {
      void renderLocalMakeup(set.lipHex, lipDepth);
    }
    showToast(`已应用「${set.name}」全套妆容`);
  };

  // Apply the currently selected set once the asynchronous Tencent material
  // list arrives, so opening the studio already shows a real makeup effect.
  useEffect(() => {
    if (webarStatus !== 'ready' || !webarEffects.length || activeSetId === 'none') return;
    const selected = customSets.find(set => set.id === activeSetId);
    const effectId = matchWebAREffect(selected?.name || activeSetId);
    if (effectId) applyWebAREffect(effectId);
    else if (selected) void renderLocalMakeup(selected.lipHex, lipDepth);
  }, [webarStatus, webarEffects, activeSetId, customSets]);

  // AI Tutorial Parser -> Adds directly to 套装 list!
  const handleParseAndAddSet = async () => {
    if (!tutorialInput.trim()) {
      showToast('请输入社媒妆教链接或文本描述');
      return;
    }
    setIsAnalyzingTutorial(true);
    try {
      const response = await fetch('/api/makeup/parse-tutorial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: tutorialInput,
          description: tutorialInput,
          vanityProducts: products
        })
      });
      const data = await response.json() as { success?: boolean; result?: any };
      if (data.success && data.result) {
        const res = data.result;
        const newSet = {
          id: `custom_${Date.now()}`,
          name: res.title || '社媒同款妆教',
          avatar: makeupGlamourImg,
          tag: res.platform || 'AI定制',
          lipHex: res.lipSetting?.shadeHex || '#B2382D',
          blushHex: res.cheekSetting?.shadeHex || '#E2847A',
          eyeHex: '#9C6858',
          lashStyle: 'sunflower',
          linerStyle: 'natural',
          fromTutorial: true,
          tutorialTitle: res.title
        };
        setCustomSets(prev => [newSet, ...prev]);
        handleSelectSet(newSet);
        setShowImportModal(false);
        setTutorialInput('');
        showToast(`AI已完成拆解！已生成新套装「${newSet.name}」并应用到面部`);
      } else {
        // Fallback local set creation
        const newSet = {
          id: `custom_${Date.now()}`,
          name: tutorialInput.slice(0, 8),
          avatar: makeupGlamourImg,
          tag: '自定仿妆',
          lipHex: '#B2382D',
          blushHex: '#E2847A',
          eyeHex: '#9C6858',
          lashStyle: 'sunflower',
          linerStyle: 'natural',
          fromTutorial: true
        };
        setCustomSets(prev => [newSet, ...prev]);
        handleSelectSet(newSet);
        setShowImportModal(false);
        showToast(`已根据妆教特征加入套装列表`);
      }
    } catch (err) {
      console.error(err);
      showToast('解析失败，请检查网络后重试');
    } finally {
      setIsAnalyzingTutorial(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#121214] text-white flex flex-col select-none overflow-hidden animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-stone-900/90 border border-white/20 backdrop-blur-md text-white text-xs px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TOP VIEWPORT (Main face canvas with live makeup simulation) */}
      <div 
        ref={viewportRef}
        className="relative flex-1 w-full bg-stone-950 flex items-center justify-center overflow-hidden"
      >
        <canvas
          ref={webarCanvasRef}
          width={720}
          height={960}
          style={{ clipPath: viewMode === 'split' ? `polygon(${splitPos}% 0, 100% 0, 100% 100%, ${splitPos}% 100%)` : undefined }}
          className={`absolute inset-0 z-10 w-full h-full object-contain bg-black ${localLipStatus === 'ready' || webarStatus === 'ready' ? 'block' : 'hidden'}`}
        />
        {generatedImage && (
          <img
            src={generatedImage}
            alt="Seedream 生成妆效预览"
            className="absolute inset-0 z-[15] w-full h-full object-contain pointer-events-none"
            style={{ clipPath: viewMode === 'split' ? `polygon(${splitPos}% 0, 100% 0, 100% 100%, ${splitPos}% 100%)` : undefined }}
          />
        )}
        {generatedImage && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 rounded-full bg-rose-950/75 border border-rose-300/50 px-3 py-1 text-[11px] text-rose-100 backdrop-blur-md">
            Seedream AI 妆效图 · 已保留原图对比
          </div>
        )}
        {localLipStatus === 'ready' && !activeTencentEffectId ? (
          <div className="absolute inset-0 z-20 pointer-events-none">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 border border-cyan-400/50 px-3 py-1 text-[11px] text-cyan-200 backdrop-blur-md">
              {localLipFaceDetected ? '已定位面部关键点 · 局部妆容试妆' : '未识别到清晰面部'}
            </div>
          </div>
        ) : webarStatus === 'ready' ? (
          <div className="absolute inset-0 z-20 pointer-events-none">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 rounded-full bg-black/60 border border-emerald-400/50 px-3 py-1 text-[11px] text-emerald-200 backdrop-blur-md">
              {webarFaceDetected ? '已识别人脸 · 妆效实时预览' : '正在识别人脸…'}
            </div>
          </div>
        ) : (
          /* 2D CANVAS VIEWPORT */
          <div className="relative w-full h-full max-w-md mx-auto flex items-center justify-center overflow-hidden">
            <div 
              className="relative w-full h-full transition-transform origin-center"
              style={{
                transform: `scale(${zoomLevel}) translate(${panPos.x / zoomLevel}px, ${panPos.y / zoomLevel}px)`
              }}
            >
              {/* Bare skin background */}
              <img 
                src={photoUrl} 
                alt="Bare Face" 
                className="w-full h-full object-cover object-center filter grayscale-[6%]" 
              />

              {/* AFTER MAKEUP LAYER (Split clipped or full) */}
              <div 
                className="absolute inset-0 overflow-hidden"
                style={{
                  clipPath: viewMode === 'split' ? `polygon(${splitPos}% 0, 100% 0, 100% 100%, ${splitPos}% 100%)` : 'none'
                }}
              >
                <img 
                  src={photoUrl} 
                  alt="Face after makeup" 
                  className="w-full h-full object-cover object-center" 
                />

                {/* 1. Base skin finish (Smoothing & radiance) */}
                <div 
                  className="absolute inset-0 pointer-events-none mix-blend-soft-light"
                  style={{ backgroundColor: '#FFF0EA', opacity: 0.35 }}
                />

                {/* 2. Eye makeup (Eyeshadow) */}
                {eyeEnabled && (
                  <div 
                    className="absolute inset-x-[22%] top-[34%] h-[12%] rounded-[45%] pointer-events-none blur-[7px] transition-all"
                    style={{
                      backgroundColor: eyeHex,
                      opacity: (eyeIntensity / 100) * 0.72,
                      mixBlendMode: 'multiply'
                    }}
                  />
                )}

                {/* 3. Eyelashes layer */}
                {activeLash !== 'none' && (
                  <div 
                    className="absolute inset-x-[24%] top-[37%] h-[5%] pointer-events-none flex items-center justify-between px-3"
                    style={{ opacity: lashDensity / 100 }}
                  >
                    <div className="w-12 h-1 bg-stone-900 rounded-full blur-[0.5px] shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                    <div className="w-12 h-1 bg-stone-900 rounded-full blur-[0.5px] shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                  </div>
                )}

                {/* 4. Eyeliner layer */}
                {activeLiner !== 'none' && (
                  <div 
                    className="absolute inset-x-[23%] top-[38.5%] h-[4%] pointer-events-none flex items-center justify-between px-2"
                  >
                    <div className="w-14 h-0.5 bg-stone-900 rounded-full blur-[0.3px]" />
                    <div className="w-14 h-0.5 bg-stone-900 rounded-full blur-[0.3px]" />
                  </div>
                )}

                {/* 5. Eyebrows layer */}
                {activeBrow !== 'none' && (
                  <div 
                    className="absolute inset-x-[23%] top-[30%] h-[5%] pointer-events-none flex items-center justify-between px-2"
                  >
                    <div 
                      className="w-14 h-2.5 rounded-full blur-[1px] opacity-75"
                      style={{ backgroundColor: browColor }}
                    />
                    <div 
                      className="w-14 h-2.5 rounded-full blur-[1px] opacity-75"
                      style={{ backgroundColor: browColor }}
                    />
                  </div>
                )}

                {/* 6. Contact Lenses (美瞳) */}
                {activeLens !== 'none' && (
                  <div className="absolute inset-x-[29%] top-[38%] h-[5%] pointer-events-none flex items-center justify-between px-2">
                    <div 
                      className="w-4 h-4 rounded-full border border-white/40 blur-[0.5px]"
                      style={{ 
                        backgroundColor: activeLens === 'olive_green' ? '#4A6B53' : activeLens === 'cos_blue' ? '#2A6F97' : '#5C4033',
                        opacity: 0.65 
                      }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full border border-white/40 blur-[0.5px]"
                      style={{ 
                        backgroundColor: activeLens === 'olive_green' ? '#4A6B53' : activeLens === 'cos_blue' ? '#2A6F97' : '#5C4033',
                        opacity: 0.65 
                      }}
                    />
                  </div>
                )}

                {/* 7. Blush layer (Cheeks) */}
                {blushEnabled && (
                  <>
                    <div 
                      className={`absolute pointer-events-none blur-[15px] transition-all ${
                        blushPlacement === 'undereye' 
                          ? 'left-[22%] top-[42%] w-[22%] h-[16%]' 
                          : blushPlacement === 'cheekbone'
                          ? 'left-[14%] top-[45%] w-[26%] h-[18%]'
                          : 'left-[18%] top-[47%] w-[25%] h-[20%]'
                      } rounded-full`}
                      style={{
                        backgroundColor: blushHex,
                        opacity: (blushAmount / 100) * 0.65,
                        mixBlendMode: 'color-burn'
                      }}
                    />
                    <div 
                      className={`absolute pointer-events-none blur-[15px] transition-all ${
                        blushPlacement === 'undereye' 
                          ? 'right-[22%] top-[42%] w-[22%] h-[16%]' 
                          : blushPlacement === 'cheekbone'
                          ? 'right-[14%] top-[45%] w-[26%] h-[18%]'
                          : 'right-[18%] top-[47%] w-[25%] h-[20%]'
                      } rounded-full`}
                      style={{
                        backgroundColor: blushHex,
                        opacity: (blushAmount / 100) * 0.65,
                        mixBlendMode: 'color-burn'
                      }}
                    />
                  </>
                )}

                {/* 8. Highlighter layer (高光) */}
                {highlighterEnabled && (
                  <>
                    {/* Nose Bridge & Tip */}
                    <div 
                      className="absolute left-[49%] top-[40%] w-[2%] h-[12%] rounded-full bg-white/70 blur-[2px] pointer-events-none"
                      style={{ opacity: (highlighterIntensity / 100) * 0.8 }}
                    />
                    <div 
                      className="absolute left-[48.5%] top-[53%] w-[3%] h-[3%] rounded-full bg-white/90 blur-[1px] pointer-events-none shadow-[0_0_8px_#fff]"
                      style={{ opacity: (highlighterIntensity / 100) }}
                    />
                  </>
                )}

                {/* 9. Contour layer (修容) */}
                {contourEnabled && (
                  <>
                    <div 
                      className="absolute left-[44%] top-[41%] w-[3%] h-[14%] bg-stone-900/60 blur-[4px] pointer-events-none"
                      style={{ opacity: (contourIntensity / 100) * 0.6 }}
                    />
                    <div 
                      className="absolute right-[44%] top-[41%] w-[3%] h-[14%] bg-stone-900/60 blur-[4px] pointer-events-none"
                      style={{ opacity: (contourIntensity / 100) * 0.6 }}
                    />
                  </>
                )}

                {/* 10. Lipstick layer (唇妆) */}
                {lipEnabled && (
                  <div 
                    className="absolute inset-x-[36%] bottom-[23%] h-[12%] rounded-[50%] pointer-events-none blur-[2px] transition-all"
                    style={{
                      backgroundColor: lipHex,
                      opacity: (lipDepth / 100) * (lipTexture === 'matte' ? 0.92 : 0.82),
                      mixBlendMode: 'multiply'
                    }}
                  />
                )}
              </div>
            </div>

            {/* Split Slider Line & Drag Handle */}
            {viewMode === 'split' && (
              <div 
                className="absolute inset-y-0 w-0.5 bg-white shadow-2xl z-20 pointer-events-none"
                style={{ left: `${splitPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-stone-900/90 text-white border-2 border-white flex items-center justify-center text-xs font-bold shadow-lg">
                  ↔
                </div>
              </div>
            )}
          </div>
        )}

        {/* TOP LEFT BUTTON: 擦除 (ERASER) matching Image 4 */}
        <button
          onClick={handleEraser}
          className="absolute top-4 left-4 z-30 px-4 py-1.5 rounded-full bg-stone-900/70 hover:bg-stone-800 text-white text-xs font-semibold backdrop-blur-md border border-white/10 shadow-lg flex items-center gap-1.5 active:scale-95 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5 text-stone-300" />
          <span>擦除</span>
        </button>

        {/* TOP RIGHT FLOATING CONTROLS: 对比 / 放大 */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5">
          <span className={`px-2.5 py-1.5 rounded-full text-[10px] backdrop-blur-md border ${webarStatus === 'ready' ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200' : 'bg-stone-900/70 border-white/10 text-stone-400'}`}>
            {activeTencentEffectId && webarStatus === 'ready' ? '腾讯妆效素材已连接' : localLipStatus === 'ready' ? '面部关键点已连接 · 本地局部渲染' : webarStatus === 'starting' ? '腾讯 WebAR 加载中' : '试妆不可用'}
          </span>
          <button
            onClick={() => {
              const canvas = webarCanvasRef.current;
              if (!canvas || (!localLipFaceDetected && !webarFaceDetected)) { showToast('请先完成面部关键点识别后再导出'); return; }
              const link = document.createElement('a');
              link.download = `lip-try-on-${Date.now()}.png`;
              link.href = canvas.toDataURL('image/png');
              link.click();
              showToast('试妆照片已导出');
            }}
            className="px-2.5 py-1.5 rounded-full text-[10px] bg-stone-900/70 border border-white/10 text-stone-200 backdrop-blur-md flex items-center gap-1"
          >
            <Download className="w-3 h-3" />导出
          </button>
          {/* Split Mode Toggle */}
          <button
            onClick={() => setViewMode(viewMode === 'split' ? 'normal' : 'split')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border transition-all ${
              viewMode === 'split' 
                ? 'bg-emerald-500 border-emerald-400 text-white shadow-md' 
                : 'bg-stone-900/70 border-white/10 text-stone-300 hover:text-white'
            }`}
          >
            对比
          </button>

          {/* Zoom Level Toggle */}
          <button
            onClick={() => {
              if (zoomLevel === 1.0) setZoomLevel(1.5);
              else if (zoomLevel === 1.5) setZoomLevel(2.0);
              else setZoomLevel(1.0);
            }}
            className="px-2.5 py-1.5 rounded-full bg-stone-900/70 border border-white/10 text-xs font-mono text-stone-200 backdrop-blur-md"
          >
            {zoomLevel.toFixed(1)}x
          </button>
        </div>
      </div>

      {/* MIDDLE DRAWER / CAROUSEL (Sub-options for the active category matching Image 4) */}
      <div className="w-full bg-[#1A1A1E] border-t border-white/10 p-3 sm:p-4 space-y-3">
        {/* 1. Category: 套装 (Sets) */}
        {activeCategory === '套装' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-stone-400 px-1">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>精选妆容套装</span>
              </span>
              <button 
                onClick={() => setShowImportModal(true)}
                className="text-xs text-[#22C55E] hover:underline flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>导入妆教图片/链接</span>
              </button>
            </div>

            {/* Carousel matching Image 4 with circular avatars and labels */}
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-none py-1">
              {/* Import Tutorial Card */}
              <button
                onClick={() => setShowImportModal(true)}
                className="flex flex-col items-center gap-1.5 shrink-0 group"
              >
                <div className="w-16 h-20 rounded-2xl border-2 border-dashed border-emerald-500/60 bg-emerald-950/20 group-hover:bg-emerald-900/30 flex flex-col items-center justify-center text-emerald-400 transition-colors">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                  <span className="text-[10px] font-bold mt-1">导入妆教</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-semibold">AI分析</span>
              </button>

              {customSets.map((s) => {
                const isSelected = activeSetId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSet(s)}
                    className="flex flex-col items-center gap-1.5 shrink-0 group relative"
                  >
                    <div 
                      className={`w-16 h-20 rounded-2xl overflow-hidden border-2 transition-all relative ${
                        isSelected 
                          ? 'border-[#22C55E] ring-2 ring-[#22C55E]/40 scale-102 shadow-lg' 
                          : 'border-white/15 opacity-80 hover:opacity-100'
                      }`}
                    >
                      {s.id === 'none' ? (
                        <div className="w-full h-full bg-stone-900 flex flex-col items-center justify-center text-stone-400">
                          <RotateCcw className="w-5 h-5 mb-1" />
                          <span className="text-[10px]">素颜</span>
                        </div>
                      ) : (
                        <img src={s.avatar} alt={s.name} className="w-full h-full object-cover" />
                      )}
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#22C55E] rounded-full shadow-md ring-1 ring-black" />
                      )}
                    </div>
                    <span className={`text-[11px] font-medium tracking-tight ${isSelected ? 'text-[#22C55E] font-bold' : 'text-stone-300'}`}>
                      {s.name}
                    </span>
                  </button>
                );
              })}
              {webarEffects.slice(0, 12).map((effect, index) => {
                const id = effect.EffectId;
                if (!id) return null;
                const selected = Object.values(webarEffectForSetRef.current).includes(id);
                return (
                  <button
                    key={`webar-${id}`}
                    onClick={() => applyWebAREffect(id)}
                    className="flex flex-col items-center gap-1.5 shrink-0 group"
                    title={effect.Name || id}
                  >
                    <div className={`w-16 h-20 rounded-2xl overflow-hidden border-2 ${selected ? 'border-emerald-400' : 'border-cyan-400/40'} bg-stone-900`}>
                      {effect.CoverUrl ? <img src={effect.CoverUrl} alt={effect.Name || '腾讯妆效'} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-[10px] text-cyan-200">妆效</div>}
                    </div>
                    <span className="text-[10px] text-cyan-200 max-w-16 truncate">{effect.Name || `腾讯妆效${index + 1}`}</span>
                  </button>
                );
              })}
            </div>
            <div className="text-[10px] text-stone-500 px-1">
              {webarStatus === 'ready' ? (webarEffects.length ? `腾讯 WebAR 已加载 ${webarEffects.length} 个可修改妆效` : '腾讯妆效列表为空，请在控制台发布妆效素材') : webarMessage}
            </div>
          </div>
        )}

        {/* 2. Category: 睫毛 (Eyelashes) */}
        {activeCategory === '睫毛' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-400 px-1">
              <span>睫毛款式选择</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px]">浓淡: {lashDensity}%</span>
                <input 
                  type="range" 
                  min="20" 
                  max="100" 
                  value={lashDensity} 
                  onChange={(e) => setLashDensity(Number(e.target.value))}
                  className="w-24 accent-[#22C55E] h-1"
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-none py-1">
              {[
                { id: 'none', name: '无' },
                { id: 'sunflower', name: '太阳花' },
                { id: 'slim', name: '自然纤长' },
                { id: 'clusters', name: '女团单簇' },
                { id: 'anime', name: '二次元下至' },
                { id: 'winged', name: '眼尾拉长' }
              ].map((lash) => (
                <button
                  key={lash.id}
                  onClick={() => {
                    setActiveLash(lash.id);
                    showToast(`已更换睫毛款式为「${lash.name}」`);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                    activeLash === lash.id 
                      ? 'bg-[#22C55E] border-[#22C55E] text-black shadow-md font-bold' 
                      : 'bg-stone-900 border-white/10 text-stone-300 hover:border-white/30'
                  }`}
                >
                  {lash.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. Category: 眉毛 (Eyebrows) */}
        {activeCategory === '眉毛' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-400 px-1">
              <span>眉型与眉色（支持调取化妆台眉笔）</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
              {[
                { id: 'none', name: '无' },
                { id: 'wild', name: '野生原生眉' },
                { id: 'soft_arch', name: '柔雾小折角' },
                { id: 'korean_flat', name: '韩系平眉' },
                { id: 'sword', name: '微挑剑眉' },
                { id: 'chinese_fine', name: '远山细黛' }
              ].map((brow) => (
                <button
                  key={brow.id}
                  onClick={() => {
                    setActiveBrow(brow.id);
                    showToast(`已更换眉型为「${brow.name}」`);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                    activeBrow === brow.id 
                      ? 'bg-[#22C55E] border-[#22C55E] text-black shadow-md font-bold' 
                      : 'bg-stone-900 border-white/10 text-stone-300'
                  }`}
                >
                  {brow.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. Category: 眼线 (Eyeliner) */}
        {activeCategory === '眼线' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-400 px-1">
              <span>眼线风格</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
              {[
                { id: 'none', name: '无' },
                { id: 'inner', name: '极细内眼线' },
                { id: 'natural', name: '自然微翘' },
                { id: 'winged', name: '狐系开眼尾' },
                { id: 'anime', name: '二次元下眼睑' }
              ].map((liner) => (
                <button
                  key={liner.id}
                  onClick={() => {
                    setActiveLiner(liner.id);
                    showToast(`已更换眼线为「${liner.name}」`);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                    activeLiner === liner.id 
                      ? 'bg-[#22C55E] border-[#22C55E] text-black shadow-md font-bold' 
                      : 'bg-stone-900 border-white/10 text-stone-300'
                  }`}
                >
                  {liner.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5. Category: 口红 (Lipstick - 优先调取化妆台现有口红) */}
        {activeCategory === '口红' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-stone-400 px-1">
              <span className="flex items-center gap-1.5 font-semibold text-white">
                <span>我的化妆台口红：</span>
                <span className="text-[#22C55E]">{activeLipProduct}</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px]">浓淡: {lipDepth}%</span>
                <input 
                  type="range" 
                  min="20" 
                  max="100" 
                  value={lipDepth} 
                  onChange={(e) => setLipDepth(Number(e.target.value))}
                  className="w-20 accent-[#22C55E] h-1"
                />
              </div>
            </div>

            {/* Vanity Lipsticks Carousel */}
            <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-none py-1">
              {/* Actual products from vanity */}
              {vanityLipsticks.map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => {
                    setActiveLipProduct(prod.product_name);
                    if (prod.shade_hex) setLipHex(prod.shade_hex);
                    setLipEnabled(true);
                    showToast(`已切换为化妆台好物「${prod.product_name}」`);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap ${
                    activeLipProduct === prod.product_name 
                      ? 'bg-rose-950/60 border-rose-500 text-white font-bold ring-1 ring-rose-400' 
                      : 'bg-stone-900 border-white/15 text-stone-300'
                  }`}
                >
                  <div 
                    className="w-4 h-4 rounded-full border border-white shadow-xs" 
                    style={{ backgroundColor: prod.shade_hex || '#8d2d2a' }} 
                  />
                  <div className="text-left">
                    <div className="text-[11px] leading-tight">{prod.product_name}</div>
                    <div className="text-[9px] text-stone-400">{prod.shade_name || '台面在用'}</div>
                  </div>
                </button>
              ))}

              {/* Preset Color Swatches */}
              {[
                { name: '豆沙粉', hex: '#C45868' },
                { name: '烂番茄', hex: '#B2382D' },
                { name: '乌木红棕', hex: '#853139' },
                { name: '蜜桃橘', hex: '#E0735E' },
                { name: '正红朱砂', hex: '#B3262E' }
              ].map((swatch) => (
                <button
                  key={swatch.name}
                  onClick={() => {
                    setActiveLipProduct(swatch.name);
                    setLipHex(swatch.hex);
                    setLipEnabled(true);
                    showToast(`已更换唇色为「${swatch.name}」`);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap ${
                    lipHex === swatch.hex && activeLipProduct === swatch.name
                      ? 'bg-rose-950/60 border-rose-500 text-white font-bold' 
                      : 'bg-stone-900 border-white/10 text-stone-400'
                  }`}
                >
                  <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: swatch.hex }} />
                  <span className="text-[11px]">{swatch.name}</span>
                </button>
              ))}
            </div>

            {/* Texture Pills */}
            <div className="flex items-center gap-2 pt-0.5 text-xs text-stone-400">
              <span className="text-[10px]">质地：</span>
              {(['dewy', 'matte', 'gloss'] as const).map((tex) => (
                <button
                  key={tex}
                  onClick={() => setLipTexture(tex)}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] ${
                    lipTexture === tex ? 'bg-white text-black font-bold' : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  {tex === 'dewy' ? '水光润泽' : tex === 'matte' ? '柔雾丝绒' : '镜面玻璃'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 6. Category: 腮红 (Blush - 优先调取化妆台腮红/多用膏) */}
        {activeCategory === '腮红' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-stone-400 px-1">
              <span className="font-semibold text-white">我的化妆台腮红 / 唇颊膏：</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px]">用量: {blushAmount}%</span>
                <input 
                  type="range" 
                  min="10" 
                  max="100" 
                  value={blushAmount} 
                  onChange={(e) => setBlushAmount(Number(e.target.value))}
                  className="w-20 accent-[#22C55E] h-1"
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-none py-1">
              {[
                { name: '膨胀浅粉', hex: '#F5A4AC' },
                { name: '蜜桃肉桂', hex: '#E2847A' },
                { name: '杏子奶茶', hex: '#E8A48B' },
                { name: '微醺赤茶', hex: '#D08770' }
              ].map((swatch) => (
                <button
                  key={swatch.name}
                  onClick={() => {
                    setBlushHex(swatch.hex);
                    setBlushEnabled(true);
                    showToast(`已更换腮红色号为「${swatch.name}」`);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap ${
                    blushHex === swatch.hex 
                      ? 'bg-rose-950/60 border-rose-400 text-white font-bold' 
                      : 'bg-stone-900 border-white/10 text-stone-400'
                  }`}
                >
                  <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: swatch.hex }} />
                  <span className="text-[11px]">{swatch.name}</span>
                </button>
              ))}
            </div>

            {/* Placement Switcher */}
            <div className="flex items-center gap-2 text-xs text-stone-400 pt-0.5">
              <span className="text-[10px]">扫法：</span>
              {[
                { id: 'center', label: '面中膨胀 (缩短中庭)' },
                { id: 'cheekbone', label: '颧骨收缩 (显脸小)' },
                { id: 'undereye', label: '眼下微醺 (幼态)' }
              ].map((pos) => (
                <button
                  key={pos.id}
                  onClick={() => setBlushPlacement(pos.id as any)}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] ${
                    blushPlacement === pos.id ? 'bg-[#22C55E] text-black font-bold' : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 7. Category: 修容 (Contour) */}
        {activeCategory === '修容' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-400 px-1">
              <span>面部修容轮廓（调取化妆台修容盘）</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px]">深浅: {contourIntensity}%</span>
                <input 
                  type="range" 
                  min="20" 
                  max="100" 
                  value={contourIntensity} 
                  onChange={(e) => setContourIntensity(Number(e.target.value))}
                  className="w-20 accent-[#22C55E] h-1"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
              {[
                { id: 'full', name: '全脸骨相立体' },
                { id: 'nose', name: '立体高鼻梁' },
                { id: 'jaw', name: '下颌线折角小颜' }
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setContourStyle(c.id as any);
                    setContourEnabled(true);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                    contourStyle === c.id 
                      ? 'bg-[#22C55E] border-[#22C55E] text-black font-bold' 
                      : 'bg-stone-900 border-white/10 text-stone-300'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 8. Category: 眼影 (Eyeshadow) */}
        {activeCategory === '眼影' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-stone-400 px-1">
              <span className="font-semibold text-white">我的化妆台眼影盘：</span>
            </div>

            <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-none py-1">
              {vanityEyeShadows.map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => {
                    setActiveEyeProduct(prod.product_name);
                    if (prod.shade_hex) setEyeHex(prod.shade_hex);
                    setEyeEnabled(true);
                    showToast(`已更换为化妆台眼影「${prod.product_name}」`);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap ${
                    activeEyeProduct === prod.product_name 
                      ? 'bg-amber-950/60 border-amber-500 text-white font-bold ring-1 ring-amber-400' 
                      : 'bg-stone-900 border-white/15 text-stone-300'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: prod.shade_hex || '#A67B6F' }} />
                  <span className="text-[11px]">{prod.product_name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 9. Category: 高光 (Highlighter) */}
        {activeCategory === '高光' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-400 px-1">
              <span>面部高光提亮</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
              {[
                { id: 'all', name: '全脸微光钻闪' },
                { id: 'nose_bridge', name: '山根水光提亮' },
                { id: 'triangle', name: '面中哑光膨胀' }
              ].map((h) => (
                <button
                  key={h.id}
                  onClick={() => {
                    setHighlighterArea(h.id as any);
                    setHighlighterEnabled(true);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                    highlighterArea === h.id 
                      ? 'bg-[#22C55E] border-[#22C55E] text-black font-bold' 
                      : 'bg-stone-900 border-white/10 text-stone-300'
                  }`}
                >
                  {h.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 10. Category: 美瞳 (Contact Lenses) */}
        {activeCategory === '美瞳' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-400 px-1">
              <span>美瞳眼瞳模拟</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
              {[
                { id: 'none', name: '原瞳' },
                { id: 'water_black', name: '水光黑曜' },
                { id: 'olive_green', name: '浅榄绿混血' },
                { id: 'amber_brown', name: '蜜糖琥珀' },
                { id: 'cos_blue', name: '二次元宝石蓝' }
              ].map((lens) => (
                <button
                  key={lens.id}
                  onClick={() => {
                    setActiveLens(lens.id);
                    showToast(`已更换美瞳为「${lens.name}」`);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                    activeLens === lens.id 
                      ? 'bg-[#22C55E] border-[#22C55E] text-black font-bold' 
                      : 'bg-stone-900 border-white/10 text-stone-300'
                  }`}
                >
                  {lens.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAVIGATION BAR (Exact replica of Image 4: X on left, categories in middle with green underline, Checkmark on right) */}
      <div className="w-full bg-[#121214] border-t border-white/10 px-3 py-2 flex items-center justify-between gap-2">
        {/* Left: Close Button (✕) */}
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-800 transition-colors shrink-0"
          title="关闭"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Center: Scrollable Categories */}
        <div className="flex-1 flex items-center gap-5 overflow-x-auto scrollbar-none px-2">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`py-2 text-sm whitespace-nowrap relative transition-all ${
                  isActive ? 'text-white font-bold' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <span>{cat}</span>
                {/* Green Underline indicator matching Image 4 */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22C55E] rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Confirm and follow-along actions */}
        {onConfirmFollowAlong && <button
          onClick={() => {
            onSaveLook?.(`定制试妆 · ${activeSetId}`, 'red');
            onConfirmFollowAlong();
          }}
          className="px-3 py-2 rounded-full bg-[#962F43] text-white text-[11px] font-bold whitespace-nowrap"
        >确认妆容，开始跟练</button>}
        <button
          onClick={() => {
            if (onSaveLook) {
              onSaveLook(`定制试妆 · ${activeSetId}`, 'red');
            }
            showToast('已保存当前定制妆造至「我的妆容存档」✓');
            setTimeout(() => onClose(), 800);
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#22C55E] hover:bg-stone-800 transition-colors shrink-0"
          title="保存并应用"
        >
          <Check className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* MODAL: IMPORT MAKEUP TUTORIAL (妆教图片 / 链接) */}
      {showImportModal && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1C1C20] border border-white/20 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-[#22C55E]" />
                <h3 className="text-sm font-bold text-white">导入社媒妆教 · AI 生成套装</h3>
              </div>
              <button 
                onClick={() => setShowImportModal(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              支持粘贴来自<strong>小红书、抖音、B站</strong>的妆教链接或文案描述，导入后 AI 智能拆解并自动加入下方【套装】列表！
            </p>

            <textarea
              value={tutorialInput}
              onChange={(e) => setTutorialInput(e.target.value)}
              placeholder="例如：小红书 鞠婧祎倒三角白开水妆，或者粘贴链接 http://xhslink.com/..."
              rows={3}
              className="w-full p-3 rounded-2xl bg-stone-900 border border-white/20 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#22C55E]"
            />

            {/* Quick Demo Links */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              {[
                '小红书 鞠婧祎倒三角妆',
                '抖音 纯欲微醺白桃妆',
                '漫展 异色高显色COS妆'
              ].map((query) => (
                <button
                  key={query}
                  onClick={() => setTutorialInput(query)}
                  className="px-2 py-0.5 rounded-full text-[10px] bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 whitespace-nowrap"
                >
                  {query}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-full text-xs text-stone-400 hover:text-white"
              >
                取消
              </button>
              <button
                disabled={isAnalyzingTutorial}
                onClick={handleParseAndAddSet}
                className="px-5 py-2 rounded-full bg-[#22C55E] hover:bg-[#1ea34d] text-black text-xs font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>{isAnalyzingTutorial ? 'AI 分析中...' : '生成并加入套装'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
