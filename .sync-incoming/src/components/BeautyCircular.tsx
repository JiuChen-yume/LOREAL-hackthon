import React, { useState } from 'react';
import { 
  Recycle, 
  MapPin, 
  Award, 
  BookOpen, 
  Users, 
  Check, 
  ChevronRight, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  Heart
} from 'lucide-react';
import { CircularRecycleRecord } from '../types/beauty';
import { circularRecycleImg } from '../data/mockData';

interface BeautyCircularProps {
  recycleRecords: CircularRecycleRecord[];
  onAddRecycleRecord: (record: CircularRecycleRecord) => void;
}

export const BeautyCircular: React.FC<BeautyCircularProps> = ({
  recycleRecords,
  onAddRecycleRecord
}) => {
  const [activeTab, setActiveTab] = useState<'recycle' | 'community' | 'guide'>('recycle');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStation, setBookingStation] = useState('欧莱雅环球港旗舰店 · 绿色循环服务站');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Total points
  const totalPoints = recycleRecords.reduce((acc, r) => acc + r.points, 320);

  // Recycling stations mock
  const stations = [
    {
      id: 'st_1',
      name: '巴黎欧莱雅环球港旗舰店 · 绿色循环服务站',
      address: '上海市普陀区中山北路3300号环球港B1层',
      distance: '1.2 km',
      acceptTypes: '玻璃瓶 · 塑料管 · 铝盒 · 泵头回收',
      perk: '回收任意品牌正品空瓶享 100 积分 + 免费专属皮肤水油测试'
    },
    {
      id: 'st_2',
      name: '理肤泉社区智能空瓶回收箱 #04',
      address: '上海市静安区延安中路1000号城市便利站',
      distance: '2.5 km',
      acceptTypes: '塑料软管 · 喷雾铝罐',
      perk: '投递立得 50 积分'
    },
    {
      id: 'st_3',
      name: '欧莱雅无障碍美妆体验舱 & 循环中枢',
      address: '上海市徐汇区龙腾大道西岸艺术中心',
      distance: '4.8 km',
      acceptTypes: '全品类空瓶 · 辅助工具试戴',
      perk: '视障/肢障友好辅助化妆体验 + 绿色循环大礼包'
    }
  ];

  // Community posts mock
  const communityPosts = [
    {
      id: 'post_1',
      title: '【闲置拯救】面霜过期前，我用它治好了手肘干裂与起皮！',
      author: '沐沐 (混干皮)',
      tag: '闲置拯救案例',
      likes: 248,
      content: '之前跟风买的滋润面霜夏天用太厚重，在系统“闲置拯救”指导下与身体乳 1:1 混合厚敷手肘，包保鲜膜10分钟，比任何护手霜都管用！'
    },
    {
      id: 'post_2',
      title: '【无障碍美妆】色弱友好的化妆台分区收纳法分享',
      author: '阿泽 (低对比度识别者)',
      tag: '无障碍美妆经验',
      likes: 312,
      content: '通过化妆台系统的色系物理位置与大号纯文字标识，彻底摆脱了依靠微小肉眼色号辨认的困扰。'
    },
    {
      id: 'post_3',
      title: '【低消费挑战】30天不买新彩妆，全靠眼影深色画眼线',
      author: 'Lin (极简护肤践行者)',
      tag: '低消费挑战',
      likes: 189,
      content: '把九宫格里永远用不完的深冷棕眼影盘，用精细斜角刷微湿蘸取，画出来的线条比眼线液笔更柔和自然，省下好几百！'
    }
  ];

  const handleBooking = () => {
    onAddRecycleRecord({
      id: `rec_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      station_name: bookingStation,
      type: 'glass_bottle',
      item_name: '空瓶预约称重回收单 (待核销)',
      points: 100,
      status: 'in_transit'
    });
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setShowBookingModal(false);
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Header & ESG Overview */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
              <span>企业社会责任 (ESG)</span>
              <span aria-hidden="true">·</span>
              <span>让每一件美妆产品在善意中闭环</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-semibold text-stone-900 mt-1">
              美丽循环 (Beauty Circular & ESG)
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              倡导空瓶减塑回收、包装专业拆解与反浪费社区分享，赋能无障碍与可持续美。
            </p>
          </div>

          {/* Green Points Balance */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3">
            <Award className="w-5 h-5 text-emerald-700" />
            <div>
              <span className="text-[11px] text-emerald-800 font-medium block">绿色碳积分账户</span>
              <span className="text-lg font-serif font-semibold text-emerald-950 tabular-numbers">
                {totalPoints} <span className="text-xs font-normal">pts</span>
              </span>
            </div>
          </div>
        </div>

        {/* 3 Tabs */}
        <div className="flex items-center gap-2 pt-4 overflow-x-auto scrollbar-none text-xs sm:text-sm">
          {[
            { id: 'recycle', label: '空瓶回收 & 线下网点' },
            { id: 'guide', label: '包装拆解指南 (无害分离)' },
            { id: 'community', label: '循环社区与经验交流' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap ${
                  isActive 
                    ? 'bg-stone-900 text-white shadow-xs' 
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab: 空瓶回收 & 线下网点 */}
      {activeTab === 'recycle' && (
        <div className="space-y-6">
          {/* Visual Showcase */}
          <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden grid grid-cols-1 md:grid-cols-12 items-center">
            <div className="md:col-span-5 h-48 md:h-full relative overflow-hidden">
              <img
                src={circularRecycleImg}
                alt="美妆空瓶绿色回收站"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="md:col-span-7 p-5 sm:p-6 space-y-3">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                L'Oréal 绿色循环回收计划
              </span>
              <h2 className="text-base sm:text-lg font-serif font-semibold text-stone-900">
                把用完的空瓶交给我们，兑换专属权益与自然新生
              </h2>
              <p className="text-xs text-stone-600 leading-relaxed">
                无论是玻璃精华瓶、塑料面霜罐还是金属泵头，经专业分拆处理后均可 100% 重生为绿色包装或环保建材。
              </p>
              <button
                onClick={() => setShowBookingModal(true)}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-xl transition-colors"
              >
                预约线下专柜空瓶清洗与称重
              </button>
            </div>
          </div>

          {/* Stations list */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200/80 space-y-4">
            <h3 className="text-sm font-semibold text-stone-900">附近绿色服务网点</h3>
            <div className="space-y-3">
              {stations.map((st) => (
                <div key={st.id} className="p-4 rounded-xl bg-stone-50 border border-stone-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-stone-700 shrink-0" />
                      <span className="text-xs font-semibold text-stone-900">{st.name}</span>
                      <span className="text-[10px] text-stone-500 font-mono">({st.distance})</span>
                    </div>
                    <p className="text-xs text-stone-500 mt-1 pl-6">{st.address}</p>
                    <p className="text-[11px] text-emerald-800 mt-1 pl-6">
                      回收类型: {st.acceptTypes} · 权益: {st.perk}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setBookingStation(st.name);
                      setShowBookingModal(true);
                    }}
                    className="self-end sm:self-auto px-3.5 py-1.5 bg-white border border-stone-200 hover:bg-stone-100 text-stone-800 text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                  >
                    预约投递
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* User's recycle records history */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200/80 space-y-3">
            <h3 className="text-sm font-semibold text-stone-900">我的循环回收存证</h3>
            <div className="space-y-2">
              {recycleRecords.map((r) => (
                <div key={r.id} className="p-3 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-stone-900">{r.item_name}</div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      {r.date} · {r.station_name}
                    </div>
                  </div>
                  <span className="text-emerald-700 font-semibold font-mono tabular-numbers">
                    +{r.points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: 包装拆解指南 */}
      {activeTab === 'guide' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 space-y-5">
          <div>
            <h3 className="text-base font-serif font-semibold text-stone-900">
              美妆空瓶专业拆解与材质分离指南
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              不同材质混杂会导致回收焚烧降级。3 步拆解，让材质回归最高级再生利用。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/70 space-y-2">
              <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-mono flex items-center justify-center">
                1
              </span>
              <h4 className="text-xs font-semibold text-stone-900">滴管与泵头分离</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                精华瓶橡胶胶帽、塑料圈与内置小弹簧材质不同。顺时针旋转拆出玻璃吸管，放入高纯玻璃回收区；塑料泵头放入工程塑料区。
              </p>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/70 space-y-2">
              <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-mono flex items-center justify-center">
                2
              </span>
              <h4 className="text-xs font-semibold text-stone-900">面霜广口玻璃罐清洗</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                撕下瓶口封口铝箔与内盖垫片（属于其他塑料）。用温水清洗罐壁残留油脂，晾干后即可作为 100% 透明重熔玻璃回收。
              </p>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/70 space-y-2">
              <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-mono flex items-center justify-center">
                3
              </span>
              <h4 className="text-xs font-semibold text-stone-900">铝制眼影盘磁铁分离</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                眼影铁盘背面通常有微型吸附磁铁。用别针挑出金属铝盘归入金属回收，外层ABS高透明塑料盒可单独回收或作为小首饰盒二创。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: 循环社区 */}
      {activeTab === 'community' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {communityPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-2xl p-5 border border-stone-200/80 flex flex-col justify-between shadow-2xs space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs text-stone-500 pb-2 border-b border-stone-100">
                    <span className="text-[11px] font-medium bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                      {post.tag}
                    </span>
                    <span>作者: {post.author}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-stone-900 mt-2">
                    {post.title}
                  </h4>
                  <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                    {post.content}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>{post.likes} 人点赞践行</span>
                  </span>
                  <span className="text-stone-900 font-medium">查看讨论 →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <h3 className="text-base font-serif font-semibold text-stone-900">
              预约线下空瓶称重回收
            </h3>
            <p className="text-xs text-stone-500">
              预约成功后凭二维码至门店，专柜导师将协助您完成材质分离并当场发放碳积分。
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-700 block">选择网点</label>
              <input
                type="text"
                readOnly
                value={bookingStation}
                className="w-full p-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-700 block">预计投递空瓶数量</label>
              <select className="w-full p-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800">
                <option>1 - 2 个 (约 100 积分)</option>
                <option>3 - 5 个 (约 250 积分)</option>
                <option>5 个以上 (大批量绿色捐赠)</option>
              </select>
            </div>

            {bookingSuccess ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>预约成功！已发放 100 预存碳积分。</span>
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="px-4 py-2 text-xs text-stone-600"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleBooking}
                className="px-5 py-2 bg-stone-900 text-white rounded-xl text-xs font-medium hover:bg-stone-800"
              >
                确认预约
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
