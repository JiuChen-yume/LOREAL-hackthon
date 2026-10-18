import React, { useState } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Sparkles, 
  ShoppingBag, 
  X, 
  AlertCircle, 
  Info, 
  Check,
  ShieldCheck,
  MapPin,
  Recycle,
  Tag,
  ArrowRight,
  TrendingDown,
  Gift,
  Plus,
  Trash2
} from 'lucide-react';
import { MallItem, BeautyProduct } from '../../types/beauty';
import { 
  skincareCalm, 
  vanityHero, 
  makeupLookImg,
  circularBottleEcoImg,
  makeupGlamourImg
} from '../../data/mockData';

interface MallScreenProps {
  mallItems: MallItem[];
  vanityProducts: BeautyProduct[];
  onNavigateToVanityRescue: (productName: string) => void;
}

export const MallScreen: React.FC<MallScreenProps> = ({
  mallItems,
  vanityProducts,
  onNavigateToVanityRescue
}) => {
  const [activeTab, setActiveTab] = useState('为你补齐');
  const [showAiAlert, setShowAiAlert] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(1);
  const [showCartModal, setShowCartModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected item for "这件能买吗？" AI Purchase Decision Modal
  const [decisionModalItem, setDecisionModalItem] = useState<any | null>(null);

  // Shopping cart items state
  const [cartItems, setCartItems] = useState<Array<{ id: string; title: string; price: number; img: string; count: number }>>([
    {
      id: 'm1',
      title: '轻薄持妆水润粉底液',
      price: 219,
      img: vanityHero,
      count: 1
    }
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const categories = ['为你补齐', '化妆台平替', '临近用完', '新品探索', '线下专柜', '产品回收'];

  // Rich feeds categorized dynamically
  const allFeeds: Record<string, any[]> = {
    '为你补齐': [
      {
        id: 'm1',
        badge: '✨ AI 为你补齐',
        title: '轻薄持妆水润粉底液',
        tags: ['适合偏干泛红肌', '自然水光', '养肤不暗沉'],
        desc: '根据你的偏干泛红肤质定制推荐，质地轻薄透气，含角鲨烷与积雪草成分。',
        price: 219,
        originalPrice: 289,
        hasSameCategory: true,
        similarCount: 2,
        similarity: 78,
        isCommercial: false,
        img: vanityHero,
        brand: '花西子',
        category: 'base'
      },
      {
        id: 'm2',
        badge: '✨ AI 精准推荐',
        title: '柔雾丝绒哑光唇釉 #03',
        tags: ['低饱和红茶', '显白提气色', '不易沾杯'],
        desc: '基于你的冷白皮与常用色系，推荐这款日常通勤百搭的红茶陶土色，温柔优雅。',
        price: 168,
        originalPrice: 249,
        hasSameCategory: true,
        similarCount: 3,
        similarity: null,
        isCommercial: true,
        img: makeupLookImg,
        brand: '酵色',
        category: 'lip'
      },
      {
        id: 'm3',
        badge: '🛡️ 屏障维稳',
        title: '神经酰胺屏障修护喷雾',
        tags: ['妆前补水', '舒缓泛红', '敏感肌可用'],
        desc: '补齐化妆台中缺失的便携妆前补水喷雾，随时随地缓解换季干燥。',
        price: 128,
        originalPrice: 179,
        hasSameCategory: false,
        similarCount: 0,
        similarity: null,
        isCommercial: false,
        img: skincareCalm,
        brand: '理肤泉',
        category: 'skincare'
      }
    ],
    '化妆台平替': [
      {
        id: 'dupe_1',
        badge: '💰 92% 高相似度平替',
        title: '橘朵单色烘焙腮红 #02 甜杏乌龙',
        tags: ['平替: 倩碧小雏菊 #08', '粉质极其细腻', '立省 ¥130'],
        desc: '显色度与色调精准对标小雏菊 #08，粉质轻薄服帖，膨胀缩短中庭效果极佳。',
        price: 39,
        originalPrice: 169,
        hasSameCategory: true,
        similarCount: 1,
        similarity: 92,
        isCommercial: false,
        img: makeupLookImg,
        brand: 'Judydoll 橘朵',
        category: 'cheek'
      },
      {
        id: 'dupe_2',
        badge: '💰 90% 经典平替',
        title: '酵色红茶多用九色眼影盘',
        tags: ['平替: 3CE OVERTAKE', '消肿大地色', '立省 ¥80'],
        desc: '同配方消肿红棕与细闪爆闪，不易飞粉，新手老手皆宜。',
        price: 89,
        originalPrice: 169,
        hasSameCategory: true,
        similarCount: 2,
        similarity: 90,
        isCommercial: false,
        img: makeupGlamourImg,
        brand: 'Joocyee 酵色',
        category: 'eye'
      },
      {
        id: 'dupe_3',
        badge: '💰 88% 屏障修护平替',
        title: '珂润润浸保湿滋养乳霜 40g',
        tags: ['平替: 赫莲娜日常维稳', '无香精无酒精', '立省 ¥2800'],
        desc: '神经酰胺功能成分，修护干敏角质层，滋润不闷痘。',
        price: 139,
        originalPrice: 198,
        hasSameCategory: true,
        similarCount: 1,
        similarity: 88,
        isCommercial: false,
        img: skincareCalm,
        brand: 'Curel 珂润',
        category: 'skincare'
      }
    ],
    '临近用完': [
      {
        id: 'm4',
        badge: '⏰ 临近用完补货',
        title: '深层高保湿修护面霜 50ml',
        tags: ['深层保湿', '修护屏障', '适合干敏肌'],
        desc: '检测到你化妆台中同类面霜剩余约 15%，预计 10 天后用完，提前备货更省心。',
        price: 198,
        originalPrice: 256,
        hasSameCategory: true,
        similarCount: 1,
        similarity: null,
        isCommercial: true,
        img: skincareCalm,
        brand: '修丽可',
        category: 'skincare'
      },
      {
        id: 'm5',
        badge: '⏰ 临期替换推荐',
        title: '柔光清爽水润防晒乳 SPF50+',
        tags: ['物化结合', '一抹化水', '成膜快'],
        desc: '化妆台旧版防晒将于 15 天后开盖满 12 个月（PAO到期），建议及时更新。',
        price: 159,
        originalPrice: 219,
        hasSameCategory: true,
        similarCount: 1,
        similarity: null,
        isCommercial: false,
        img: skincareCalm,
        brand: '怡丽丝尔',
        category: 'skincare'
      }
    ],
    '新品探索': [
      {
        id: 'new_1',
        badge: '🍃 春季透光限定',
        title: '春日清透花颜四色眼影盘',
        tags: ['微光碎钻', '清透低饱和', '不显肿'],
        desc: '2026 春季水光新品，搭配细致微闪与奶油哑光，打造灵动氧气眼妆。',
        price: 189,
        originalPrice: 269,
        hasSameCategory: false,
        similarCount: 0,
        similarity: null,
        isCommercial: true,
        img: makeupGlamourImg,
        brand: 'Suqqu',
        category: 'eye'
      },
      {
        id: 'new_2',
        badge: '🍃 纯净美妆 Clean Beauty',
        title: '植萃多肽抗皱紧致精华露',
        tags: ['纯素配方', '零防腐添加', '温和提亮'],
        desc: '不含黑榜成分，通过 0 刺激斑贴测试，适合娇嫩敏肌。',
        price: 298,
        originalPrice: 388,
        hasSameCategory: false,
        similarCount: 0,
        similarity: null,
        isCommercial: false,
        img: skincareCalm,
        brand: 'Drunk Elephant',
        category: 'skincare'
      }
    ],
    '线下专柜': [
      {
        id: 'offline_1',
        badge: '📍 线下 1.2km 可试妆',
        title: '巴黎欧莱雅环球港旗舰店 · 专柜测肤与试色',
        tags: ['免费AI面部分析', '色号实测', '赠小样套组'],
        desc: '上海市普陀区中山北路3300号环球港B1层 · 营业至 22:00。',
        price: 0,
        originalPrice: 150,
        hasSameCategory: false,
        similarCount: 0,
        similarity: null,
        isCommercial: false,
        img: vanityHero,
        brand: 'L\'Oreal Paris',
        category: 'service'
      },
      {
        id: 'offline_2',
        badge: '📍 线下 2.5km 专柜',
        title: 'SK-II 港汇恒隆广场专柜 · 魔镜肌龄实测',
        tags: ['一对一美容顾问', '神仙水体验装', '无强行推销'],
        desc: '上海市徐汇区虹桥路1号港汇恒隆1楼 · 营业至 21:30。',
        price: 0,
        originalPrice: 200,
        hasSameCategory: false,
        similarCount: 0,
        similarity: null,
        isCommercial: false,
        img: skincareCalm,
        brand: 'SK-II',
        category: 'service'
      }
    ],
    '产品回收': [
      {
        id: 'recycle_mall_1',
        badge: '♻️ 绿色空瓶换礼',
        title: '欧莱雅空瓶绿色回收 · 兑换环保替换芯',
        tags: ['任意品牌空瓶', '兑 100 积分', '获无门槛减券'],
        desc: '投递 1 件正装玻璃或塑料空瓶，即可获赠环保旅行装与积分。',
        price: 0,
        originalPrice: 80,
        hasSameCategory: false,
        similarCount: 0,
        similarity: null,
        isCommercial: false,
        img: circularBottleEcoImg,
        brand: '绿色循环',
        category: 'eco'
      },
      {
        id: 'recycle_mall_2',
        badge: '♻️ 绿色公益认领',
        title: '阿拉善荒漠锁边林 · 梭梭树公益树苗',
        tags: ['200 循环积分', '生成数字碳减排证书', '真实种植'],
        desc: '用你在美妆平台坚持空瓶回收积攒的绿色积分，为沙漠贡献一片新绿。',
        price: 0,
        originalPrice: 100,
        hasSameCategory: false,
        similarCount: 0,
        similarity: null,
        isCommercial: false,
        img: circularBottleEcoImg,
        brand: '美丽地球',
        category: 'eco'
      }
    ]
  };

  const currentList = allFeeds[activeTab] || allFeeds['为你补齐'];

  const filteredItems = currentList.filter(item => {
    if (!searchQuery) return true;
    return item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
           item.tags.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  // Add to cart
  const handleAddToCart = (item: any) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, count: i.count + 1 } : i);
      }
      return [...prev, { id: item.id, title: item.title, price: item.price, img: item.img, count: 1 }];
    });
    setCartCount(prev => prev + 1);
    showToast(`已将「${item.title}」加入购物清单！`);
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

      {/* 1. Header with Search & Shopping Cart */}
      <div className="pt-1 flex items-start justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-serif tracking-tight text-stone-900">
              美妆发现商城
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100/80 text-rose-800 font-semibold border border-rose-200/60">
              理性消费
            </span>
          </div>
          <p className="text-[11px] text-stone-500">
            更懂你的美妆生活 · 结合化妆台已有产品，杜绝重复囤货
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            type="button" 
            onClick={() => setShowCartModal(true)}
            className="relative p-2 rounded-full bg-white border border-[#EDE5DE] text-stone-700 hover:text-stone-900 shadow-2xs hover:bg-stone-50 transition-colors" 
            title="购物清单"
          >
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#E05252] text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#FAF6F3]">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索商城好物、平替对标、品类或功效..."
          className="w-full pl-9 pr-8 py-2 bg-white rounded-2xl border border-[#EDE5DE] text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#962F43] shadow-2xs"
        />
        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* 2. Category Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
        {categories.map((cat) => {
          const isActive = activeTab === cat;
          return (
            <button
              key={cat}
              onClick={() => {
                setActiveTab(cat);
                showToast(`已切换至「${cat}」专区`);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-gradient-to-r from-[#E25C70] to-[#CF3F57] text-white shadow-2xs' 
                  : 'bg-white/80 text-stone-600 hover:text-stone-900 border border-[#EDE5DE]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 3. Hero AI Anti-Impulse Banner */}
      {showAiAlert && (
        <div className="relative rounded-3xl bg-gradient-to-r from-[#FFF0EC] via-[#FCEAE5] to-[#FCE6E2] p-4 border border-[#F5D8CF] shadow-xs overflow-hidden">
          <button 
            onClick={() => setShowAiAlert(false)}
            className="absolute top-3 right-3 text-stone-400 hover:text-stone-600"
            title="关闭提示"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            {/* Left Product Tray Image with 2件相似 badge */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-white/70 border border-rose-200/60 shrink-0">
              <img src={vanityHero} alt="化妆台已有相似产品" className="w-full h-full object-cover" />
              <div className="absolute bottom-1 left-1 right-1 bg-white/90 backdrop-blur-2xs rounded-full py-0.5 text-center text-[10px] font-bold text-[#CF3F57] shadow-2xs">
                2 件同类
              </div>
            </div>

            {/* Right Information */}
            <div className="flex-1 space-y-1 pr-3">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-[#CF3F57] bg-rose-100/70 w-fit px-2 py-0.5 rounded-full">
                <span>AI 防冲动消费提醒 &gt;</span>
                <Sparkles className="w-3 h-3" />
              </div>

              <h3 className="text-xs font-bold text-stone-900">
                你的化妆台中已有 <span className="text-[#CF3F57] text-sm font-serif">2</span> 件同功效产品
              </h3>

              <p className="text-[10px] text-stone-600 leading-relaxed">
                检测到与你化妆台中「滋润型粉底液」与「红茶色口红」功效及色调相近，建议优先拯救闲置。
              </p>

              <div className="flex items-center gap-2 pt-0.5">
                <button
                  onClick={() => onNavigateToVanityRescue('粉底液')}
                  className="px-3 py-1 rounded-full bg-[#E25C70] hover:bg-[#d64e62] text-white text-[10px] font-semibold shadow-2xs flex items-center gap-1"
                >
                  <span>查看我的化妆台</span>
                  <span>&gt;</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Product Feed Cards */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-[#EDE5DE] text-stone-400 text-xs">
            未找到相关选品，请尝试切换分类或搜索其他关键词。
          </div>
        ) : (
          filteredItems.map((item) => (
            <div 
              key={item.id}
              onClick={() => setDecisionModalItem(item)}
              className="bg-white rounded-3xl p-3.5 border border-[#F0EBE6] shadow-xs flex gap-3 relative overflow-hidden cursor-pointer hover:border-[#E8DFD8] transition-all group"
            >
              {/* Product Image */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-stone-50 border border-stone-100 shrink-0">
                <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                {/* Badge on top left of image */}
                <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-stone-900/75 backdrop-blur-2xs text-white text-[9px] font-medium shadow-2xs">
                  {item.badge}
                </div>
              </div>

              {/* Product Meta & Purchase */}
              <div className="flex-1 min-w-0 flex flex-col justify-between space-y-1">
                <div>
                  {/* Title & Badges */}
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="text-xs font-bold text-stone-900 truncate">
                      {item.title}
                    </h4>

                    <div className="flex items-center gap-1 shrink-0">
                      {item.hasSameCategory && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-50 text-[#CF3F57] font-semibold border border-rose-200/70 flex items-center gap-0.5">
                          <ShoppingBag className="w-2.5 h-2.5" />
                          <span>已有同类</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-1 flex-wrap mt-1">
                    {item.tags.map((t: string) => (
                      <span key={t} className="px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[9px]">
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Description */}
                  <p className="text-[10px] text-stone-500 mt-1 line-clamp-2 leading-tight">
                    {item.desc}
                  </p>

                  {/* Similarity Progress Bar if available */}
                  {item.similarity && (
                    <div className="mt-1 space-y-0.5">
                      <div className="flex items-center justify-between text-[9px] text-rose-700">
                        <span>与化妆台产品相似度</span>
                        <span className="font-bold">{item.similarity}%</span>
                      </div>
                      <div className="w-full h-1 bg-rose-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#E25C70] rounded-full" style={{ width: `${item.similarity}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Price & Add to List Button */}
                <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                  <div className="flex items-baseline gap-1">
                    {item.price > 0 ? (
                      <>
                        <span className="text-xs font-bold text-[#CF3F57]">¥</span>
                        <span className="text-base font-bold font-serif text-[#CF3F57]">{item.price}</span>
                        <span className="text-[10px] text-stone-400 line-through">¥{item.originalPrice}</span>
                      </>
                    ) : (
                      <span className="text-xs font-bold text-emerald-700 font-serif">
                        免费预约 / 积分兑换
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDecisionModalItem(item);
                      }}
                      className="px-2.5 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-[#CF3F57] text-[10px] font-semibold border border-rose-200/60"
                    >
                      这件能买吗？
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(item);
                      }}
                      className="px-3 py-1 rounded-full bg-gradient-to-r from-[#E25C70] to-[#CF3F57] text-white text-[10px] font-semibold flex items-center gap-1 shadow-2xs transition-transform active:scale-95"
                    >
                      <ShoppingCart className="w-3 h-3" />
                      <span>选购</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 5. "这件能买吗？" AI Smart Purchase Decision Modal */}
      {decisionModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-xl border border-stone-200 space-y-3.5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#CF3F57]" />
                <h3 className="text-sm font-bold text-stone-900 font-serif">
                  AI 理性决策报告 · 这件能买吗？
                </h3>
              </div>
              <button onClick={() => setDecisionModalItem(null)} className="text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Product Summary */}
            <div className="flex items-center gap-3 bg-stone-50 p-2.5 rounded-2xl">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-stone-200 shrink-0">
                <img src={decisionModalItem.img} alt={decisionModalItem.title} className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900">{decisionModalItem.title}</h4>
                <div className="text-[11px] text-[#CF3F57] font-serif font-bold mt-0.5">
                  ¥{decisionModalItem.price} <span className="text-[10px] text-stone-400 font-sans line-through">¥{decisionModalItem.originalPrice}</span>
                </div>
              </div>
            </div>

            {/* 3 Pillars of AI Decision */}
            <div className="space-y-2 text-xs">
              {/* Pillar 1: 重合度排查 */}
              <div className="p-2.5 rounded-xl bg-[#FFF6F3] border border-[#FADCD5] space-y-1">
                <div className="flex items-center justify-between font-bold text-stone-800 text-[11px]">
                  <span>1. 化妆台重合度分析</span>
                  <span className={decisionModalItem.hasSameCategory ? "text-[#CF3F57]" : "text-emerald-700"}>
                    {decisionModalItem.hasSameCategory ? "⚠️ 发现同类单品" : "✓ 完美填补品类空白"}
                  </span>
                </div>
                <p className="text-[10px] text-stone-600 leading-tight">
                  {decisionModalItem.hasSameCategory 
                    ? `你的化妆台已有 2 件相似底妆/彩妆单品。若非急需或空瓶，建议优先使用现有产品。`
                    : `你的化妆台中尚无此功能单品，购入后将丰富你的晨晚 Routine 与妆容变化。`}
                </p>
              </div>

              {/* Pillar 2: 成分避雷排查 */}
              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                <div className="flex items-center justify-between font-bold text-stone-800 text-[11px]">
                  <span>2. 成分避雷库比对</span>
                  <span className="text-emerald-700">✓ 安全通过</span>
                </div>
                <p className="text-[10px] text-stone-600 leading-tight">
                  未检测到变性乙醇、高浓度水杨酸或强香精防腐剂，对偏干敏感肌耐受度极佳。
                </p>
              </div>

              {/* Pillar 3: AI 综合决策建议 */}
              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                <div className="flex items-center justify-between font-bold text-stone-800 text-[11px]">
                  <span>3. AI 消费建议</span>
                  <span className="text-amber-800 font-bold">综合适配度 92%</span>
                </div>
                <p className="text-[10px] text-stone-700 leading-tight">
                  {decisionModalItem.similarity 
                    ? `作为大牌平替性价比极高，可节省 70% 预算，值得入手尝鲜！`
                    : `产品配方温和，如确实有使用场景可放心加购。`}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setDecisionModalItem(null);
                  onNavigateToVanityRescue('粉底液');
                }}
                className="flex-1 py-2 rounded-full border border-stone-200 text-stone-600 text-xs font-semibold hover:bg-stone-50"
              >
                去拯救闲置
              </button>
              <button
                onClick={() => {
                  handleAddToCart(decisionModalItem);
                  setDecisionModalItem(null);
                }}
                className="flex-1 py-2 rounded-full bg-gradient-to-r from-[#E25C70] to-[#CF3F57] text-white text-xs font-bold shadow-xs"
              >
                加入清单
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Shopping Cart Modal */}
      {showCartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-xl border border-stone-200 space-y-3.5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-[#CF3F57]" />
                <h3 className="text-sm font-bold text-stone-900">
                  我的美妆购物清单 ({cartItems.length})
                </h3>
              </div>
              <button onClick={() => setShowCartModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {cartItems.length === 0 ? (
              <div className="text-center py-8 text-stone-400 text-xs">
                清单为空，可以在商城中探索所需好物。
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {cartItems.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-stone-50">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-stone-200 shrink-0">
                      <img src={c.img} alt={c.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-stone-900 truncate">{c.title}</h5>
                      <span className="text-[11px] text-[#CF3F57] font-serif font-bold">¥{c.price}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-600">x{c.count}</span>
                      <button
                        onClick={() => {
                          setCartItems(cartItems.filter(i => i.id !== c.id));
                          setCartCount(prev => Math.max(0, prev - c.count));
                        }}
                        className="text-stone-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cartItems.length > 0 && (
              <div className="pt-2 border-t border-stone-100 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>总计预估：</span>
                  <span className="text-base text-[#CF3F57] font-serif">
                    ¥{cartItems.reduce((acc, cur) => acc + cur.price * cur.count, 0)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowCartModal(false);
                    setCartItems([]);
                    setCartCount(0);
                    showToast('🎉 模拟结算成功！已生成订单');
                  }}
                  className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#E25C70] to-[#CF3F57] text-white text-xs font-bold shadow-xs"
                >
                  去结算 / 导出清单
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
