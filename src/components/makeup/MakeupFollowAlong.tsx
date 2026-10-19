import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Camera, X } from 'lucide-react';
import { BeautyProduct, MakeupLook } from '../../types/beauty';
import { buildMakeupLayers } from '../../services/makeup/makeupLayers';

interface MakeupFollowAlongProps {
  userPhotoUrl: string;
  look: MakeupLook;
  products: BeautyProduct[];
  authenticated?: boolean;
  onClose: () => void;
}

export const MakeupFollowAlong: React.FC<MakeupFollowAlongProps> = ({ userPhotoUrl, look, products, authenticated = false, onClose }) => {
  const steps = useMemo(() => {
    try {
      const layers = buildMakeupLayers(look, products);
      return layers.map((layer, index) => ({ title: layer.style || `${layer.region}步骤`, area: layer.region, layer, index }));
    } catch (error) {
      console.error('Makeup follow-along layer preparation failed:', error);
      return [{ title: '完成整体妆容检查', area: '整体', layer: undefined, index: 0 }];
    }
  }, [look, products]);
  const [current, setCurrent] = useState(0);
  const [completed, setCompleted] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem(`makeup_follow_${look.id}`) || '[]'); } catch { return []; }
  });
  const [saved, setSaved] = useState(false);
  const step = steps[current] || { title: '完成整体妆容检查', area: '整体', index: current };
  const product = products.find(item => item.category === (step.layer?.type === 'lips' ? 'lip' : ['eyeshadow', 'eyeliner', 'lashes', 'brows'].includes(step.layer?.type || '') ? 'eye' : 'base')) || products[0];
  const finished = steps.length > 0 && completed.length >= steps.length;

  useEffect(() => {
    localStorage.setItem(`makeup_follow_${look.id}`, JSON.stringify(completed));
    if (authenticated) void fetch('/api/makeup/follow-along/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lookId: look.id, progress: completed }) }).catch(() => undefined);
  }, [completed, look.id, authenticated]);

  const markComplete = () => {
    setCompleted(prev => Array.from(new Set([...prev, current])));
    if (current < steps.length - 1) setCurrent(current + 1);
  };

  const saveArchive = async () => {
    const archive = { ...look, final_image: userPhotoUrl, completed_steps: completed, saved_at: new Date().toISOString() };
    localStorage.setItem(`makeup_archive_${look.id}`, JSON.stringify(archive));
    if (authenticated) try { await fetch('/api/makeup/archive', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ look: archive }) }); } catch { /* local archive remains available */ }
    setSaved(true);
  };

  return <div className="fixed inset-0 z-[70] bg-[#1A1717] text-white overflow-auto">
    <div className="min-h-full max-w-7xl mx-auto p-4 sm:p-6">
      <header className="flex items-center justify-between mb-4">
        <div><p className="text-xs text-rose-300">跟练工作台</p><h2 className="text-xl font-serif font-bold">{look.title}</h2></div>
        <button onClick={onClose} className="p-2 rounded-full bg-white/10"><X className="w-5 h-5" /></button>
      </header>
      <div className="grid lg:grid-cols-[220px_minmax(0,1fr)_300px] gap-4">
        <aside className="rounded-2xl bg-white/10 p-3 space-y-2">
          <p className="text-xs text-white/60 mb-2">分图层流程 · 步骤 {Math.min(current + 1, Math.max(steps.length, 1))}/{Math.max(steps.length, 1)}</p>
          {steps.map((item, index) => <button key={`${item.title}-${index}`} onClick={() => setCurrent(index)} className={`w-full text-left p-3 rounded-xl text-xs ${current === index ? 'bg-rose-600' : 'bg-white/5'}`}><span className="inline-flex mr-2">{completed.includes(index) ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : `${index + 1}.`}</span><span className="block font-semibold">{item.title}</span><span className="block mt-1 text-[10px] text-white/60">图层：{item.layer?.type || 'fullLook'} · {item.area}</span></button>)}
        </aside>
        <main className="rounded-2xl bg-black/30 p-3 flex flex-col items-center justify-center min-h-[420px] gap-3"><img src={userPhotoUrl} alt="跟练照片" className="max-h-[62vh] max-w-full object-contain rounded-xl" />{look.rendered_layers && look.rendered_layers.length > 0 && <div className="w-full"><p className="text-[10px] text-white/60 mb-1">Seedream 实际拆分图层：{look.rendered_layers.length} 层</p><div className="flex gap-2 overflow-x-auto">{look.rendered_layers.map((layer, index) => <div key={`${layer.name || 'layer'}-${index}`} className={`shrink-0 rounded-lg border p-1 ${index === current ? 'border-rose-400' : 'border-white/20'}`}>{layer.url ? <img src={layer.url} alt={layer.name || `图层${index + 1}`} className="w-14 h-14 object-contain bg-white/10 rounded" /> : <div className="w-14 h-14 flex items-center justify-center text-[9px]">图层 {index + 1}</div>}<p className="max-w-14 truncate text-[9px] text-white/70 mt-1">{layer.name || `图层${index + 1}`}</p></div>)}</div></div>}</main>
        <aside className="rounded-2xl bg-white p-4 text-stone-900 self-start space-y-3">
          {finished && <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3"><p className="text-sm font-bold text-emerald-900">妆容跟练完成</p><p className="text-[11px] text-emerald-700 mt-1">已完成 {steps.length} 个步骤，可以保存本次妆容档案。</p><button onClick={saveArchive} className="mt-2 w-full rounded-lg bg-emerald-700 text-white py-2 text-xs">{saved ? '已保存妆容档案' : '保存妆容档案'}</button></div>}
          <div><p className="text-[10px] text-rose-700 font-bold">当前图层 · {step.layer?.type || 'fullLook'}</p><h3 className="text-base font-bold mt-1">{step.title}</h3><p className="text-[11px] text-stone-500 mt-1">目标区域：{step.area}</p></div>
          <div className="rounded-xl bg-stone-50 p-3 text-xs"><p className="font-semibold">当前产品</p><p className="mt-1">{product ? `${product.brand} ${product.product_name}${product.shade_name ? ` · ${product.shade_name}` : ''}` : '请从化妆台选择产品'}</p></div>
          <div className="text-xs text-stone-600 space-y-1"><p>工具：干净刷具或指腹</p><p>用量：少量多次，先薄后叠</p><p>检查：边缘自然、左右对称、不要覆盖非目标区域</p></div>
          <button onClick={() => setCompleted(prev => prev.includes(current) ? prev.filter(i => i !== current) : [...prev, current])} className="w-full rounded-xl border border-stone-200 py-2 text-xs">{completed.includes(current) ? '取消完成' : '标记本步完成'}</button>
          <div className="flex gap-2"><button disabled={current === 0} onClick={() => setCurrent(i => Math.max(0, i - 1))} className="flex-1 rounded-xl bg-stone-100 py-2 text-xs disabled:opacity-40"><ChevronLeft className="inline w-4 h-4" />上一步</button><button onClick={markComplete} className="flex-1 rounded-xl bg-[#962F43] text-white py-2 text-xs">下一步<ChevronRight className="inline w-4 h-4" /></button></div>
          <button onClick={() => alert('请用手机拍照检查当前妆面，再回到这里标记完成。')} className="w-full rounded-xl border border-rose-200 text-rose-700 py-2 text-xs"><Camera className="inline w-4 h-4 mr-1" />拍照检查</button>
        </aside>
      </div>
    </div>
  </div>;
};
