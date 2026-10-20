import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Camera, X, Sparkles } from 'lucide-react';
import { BeautyProduct, MakeupLayer, MakeupLook, MakeupStepDetail } from '../../types/beauty';
import { buildMakeupLayers } from '../../services/makeup/makeupLayers';

interface MakeupFollowAlongProps {
  userPhotoUrl: string;
  generatedImage?: string;
  look: MakeupLook;
  products: BeautyProduct[];
  authenticated?: boolean;
  onClose: () => void;
}

interface FollowStep {
  title: string;
  area: string;
  layer?: MakeupLayer;
  detail?: MakeupStepDetail;
  index: number;
}

export const MakeupFollowAlong: React.FC<MakeupFollowAlongProps> = ({ userPhotoUrl, generatedImage, look, products, authenticated = false, onClose }) => {
  const steps = useMemo<FollowStep[]>(() => {
    try {
      const layers = buildMakeupLayers(look, products);
      if (look.step_details && look.step_details.length > 0) {
        return look.step_details.map((detail, index) => ({
          title: detail.title,
          area: detail.targetArea || layers[index]?.region || '面部整体',
          layer: layers[index],
          detail,
          index
        }));
      }
      return layers.map((layer, index) => ({ title: layer.style || `${layer.region}步骤`, area: layer.region, layer, detail: undefined, index }));
    } catch (error) {
      console.error('Makeup follow-along layer preparation failed:', error);
      return [{ title: '完成整体妆容检查', area: '整体', layer: undefined, detail: undefined, index: 0 }];
    }
  }, [look, products]);
  const [current, setCurrent] = useState(0);
  const [completed, setCompleted] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem(`makeup_follow_${look.id}`) || '[]'); } catch { return []; }
  });
  const [saved, setSaved] = useState(false);
  const [showGeneratedFinal, setShowGeneratedFinal] = useState(false);
  const [stepImages, setStepImages] = useState<Record<number, string>>({});
  const [loadingStepImage, setLoadingStepImage] = useState(false);
  const [stepImageError, setStepImageError] = useState<string | null>(null);
  const step: FollowStep = steps[current] || { title: '完成整体妆容检查', area: '整体', layer: undefined, detail: undefined, index: current };
  const product = (step.detail?.productId ? products.find(item => item.id === step.detail?.productId) : undefined)
    || products.find(item => item.category === (step.layer?.type === 'lips' ? 'lip' : ['eyeshadow', 'eyeliner', 'lashes', 'brows'].includes(step.layer?.type || '') ? 'eye' : 'base'))
    || products.find(item => step.detail?.productName && `${item.brand} ${item.product_name}`.includes(step.detail.productName))
    || products[0];
  const finished = steps.length > 0 && completed.length >= steps.length;

  useEffect(() => {
    if (stepImages[current]) return;
    let cancelled = false;
    setLoadingStepImage(true);
    setStepImageError(null);
    void fetch('/api/makeup/render-layer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: userPhotoUrl,
        stepIndex: current,
        step: {
          title: step.detail?.title || step.title,
          targetArea: step.detail?.targetArea || step.area,
          layerType: step.detail?.layerType || step.layer?.type || 'fullLook',
          method: step.detail?.method?.length ? step.detail.method : [step.title]
        },
        style: look.description
      })
    }).then(async response => {
      const data = await response.json() as { success?: boolean; layer?: { url?: string }; error?: string };
      if (!response.ok || !data.success || !data.layer?.url) throw new Error(data.error || '当前步骤图片生成失败。');
      const imageUrl = data.layer.url;
      if (!cancelled) setStepImages(previous => ({ ...previous, [current]: imageUrl }));
    }).catch(error => {
      if (!cancelled) {
        console.error('Makeup follow-along step image failed:', error);
        setStepImageError(error instanceof Error ? error.message : '当前步骤图片生成失败。');
      }
    }).finally(() => {
      if (!cancelled) setLoadingStepImage(false);
    });
    return () => { cancelled = true; };
  }, [current, look.description, step.detail, step.layer?.type, step.area, step.title, stepImages, userPhotoUrl]);

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
        <main className="rounded-2xl bg-black/30 p-3 flex flex-col items-center justify-center min-h-[420px] gap-3"><div className="relative max-h-[62vh] max-w-full"><img src={showGeneratedFinal && generatedImage ? generatedImage : stepImages[current] || userPhotoUrl} alt={showGeneratedFinal ? 'Seedream 完整妆效图' : `${step.title}步骤参考图`} className="max-h-[62vh] max-w-full object-contain rounded-xl" /></div>{loadingStepImage && <p className="text-xs text-white/70"><Sparkles className="inline w-4 h-4 mr-1 animate-pulse" />豆包正在生成「{step.title}」步骤图…</p>}{stepImageError && <p role="status" className="text-xs text-amber-200">{stepImageError} 当前显示原始照片，可继续查看步骤。</p>}{generatedImage && <button type="button" onClick={() => setShowGeneratedFinal(value => !value)} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] text-white/80">{showGeneratedFinal ? '查看当前步骤图' : '查看完整试妆效果图'}</button>}</main>
        <aside className="rounded-2xl bg-white p-4 text-stone-900 self-start space-y-3">
          {finished && <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3"><p className="text-sm font-bold text-emerald-900">妆容跟练完成</p><p className="text-[11px] text-emerald-700 mt-1">已完成 {steps.length} 个步骤，可以保存本次妆容档案。</p><button onClick={saveArchive} className="mt-2 w-full rounded-lg bg-emerald-700 text-white py-2 text-xs">{saved ? '已保存妆容档案' : '保存妆容档案'}</button></div>}
          <div><p className="text-[10px] text-rose-700 font-bold">当前图层 · {step.layer?.type || 'fullLook'}</p><h3 className="text-base font-bold mt-1">{step.title}</h3><p className="text-[11px] text-stone-500 mt-1">目标区域：{step.area}</p></div>
          <div className="rounded-xl bg-stone-50 p-3 text-xs"><p className="font-semibold">当前产品</p><p className="mt-1">{product ? `${product.brand} ${product.product_name}${product.shade_name ? ` · ${product.shade_name}` : ''}` : '请从化妆台选择产品'}</p></div>
          <div className="text-xs text-stone-600 space-y-1"><p>工具：{step.detail?.tool || '干净刷具或指腹'}</p><p>用量：{step.detail?.dosage || '少量多次，先薄后叠'}</p>{step.detail?.method?.slice(0, 3).map((item, index) => <p key={index}>操作：{item}</p>)}{step.detail?.pitfalls?.slice(0, 2).map((item, index) => <p key={`pitfall-${index}`} className="text-amber-700">避坑：{item}</p>)}<p>检查：{step.detail?.checklist?.[0] || '边缘自然、左右对称、不要覆盖非目标区域'}</p></div>
          <button onClick={() => setCompleted(prev => prev.includes(current) ? prev.filter(i => i !== current) : [...prev, current])} className="w-full rounded-xl border border-stone-200 py-2 text-xs">{completed.includes(current) ? '取消完成' : '标记本步完成'}</button>
          <div className="flex gap-2"><button disabled={current === 0} onClick={() => setCurrent(i => Math.max(0, i - 1))} className="flex-1 rounded-xl bg-stone-100 py-2 text-xs disabled:opacity-40"><ChevronLeft className="inline w-4 h-4" />上一步</button><button onClick={markComplete} className="flex-1 rounded-xl bg-[#962F43] text-white py-2 text-xs">下一步<ChevronRight className="inline w-4 h-4" /></button></div>
          <button onClick={() => alert('请用手机拍照检查当前妆面，再回到这里标记完成。')} className="w-full rounded-xl border border-rose-200 text-rose-700 py-2 text-xs"><Camera className="inline w-4 h-4 mr-1" />拍照检查</button>
        </aside>
      </div>
    </div>
  </div>;
};
