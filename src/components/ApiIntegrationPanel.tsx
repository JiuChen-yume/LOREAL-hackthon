import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CircleDashed, ExternalLink, Loader2, PlugZap, RefreshCw, ShieldCheck } from 'lucide-react';

type ApiStatus = 'connected' | 'local-ready' | 'auth-required';
type ApiItem = {
  id: string;
  group: string;
  name: string;
  method: string;
  path: string;
  description: string;
  status: ApiStatus;
  source?: string;
  docs?: string;
};

const FALLBACK_APIS: ApiItem[] = [
  { id: 'plan', group: '当前已接入', name: '护理计划生成', method: 'POST', path: '/api/home/generate-plan', description: '按时间预算、肤况、化妆台产品和避雷成分生成早晚 Routine。', status: 'connected' },
  { id: 'compatibility', group: '当前已接入', name: '成分兼容性检测', method: 'POST', path: '/api/compatibility/check', description: '规则引擎优先识别 A 醇、酸类、酒精等冲突，再由 AI 解释。', status: 'connected' },
  { id: 'ocr', group: '当前已接入', name: '包装 OCR 识别', method: 'POST', path: '/api/ocr/recognize', description: '识别品牌、品名、规格、成分、PAO 和闲置拯救建议。', status: 'connected' },
  { id: 'tencent-product', group: '当前已接入', name: '腾讯云商品识别', method: 'POST', path: '/api/product/recognize', description: '一张化妆柜图片识别多个商品并返回商品位置坐标。', status: 'connected', source: 'Tencent Cloud TIIA', docs: 'https://cloud.tencent.com/document/api/865/36457' },
  { id: 'qrcode-ocr', group: '当前已接入', name: '腾讯云二维码/条形码识别', method: 'POST', path: '/api/barcode/recognize', description: '调用 QrcodeOCR 识别二维码、条形码并返回码制和坐标。', status: 'connected', source: 'Tencent Cloud OCR', docs: 'https://cloud.tencent.com/document/product/866/38292' },
  { id: 'barcode', group: '当前已接入', name: '条码查询', method: 'POST', path: '/api/scanner/barcode', description: '按条码查询演示产品主数据，并由用户确认入台。', status: 'connected' },
  { id: 'makeup', group: '当前已接入', name: '妆容生成', method: 'POST', path: '/api/makeup/generate', description: '生成日常妆、图片仿妆和 COS 妆的步骤与产品匹配。', status: 'connected' },
  { id: 'tutorial', group: '当前已接入', name: '妆教解析', method: 'POST', path: '/api/makeup/parse-tutorial', description: '将妆教链接或描述拆解成底妆、眼影、腮红和唇妆步骤。', status: 'connected' },
  { id: 'rescue', group: '当前已接入', name: '闲置拯救', method: 'POST', path: '/api/idle/rescue', description: '根据品类、质地和成分给出安全的闲置复用方案。', status: 'connected' },
  { id: 'products', group: '业务模块骨架', name: '化妆台产品 CRUD', method: 'GET / POST', path: '/api/products', description: '产品新增、编辑、删除、批量操作和隐藏状态。', status: 'local-ready' },
  { id: 'profile', group: '业务模块骨架', name: '用户资料与隐私', method: 'GET / PUT', path: '/api/profile', description: '用户资料、隐私授权、数据导出和清空。', status: 'local-ready' },
  { id: 'uploads', group: '业务模块骨架', name: '图片与文件', method: 'POST', path: '/api/uploads', description: '包装图、妆容参考图和完成图的本地上传占位接口。', status: 'local-ready' },
  { id: 'rules', group: '业务模块骨架', name: '成分规则引擎', method: 'POST', path: '/api/rules/compatibility', description: '将成分冲突、黑榜过滤、PAO 和使用顺序沉淀为可复核规则。', status: 'local-ready' },
  { id: 'reminders', group: '业务模块骨架', name: '提醒任务', method: 'GET / POST', path: '/api/reminders', description: '临期、过期、闲置、补货和早晚打卡提醒。', status: 'local-ready' },
  { id: 'recommendations', group: '业务模块骨架', name: '推荐服务', method: 'GET', path: '/api/recommendations', description: '同类产品、平替、补缺和重复购买拦截。', status: 'local-ready' },
  { id: 'recycling', group: '业务模块骨架', name: '回收与积分', method: 'GET / POST', path: '/api/recycling', description: '预约回收、积分记录、兑换和活动。', status: 'local-ready' },
  { id: 'filing', group: '业务模块骨架', name: '备案信息核验', method: 'GET', path: '/api/products/{id}/filing-status', description: '展示备案状态、备案编号、备案人、责任人、来源和核验时间。', status: 'local-ready' },
  { id: 'gemini', group: '外部服务', name: 'Gemini 文本与视觉', method: 'POST', path: '/api/ai/*', description: '统一 AI 网关；当前服务有 GEMINI_API_KEY 时启用，未配置时走演示兜底。', status: 'auth-required', source: 'Google Gemini' },
  { id: 'tencent-ocr', group: '当前已接入', name: '腾讯云高精度 OCR', method: 'POST', path: '/api/ocr/recognize', description: '通过服务端签名调用 GeneralAccurateOCR，提取包装文字及坐标。', status: 'connected', source: 'Tencent Cloud OCR', docs: 'https://cloud.tencent.com/document/product/866/34937' },
  { id: 'qweather', group: '外部服务', name: '和风天气与 UV', method: 'GET', path: '/api/weather', description: '按经纬度返回实时天气、湿度、紫外线和预报，需要后端代理 Key。', status: 'auth-required', source: 'QWeather', docs: 'https://dev.qweather.com/docs/api/weather/' },
  { id: 'nmpa', group: '外部服务', name: '国家药监局备案', method: 'GET / 人工核验', path: '/api/products/{id}/filing-status', description: '官方查询或授权数据校验来源，不能假设存在稳定公开 API。', status: 'auth-required', source: 'NMPA', docs: 'https://www.nmpa.gov.cn/xxgk/zhqyj/zhqyjhzhp/' },
];

