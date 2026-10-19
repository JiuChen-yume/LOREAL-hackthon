import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Camera, 
  RotateCcw, 
  Sparkles, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Heart, 
  Star, 
  Share2, 
  Bookmark, 
  Volume2, 
  VolumeX, 
  Eye, 
  ArrowRight,
  ShieldCheck,
  Pause,
  Play,
  Layers
} from 'lucide-react';
import { BeautyProduct, MakeupLook } from '../../types/beauty';

export interface PracticeStep {
  id: string;
  num: number;
  title: string;
  targetArea: 'base' | 'brow' | 'eye' | 'lash' | 'blush' | 'contour' | 'lip';
  targetAreaName: string;
  productName: string;
  brand: string;
  shade?: string;
  shadeHex?: string;
  tool: string;
  dosage: string;
  method: string[];
  pitfalls: string[];
  checklist: string[];
  estimatedMin: number;
  isOptional?: boolean;
}

interface MakeupPracticeStudioProps {
  lookTitle: string;
  lookType: 'daily' | 'imitation' | 'cos';
  characterName?: string;
  userPhotoUrl: string;
  activeProducts: BeautyProduct[];
  customSteps?: PracticeStep[];
  onClose: () => void;
  onSaveToArchive?: (archiveData: {
    title: string;
    type: 'daily' | 'imitation' | 'cos';
    rating: 'red' | 'yellow' | 'black';
    reviewNote: string;
    usedProducts: string[];
    userPhotoUrl: string;
  }) => void;
}

