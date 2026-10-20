import React, { useState, useRef, useEffect } from 'react';
import { 
  Palette, 
  Sparkles, 
  Image as ImageIcon, 
  UserCheck, 
  Bookmark, 
  Upload, 
  Clock, 
  Check, 
  Camera, 
  ChevronRight, 
  Layers, 
  ShieldAlert, 
  Heart, 
  Star, 
  ShieldCheck, 
  Smile, 
  SlidersHorizontal,
  Wand2,
  Eye,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  ScanLine
} from 'lucide-react';
import { BeautyProduct, MakeupLook } from '../../types/beauty';
import { 
  makeupLookImg, 
  makeupGlamourImg, 
  homePortraitImg, 
  vanityHero 
} from '../../data/mockData';
import { Image4BeautyEditor } from '../makeup/Image4BeautyEditor';
import { MakeupPracticeStudio } from '../makeup/MakeupPracticeStudio';
import { MakeupFollowAlong } from '../makeup/MakeupFollowAlong';
import { LocalLipMaskRenderer } from '../../services/tryOn/LocalLipMaskRenderer';

interface MakeupScreenProps {
  products: BeautyProduct[];
  looks: MakeupLook[];
  onGenerateLook?: (params: { lookType: 'daily' | 'imitation' | 'cos'; referenceText?: string; referenceImage?: string; characterName?: string; userPhoto?: string }) => void;
  onParseTutorial?: (params: { url?: string; description?: string }) => Promise<MakeupLook | null>;
  onRateLook?: (lookTitle: string, rating: 'red' | 'yellow' | 'black', reason: string) => void;
  isGenerating?: boolean;
  authenticated?: boolean;
}

