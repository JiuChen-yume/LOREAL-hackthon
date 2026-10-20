import React, { useState } from 'react';
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
  AlertTriangle,
  Heart,
  Star,
  ShieldCheck,
  Smile,
  ShieldAlert
} from 'lucide-react';
import { BeautyProduct, MakeupLook } from '../types/beauty';
import { makeupLookImg } from '../data/mockData';

interface MakeupStudioProps {
  products: BeautyProduct[];
  looks: MakeupLook[];
  onSaveLook: (newLook: MakeupLook) => void;
  onGenerateAILook: (params: { lookType: 'daily' | 'imitation' | 'cos'; referenceText?: string }) => Promise<void>;
  onRateLookToList: (lookTitle: string, rating: 'red' | 'yellow' | 'black', reason: string) => void;
  isGeneratingLook: boolean;
}

export const MakeupStudio: React.FC<MakeupStudioProps> = ({
  products,
  looks,
  onSaveLook,
  onGenerateAILook,
  onRateLookToList,
  isGeneratingLook
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'precheck' | 'profile' | 'archive'>('create');
  const [selectedLookType, setSelectedLookType] = useState<'daily' | 'imitation' | 'cos'>('daily');

  // Imitation & COS form state
  const [referenceText, setReferenceText] = useState('');
  const [cosRoleName, setCosRoleName] = useState('赛博机械姬 (Cyber Elf)');
  const [cosDuration, setCosDuration] = useState('6小时 (全天漫展拍摄)');
  const [hasLenses, setHasLenses] = useState(true);

  // Pre-makeup skin risk state
  const [precheckCondition, setPrecheckCondition] = useState<'dry' | 'oily' | 'redness' | 'normal'>('dry');

  // Aesthetic profile state (Positive & Strengths-focused, zero criticism)
  const [aestheticProfile, setAestheticProfile] = useState({
    faceFeatures: '中庭比例适中，原生眉骨立体，眼裂弧度柔和，唇峰轮廓清晰',
    skinTendency: '混合偏干 · 秋冬易起皮脱屑 · 局部轻微泛红',
    stylePreference: '清透氧气自然原生感 / 温暖低饱和红茶色系',
    makeupTaboos: '不适合过粗全包黑眼线、避免全脸高荧光粉色、避免厚重哑光死白面具感',
    scenePreference: '日常通勤 / 周末摄影 / 漫展角色扮演'
  });
  const [profileSaved, setProfileSaved] = useState(false);

  // Selected look to preview
  const [viewingLook, setViewingLook] = useState<MakeupLook>(looks[0]);
  const [ratingNotice, setRatingNotice] = useState<string | null>(null);

  const handleGenerate = async (type: 'daily' | 'imitation' | 'cos') => {
    let desc = '';
    if (type === 'imitation') {
      desc = referenceText || '法式复古松弛感猫系红唇，通透底妆与低饱和眼妆';
    } else if (type === 'cos') {
      desc = `角色:${cosRoleName}, 佩戴时长:${cosDuration}, 美瞳:${hasLenses ? '是' : '否'}`;
    } else {
      desc = '晨间5分钟快速氧气通勤，利用化妆台现有单品';
    }

    await onGenerateAILook({ lookType: type, referenceText: desc });
  };

  const handleRateCurrentLook = (rating: 'red' | 'yellow' | 'black') => {
    const reason = rating === 'red' 
      ? '这套彩妆搭配巨适配，自制唇颊腮红很通透！'
      : rating === 'yellow'
      ? '妆效尚可，但秋冬需多做打底滋润。'
      : '此色系或质地与面部产生不适，列入避雷参考。';
    onRateLookToList(viewingLook.title, rating, reason);
    setRatingNotice(rating === 'red' ? '已收录进红榜珍藏配方！' : rating === 'black' ? '已记入黑榜色系避雷库！' : '已记录反馈！');
    setTimeout(() => setRatingNotice(null), 3000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Header & Navigation */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
              <span>反容貌焦虑妆造</span>
              <span aria-hidden="true">·</span>
              <span>发掘原生优势与化妆台彩妆潜力</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-semibold text-stone-900 mt-1">
              AI 妆造工作室 (Makeup Studio)
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              从日常提气色、图片仿妆到角色 COS，优先匹配现有彩妆并提供平替方案，拒绝闲置浪费。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('precheck')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border transition-colors ${
                activeTab === 'precheck'
                  ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                  : 'border-stone-200 hover:bg-stone-50 text-stone-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>妆前预判预警</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border transition-colors ${
                activeTab === 'profile'
                  ? 'bg-stone-900 border-stone-900 text-white'
                  : 'border-stone-200 hover:bg-stone-50 text-stone-700'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>五官底档</span>
            </button>
            <button
              onClick={() => setActiveTab('archive')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border transition-colors ${
                activeTab === 'archive'
                  ? 'bg-stone-900 border-stone-900 text-white'
                  : 'border-stone-200 hover:bg-stone-50 text-stone-700'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>妆容存档 ({looks.length})</span>
            </button>
          </div>
        </div>

        {/* 3 Large Creation Triggers */}
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
            <button
              onClick={() => { setSelectedLookType('daily'); handleGenerate('daily'); }}
              disabled={isGeneratingLook}
              className={`p-4 rounded-xl border text-left transition-all active:scale-[0.98] ${
                selectedLookType === 'daily'
                  ? 'border-stone-900 bg-stone-50/80 shadow-2xs'
                  : 'border-stone-200 hover:border-stone-400 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-900">今日专属日常妆</span>
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-xs text-stone-500 mt-1">
                适配今日天气与气色，仅调用台面现有 2-3 件好物，附 5 分钟极简版。
              </p>
            </button>

            <button
              onClick={() => { setSelectedLookType('imitation'); }}
              className={`p-4 rounded-xl border text-left transition-all active:scale-[0.98] ${
                selectedLookType === 'imitation'
                  ? 'border-stone-900 bg-stone-50/80 shadow-2xs'
                  : 'border-stone-200 hover:border-stone-400 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-900">图片仿妆私人改造</span>
                <ImageIcon className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-xs text-stone-500 mt-1">
                上传秀场或爱豆参考图，AI 拆解眼唇并在化妆台寻找等价替代。
              </p>
            </button>

            <button
              onClick={() => { setSelectedLookType('cos'); }}
              className={`p-4 rounded-xl border text-left transition-all active:scale-[0.98] ${
                selectedLookType === 'cos'
                  ? 'border-stone-900 bg-stone-50/80 shadow-2xs'
                  : 'border-stone-200 hover:border-stone-400 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-900">COS 角色妆造定制</span>
                <Palette className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-xs text-stone-500 mt-1">
                动漫/游戏角色五官适配转换，强光舞台持妆与眼裂下至技巧。
              </p>
            </button>
          </div>
        )}
      </div>

      {/* Tab: 妆前肤质预判 + 妆面风险预警 (From Proposal!) */}
      {activeTab === 'precheck' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-700" />
                <h3 className="text-base font-serif font-semibold text-stone-900">
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
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    precheckCondition === item.id
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800'
                  }`}
                >
                  <span className="text-xs font-semibold block">{item.label}</span>
                  <span className={`text-[10px] block mt-0.5 ${precheckCondition === item.id ? 'text-stone-300' : 'text-stone-500'}`}>
                    {item.risk}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Pre-check Advice output */}
          <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2 text-xs">
            <h4 className="font-semibold text-amber-950 flex items-center gap-1.5">
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

      {/* Tab: Profile (Aesthetic Profile with Positive Wording) */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 max-w-2xl mx-auto space-y-5">
          <div>
            <h2 className="text-base font-serif font-semibold text-stone-900">
              五官比例与审美底档系统
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              本系统严格采用“适配优势”与“风格延展”，严禁评判或贬低任何原生五官特征。
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-stone-800 block mb-1">
                五官比例与骨相特征 (AI 妆造以此为高光锚点)
              </label>
              <input
                type="text"
                value={aestheticProfile.faceFeatures}
                onChange={(e) => setAestheticProfile({ ...aestheticProfile, faceFeatures: e.target.value })}
                className="w-full p-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl"
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
                className="w-full p-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl"
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
                className="w-full p-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl"
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
                className="w-full p-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl"
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
                className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-xl transition-colors"
              >
                保存底档
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Archive (Saved Looks) */}
      {activeTab === 'archive' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-900">已存档的经典妆容</h2>
            <button
              onClick={() => setActiveTab('create')}
              className="text-xs text-stone-600 hover:text-stone-900 underline underline-offset-2"
            >
              + 创作新妆造
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {looks.map((look) => (
              <div 
                key={look.id}
                onClick={() => { setViewingLook(look); setActiveTab('create'); }}
                className="bg-white rounded-2xl p-4 border border-stone-200/80 hover:border-stone-400 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-stone-500 pb-2 border-b border-stone-100">
                    <span className="font-medium text-stone-800">
                      {look.type === 'daily' ? '日常' : look.type === 'imitation' ? '仿妆' : 'COS'}
                    </span>
                    <span>{look.occasion}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-stone-900 mt-2">
                    {look.title}
                  </h3>
                  <p className="text-xs text-stone-600 mt-1 line-clamp-2">
                    {look.description}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                  <span>调用 {look.matched_products.length} 件化妆台产品</span>
                  <span className="text-stone-900 font-medium">查看复刻 →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Create - Active Workspace */}
      {activeTab === 'create' && (
        <div className="space-y-6">
          {/* Specific Inputs for Imitation & COS */}
          {selectedLookType === 'imitation' && (
            <div className="bg-white rounded-2xl p-5 border border-stone-200/80 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-stone-900">图片仿妆拆解工作流</h3>
                <p className="text-xs text-stone-500">
                  上传参考照片，AI 分析面部光影并从您的化妆台中提取匹配产品
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border-2 border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-stone-50 transition-colors">
                  <Upload className="w-6 h-6 text-stone-400 mb-2" />
                  <span className="text-xs font-semibold text-stone-800">上传参考妆容照片</span>
                  <span className="text-[11px] text-stone-500 mt-0.5">支持秀场图、杂志截图或爱豆特写</span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-stone-800 block">
                    仿妆重点描述或色系氛围 (选填)
                  </label>
                  <textarea
                    value={referenceText}
                    onChange={(e) => setReferenceText(e.target.value)}
                    placeholder="例如：巴黎秀场同款，微醺红茶唇、清透光泽底妆，强调下眼睑下至..."
                    rows={3}
                    className="w-full p-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl"
                  />
                  <button
                    onClick={() => handleGenerate('imitation')}
                    disabled={isGeneratingLook}
                    className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isGeneratingLook ? 'AI 正在拆解色调与映射化妆台...' : '开始拆解并匹配化妆台'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedLookType === 'cos' && (
            <div className="bg-white rounded-2xl p-5 border border-stone-200/80 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-stone-900">COS 角色妆造定制</h3>
                <p className="text-xs text-stone-500">
                  角色妆容拆解、舞台强光适应与持妆方案
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-800 block mb-1">
                    角色名称 / 作品
                  </label>
                  <input
                    type="text"
                    value={cosRoleName}
                    onChange={(e) => setCosRoleName(e.target.value)}
                    className="w-full p-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-800 block mb-1">
                    漫展/拍摄预计佩戴时长
                  </label>
                  <input
                    type="text"
                    value={cosDuration}
                    onChange={(e) => setCosDuration(e.target.value)}
                    className="w-full p-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => handleGenerate('cos')}
                    disabled={isGeneratingLook}
                    className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isGeneratingLook ? '正在设计适配方案...' : '生成角色转化妆造'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Current Generated / Selected Look Showcase */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-stone-100">
              <div>
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <span className="font-semibold text-stone-900">{viewingLook.title}</span>
                  <span aria-hidden="true">·</span>
                  <span>{viewingLook.occasion}</span>
                </div>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed max-w-2xl">
                  {viewingLook.description}
                </p>
              </div>

              {/* Look Rating to 3 Lists (Red/Yellow/Black) */}
              <div className="flex items-center gap-1.5 self-start md:self-auto">
                <button
                  onClick={() => handleRateCurrentLook('red')}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg text-xs font-medium border border-rose-200 transition-colors"
                >
                  ❤️ 入红榜配方
                </button>
                <button
                  onClick={() => handleRateCurrentLook('black')}
                  className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium transition-colors"
                >
                  ⛔ 避雷入黑榜
                </button>
                <button
                  onClick={() => {
                    onSaveLook(viewingLook);
                    alert('已存入您的妆容存档！可随时一键复刻。');
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-medium rounded-lg transition-colors"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>存档</span>
                </button>
              </div>
            </div>

            {/* Rating notification */}
            {ratingNotice && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>{ratingNotice}</span>
              </div>
            )}

            {/* Visual reference photo & 5-minute tip */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-4 rounded-xl overflow-hidden border border-stone-200 relative h-64 lg:h-auto">
                <img
                  src={viewingLook.inspiration_image || makeupLookImg}
                  alt={viewingLook.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent flex items-end p-4">
                  <span className="text-white text-xs font-medium">
                    妆面氛围与骨骼光影示意
                  </span>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-4">
                {/* 5-Min Minimal Tip */}
                <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-amber-950">5分钟极简提气色版</h4>
                    <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                      {viewingLook.minimal_5min_tip}
                    </p>
                  </div>
                </div>

                {/* Matched Products from Vanity */}
                <div>
                  <h4 className="text-xs font-semibold text-stone-800 mb-2">
                    化妆台现有彩妆精准匹配 ({viewingLook.matched_products.length} 项)
                  </h4>
                  <div className="space-y-2">
                    {viewingLook.matched_products.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-stone-50 border border-stone-200/60 flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-stone-200 text-stone-800 font-semibold px-1.5 py-0.5 rounded">
                              {item.slot}
                            </span>
                            <span className="text-xs font-semibold text-stone-900">
                              {item.product_name}
                            </span>
                            {item.shade && (
                              <span className="text-[11px] text-stone-500 font-medium">
                                ({item.shade})
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-600 mt-1">
                            {item.note}
                          </p>
                        </div>

                        {item.is_dupe_alternative && (
                          <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded shrink-0 border border-emerald-200">
                            同色平替
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step-by-step tutorial */}
                <div>
                  <h4 className="text-xs font-semibold text-stone-800 mb-2">
                    逐步操作手法
                  </h4>
                  <ol className="space-y-2">
                    {viewingLook.steps.map((step, idx) => (
                      <li key={idx} className="text-xs text-stone-700 flex items-start gap-2 leading-relaxed">
                        <span className="w-4 h-4 rounded-full bg-stone-200 text-stone-800 text-[10px] font-mono flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Lighting advice if available */}
                {viewingLook.lighting_advice && (
                  <div className="p-3 bg-stone-50 rounded-xl text-xs text-stone-600 border border-stone-200/60">
                    <strong>💡 灯光与持妆建议：</strong> {viewingLook.lighting_advice}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