export const MakeupPracticeStudio: React.FC<MakeupPracticeStudioProps> = ({
  lookTitle,
  lookType,
  characterName,
  userPhotoUrl,
  activeProducts,
  customSteps,
  onClose,
  onSaveToArchive
}) => {
  // Generate tailored steps based on lookType
  const defaultSteps: PracticeStep[] = React.useMemo(() => {
    if (customSteps && customSteps.length > 0) return customSteps;

    if (lookType === 'cos') {
      const char = characterName || '角色专属';
      return [
        {
          id: 'step_1',
          num: 1,
          title: '高遮瑕冷白舞台底妆',
          targetArea: 'base',
          targetAreaName: '全脸面部与颈部',
          brand: activeProducts.find(p => p.category === 'base')?.brand || '芭比波朗 / 兰蔻',
          productName: activeProducts.find(p => p.category === 'base')?.product_name || '橘子面霜 + 菁纯瓷白粉底',
          shade: '#100-PO 冷瓷白',
          shadeHex: '#FFF5F0',
          tool: '润湿紧致美妆蛋 / 三角粉扑',
          dosage: '全脸 1 泵，颈部半泵',
          method: [
            '用润泽妆前乳在鼻翼与两颊轻打圈，避免漫展长时间暗沉卡粉。',
            '粉底点涂于面中，用美妆蛋垂直快速拍开，边缘带到发际线与颈部避免分层。',
            '用散粉在 T 区和眼下进行烘焙轻定，确保持妆 8 小时以上。'
          ],
          pitfalls: [
            '不要来回拖拽涂抹，会破坏防晒成膜并起皮。',
            '颈部色差过大是二次元漫展出片常见翻车点，务必用余粉拍到锁骨。'
          ],
          checklist: [
            '全脸肤色均匀透亮无死角',
            '鼻翼与唇周无卡粉浮粉',
            '轻触面部无黏腻反光'
          ],
          estimatedMin: 4
        },
        {
          id: 'step_2',
          num: 2,
          title: '动漫立绘拉长眉形',
          targetArea: 'brow',
          targetAreaName: '眉弓与眉尾',
          brand: '植村秀 / 3CE',
          productName: '极细砍刀眉笔',
          shade: '角色发色联动灰棕 / 深冷灰',
          shadeHex: '#3D3430',
          tool: '极细眉笔 + 眉刷',
          dosage: '勾勒线条，少量多次',
          method: [
            '用眉刷理顺毛流，先定出眉峰稍高于原生眉峰 2mm，营造二次元锐利感。',
            '沿眉骨平直向后拉长 3-5mm，眉尾收尖利落。',
            '眉毛中段用染眉膏或浅色遮瑕梳理，与假发发色完美协调。'
          ],
          pitfalls: [
            '避免画成死黑块状蜡笔小新眉，线条要前虚后实。'
          ],
          checklist: [
            '左右眉毛高低对称度适中',
            '眉尾线条干净收尖，无多余晕染'
          ],
          estimatedMin: 3
        },
        {
          id: 'step_3',
          num: 3,
          title: '眼裂下至与动漫大眼眼影',
          targetArea: 'eye',
          targetAreaName: '上眼窝与下眼睑三角区',
          brand: activeProducts.find(p => p.category === 'eye')?.brand || '3CE',
          productName: activeProducts.find(p => p.category === 'eye')?.product_name || '九宫格眼影盘 OVERTAKE',
          shade: '深紫棕 / 暖红棕',
          shadeHex: '#6B3848',
          tool: '铺色扁头刷 + 细节火苗刷',
          dosage: '取粉后在手背轻抖掉余粉',
          method: [
            '用浅肤色大面积扫过整个上眼皮眼窝打底消肿。',
            '深色晕染眼尾后 1/3，从眼尾向太阳穴方向斜向上拉伸。',
            '重点步骤：用扁平刷取深棕色，在下眼睑后半段平拉画出「下至眼睑线」，中间留出眼白留白空间。',
            '在留白区与眼头点涂高光或卧蚕笔，瞬间放大双眼 1.5 倍！'
          ],
          pitfalls: [
            '下至线不要紧贴睫毛根部，必须留出空隙才有大眼假象。'
          ],
          checklist: [
            '眼影边缘无明显边界色块，过渡自然',
            '下至留白区干净透亮'
          ],
          estimatedMin: 5
        },
        {
          id: 'step_4',
          num: 4,
          title: '二次元束状漫画睫毛与拉长眼线',
          targetArea: 'lash',
          targetAreaName: '睫毛根部与眼尾下至',
          brand: '花洛莉亚 / 艾杜纱',
          productName: '极细速干眼线液笔 + 仙子毛束假睫毛',
          shade: '浓郁深黑 / 摩卡棕',
          shadeHex: '#1C1917',
          tool: '睫毛夹 + 弯头镊子 + 胶水',
          dosage: '分段贴 4-5 簇仙子毛',
          method: [
            '贴着睫毛根部画极细内眼线填补睫毛缝隙。',
            '眼尾顺着刚才的眼影走势，向上拉出一条 4mm 的利落动漫猫眼眼线。',
            '分段夹翘原生睫毛，取 11-12mm 仙子毛贴在黑眼球正上方和眼尾，形成根根分明的漫画束感。'
          ],
          pitfalls: [
            '胶水涂抹后静待 10 秒半干再上眼，粘合最牢固不移位。'
          ],
          checklist: [
            '假睫毛弧度与双眼皮协调',
            '眨眼无异物感或翘起'
          ],
          estimatedMin: 5
        },
        {
          id: 'step_5',
          num: 5,
          title: '角色氛围腮红与高光提亮',
          targetArea: 'blush',
          targetAreaName: '眼下三角区与鼻头',
          brand: 'NARS / 植村秀',
          productName: '膨胀色腮红与面中高光',
          shade: '冷调梅粉 / 膨胀粉白',
          shadeHex: '#E85D75',
          tool: '点彩刷 / 蓬松火苗刷',
          dosage: '少量轻沾，抖粉后轻扫',
          method: [
            '二次元腮红打法：从下眼睑卧蚕下方开始，横向轻扫至颧骨内侧，营造微醺幼态感。',
            '余粉轻扫鼻尖和下巴尖，增强二次元立体娇憨感。',
            '高光点在鼻梁骨最高处与鼻尖，视觉收窄鼻梁。'
          ],
          pitfalls: [
            '腮红位置不要低于鼻翼下缘，否则会显脸长下垂。'
          ],
          checklist: [
            '两颊气色红润通透',
            '面中饱满立体，中庭视觉缩短'
          ],
          estimatedMin: 3
        },
        {
          id: 'step_6',
          num: 6,
          title: '渐变雾面咬唇与边缘虚化',
          targetArea: 'lip',
          targetAreaName: '唇部内侧与轮廓',
          brand: activeProducts.find(p => p.category === 'lip')?.brand || '植村秀 / YSL',
          productName: activeProducts.find(p => p.category === 'lip')?.product_name || '小黑方唇膏 / 雾面唇釉',
          shade: '#BR784 赤狐红茶',
          shadeHex: '#8B1E3F',
          tool: '唇刷 / 指腹',
          dosage: '内侧涂抹一指，余色晕染',
          method: [
            '用粉扑余粉轻轻按压唇部边缘遮盖原本唇色。',
            '将口红涂抹于上下唇内侧 1/2 处。',
            '用小号唇刷或棉签向外画圈晕染开，唇峰稍微晕出边界营造饱满花瓣感。'
          ],
          pitfalls: [
            '唇部干裂起皮时先厚敷唇膏 3 分钟后用湿巾擦去死皮再上色。'
          ],
          checklist: [
            '唇部色彩内深外浅渐变过渡自然',
            '唇周边缘柔和无生硬分界'
          ],
          estimatedMin: 2
        }
      ];
    }

    if (lookType === 'imitation') {
      return [
        {
          id: 'step_1',
          num: 1,
          title: '清透水光原生感底妆',
          targetArea: 'base',
          targetAreaName: '全脸面部',
          brand: activeProducts.find(p => p.category === 'base')?.brand || '芭比波朗',
          productName: activeProducts.find(p => p.category === 'base')?.product_name || '橘子面霜 + 轻薄水光粉底',
          shade: '自然水润象牙白',
          shadeHex: '#FAF0E8',
          tool: '润湿海绵蛋',
          dosage: '大半泵薄涂',
          method: [
            '仿妆的核心是抓住神韵与光泽感，妆前用橘子面霜重点按摩鼻翼法令纹。',
            '粉底用海绵蛋由面中向外拍开，保持两颊原生毛孔微光泽。'
          ],
          pitfalls: ['避免全脸涂抹太厚失去灵动感。'],
          checklist: ['底妆服帖无粉痕', '局部泛红已被修饰遮盖'],
          estimatedMin: 3
        },
        {
          id: 'step_2',
          num: 2,
          title: '仿妆倒三角眼窝与卧蚕刻画',
          targetArea: 'eye',
          targetAreaName: '眼窝轮廓与卧蚕',
          brand: activeProducts.find(p => p.category === 'eye')?.brand || '3CE',
          productName: activeProducts.find(p => p.category === 'eye')?.product_name || '九宫格大地盘 OVERTAKE',
          shade: '低饱和燕麦红茶',
          shadeHex: '#9C6858',
          tool: '圆头晕染刷 + 扁头阴影刷',
          dosage: '少量多次',
          method: [
            '参考图重点在于低饱和眼部轮廓：用燕麦棕铺满上眼皮与鼻影衔接。',
            '眼下用细阴影刷顺着微笑弧度勾出饱满卧蚕阴影线。',
            '香槟碎钻或哑光米白填亮卧蚕鼓起处，眼神立马清亮。'
          ],
          pitfalls: ['卧蚕阴影不要画太长，停在黑眼球外缘即可。'],
          checklist: ['卧蚕立体自然，双眼有神'],
          estimatedMin: 4
        },
        {
          id: 'step_3',
          num: 3,
          title: '半截式下至眼线与自然睫毛',
          targetArea: 'lash',
          targetAreaName: '眼尾三角区',
          brand: '花洛莉亚',
          productName: '深棕眼线胶笔',
          shade: '柔和深棕',
          shadeHex: '#382823',
          tool: '眼线胶笔 + 睫毛夹',
          dosage: '极简半截',
          method: [
            '仅在眼尾后半段平拉出 2mm 细小尾巴，眼神温柔不显凶。',
            '睫毛夹三段式夹翘后，刷上根根分明的睫毛打底膏。'
          ],
          pitfalls: ['眼线不要下垂过狠，顺着下眼睑延伸线走。'],
          checklist: ['睫毛卷翘不结块，无苍蝇腿'],
          estimatedMin: 3
        },
        {
          id: 'step_4',
          num: 4,
          title: '大面积氛围腮红与收缩色打亮',
          targetArea: 'blush',
          targetAreaName: '眼下两颊与面中',
          brand: 'NARS / 植村秀',
          productName: '低饱和肉桂蜜桃腮红',
          shade: '肉桂粉桃',
          shadeHex: '#E2847A',
          tool: '蓬松大号腮红刷',
          dosage: '轻转一圈，手背均粉',
          method: [
            '模仿参考图的氛围感，腮红从苹果肌斜向上晕染至太阳穴下缘。',
            '与眼下遮瑕过渡边缘轻轻揉匀，形成自然天生好气色。'
          ],
          pitfalls: ['色块边界不能有明显边缘线，一定要多打圈晕染。'],
          checklist: ['两侧腮红位置高低一致，气色通透'],
          estimatedMin: 2
        },
        {
          id: 'step_5',
          num: 5,
          title: '低饱和丝绒红茶唇',
          targetArea: 'lip',
          targetAreaName: '全唇',
          brand: activeProducts.find(p => p.category === 'lip')?.brand || '植村秀',
          productName: activeProducts.find(p => p.category === 'lip')?.product_name || '小黑方唇膏 BR784',
          shade: '红棕红茶色',
          shadeHex: '#B2382D',
          tool: '指腹轻按',
          dosage: '薄涂一层',
          method: [
            '将口红均匀涂抹全唇，用指尖轻拍唇周虚化唇线。',
            '下唇中央稍微加深一层，增加丰盈立体度。'
          ],
          pitfalls: ['避免画出刻板生硬的死唇线。'],
          checklist: ['唇色饱满，复刻参考图神采'],
          estimatedMin: 2
        }
      ];
    }

    // Default: daily look
    return [
      {
        id: 'step_1',
        num: 1,
        title: '妆前滋润打底与抚平干纹',
        targetArea: 'base',
        targetAreaName: '鼻翼、额头与法令纹',
        brand: activeProducts.find(p => p.category === 'base')?.brand || '芭比波朗',
        productName: activeProducts.find(p => p.category === 'base')?.product_name || '维他命橘子面霜',
        shade: '无色通透保湿',
        shadeHex: '#FAF6F3',
        tool: '指腹温热按压',
        dosage: '黄豆粒大小',
        method: [
          '取黄豆大小橘子面霜，在掌心揉搓至半透明微温状态。',
          '按压在鼻翼易卡粉处、两颊干区及法令纹，停留 30 秒使角质软化。'
        ],
        pitfalls: ['油性 T 区用量减半，切勿厚涂导致后续搓泥。'],
        checklist: ['面部触感柔润不拔干，无黏稠多余残留'],
        estimatedMin: 1
      },
      {
        id: 'step_2',
        num: 2,
        title: '极简 3 点式薄透底妆',
        targetArea: 'base',
        targetAreaName: '面中三角区',
        brand: '兰蔻 / 自选粉底',
        productName: '菁纯轻薄持妆粉底液',
        shade: '#100-PO 瓷白',
        shadeHex: '#FDF0EC',
        tool: '湿润美妆蛋',
        dosage: '半泵即可',
        method: [
          '粉底挤在手背，点在额头中央、两颊苹果肌 3 个重点受光部位。',
          '美妆蛋快速由内向外拍匀，面周仅用余粉带过，实现天生小脸。'
        ],
        pitfalls: ['不要全脸均等厚涂，面中厚、面周薄才是高级骨相画法。'],
        checklist: ['肤色提亮均匀，自然原生透亮'],
        estimatedMin: 2
      },
      {
        id: 'step_3',
        num: 3,
        title: '柔雾毛流感野生眉',
        targetArea: 'brow',
        targetAreaName: '眉毛根部',
        brand: '植村秀',
        productName: '砍刀眉笔',
        shade: '灰棕色',
        shadeHex: '#4A3728',
        tool: '眉笔螺旋刷',
        dosage: '填补空隙',
        method: [
          '顺着原生眉毛生长方向，快速在空缺处补画 3-5 笔毛流。',
          '用螺旋刷横向梳理刷淡眉头，保持眉头透气不生硬。'
        ],
        pitfalls: ['眉头绝对不要填实，一定要保留透气毛流感。'],
        checklist: ['眉形整洁，精神提气'],
        estimatedMin: 2
      },
      {
        id: 'step_4',
        num: 4,
        title: '消肿日常大地眼影与卧蚕',
        targetArea: 'eye',
        targetAreaName: '眼皮眼窝',
        brand: activeProducts.find(p => p.category === 'eye')?.brand || '3CE',
        productName: activeProducts.find(p => p.category === 'eye')?.product_name || '九宫格眼影盘 OVERTAKE',
        shade: '哑光裸杏棕',
        shadeHex: '#A67B6F',
        tool: '大号眼影铺色刷',
        dosage: '轻沾一按',
        method: [
          '用哑光浅杏色大面积扫过眼皮，消除昨夜水肿。',
          '余粉轻扫下眼睑后半段，放大眼眶。'
        ],
        pitfalls: ['肿眼皮切勿在眼球上方大面积涂抹高反光大颗粒亮片。'],
        checklist: ['眼周干净消肿，深邃柔和'],
        estimatedMin: 2
      },
      {
        id: 'step_5',
        num: 5,
        title: '元气减龄苹果肌腮红',
        targetArea: 'blush',
        targetAreaName: '苹果肌内侧',
        brand: 'NARS',
        productName: '柔粉膨胀腮红',
        shade: '蜜桃浅粉',
        shadeHex: '#F5A4AC',
        tool: '腮红点彩刷',
        dosage: '少量轻拍',
        method: [
          '微笑找到苹果肌最高点，稍向内侧 1cm 处打圈轻拍。',
          '向上晕染至眼下，视觉提升脸颊紧致度。'
        ],
        pitfalls: ['避免打得太靠近鼻翼沟，会显得苹果肌下垂。'],
        checklist: ['双颊元气通透，如运动后微红'],
        estimatedMin: 1
      },
      {
        id: 'step_6',
        num: 6,
        title: '通勤润唇提气色',
        targetArea: 'lip',
        targetAreaName: '全唇',
        brand: activeProducts.find(p => p.category === 'lip')?.brand || '植村秀',
        productName: activeProducts.find(p => p.category === 'lip')?.product_name || '小黑方 BR784',
        shade: '赤狐红茶',
        shadeHex: '#C45868',
        tool: '指腹按压',
        dosage: '点涂抹开',
        method: [
          '口红在下唇中央点三下，抿唇均匀分布。',
          '指腹轻轻晕染唇峰边缘，自然丰满。'
        ],
        pitfalls: ['嘴角死角也要带到，避免说话时露出边缘色差。'],
        checklist: ['全妆协调，气色充沛，随时可出门！'],
        estimatedMin: 1
      }
    ];
  }, [lookType, characterName, activeProducts, customSteps]);

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Check photo / Camera check mode
  const [showCameraCheck, setShowCameraCheck] = useState(false);
  const [checkedPhotoUrl, setCheckedPhotoUrl] = useState<string | null>(null);
  const [checkPassed, setCheckPassed] = useState<boolean | null>(null);

  // Completion State
  const [isCompleted, setIsCompleted] = useState(false);
  const [userRating, setUserRating] = useState<'red' | 'yellow' | 'black'>('red');
  const [reviewNote, setReviewNote] = useState('');
  const [isSavedToArchive, setIsSavedToArchive] = useState(false);

  // Step Timer
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && !isCompleted) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, isCompleted]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentStep = defaultSteps[currentStepIdx] || defaultSteps[0];
  const isCurrentCompleted = completedSteps.includes(currentStep.id);

  const handleNextStep = () => {
    if (!completedSteps.includes(currentStep.id)) {
      setCompletedSteps(prev => [...prev, currentStep.id]);
    }
    if (currentStepIdx < defaultSteps.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1);
      setShowCameraCheck(false);
      setCheckedPhotoUrl(null);
      setCheckPassed(null);
    } else {
      // Finished all steps
      setIsCompleted(true);
      setIsTimerRunning(false);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1);
      setShowCameraCheck(false);
      setCheckedPhotoUrl(null);
      setCheckPassed(null);
    }
  };

  const handleCameraCheckSubmit = () => {
    // Simulate real-time computer vision check on user's current step
    setCheckedPhotoUrl(userPhotoUrl);
    setCheckPassed(true);
    if (!completedSteps.includes(currentStep.id)) {
      setCompletedSteps(prev => [...prev, currentStep.id]);
    }
  };

  const handleCommitArchive = () => {
    if (onSaveToArchive) {
      onSaveToArchive({
        title: `${lookTitle} · 实战跟练成效`,
        type: lookType,
        rating: userRating,
        reviewNote: reviewNote.trim() || '跟练流程顺畅，面部提亮自然，化妆台彩妆配合度极高！',
        usedProducts: defaultSteps.map(s => `${s.brand} ${s.productName}`),
        userPhotoUrl
      });
    }
    setIsSavedToArchive(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#141416] text-white flex flex-col select-none overflow-hidden animate-in fade-in">
      {/* 1. TOP HEADER BAR */}
      <div className="h-14 bg-[#1C1C20] border-b border-white/10 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-stone-400 hover:text-white transition-colors"
            title="退出跟练"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{lookTitle}</span>
              </h2>
              {characterName && (
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 font-semibold">
                  角色：{characterName}
                </span>
              )}
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 font-semibold">
                分步实操跟练工坊
              </span>
            </div>
            <div className="text-[10px] text-stone-400 flex items-center gap-2 mt-0.5">
              <span>共 {defaultSteps.length} 个步骤</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>耗时 {formatTimer(timerSeconds)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-stone-300 text-xs flex items-center gap-1 border border-white/10"
          >
            {isTimerRunning ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
            <span className="hidden sm:inline">{isTimerRunning ? '暂停计时' : '继续'}</span>
          </button>

          <button
            onClick={() => {
              // Jump directly to summary
              setIsCompleted(true);
              setIsTimerRunning(false);
            }}
            className="px-3 py-1 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold border border-white/10"
          >
            跳至成果
          </button>
        </div>
      </div>

      {/* 2. MAIN BODY (Desktop 3-Column / Mobile Responsive Workbench) */}
      {!isCompleted ? (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* COLUMN 1 (LEFT): Step Navigation (Hidden on tiny phones, collapsible) */}
          <div className="w-full md:w-64 bg-[#18181B] border-r border-white/10 p-3 overflow-y-auto shrink-0 hidden md:block">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs text-stone-400 font-semibold">
              <span>妆容流程导航</span>
              <span className="text-[#22C55E]">
                {completedSteps.length}/{defaultSteps.length} 完成
              </span>
            </div>

            <div className="space-y-1.5">
              {defaultSteps.map((st, idx) => {
                const isCur = idx === currentStepIdx;
                const isDone = completedSteps.includes(st.id);
                return (
                  <button
                    key={st.id}
                    onClick={() => {
                      setCurrentStepIdx(idx);
                      setShowCameraCheck(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 border ${
                      isCur
                        ? 'bg-[#962F43]/30 border-[#962F43] text-white shadow-xs'
                        : isDone
                        ? 'bg-stone-900/60 border-emerald-500/30 text-stone-300 hover:bg-stone-800'
                        : 'bg-transparent border-transparent text-stone-400 hover:bg-white/5'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 border ${
                      isDone 
                        ? 'bg-emerald-500 border-emerald-400 text-black' 
                        : isCur 
                        ? 'bg-[#962F43] border-[#962F43] text-white' 
                        : 'border-stone-600 text-stone-400'
                    }`}>
                      {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : st.num}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate flex items-center justify-between">
                        <span>{st.title}</span>
                      </div>
                      <div className="text-[10px] text-stone-400 truncate mt-0.5">
                        {st.targetAreaName} · 约{st.estimatedMin}m
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* COLUMN 2 (CENTER): Face Photo with Target Area Highlighting & Camera Check */}
          <div className="flex-1 bg-stone-950 flex flex-col items-center justify-center p-3 relative overflow-hidden">
            {/* Mobile Step Progress Pill */}
            <div className="w-full max-w-sm flex items-center justify-between md:hidden mb-2 px-1 text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-[#962F43] text-white text-[10px] flex items-center justify-center font-bold">
                  {currentStep.num}
                </span>
                <span>{currentStep.title}</span>
              </span>
              <span className="text-[10px] text-stone-400">
                步骤 {currentStepIdx + 1}/{defaultSteps.length}
              </span>
            </div>

            {/* Central Canvas Viewport */}
            <div className="relative w-full max-w-sm sm:max-w-md aspect-[3/4] max-h-[58vh] md:max-h-[72vh] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
              {/* User Photo */}
              <img
                src={userPhotoUrl}
                alt="My Face"
                className="w-full h-full object-cover object-center"
              />

              {/* Dynamic Target Area Focus Highlight Overlay */}
              <div className="absolute inset-0 pointer-events-none transition-all">
                {currentStep.targetArea === 'base' && (
                  <div className="absolute inset-4 rounded-3xl border-2 border-dashed border-amber-300/80 animate-pulse bg-amber-400/10 flex items-start justify-center pt-3">
                    <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] text-amber-300 font-semibold border border-amber-400/40">
                      🎯 当前部位：全脸面中底妆与平整度
                    </span>
                  </div>
                )}

                {currentStep.targetArea === 'brow' && (
                  <div className="absolute inset-x-[20%] top-[26%] h-[12%] rounded-2xl border-2 border-dashed border-indigo-300/90 animate-pulse bg-indigo-500/15 flex items-start justify-center">
                    <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[9px] text-indigo-300 font-semibold border border-indigo-400/40 -translate-y-3">
                      🎯 眉弓骨相与眉尾线条
                    </span>
                  </div>
                )}

                {currentStep.targetArea === 'eye' && (
                  <div className="absolute inset-x-[18%] top-[32%] h-[16%] rounded-2xl border-2 border-dashed border-rose-400/90 animate-pulse bg-rose-500/15 flex items-start justify-center">
                    <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[9px] text-rose-300 font-semibold border border-rose-400/40 -translate-y-3">
                      🎯 眼窝晕染与下至留白
                    </span>
                  </div>
                )}

                {currentStep.targetArea === 'lash' && (
                  <div className="absolute inset-x-[20%] top-[34%] h-[12%] rounded-2xl border-2 border-dashed border-emerald-400/90 animate-pulse bg-emerald-500/15 flex items-start justify-center">
                    <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[9px] text-emerald-300 font-semibold border border-emerald-400/40 -translate-y-3">
                      🎯 睫毛根部与眼尾拉伸
                    </span>
                  </div>
                )}

                {currentStep.targetArea === 'blush' && (
                  <div className="absolute inset-x-[14%] top-[42%] h-[20%] rounded-3xl border-2 border-dashed border-pink-400/90 animate-pulse bg-pink-500/15 flex items-start justify-center">
                    <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[9px] text-pink-300 font-semibold border border-pink-400/40 -translate-y-3">
                      🎯 苹果肌向太阳穴晕染走向
                    </span>
                  </div>
                )}

                {currentStep.targetArea === 'lip' && (
                  <div className="absolute inset-x-[30%] bottom-[20%] h-[16%] rounded-3xl border-2 border-dashed border-red-400/90 animate-pulse bg-red-500/15 flex items-center justify-center">
                    <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[9px] text-red-300 font-semibold border border-red-400/40 translate-y-8">
                      🎯 唇部内侧渐变与唇峰虚化
                    </span>
                  </div>
                )}
              </div>

              {/* Floating Camera Check result badge */}
              {checkedPhotoUrl && checkPassed && (
                <div className="absolute bottom-4 inset-x-4 p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-400 text-white text-xs flex items-center justify-between animate-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-[11px]">AI 复核通过：该部位晕染对称，边缘过渡自然！</span>
                  </div>
                  <button
                    onClick={() => {
                      setCheckedPhotoUrl(null);
                      setCheckPassed(null);
                    }}
                    className="text-[10px] text-stone-400 hover:text-white"
                  >
                    重测
                  </button>
                </div>
              )}
            </div>

            {/* Quick Camera Check Action */}
            <div className="mt-2.5 flex items-center gap-2">
              <button
                onClick={handleCameraCheckSubmit}
                className="px-3 py-1.5 rounded-full bg-stone-900/80 hover:bg-stone-800 border border-white/20 text-xs font-medium text-stone-300 flex items-center gap-1.5 transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>拍照复核当前部位</span>
              </button>
            </div>
          </div>

          {/* COLUMN 3 (RIGHT): Detailed Instructions & Products */}
          <div className="w-full md:w-80 lg:w-96 bg-[#18181B] border-l border-white/10 p-4 overflow-y-auto space-y-4 shrink-0">
            {/* Step Header */}
            <div>
              <div className="flex items-center justify-between text-xs text-stone-400 pb-1">
                <span className="font-mono">STEP 0{currentStep.num} / 0{defaultSteps.length}</span>
                <span className="text-amber-400 font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>预计 {currentStep.estimatedMin} 分钟</span>
                </span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {currentStep.title}
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                目标区域：<strong className="text-stone-200">{currentStep.targetAreaName}</strong>
              </p>
            </div>

            {/* Matched Vanity Product Card */}
            <div className="p-3 bg-stone-900 rounded-2xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-stone-400">
                <span className="flex items-center gap-1 font-semibold text-rose-300">
                  <Sparkles className="w-3 h-3" />
                  <span>推荐调用化妆台好物</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-stone-300">
                  真实库存匹配
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/20 flex items-center justify-center font-bold text-xs"
                  style={{ backgroundColor: currentStep.shadeHex || '#333' }}
                >
                  {currentStep.shade ? currentStep.shade.slice(0, 2) : '美妆'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {currentStep.productName}
                  </div>
                  <div className="text-[10px] text-stone-400 truncate mt-0.5 flex items-center gap-1.5">
                    <span>{currentStep.brand}</span>
                    {currentStep.shade && (
                      <>
                        <span>·</span>
                        <span className="text-amber-300">{currentStep.shade}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-[10px] text-stone-400">
                <div>
                  <span className="text-stone-500">使用工具：</span>
                  <span className="text-stone-300 ml-1">{currentStep.tool}</span>
                </div>
                <div>
                  <span className="text-stone-500">建议用量：</span>
                  <span className="text-stone-300 ml-1">{currentStep.dosage}</span>
                </div>
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>实操手法指引</span>
              </h4>
              <div className="space-y-2">
                {currentStep.method.map((m, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-stone-300 leading-relaxed bg-stone-900/40 p-2.5 rounded-xl border border-white/5">
                    <span className="w-4 h-4 rounded-full bg-white/10 text-white text-[10px] flex items-center justify-center font-mono shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{m}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pitfalls & Cautions */}
            {currentStep.pitfalls.length > 0 && (
              <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-2xl space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>防翻车要点</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-amber-200/90 text-[11px] leading-relaxed">
                  {currentStep.pitfalls.map((pf, idx) => (
                    <li key={idx}>{pf}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Self-Check Checklist */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>完成自检清单</span>
              </h4>
              <div className="space-y-1 text-xs text-stone-400">
                {currentStep.checklist.map((c, idx) => (
                  <label key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-stone-900/30 border border-white/5 cursor-pointer hover:bg-stone-900/60 transition-colors">
                    <input 
                      type="checkbox" 
                      defaultChecked={isCurrentCompleted}
                      className="rounded border-stone-600 text-emerald-500 focus:ring-0" 
                    />
                    <span className="text-[11px] text-stone-300">{c}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Bottom Actions for current step */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                disabled={currentStepIdx === 0}
                onClick={handlePrevStep}
                className="py-2.5 px-3 rounded-xl bg-stone-900 border border-white/10 hover:bg-stone-800 disabled:opacity-40 text-stone-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>上一步</span>
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#962F43] to-[#CF3F57] hover:opacity-95 text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-all"
              >
                <span>{currentStepIdx === defaultSteps.length - 1 ? '完成全部跟练' : '完成当前步，下一步'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 3. COMPLETION / SUMMARY / ARCHIVE WORKFLOW (第 6 节: 妆容完成后的反馈和存档) */
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex items-center justify-center bg-stone-950">
          <div className="max-w-lg w-full bg-[#1C1C20] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            {/* Header Success Banner */}
            <div className="text-center space-y-1">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto mb-2 shadow-lg">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h3 className="text-lg font-serif font-bold text-white tracking-tight">
                恭喜！完成「{lookTitle}」跟练！
              </h3>
              <p className="text-xs text-stone-400">
                耗时 {formatTimer(timerSeconds)} · 共完成 {completedSteps.length}/{defaultSteps.length} 个关键妆造部位
              </p>
            </div>

            {/* Finished Look Photo & Summary */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] border border-white/10 bg-black">
              <img
                src={userPhotoUrl}
                alt="Finished Look"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                <div className="space-y-0.5 text-white">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#22C55E] text-black font-bold">
                    成品实操已存档
                  </span>
                  <div className="text-sm font-bold font-serif">{lookTitle}</div>
                  <div className="text-[10px] text-stone-300">
                    实战彩妆：{defaultSteps.map(s => s.productName).slice(0, 3).join('、')}等
                  </div>
                </div>
              </div>
            </div>

            {/* User Rating (红榜 / 黄榜 / 避雷黑榜) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-300 block">
                给本次实战妆容评级（纳入个人妆容档案红黑榜）
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setUserRating('red')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    userRating === 'red'
                      ? 'bg-rose-500/20 border-rose-400 text-rose-300 font-bold ring-1 ring-rose-400'
                      : 'bg-stone-900 border-white/10 text-stone-400 hover:text-white'
                  }`}
                >
                  <Heart className="w-4 h-4 mx-auto mb-1 fill-rose-500 text-rose-500" />
                  <span className="text-xs block">红榜 · 珍藏</span>
                  <span className="text-[9px] block text-stone-400">适配度极佳</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUserRating('yellow')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    userRating === 'yellow'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold ring-1 ring-amber-400'
                      : 'bg-stone-900 border-white/10 text-stone-400 hover:text-white'
                  }`}
                >
                  <Star className="w-4 h-4 mx-auto mb-1 fill-amber-400 text-amber-400" />
                  <span className="text-xs block">黄榜 · 尚可</span>
                  <span className="text-[9px] block text-stone-400">需微调色号</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUserRating('black')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    userRating === 'black'
                      ? 'bg-stone-700/50 border-stone-400 text-stone-200 font-bold ring-1 ring-stone-400'
                      : 'bg-stone-900 border-white/10 text-stone-400 hover:text-white'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-stone-400" />
                  <span className="text-xs block">黑榜 · 避雷</span>
                  <span className="text-[9px] block text-stone-400">容易翻车卡粉</span>
                </button>
              </div>
            </div>

            {/* Custom Review Note */}
            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-1">
                个人实战心得或手法备注
              </label>
              <textarea
                rows={2}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="例如：下次眼影可以再少取一点粉，用指腹轻压唇中效果最通透！"
                className="w-full p-2.5 rounded-xl bg-stone-900 border border-white/10 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-rose-400 resize-none"
              />
            </div>

            {/* Save to Archive & Bottom Actions */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCompleted(false);
                  setCurrentStepIdx(0);
                  setTimerSeconds(0);
                  setIsTimerRunning(true);
                }}
                className="py-2.5 px-3 rounded-xl border border-white/10 text-stone-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>再次跟练</span>
              </button>

              <button
                type="button"
                disabled={isSavedToArchive}
                onClick={handleCommitArchive}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#962F43] to-[#CF3F57] hover:opacity-95 text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Bookmark className="w-4 h-4" />
                <span>{isSavedToArchive ? '已收录进妆容档案库 ✓' : '保存入我的妆容档案'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium"
              >
                退出工坊
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
