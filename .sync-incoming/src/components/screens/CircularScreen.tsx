import React, { useState } from 'react';
import { 
  Sprout, 
  MapPin, 
  Gift, 
  Users, 
  ChevronRight, 
  Heart, 
  Recycle, 
  Package, 
  TreePine, 
  Globe, 
  Check,
  X,
  Plus,
  Clock,
  Truck,
  Sparkles,
  Navigation as NavIcon,
  Award
} from 'lucide-react';
import { CircularRecycleRecord } from '../../types/beauty';
import { 
  circularBottleEcoImg, 
  circularRecycleImg, 
  skincareCalm, 
  homePortraitImg,
  vanityHero 
} from '../../data/mockData';

interface CircularScreenProps {
  recycleRecords: CircularRecycleRecord[];
  onAddRecycleRecord: (record: CircularRecycleRecord) => void;
}

export const CircularScreen: React.FC<CircularScreenProps> = ({
  recycleRecords,
  onAddRecycleRecord
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [userPoints, setUserPoints] = useState(260);

  // Modals inside Circular
  const [showRecycleModal, setShowRecycleModal] = useState(false);
  const [showStationsModal, setShowStationsModal] = useState(false);
  const [showGiftShopModal, setShowGiftShopModal] = useState(false);
  const [showPostStoryModal, setShowPostStoryModal] = useState(false);

  // Recycle Modal Form State
  const [recycleItemName, setRecycleItemName] = useState('兰蔻菁纯粉底液 (空瓶)');
  const [recycleMaterial, setRecycleMaterial] = useState<'glass' | 'plastic' | 'metal'>('glass');
  const [recycleCourierTime, setRecycleCourierTime] = useState('明天上午 10:00 - 12:00');
  const [recycleAddress, setRecycleAddress] = useState('上海市徐汇区虹桥路1号港汇恒隆广场 8楼');

  // Story Form State
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [newStoryContent, setNewStoryContent] = useState('');
  const [newStoryTag, setNewStoryTag] = useState('#空瓶挑战');

  // Community Stories state
  const [posts, setPosts] = useState([
    {
      id: 'p1',
      author: 'Luna 🌿',
      time: '3天前',
      avatar: '👩🏻',
      title: '闲置美妆拯救计划',
      content: '这些还很新的护肤品，送给更需要的姐妹。让美丽延续，而不是被丢弃。',
      tags: ['#闲置互助', '#美丽循环'],
      likes: 126,
      liked: false,
      img: circularRecycleImg
    },
    {
      id: 'p2',
      author: '阿宁',
      time: '5天前',
      avatar: '👧🏻',
      title: '看不见，也能看见美',
      content: '感谢大家推荐的无障碍美妆品牌，让化妆成为我也能享受的日常。',
      tags: ['#无障碍美妆', '#多元之美'],
      likes: 89,
      liked: false,
      img: homePortraitImg
    },
    {
      id: 'p3',
      author: 'Mori',
      time: '1周前',
      avatar: '👱🏻‍♀️',
      title: '30 天空瓶挑战',
      content: '这个月我回收了 12 个空瓶！小小行动，也能带来大改变。',
      tags: ['#空瓶挑战', '#可持续生活'],
      likes: 213,
      liked: false,
      img: circularBottleEcoImg
    }
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Submit appointment for empty bottle recycle
  const handleSubmitRecycle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recycleItemName.trim()) {
      showToast('请输入回收空瓶名称');
      return;
    }

    const newRecord: CircularRecycleRecord = {
      id: `rec_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      station_name: '顺丰免费绿色上门取件',
      type: recycleMaterial === 'glass' ? 'glass_bottle' : recycleMaterial === 'metal' ? 'aluminum_cap' : 'plastic_jar',
      item_name: recycleItemName.trim(),
      points: 100,
      status: 'verified'
    };

    onAddRecycleRecord(newRecord);
    setUserPoints(prev => prev + 100);
    setShowRecycleModal(false);
    showToast('🎉 空瓶回收预约成功！已为您增加 100 绿色积分');
  };

  // Submit new community post
  const handlePostStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoryTitle.trim() || !newStoryContent.trim()) {
      showToast('请填写故事标题与内容');
      return;
    }

    const newPost = {
      id: `post_${Date.now()}`,
      author: '我 🌸',
      time: '刚刚',
      avatar: '👱🏻‍♀️',
      title: newStoryTitle.trim(),
      content: newStoryContent.trim(),
      tags: [newStoryTag, '#可持续美妆'],
      likes: 1,
      liked: true,
      img: circularBottleEcoImg
    };

    setPosts([newPost, ...posts]);
    setShowPostStoryModal(false);
    setNewStoryTitle('');
    setNewStoryContent('');
    showToast('🎉 你的空瓶环保故事已发布到社区！');
  };

  // Toggle like
  const toggleLike = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          liked: !p.liked,
          likes: p.liked ? p.likes - 1 : p.likes + 1
        };
      }
      return p;
    }));
  };

  // Redeem reward
  const handleRedeemReward = (title: string, cost: number) => {
    if (userPoints < cost) {
      showToast(`积分不足（当前 ${userPoints} 分，需要 ${cost} 分）`);
      return;
    }
    setUserPoints(prev => prev - cost);
    showToast(`🎉 兑换成功！已获得「${title}」，兑换码已发送至通知`);
  };

  // Offline Stations list
  const offlineStations = [
    {
      name: '巴黎欧莱雅环球港旗舰店 · 绿色循环服务站',
      address: '上海市普陀区中山北路3300号环球港 B1 层 108 号',
      distance: '1.2km',
      hours: '10:00 - 22:00',
      accepts: '全品牌彩妆/护肤玻璃瓶、塑料瓶、金属管',
      reward: '投递即赠欧莱雅环保替换小样 + 100 积分'
    },
    {
      name: '资生堂 港汇恒隆广场专柜 · 绿植回收角',
      address: '上海市徐汇区虹桥路1号港汇恒隆广场 1 楼',
      distance: '2.5km',
      hours: '10:00 - 21:30',
      accepts: '护肤空瓶、精华空管、面霜玻璃罐',
      reward: '投递赠红妍肌活精华露试用装'
    },
    {
      name: '丝芙兰 上海南京西路旗舰店 · 美丽循环箱',
      address: '上海市静安区南京西路993号',
      distance: '3.8km',
      hours: '10:00 - 22:00',
      accepts: '任意美妆正装空瓶、香水空瓶',
      reward: '投递获丝芙兰绿色环保徽章'
    }
  ];

  return (
    <div className="p-3.5 sm:p-5 space-y-4 text-stone-900 select-none bg-[#FAF6F3]">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-stone-900/90 backdrop-blur-md text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 animate-in fade-in">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header with Eco Bottle Artwork */}
      <div className="relative pt-1 flex items-start justify-between min-h-[90px]">
        <div className="space-y-0.5 max-w-[230px]">
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl sm:text-2xl font-bold font-serif tracking-tight text-stone-900">
              美丽循环
            </h1>
            <span className="text-emerald-600 text-lg">🍃</span>
          </div>
          <p className="text-xs font-semibold text-stone-800">
            让美，更循环地发生
          </p>
          <p className="text-[10px] text-stone-500">
            回收 ｜ 再生 ｜ 兑换 ｜ 共建可持续的美丽生态
          </p>
        </div>

        {/* Right side eco image with quote */}
        <div className="text-right">
          <p className="text-[10px] font-serif italic text-emerald-800/80 leading-tight">
            小小举动<br />也能让世界更美丽 ♡
          </p>
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-white shadow-2xs border border-emerald-100 ml-auto mt-1">
            <img src={circularBottleEcoImg} alt="美丽循环" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* 2. Top Stats Card */}
      <div className="rounded-3xl bg-white p-4 border border-[#F0EBE6] shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-baseline gap-4">
            <div>
              <span className="text-[11px] text-stone-400">本月已回收 </span>
              <span className="text-2xl font-bold font-serif text-[#E05252]">{recycleRecords.length}</span>
              <span className="text-xs font-semibold text-stone-700"> 件</span>
            </div>
            <div>
              <span className="text-2xl font-bold font-serif text-emerald-700">{userPoints}</span>
              <span className="text-xs font-semibold text-stone-700"> 积分</span>
            </div>
          </div>

          <p className="text-[10px] text-stone-500 flex items-center gap-1">
            <span>累计减少约 {(recycleRecords.length * 0.28).toFixed(2)} kg 碳排放</span>
            <span className="text-rose-400">♡</span>
            <span>守护地球</span>
          </p>
        </div>

        {/* Gift shop trigger */}
        <button 
          onClick={() => setShowGiftShopModal(true)}
          className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold flex items-center gap-1 shadow-2xs hover:bg-emerald-100 transition-colors"
        >
          <Gift className="w-3.5 h-3.5 text-emerald-600" />
          <span>积分兑换好礼 &gt;</span>
        </button>
      </div>

      {/* 3. 4 Action Grid Cards (2x2) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Card 1: 预约空瓶回收 */}
        <div 
          onClick={() => setShowRecycleModal(true)}
          className="rounded-3xl p-3.5 bg-gradient-to-br from-[#E25C70] to-[#CF3F57] text-white shadow-xs flex flex-col justify-between cursor-pointer hover:shadow-sm transition-all min-h-[110px]"
        >
          <div>
            <h3 className="text-xs font-bold">预约空瓶回收</h3>
            <p className="text-[9px] text-rose-100 mt-0.5">顺丰免费上门 · 让空瓶重获新生</p>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-full">一键预约 &gt;</span>
            <Recycle className="w-6 h-6 text-white/80" />
          </div>
        </div>

        {/* Card 2: 线下绿色站点 */}
        <div 
          onClick={() => setShowStationsModal(true)}
          className="rounded-3xl p-3.5 bg-gradient-to-br from-[#3D634B] to-[#284433] text-white shadow-xs flex flex-col justify-between cursor-pointer hover:shadow-sm transition-all min-h-[110px]"
        >
          <div>
            <h3 className="text-xs font-bold">线下绿色站点</h3>
            <p className="text-[9px] text-emerald-100 mt-0.5">就近专柜投递 · 领取替换装小样</p>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-full">查看附近 &gt;</span>
            <MapPin className="w-6 h-6 text-white/80" />
          </div>
        </div>

        {/* Card 3: 积分兑换商城 */}
        <div 
          onClick={() => setShowGiftShopModal(true)}
          className="rounded-3xl p-3.5 bg-gradient-to-br from-[#E67E22] to-[#D35400] text-white shadow-xs flex flex-col justify-between cursor-pointer hover:shadow-sm transition-all min-h-[110px]"
        >
          <div>
            <h3 className="text-xs font-bold">积分环保兑换</h3>
            <p className="text-[9px] text-amber-100 mt-0.5">环保袋/替换芯/植树认领</p>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-full">去兑换 &gt;</span>
            <Gift className="w-6 h-6 text-white/80" />
          </div>
        </div>

        {/* Card 4: 社区空瓶故事 */}
        <div 
          onClick={() => setShowPostStoryModal(true)}
          className="rounded-3xl p-3.5 bg-gradient-to-br from-[#5C6BC0] to-[#3949AB] text-white shadow-xs flex flex-col justify-between cursor-pointer hover:shadow-sm transition-all min-h-[110px]"
        >
          <div>
            <h3 className="text-xs font-bold">发布空瓶挑战</h3>
            <p className="text-[9px] text-indigo-100 mt-0.5">记录每一次护肤坚持与空瓶</p>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-full">发布打卡 &gt;</span>
            <Users className="w-6 h-6 text-white/80" />
          </div>
        </div>
      </div>

      {/* 4. 最近回收记录 Timeline */}
      {recycleRecords.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-stone-900 font-serif">我的回收记录</h3>
            <span className="text-[10px] text-stone-400">已核验发放积分</span>
          </div>

          <div className="space-y-1.5">
            {recycleRecords.slice(0, 3).map((rec) => (
              <div key={rec.id} className="bg-white rounded-2xl p-2.5 border border-[#EDE5DE] shadow-2xs flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600">♻️</span>
                  <div>
                    <span className="font-bold text-stone-900 block truncate max-w-[200px]">{rec.item_name}</span>
                    <span className="text-[10px] text-stone-400">{rec.date} · {rec.station_name}</span>
                  </div>
                </div>
                <span className="font-serif font-bold text-emerald-700">+{rec.points} 分</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. 社区环保故事 Feed */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">🌱</span>
            <h3 className="text-sm font-bold text-stone-900 font-serif">美丽循环社区故事</h3>
          </div>
          <button 
            onClick={() => setShowPostStoryModal(true)}
            className="text-xs text-[#962F43] font-semibold hover:underline flex items-center gap-0.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>分享我的故事</span>
          </button>
        </div>

        <div className="space-y-3">
          {posts.map((post) => (
            <div 
              key={post.id}
              className="bg-white rounded-3xl p-3.5 border border-[#F0EBE6] shadow-xs space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{post.avatar}</span>
                  <div>
                    <span className="text-xs font-bold text-stone-900">{post.author}</span>
                    <span className="text-[10px] text-stone-400 ml-1.5">{post.time}</span>
                  </div>
                </div>

                <button
                  onClick={() => toggleLike(post.id)}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all ${
                    post.liked 
                      ? 'bg-rose-50 border-rose-200 text-[#CF3F57] font-bold' 
                      : 'border-stone-200 text-stone-500 hover:bg-stone-50'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${post.liked ? 'fill-[#CF3F57]' : ''}`} />
                  <span>{post.likes}</span>
                </button>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <h4 className="text-xs font-bold text-stone-900">{post.title}</h4>
                  <p className="text-[11px] text-stone-600 leading-relaxed">{post.content}</p>
                  <div className="flex gap-1.5 pt-1">
                    {post.tags.map(t => (
                      <span key={t} className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-50 border border-stone-100 shrink-0">
                  <img src={post.img} alt={post.title} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Modal 1: 预约空瓶回收 */}
      {showRecycleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-xl border border-stone-200 space-y-3.5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-1.5">
                <Recycle className="w-4 h-4 text-[#CF3F57]" />
                <h3 className="text-sm font-bold text-stone-900 font-serif">
                  预约顺丰免费上门取空瓶
                </h3>
              </div>
              <button onClick={() => setShowRecycleModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitRecycle} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">拟回收空瓶物品名称</label>
                <input 
                  type="text" 
                  value={recycleItemName}
                  onChange={(e) => setRecycleItemName(e.target.value)}
                  placeholder="如 兰蔻菁纯粉底液空瓶 / SK-II 精华空瓶"
                  className="w-full p-2 text-xs bg-stone-50 border border-stone-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">材质类型</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'glass', label: '玻璃瓶' },
                    { id: 'plastic', label: '塑料材质' },
                    { id: 'metal', label: '金属/气垫铝' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setRecycleMaterial(m.id as any)}
                      className={`py-1.5 text-xs font-semibold rounded-xl border ${
                        recycleMaterial === m.id ? 'bg-[#962F43] text-white border-[#962F43]' : 'bg-stone-50 border-stone-200'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">期望顺丰上门时间</label>
                <select
                  value={recycleCourierTime}
                  onChange={(e) => setRecycleCourierTime(e.target.value)}
                  className="w-full p-2 text-xs bg-stone-50 border border-stone-200 rounded-xl"
                >
                  <option value="今天下午 14:00 - 16:00">今天下午 14:00 - 16:00 (极速取)</option>
                  <option value="明天上午 10:00 - 12:00">明天上午 10:00 - 12:00</option>
                  <option value="本周六上午 09:00 - 12:00">本周六上午 09:00 - 12:00 (周末)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">上门揽收地址</label>
                <input 
                  type="text" 
                  value={recycleAddress}
                  onChange={(e) => setRecycleAddress(e.target.value)}
                  className="w-full p-2 text-xs bg-stone-50 border border-stone-200 rounded-xl"
                  required
                />
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50 text-[10px] text-emerald-800 leading-tight">
                🌱 快递费由品牌环保基金全额承担。快递员核验封箱后，100 积分将即刻打入您的美丽循环账户。
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowRecycleModal(false)}
                  className="flex-1 py-2 rounded-full border border-stone-200 text-stone-600 text-xs font-semibold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-full bg-gradient-to-r from-[#E25C70] to-[#CF3F57] text-white text-xs font-bold shadow-xs"
                >
                  确认免费预约
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal 2: 线下绿色站点 */}
      {showStationsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full max-h-[80vh] overflow-y-auto p-5 shadow-xl border border-stone-200 space-y-3.5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-stone-900 font-serif">
                  附近线下绿色美妆回收站点
                </h3>
              </div>
              <button onClick={() => setShowStationsModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {offlineStations.map((st) => (
                <div key={st.name} className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1.5">
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="text-xs font-bold text-stone-900">{st.name}</h4>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded-md shrink-0">
                      {st.distance}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500">{st.address}</p>
                  <div className="text-[9px] text-stone-600 bg-white p-1.5 rounded-lg border border-stone-100 space-y-0.5">
                    <div><strong>接收品类：</strong>{st.accepts}</div>
                    <div className="text-emerald-700"><strong>现场奖励：</strong>{st.reward}</div>
                  </div>
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[9px] text-stone-400">营业时间 {st.hours}</span>
                    <button
                      onClick={() => showToast(`已启动高德地图导航至「${st.name}」`)}
                      className="px-2.5 py-1 rounded-full bg-[#3D634B] text-white text-[10px] font-bold flex items-center gap-1 shadow-2xs"
                    >
                      <NavIcon className="w-3 h-3" />
                      <span>导航前往</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal 3: 积分环保兑换商城 */}
      {showGiftShopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full max-h-[80vh] overflow-y-auto p-5 shadow-xl border border-stone-200 space-y-3.5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-stone-900 font-serif">
                  积分环保好礼兑换 (可用 {userPoints} 分)
                </h3>
              </div>
              <button onClick={() => setShowGiftShopModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {[
                { title: '欧舒丹有机棉环保手提托特包', cost: 200, desc: '加厚纯棉帆布，可装化妆品与随身书籍', badge: '热门' },
                { title: '兰蔻小黑瓶环保替换芯 50元抵用券', cost: 150, desc: '官方专柜或小程序下单通用，保护地球减塑', badge: '大牌礼券' },
                { title: '阿拉善荒漠锁边林 · 梭梭树公益树苗认领', cost: 100, desc: '为您在内蒙古阿拉善种植一棵真实梭梭树并生成唯一编号证书', badge: '公益认证' },
                { title: '便携环保分装真空喷雾瓶 3件套', cost: 80, desc: '旅行分装化妆水、卸妆水，反复清洗使用', badge: '实用' }
              ].map((g) => (
                <div key={g.title} className="p-3 rounded-2xl bg-amber-50/50 border border-amber-200/70 flex items-center justify-between gap-2">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-stone-900 truncate">{g.title}</h4>
                      <span className="text-[9px] px-1 py-0.2 rounded-md bg-amber-200/80 text-amber-900 font-bold shrink-0">{g.badge}</span>
                    </div>
                    <p className="text-[10px] text-stone-500 line-clamp-1">{g.desc}</p>
                    <span className="text-xs font-serif font-bold text-amber-800 block">{g.cost} 积分</span>
                  </div>

                  <button
                    onClick={() => handleRedeemReward(g.title, g.cost)}
                    className="px-3 py-1.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold shrink-0 shadow-2xs transition-transform active:scale-95"
                  >
                    兑换
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 9. Modal 4: 发布我的空瓶故事 */}
      {showPostStoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-xl border border-stone-200 space-y-3.5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-900">
                分享我的空瓶挑战与环保心得
              </h3>
              <button onClick={() => setShowPostStoryModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePostStory} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">故事标题</label>
                <input 
                  type="text" 
                  value={newStoryTitle}
                  onChange={(e) => setNewStoryTitle(e.target.value)}
                  placeholder="如 30天空瓶记录：用完也是一种极致的美"
                  className="w-full p-2 text-xs bg-stone-50 border border-stone-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">话题标签</label>
                <div className="flex gap-1.5">
                  {['#空瓶挑战', '#可持续生活', '#闲置互助', '#美妆极简主义'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setNewStoryTag(tag)}
                      className={`text-[10px] px-2 py-1 rounded-full border ${
                        newStoryTag === tag ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-stone-50 text-stone-700 border-stone-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">心得与真实体会</label>
                <textarea 
                  value={newStoryContent}
                  onChange={(e) => setNewStoryContent(e.target.value)}
                  placeholder="记录你用完这瓶护肤品的心情，或者送出闲置的温柔感受..."
                  className="w-full p-2 text-xs bg-stone-50 border border-stone-200 rounded-xl h-20 focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPostStoryModal(false)}
                  className="flex-1 py-2 rounded-full border border-stone-200 text-stone-600 text-xs font-semibold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-full bg-[#5C6BC0] text-white text-xs font-bold shadow-xs"
                >
                  立即发布
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