export const MakeupScreen: React.FC<MakeupScreenProps> = ({
  products,
  looks,
  onGenerateLook,
  onParseTutorial,
  onRateLook,
  isGenerating = false,
  authenticated = false
}) => {
  // Navigation inside Makeup: 'create' | 'precheck' | 'profile' | 'archive'
  const [activeTab, setActiveTab] = useState<'create' | 'precheck' | 'profile' | 'archive'>('create');
  
  // Layer 3 Core Makeup Types: 'daily' | 'imitation' | 'cos'
  const [selectedLookType, setSelectedLookType] = useState<'daily' | 'imitation' | 'cos'>('daily');

  // Layer 2 User Photo State & Real Detection State
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null);
  const [isDetectingFace, setIsDetectingFace] = useState<boolean>(false);
  const [faceDetected, setFaceDetected] = useState<boolean>(false);
  const faceRendererRef = useRef<LocalLipMaskRenderer | null>(null);
  const [showFollowAlong, setShowFollowAlong] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Full-screen Image 4 Virtual Makeup Editor Modal (P3)
  const [showImage4Editor, setShowImage4Editor] = useState<boolean>(false);
  const [editorInitialSet, setEditorInitialSet] = useState<string>('韩蕾妆');

  // Follow-along Practice Studio Modal (P5)
  const [showPracticeStudio, setShowPracticeStudio] = useState<boolean>(false);
  const [practiceLookTitle, setPracticeLookTitle] = useState<string>('今日法式通勤红唇');
  const [practiceLookType, setPracticeLookType] = useState<'daily' | 'imitation' | 'cos'>('daily');
  const [practiceCharacter, setPracticeCharacter] = useState<string>('');

  // ==========================================
  // Layer 3 Sub-States: Daily / Imitation / COS
  // ==========================================
  // 1. Daily Look Sub-State
  const [dailyOccasion, setDailyOccasion] = useState<'commute' | 'date' | 'bare' | 'party'>('commute');

  // 2. Imitation Look Sub-State
  const [imitationRefImage, setImitationRefImage] = useState<string | null>(makeupGlamourImg);
  const [imitationRefTitle, setImitationRefTitle] = useState<string>('鞠婧祎倒三角白开水眼妆');
  const [isAnalyzingImitation, setIsAnalyzingImitation] = useState<boolean>(false);
  const imitationFileInputRef = useRef<HTMLInputElement | null>(null);

  // 3. COS Look Sub-State
  const [cosCharacterName, setCosCharacterName] = useState<string>('原神·雷电将军');
  const [cosRefImage, setCosRefImage] = useState<string | null>(makeupLookImg);
  const [isAnalyzingCos, setIsAnalyzingCos] = useState<boolean>(false);
  const cosFileInputRef = useRef<HTMLInputElement | null>(null);

  // Pre-makeup skin risk state
  const [precheckCondition, setPrecheckCondition] = useState<'dry' | 'oily' | 'redness' | 'normal'>('dry');

  // Aesthetic profile state
  const [aestheticProfile, setAestheticProfile] = useState({
    faceFeatures: '中庭比例适中，原生眉骨立体，眼裂弧度柔和，唇峰轮廓清晰',
    skinTendency: '混合偏干 · 秋冬易起皮脱屑 · 局部轻微泛红',
    stylePreference: '清透氧气自然原生感 / 温暖低饱和红茶色系',
    makeupTaboos: '不适合过粗全包黑眼线、避免全脸高荧光粉色、避免厚重哑光死白面具感',
    scenePreference: '日常通勤 / 周末摄影 / 漫展角色扮演'
  });
  const [profileSaved, setProfileSaved] = useState(false);

  // Selected look to preview
  const [viewingLook, setViewingLook] = useState<MakeupLook>(looks[0] || {
    id: 'default-look',
    title: '法式复古松弛感猫系红唇',
    type: 'daily',
    occasion: '周末约会 / 氛围摄影',
    description: '以清透雾面底妆打底，低饱和大地红茶眼影勾勒眼窝，复古丝绒红唇提亮全脸气色。',
    matched_products: [
      { slot: '底妆', product_name: '芭比波朗橘子面霜', note: '妆前打底' },
      { slot: '唇妆', product_name: '植村秀小黑方 BR784', note: '赤狐红棕' },
      { slot: '眼影', product_name: '3CE九宫格眼影 OVERTAKE', note: '低饱和大地色' }
    ],
    steps: ['润泽妆前打底', '低饱和大地眼窝', '复古丝绒红唇'],
    minimal_5min_tip: '赶时间出门时：仅用橘子面霜局部打底，取植村秀唇膏一指按压唇部，余色轻点两颊当腮红，即刻通透提气色。',
    created_at: new Date().toISOString()
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [tutorialInput, setTutorialInput] = useState('');
  const [isParsingTutorial, setIsParsingTutorial] = useState(false);

  // Keep the preview and follow-along workflow pointed at the latest AI-generated look.
  // Previously viewingLook was initialized once, so newly generated looks never reached
  // the follow-along page and it fell back to a single generic step.
  useEffect(() => {
    if (looks.length > 0) setViewingLook(looks[0]);
  }, [looks]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Handle user photo file upload with local facial landmark detection.
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('请选择 JPG、PNG 或 WEBP 图片'); return; }
    const reader = new FileReader();
    setIsDetectingFace(true);
    setFaceDetected(false);
    reader.onload = (event) => {
      if (!event.target?.result) return;
      const imgUrl = event.target.result as string;
      setUserPhotoUrl(imgUrl);
      const image = new Image();
      image.onload = async () => {
        try {
          if (!faceRendererRef.current) faceRendererRef.current = new LocalLipMaskRenderer();
          await faceRendererRef.current.initialize();
          const detected = faceRendererRef.current.detectFace(image);
          setFaceDetected(detected);
          showToast(detected ? '✓ 人脸定位成功！可以进入试妆镜' : '未识别到清晰人脸，请上传正面照片');
        } catch {
          setFaceDetected(false);
          showToast('人脸定位模型加载失败，请重试');
        } finally {
          setIsDetectingFace(false);
        }
      };
      image.onerror = () => { setIsDetectingFace(false); showToast('照片无法读取，请重新上传'); };
      image.src = imgUrl;
    };
    reader.readAsDataURL(file);
  };

  // Handle imitation reference image upload
  const handleImitationUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      setIsAnalyzingImitation(true);
      reader.onload = (event) => {
        if (event.target?.result) {
          setImitationRefImage(event.target.result as string);
          setImitationRefTitle(file.name.replace(/\.[^/.]+$/, ''));
          setTimeout(() => {
            setIsAnalyzingImitation(false);
            showToast('✓ 参考妆容拆解完成！已在化妆台匹配替代品');
          }, 800);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle COS character reference upload
  const handleCosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      setIsAnalyzingCos(true);
      reader.onload = (event) => {
        if (event.target?.result) {
          setCosRefImage(event.target.result as string);
          setTimeout(() => {
            setIsAnalyzingCos(false);
            showToast(`✓ 已解析角色「${cosCharacterName}」二次元妆造特征！`);
          }, 800);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Open Image 4 detailed virtual makeup editor
  const handleOpenDetailedShowcase = (setName?: string) => {
    if (!userPhotoUrl) {
      showToast('请先上传本人照片建立五官网格');
      fileInputRef.current?.click();
      return;
    }
    if (isDetectingFace || !faceDetected) {
      showToast(isDetectingFace ? '正在进行人脸定位，请稍候' : '当前照片未识别到人脸，请重新上传');
      return;
    }
    if (setName) {
      setEditorInitialSet(setName);
      const matchingLook = looks.find(item => item.title === setName);
      if (matchingLook) setViewingLook(matchingLook);
    }
    setShowImage4Editor(true);
  };

  // Open follow-along practice studio
  const handleStartPractice = (title: string, type: 'daily' | 'imitation' | 'cos', character?: string) => {
    if (!userPhotoUrl) {
      showToast('请先上传本人照片，以便在跟练中对照面部区域');
      fileInputRef.current?.click();
      return;
    }
    const generatedLook = looks.find(item => item.title === title) || (viewingLook.id !== 'default-look' && viewingLook.type === type ? viewingLook : undefined);
    if (generatedLook) {
      setViewingLook(generatedLook);
      setShowFollowAlong(true);
      return;
    }
    setPracticeLookTitle(title);
    setPracticeLookType(type);
    setPracticeCharacter(character || '');
    setShowPracticeStudio(true);
  };

  return (
    <div className="p-3.5 sm:p-5 space-y-4 text-stone-900 select-none bg-[#FAF6F3]">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-stone-900/90 backdrop-blur-md text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 animate-in fade-in">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handlePhotoUpload} 
        accept="image/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={imitationFileInputRef} 
        onChange={handleImitationUpload} 
        accept="image/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={cosFileInputRef} 
        onChange={handleCosUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* ======================================================== */}
      {/* LAYER 1: HEADER & CORE SUB-TABS                           */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#F0EBE6] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2 text-[11px] text-stone-400 font-medium">
              <span>反容貌焦虑妆造</span>
              <span aria-hidden="true">·</span>
              <span>发掘原生优势与化妆台彩妆潜力</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mt-0.5 tracking-tight">
              AI 妆造工作室
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              从日常提气色、图片仿妆到角色 COS，优先匹配现有彩妆并提供平替方案，拒绝闲置浪费。
            </p>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                activeTab === 'create'
                  ? 'bg-[#962F43] border-[#962F43] text-white shadow-2xs'
                  : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>妆造创作</span>
            </button>
            <button
              onClick={() => setActiveTab('precheck')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                activeTab === 'precheck'
                  ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                  : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>妆前预判预警</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                activeTab === 'profile'
                  ? 'bg-stone-900 border-stone-900 text-white'
                  : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>五官底档</span>
            </button>
            <button
              onClick={() => setActiveTab('archive')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                activeTab === 'archive'
                  ? 'bg-stone-900 border-stone-900 text-white'
                  : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>妆容存档 ({looks.length})</span>
            </button>
          </div>
        </div>

        {activeTab === 'create' && <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-3 space-y-2">
          <div>
            <p className="text-xs font-bold text-stone-900">把妆教整理成专属分步跟练</p>
            <p className="text-[10px] text-stone-500 mt-0.5">粘贴妆教链接或步骤/字幕描述；解析结果会保留它自己的顺序和技法。</p>
          </div>
          <textarea value={tutorialInput} onChange={event => setTutorialInput(event.target.value)} rows={2} maxLength={4000} placeholder="妆教链接，或粘贴视频中的步骤、字幕和色彩说明" className="w-full rounded-xl border border-rose-100 bg-white p-2.5 text-xs outline-none focus:border-rose-400" />
          <button type="button" disabled={!tutorialInput.trim() || isParsingTutorial || !onParseTutorial} onClick={async () => {
            if (!onParseTutorial || !tutorialInput.trim()) return;
            setIsParsingTutorial(true);
            try {
              const value = tutorialInput.trim();
              const isUrl = /^https?:\\/\\//i.test(value);
              const look = await onParseTutorial(isUrl ? { url: value } : { description: value });
              if (look) {
                setViewingLook(look);
                showToast('妆教步骤已同步，正在打开分步跟练');
                if (userPhotoUrl) setShowFollowAlong(true);
                else showToast('妆教已保存，请先上传本人照片后开始跟练');
              }
            } catch (error) {
              console.error('Tutorial parsing failed:', error);
              showToast(error instanceof Error ? error.message : '妆教解析失败，请重试');
            } finally {
              setIsParsingTutorial(false);
            }
          }} className="rounded-full bg-[#962F43] px-4 py-2 text-[11px] font-bold text-white disabled:opacity-50">{isParsingTutorial ? '正在解析妆教…' : '解析妆教并进入跟练'}</button>
        </div>}

        {/* ======================================================== */}
        {/* LAYER 2: USER PHOTO & REAL FACIAL DETECTION STATUS (P2)    */}
        {/* ======================================================== */}
        {activeTab === 'create' && (
          <div className="bg-gradient-to-r from-[#FFF5F1] via-[#FDF0EC] to-[#FCEAE6] rounded-2xl p-3 sm:p-3.5 border border-[#F5DCD5]">
            {!userPhotoUrl ? (
              /* State A: NOT uploaded - Clean proportional placeholder (No huge lock/blank) */
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-[#F5DCD5] bg-white flex items-center justify-center text-stone-400 shrink-0">
                    <Camera className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-bold text-stone-900">请上传正面自拍照片</h3>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-semibold">待录入</span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      建议正脸平视、光线均匀、五官清晰无遮挡 · 仅本地试妆，严格保护隐私
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-1.5 rounded-full bg-[#962F43] hover:bg-[#832637] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>上传照片</span>
                  </button>
                </div>
              </div>
            ) : (
              /* State B: Photo IS uploaded - Real Facial Landmark Recognition Status */
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Photo Avatar with status badge */}
                  <div className="relative w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-xs shrink-0 bg-rose-100">
                    <img src={userPhotoUrl} alt="User Face" className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-stone-900">面部数据已精确就绪</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>人脸识别 99.4%</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      106关键点已锁定 · 三庭五眼比例协调 · 随时点击进入 3D 试妆镜或开始跟练
                    </p>
                  </div>
                </div>

                {/* Quick Action Buttons for Photo */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleOpenDetailedShowcase()}
                    className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>查看试妆效果</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-full bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>更换照片</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* LAYER 3: 3 CORE MAKEUP WORKSPACES (Daily, Imitation, COS)  */}
        {/* ======================================================== */}
        {activeTab === 'create' && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-xs font-bold text-stone-800 px-0.5">
              <span>妆造分类与定制入口</span>
              <span className="text-[10px] text-stone-400">切换体验专属定制流程</span>
            </div>

            {/* 3 Entry Category Buttons (有明确点击区别与独立工作台) */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* Card 1: 今日专属日常妆 */}
              <button
                onClick={() => {
                  setSelectedLookType('daily');
                  showToast('已切换至「今日专属日常妆」推荐');
                }}
                className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all relative ${
                  selectedLookType === 'daily'
                    ? 'border-[#962F43] bg-gradient-to-br from-rose-50/80 to-white shadow-2xs ring-1 ring-[#962F43]/30'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span>今日日常妆</span>
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold ${
                    selectedLookType === 'daily' ? 'bg-[#962F43] text-white' : 'bg-amber-100 text-amber-900'
                  }`}>
                    日常通勤
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 mt-1 line-clamp-1">
                  适配今日气色，台面2-3件好物，5分钟极简通勤。
                </p>
              </button>

              {/* Card 2: 图片仿妆私人改造 */}
              <button
                onClick={() => {
                  setSelectedLookType('imitation');
                  showToast('已切换至「图片仿妆私人改造」');
                }}
                className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all relative ${
                  selectedLookType === 'imitation'
                    ? 'border-[#962F43] bg-gradient-to-br from-rose-50/80 to-white shadow-2xs ring-1 ring-[#962F43]/30'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-rose-500" />
                    <span>图片仿妆</span>
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold ${
                    selectedLookType === 'imitation' ? 'bg-[#962F43] text-white' : 'bg-rose-100 text-rose-800'
                  }`}>
                    上传参考图
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 mt-1 line-clamp-1">
                  上传社媒博主美图，AI拆解眼唇并在化妆台找替代。
                </p>
              </button>

              {/* Card 3: COS 角色妆造定制 */}
              <button
                onClick={() => {
                  setSelectedLookType('cos');
                  showToast('已切换至「COS 角色妆造定制」');
                }}
                className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all relative ${
                  selectedLookType === 'cos'
                    ? 'border-[#962F43] bg-gradient-to-br from-rose-50/80 to-white shadow-2xs ring-1 ring-[#962F43]/30'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900 flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-indigo-500" />
                    <span>COS 妆造</span>
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold ${
                    selectedLookType === 'cos' ? 'bg-[#962F43] text-white' : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    输入角色
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 mt-1 line-clamp-1">
                  输入动漫角色与立绘，AI定制专属二次元大眼。
                </p>
              </button>
            </div>

            <button
              type="button"
              disabled={isGenerating}
              onClick={() => onGenerateLook?.({
                lookType: selectedLookType,
                referenceText: selectedLookType === 'cos' ? `角色：${cosCharacterName}` : undefined,
                referenceImage: selectedLookType === 'imitation' ? imitationRefImage || undefined : selectedLookType === 'cos' ? cosRefImage || undefined : undefined,
                characterName: selectedLookType === 'cos' ? cosCharacterName : undefined,
                userPhoto: userPhotoUrl || undefined
              })}
              className="w-full rounded-2xl bg-stone-900 py-2.5 text-xs font-bold text-white shadow-sm transition-opacity disabled:cursor-wait disabled:opacity-60"
            >
              {isGenerating ? 'AI 正在生成妆容方案…' : `生成${selectedLookType === 'daily' ? '今日日常' : selectedLookType === 'imitation' ? '图片仿妆' : 'COS'}方案`}
            </button>

            {/* ---------------------------------------------------- */}
            {/* WORKSPACE 1: 今日专属日常妆 WORKBENCH                */}
            {/* ---------------------------------------------------- */}
            {selectedLookType === 'daily' && (
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-stone-900">今日通勤定制方案</span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                      根据今日天气与肌肤诊断匹配
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400">调用台面 3 件好物</span>
                </div>

                {/* Scenario Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'commute', name: '晨间快手通勤 (5分钟)', tag: '提气色' },
                    { id: 'date', name: '周末温柔约会 (10分钟)', tag: '暖调红茶' },
                    { id: 'bare', name: '清冷伪素颜 (3分钟)', tag: '白开水' },
                    { id: 'party', name: '晚间精致聚会 (15分钟)', tag: '复古丝缎' }
                  ].map((sc) => (
                    <button
                      key={sc.id}
                      onClick={() => {
                        setDailyOccasion(sc.id as any);
                        showToast(`已切换日常场景为「${sc.name}」`);
                      }}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                        dailyOccasion === sc.id
                          ? 'bg-[#962F43] border-[#962F43] text-white font-bold shadow-2xs'
                          : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <span>{sc.name}</span>
                    </button>
                  ))}
                </div>

                {/* Matched Vanity Products Row */}
                <div className="p-2.5 bg-white rounded-xl border border-stone-200/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
                    <span className="text-[10px] text-stone-400 shrink-0">调用彩妆：</span>
                    <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] shrink-0 font-medium">
                      芭比波朗橘子面霜 (局部打底)
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] shrink-0 font-medium">
                      植村秀小黑方 BR784 (唇颊两用)
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] shrink-0 font-medium">
                      3CE九宫格眼影 (大地消肿)
                    </span>
                  </div>
                </div>

                {/* 2 Clear Action Buttons: 查看试妆效果 vs 开始跟练 */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleOpenDetailedShowcase('韩蕾妆')}
                    className="flex-1 py-2 px-3 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-stone-600" />
                    <span>查看试妆效果 (试妆镜)</span>
                  </button>

                  <button
                    onClick={() => handleStartPractice('今日日常通勤提气色妆', 'daily')}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#962F43] to-[#CF3F57] hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>开始分步跟练教学</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* WORKSPACE 2: 图片仿妆私人改造 WORKBENCH              */}
            {/* ---------------------------------------------------- */}
            {selectedLookType === 'imitation' && (
              <div className="p-3.5 bg-rose-50/50 rounded-2xl border border-rose-200/80 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-stone-900">上传参考图片 · AI 仿妆拆解</span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-rose-100 text-rose-800 font-semibold">
                      社媒同款
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400">支持小红书/秀场截图</span>
                </div>

                {/* Upload & Reference Preview Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  {/* Reference Image Box */}
                  <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-rose-100 shadow-2xs">
                    <div className="relative w-16 h-20 rounded-lg overflow-hidden border border-stone-200 shrink-0 bg-stone-100">
                      {imitationRefImage ? (
                        <img src={imitationRefImage} alt="参考图" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-400">
                          <ImageIcon className="w-5 h-5 text-rose-400" />
                          <span className="text-[9px] mt-0.5">参考图</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="text-xs font-bold text-stone-900 truncate">
                        {imitationRefTitle}
                      </div>
                      <p className="text-[10px] text-stone-500 leading-tight">
                        已识别：倒三角眼影晕染、低饱和肉桂唇、膨胀微醺腮红
                      </p>
                      <button
                        onClick={() => imitationFileInputRef.current?.click()}
                        className="text-[10px] font-semibold text-[#962F43] hover:underline flex items-center gap-0.5"
                      >
                        <Upload className="w-3 h-3" />
                        <span>更换参考图片</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Reference Presets */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-stone-500 block font-medium">快捷试用热门仿妆样本：</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { title: '鞠婧祎倒三角眼妆', img: makeupLookImg },
                        { title: 'Jennie猫系低饱和红茶', img: makeupGlamourImg },
                        { title: '法式复古秀场红唇', img: homePortraitImg }
                      ].map((item) => (
                        <button
                          key={item.title}
                          onClick={() => {
                            setImitationRefImage(item.img);
                            setImitationRefTitle(item.title);
                            showToast(`已选用「${item.title}」参考图`);
                          }}
                          className="px-2 py-1 rounded-lg text-[10px] bg-white border border-stone-200 hover:border-rose-300 text-stone-700 transition-colors"
                        >
                          {item.title}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Feature Breakdown Card */}
                <div className="p-2.5 bg-white rounded-xl border border-rose-100 text-[11px] text-stone-600 space-y-1">
                  <div className="flex items-center justify-between font-bold text-stone-900">
                    <span className="flex items-center gap-1 text-rose-900">
                      <Wand2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>AI 妆造特征提炼与化妆台替代匹配</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 font-normal">匹配度 94%</span>
                  </div>
                  <p className="text-[10px] text-stone-500">
                    • <strong>眼妆：</strong>3CE九宫格深浅大地色打底，眼下留白 1.5mm 画出微笑卧蚕。<br />
                    • <strong>唇妆：</strong>植村秀 BR784 丝绒质感，指腹模糊边缘避免生硬唇线。<br />
                    • <strong>腮红：</strong>面中膨胀粉扫在眼下三角区，缩短中庭。
                  </p>
                </div>

                {/* 2 Clear Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleOpenDetailedShowcase('清透')}
                    className="flex-1 py-2 px-3 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-stone-600" />
                    <span>导入试妆镜微调</span>
                  </button>

                  <button
                    onClick={() => handleStartPractice(`仿妆跟练 · ${imitationRefTitle}`, 'imitation')}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#962F43] to-[#CF3F57] hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>开始仿妆分步跟练</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* WORKSPACE 3: COS 角色妆造定制 WORKBENCH              */}
            {/* ---------------------------------------------------- */}
            {selectedLookType === 'cos' && (
              <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-200/80 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-stone-900">输入角色名称 · COS 妆造定制</span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-indigo-100 text-indigo-800 font-semibold">
                      二次元/漫展
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400">大眼下至 · 假发色彩联动</span>
                </div>

                {/* Character Name Input + Quick Character Chips */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-700 block">
                    1. 目标 COS 角色名称 (点击快捷填入或自主输入)：
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={cosCharacterName}
                      onChange={(e) => setCosCharacterName(e.target.value)}
                      placeholder="如：原神·雷电将军 / 初音未来 / 崩铁·卡芙卡 / 间谍过家家·约尔"
                      className="flex-1 px-3 py-2 text-xs bg-white border border-indigo-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                    />
                    <button
                      onClick={() => cosFileInputRef.current?.click()}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>立绘参考图</span>
                    </button>
                  </div>

                  {/* Quick Character Selection Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {[
                      '原神·雷电将军',
                      '初音未来',
                      '崩铁·卡芙卡',
                      '间谍过家家·约尔',
                      '葬送的芙莉莲',
                      'EVA·绫波丽'
                    ].map((name) => (
                      <button
                        key={name}
                        onClick={() => {
                          setCosCharacterName(name);
                          showToast(`已填入角色「${name}」`);
                        }}
                        className={`px-2 py-0.5 rounded-full text-[10px] border transition-colors ${
                          cosCharacterName === name 
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold' 
                            : 'bg-white text-stone-700 border-stone-200 hover:border-indigo-300'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Character Features Breakdown */}
                <div className="p-2.5 bg-white rounded-xl border border-indigo-100 text-[11px] text-stone-600 space-y-1">
                  <div className="flex items-center justify-between font-bold text-stone-900">
                    <span className="flex items-center gap-1 text-indigo-900">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{cosCharacterName} 专属妆造拆解</span>
                    </span>
                    <span className="text-[10px] text-indigo-600 font-semibold">舞台持妆 8H+</span>
                  </div>
                  <p className="text-[10px] text-stone-500 leading-relaxed">
                    • <strong>眼部二次元大眼：</strong>眼裂向外平拉 4mm，深紫眼线画出下至，搭配 12mm 束状仙子毛放大双眼。<br />
                    • <strong>发色与眉形联动：</strong>紫冷调假发搭配深灰平直挑眉，拒绝暖黄眉毛突兀。<br />
                    • <strong>舞台高遮瑕底妆：</strong>冷白遮瑕打底，T区烘焙定妆，闪光灯下不反光脱色。
                  </p>
                </div>

                {/* 2 Clear Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleOpenDetailedShowcase('漫展COS')}
                    className="flex-1 py-2 px-3 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-stone-600" />
                    <span>定制该角色试妆</span>
                  </button>

                  <button
                    onClick={() => handleStartPractice(`COS跟练 · ${cosCharacterName}`, 'cos', cosCharacterName)}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-[#962F43] hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>开始 COS 分步跟练</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* LAYER 4: SHOWCASE & RECOMMENDED LOOKS / ARCHIVES          */}
      {/* ======================================================== */}
      {activeTab === 'create' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold font-serif text-stone-900">
                试妆效果与专属档案推荐
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-[#962F43] font-semibold border border-rose-200">
                可分别进入试妆或跟练
              </span>
            </div>
            <span className="text-[11px] text-stone-400">图4沉浸式全屏试妆工坊</span>
          </div>

          {/* LARGE SHOWCASE CARD */}
          <div 
            className="relative rounded-3xl overflow-hidden border border-[#EDE5DE] shadow-md transition-all group bg-stone-950"
          >
            <div className="relative min-h-[380px] sm:min-h-[440px] w-full flex items-center justify-center">
              {/* Large Face Image */}
              <img 
                src={userPhotoUrl || homePortraitImg} 
                alt="My Makeup Look" 
                className="w-full h-full max-h-[480px] object-cover object-center group-hover:scale-102 transition-transform duration-500" 
              />

              {/* Simulated Soft Radiance & Makeup Layer over preview */}
              <div 
                className="absolute inset-0 pointer-events-none mix-blend-soft-light bg-gradient-to-t from-black/80 via-transparent to-black/30"
              />

              {/* Natural Feathered Lip & Blush Blend */}
              <div 
                className="absolute inset-x-[36%] bottom-[25%] h-[10%] rounded-[50%] pointer-events-none blur-[2px] opacity-80 mix-blend-multiply bg-[#B2382D]"
              />
              <div 
                className="absolute left-[18%] top-[45%] w-[25%] h-[18%] rounded-full pointer-events-none blur-[14px] opacity-55 mix-blend-color-burn bg-[#F5A4AC]"
              />
              <div 
                className="absolute right-[18%] top-[45%] w-[25%] h-[18%] rounded-full pointer-events-none blur-[14px] opacity-55 mix-blend-color-burn bg-[#F5A4AC]"
              />

              {/* Top Overlay Badge */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-stone-900/80 backdrop-blur-md text-white text-xs font-semibold border border-white/20">
                  当前试妆：{viewingLook.title}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#22C55E]/90 text-black text-[10px] font-bold">
                  面部数据已就绪
                </span>
              </div>

              {/* Bottom Information & 2 Clear Buttons: 查看试妆效果 vs 开始跟练 */}
              <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-5 bg-gradient-to-t from-stone-950 via-stone-950/80 to-transparent space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-white">
                  <div>
                    <div className="text-xs text-rose-300 font-medium flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>已联动化妆台 {viewingLook.matched_products.length} 款彩妆</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold font-serif mt-0.5">
                      {viewingLook.title}
                    </h3>
                    <p className="text-xs text-stone-300 line-clamp-1 mt-0.5">
                      {viewingLook.description}
                    </p>
                  </div>

                  {/* Dual Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenDetailedShowcase()}
                      className="px-4 py-2.5 rounded-full bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold border border-white/20 shadow-md flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>查看试妆效果</span>
                    </button>

                    <button
                      onClick={() => handleStartPractice(viewingLook.title, viewingLook.type || 'daily')}
                      className="px-5 py-2.5 rounded-full bg-[#22C55E] hover:bg-[#1ea34d] text-black text-xs font-bold shadow-lg flex items-center gap-1.5 transition-transform active:scale-95"
                    >
                      <span>开始分步跟练</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sub Features Row */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-stone-400">
                  <span>支持：套装 · 底妆 · 睫毛 · 眉毛 · 眼线 · 眼影 · 口红 · 腮红 · 修容 · 高光 · 美瞳</span>
                  <span className="text-[#22C55E] font-medium hidden sm:inline">可导入抖音/小红书妆教</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: PRECHECK (妆前肤质预判与卡粉脱妆预警)                 */}
      {/* ======================================================== */}
      {activeTab === 'precheck' && (
        <div className="bg-white rounded-3xl p-5 border border-[#F0EBE6] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-700" />
                <h3 className="text-base font-serif font-bold text-stone-900">
                  妆前肤质预判与卡粉脱妆预警
                </h3>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                先判断今天皮肤适不适合上妆、如何避免斑驳翻车，再给出教学。
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-800 block mb-2">
              点击测试您当前的面部触感：
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'dry', label: '两颊紧绷脱皮', risk: '极高卡粉斑驳风险' },
                { id: 'oily', label: 'T区明显冒油', risk: '脱妆移位与暗沉风险' },
                { id: 'redness', label: '局部泛红敏弱', risk: '摩擦加重屏障刺痛' },
                { id: 'normal', label: '水油平衡平整', risk: '状态极佳，可化水光妆' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setPrecheckCondition(item.id as any)}
                  className={`p-3 rounded-2xl border text-left transition-colors ${
                    precheckCondition === item.id
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800'
                  }`}
                >
                  <span className="text-xs font-bold block">{item.label}</span>
                  <span className={`text-[10px] block mt-0.5 ${precheckCondition === item.id ? 'text-stone-300' : 'text-stone-500'}`}>
                    {item.risk}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Pre-check Advice */}
          <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2 text-xs">
            <h4 className="font-bold text-amber-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>今日妆前防翻车专属定制提示：</span>
            </h4>
            {precheckCondition === 'dry' && (
              <p className="text-amber-900 leading-relaxed">
                🚨 <strong>偏干起皮预警：</strong>今天请绝对<strong>减少全脸烘焙散粉</strong>！
                建议上妆前用化妆台内的【芭比波朗橘子面霜】在鼻翼与法令纹处揉搓温热薄揉打底，粉底液中滴入半滴精华乳混匀，用湿润海绵蛋按压上妆，避免刷具拉扯干皮。
              </p>
            )}
            {precheckCondition === 'oily' && (
              <p className="text-amber-900 leading-relaxed">
                ⚠️ <strong>出油脱妆预警：</strong>今天需强化<strong>分区定妆</strong>！
                妆前护肤暂停厚重油质面霜，选用清爽二裂酵母打底；底妆完成后用粉扑紧密按压 T 区定妆，延长持妆 4 小时以上。
              </p>
            )}
            {precheckCondition === 'redness' && (
              <p className="text-amber-900 leading-relaxed">
                🌸 <strong>泛红敏感预警：</strong>今天主打<strong>低刺激极简轻妆</strong>！
                禁止使用粘合力过强的假睫毛胶水与撕拉式美瞳，粉底以半泵薄拍均匀肤色即可，泛红处用色修修护代替厚重遮瑕膏。
              </p>
            )}
            {precheckCondition === 'normal' && (
              <p className="text-amber-900 leading-relaxed">
                ✨ <strong>状态良好：</strong>角质层含水量充足，平整通透，无论是法式丝缎光泽妆还是 COS 动漫大眼妆均可尽情发挥！
              </p>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: PROFILE (五官底档)                                  */}
      {/* ======================================================== */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-5 border border-[#F0EBE6] shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-serif font-bold text-stone-900">
              五官比例与审美底档系统
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              本系统严格采用“适配优势”与“风格延展”，严禁评判或贬低任何原生五官特征。
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-stone-800 block mb-1">
                五官比例与骨相特征 (AI 妆造以此为高光锚点)
              </label>
              <input
                type="text"
                value={aestheticProfile.faceFeatures}
                onChange={(e) => setAestheticProfile({ ...aestheticProfile, faceFeatures: e.target.value })}
                className="w-full p-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-800 block mb-1">
                肤质底色与卡粉脱妆倾向
              </label>
              <input
                type="text"
                value={aestheticProfile.skinTendency}
                onChange={(e) => setAestheticProfile({ ...aestheticProfile, skinTendency: e.target.value })}
                className="w-full p-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-800 block mb-1">
                个人妆容禁忌与避雷色系
              </label>
              <input
                type="text"
                value={aestheticProfile.makeupTaboos}
                onChange={(e) => setAestheticProfile({ ...aestheticProfile, makeupTaboos: e.target.value })}
                className="w-full p-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-800 block mb-1">
                偏好的风格氛围
              </label>
              <input
                type="text"
                value={aestheticProfile.stylePreference}
                onChange={(e) => setAestheticProfile({ ...aestheticProfile, stylePreference: e.target.value })}
                className="w-full p-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-stone-100">
            {profileSaved ? (
              <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                审美底档已更新，已接入妆造生成引擎
              </span>
            ) : <span />}

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('create')}
                className="px-4 py-2 text-xs text-stone-600 hover:text-stone-900"
              >
                返回妆造
              </button>
              <button
                onClick={() => {
                  setProfileSaved(true);
                  setTimeout(() => setProfileSaved(false), 3000);
                }}
                className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-full transition-colors"
              >
                保存底档
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: ARCHIVE (妆容存档)                                  */}
      {/* ======================================================== */}
      {activeTab === 'archive' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-stone-900 font-serif">已存档的经典妆容</h2>
            <button
              onClick={() => setActiveTab('create')}
              className="text-xs text-[#962F43] hover:underline"
            >
              + 创作新妆造
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {looks.map((look) => (
              <div 
                key={look.id}
                className="bg-white rounded-2xl p-4 border border-[#F0EBE6] shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-stone-400 pb-2 border-b border-stone-100">
                    <span className="font-bold text-stone-800">
                      {look.type === 'daily' ? '日常妆' : look.type === 'imitation' ? '仿妆' : 'COS'}
                    </span>
                    <span>{look.occasion}</span>
                  </div>
                  <h3 className="text-xs font-bold text-stone-900 mt-2">
                    {look.title}
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-1 line-clamp-2">
                    {look.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenDetailedShowcase(look.title)}
                    className="text-xs font-semibold text-stone-700 hover:text-stone-900 flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5 text-stone-500" />
                    <span>试妆镜</span>
                  </button>

                  <button
                    onClick={() => handleStartPractice(look.title, look.type || 'daily')}
                    className="px-3 py-1 rounded-full bg-[#962F43] hover:bg-[#832637] text-white text-[11px] font-bold flex items-center gap-1 transition-all"
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>开始跟练</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* P3 FULL-SCREEN VIRTUAL MAKEUP EDITOR MODAL               */}
      {/* ======================================================== */}
      {showImage4Editor && userPhotoUrl && (
        <Image4BeautyEditor
          userPhotoUrl={userPhotoUrl}
          generatedImage={viewingLook.generated_image}
          onClose={() => setShowImage4Editor(false)}
          products={products}
          onSaveLook={(title, rating) => {
            if (onRateLook) {
              onRateLook(title, rating, '在详细试妆镜中完成定制并确认满意的配方');
            }
          }}
          initialSet={editorInitialSet}
          onConfirmFollowAlong={() => {
            setShowImage4Editor(false);
            setShowFollowAlong(true);
          }}
        />
      )}

      {/* ======================================================== */}
      {/* P5 DEDICATED FOLLOW-ALONG PRACTICE STUDIO MODAL           */}
      {/* ======================================================== */}
      {showPracticeStudio && userPhotoUrl && (
        <MakeupPracticeStudio
          lookTitle={practiceLookTitle}
          lookType={practiceLookType}
          characterName={practiceCharacter}
          userPhotoUrl={userPhotoUrl}
          activeProducts={products}
          onClose={() => setShowPracticeStudio(false)}
          onSaveToArchive={(archiveData) => {
            if (onRateLook) {
              onRateLook(archiveData.title, archiveData.rating, archiveData.reviewNote);
            }
            showToast('已录入个人妆容档案红黑榜！');
          }}
        />
      )}
      {showFollowAlong && userPhotoUrl && (
        <MakeupFollowAlong
          userPhotoUrl={userPhotoUrl}
          generatedImage={viewingLook.generated_image}
          look={viewingLook}
          products={products}
          authenticated={authenticated}
          onClose={() => setShowFollowAlong(false)}
        />
      )}
    </div>
  );
};