const statusMeta: Record<ApiStatus, { label: string; className: string }> = {
  connected: { label: '已接入', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'local-ready': { label: '本地可接', className: 'bg-amber-50 text-amber-800 border-amber-200' },
  'auth-required': { label: '需密钥/授权', className: 'bg-stone-100 text-stone-600 border-stone-200' },
};

export const ApiIntegrationPanel: React.FC = () => {
  const [apis, setApis] = useState<ApiItem[]>(FALLBACK_APIS);
  const [loading, setLoading] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/catalog');
      if (response.ok) {
        const payload = await response.json() as any;
        if (Array.isArray(payload.apis)) setApis(payload.apis);
      }
    } catch {
      setApis(FALLBACK_APIS);
    } finally {
      setCheckedAt(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setLoading(false);
    }
  };

  useEffect(() => { loadCatalog(); }, []);

  const groups = useMemo(() => Array.from(new Set(apis.map(api => api.group))), [apis]);
  const connectedCount = apis.filter(api => api.status === 'connected').length;
  const localReadyCount = apis.filter(api => api.status === 'local-ready').length;

  return (
    <section className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[#962F43] mb-1"><PlugZap className="w-4 h-4" /><span className="text-xs font-semibold tracking-widest uppercase">Integration Center</span></div>
          <h1 className="font-serif text-2xl text-stone-900">API 接入中心</h1>
          <p className="text-xs text-stone-500 mt-1">把当前 Demo、可本地联调模块和需要外部授权的服务放在同一张清单里。</p>
        </div>
        <button onClick={loadCatalog} disabled={loading} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-700 hover:bg-stone-50 disabled:opacity-60">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          检测本地接口
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3"><p className="text-[10px] text-emerald-700">已接入</p><p className="text-xl font-semibold text-emerald-900">{connectedCount}</p></div>
        <div className="rounded-2xl bg-amber-50 border border-amber-100 p-3"><p className="text-[10px] text-amber-800">本地可接</p><p className="text-xl font-semibold text-amber-950">{localReadyCount}</p></div>
        <div className="rounded-2xl bg-stone-100 border border-stone-200 p-3"><p className="text-[10px] text-stone-600">总接口项</p><p className="text-xl font-semibold text-stone-900">{apis.length}</p></div>
      </div>

      {groups.map(group => (
        <div key={group} className="space-y-2">
          <h2 className="text-sm font-semibold text-stone-800">{group}</h2>
          <div className="space-y-2">
            {apis.filter(api => api.group === group).map(api => {
              const meta = statusMeta[api.status];
              return <article key={api.id} className="rounded-2xl border border-stone-200 bg-white p-3 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-medium text-stone-900">{api.name}</h3><span className={`text-[10px] px-2 py-0.5 rounded-full border ${meta.className}`}>{meta.label}</span></div>
                    <p className="text-xs text-stone-500 mt-1">{api.description}</p>
                  </div>
                  {api.status === 'connected' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : api.status === 'local-ready' ? <CircleDashed className="w-4 h-4 text-amber-600 shrink-0" /> : <ShieldCheck className="w-4 h-4 text-stone-400 shrink-0" />}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-mono"><span className="px-2 py-1 rounded-md bg-stone-100 text-stone-700">{api.method}</span><span className="text-stone-600 break-all">{api.path}</span>{api.source && <span className="font-sans text-stone-400">· {api.source}</span>}{api.docs && <a href={api.docs} target="_blank" rel="noreferrer" className="font-sans inline-flex items-center gap-1 text-[#962F43] hover:underline"><ExternalLink className="w-3 h-3" />文档</a>}</div>
              </article>;
            })}
          </div>
        </div>
      ))}

      <p className="text-[11px] text-stone-400">{checkedAt ? `最近检测 ${checkedAt}` : '正在读取接口目录'} · 密钥只应放在服务端环境变量中，不能写入前端代码。</p>
    </section>
  );
};
