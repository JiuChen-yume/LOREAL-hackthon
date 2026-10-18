import React, { useEffect, useRef, useState } from 'react';
import { Camera, CircleStop, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { ArSdk, type BeautifyOptions } from 'tencentcloud-webar';

type MirrorStatus = 'idle' | 'starting' | 'ready' | 'error';

interface WebARConfig {
  appId: string;
  licenseKey: string;
}

interface WebAREffect {
  EffectId?: string;
  Name?: string;
  CoverUrl?: string;
  Label?: string | string[];
}

export const WebARMakeupMirror: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sdkRef = useRef<ArSdk | null>(null);
  const [status, setStatus] = useState<MirrorStatus>('idle');
  const [message, setMessage] = useState('点击开始实时试妆');
  const [beautify, setBeautify] = useState<BeautifyOptions>({ whiten: 0.15, dermabrasion: 0.25, lift: 0.1, eye: 0.08 });
  const [effectId, setEffectId] = useState('');
  const [effects, setEffects] = useState<WebAREffect[]>([]);
  const [faceDetected, setFaceDetected] = useState(false);

  const stop = () => {
    sdkRef.current?.destroy({ stopInputStream: true });
    sdkRef.current = null;
    setStatus('idle');
    setMessage('点击开始实时试妆');
  };

  const start = async () => {
    if (status === 'ready' || status === 'starting') return;
    setStatus('starting');
    setMessage('正在加载腾讯特效 WebAR…');
    try {
      const configResponse = await fetch('/api/webar/config');
      if (!configResponse.ok) throw new Error('WEBAR_CONFIG_MISSING');
      const config = await configResponse.json() as { success: boolean; config?: WebARConfig };
      if (!config.success || !config.config?.appId || !config.config.licenseKey) throw new Error('WEBAR_CONFIG_MISSING');

      const sdk = new ArSdk({
        auth: {
          appId: config.config.appId,
          licenseKey: config.config.licenseKey,
          authFunc: async () => {
            const response = await fetch('/api/webar/signature');
            if (!response.ok) throw new Error('WEBAR_SIGNATURE_FAILED');
            return response.json();
          },
        },
        module: { beautify: true },
        camera: { width: 720, height: 960, mirror: true, frameRate: 30 },
        output: canvasRef.current ?? undefined,
        language: 'zh',
        resolution: 720,
      });
      sdkRef.current = sdk;
      const loadEffects = async () => {
        try {
          const list = await sdk.getEffectList({ Type: 'Preset', Label: ['Makeup', 'Woman'] });
          setEffects(Array.isArray(list) ? list : []);
        } catch (error) {
          console.warn('Unable to load WebAR makeup materials', error);
        }
      };
      const markReady = () => {
        sdk.setBeautify(beautify);
        setStatus('ready');
        setMessage('实时试妆已开启');
        void loadEffects();
      };
      sdk.on('created', loadEffects);
      sdk.on('resourceReady', markReady);
      sdk.on('ready', markReady);
      sdk.on('detectStatusChange', (data) => setFaceDetected(Boolean(data?.faceDetected ?? data?.status ?? true)));
      sdk.on('result', () => setFaceDetected(true));
      sdk.on('error', (error) => {
        console.error('Tencent WebAR error', error);
        setStatus('error');
        setMessage('WebAR 初始化失败，请检查 License、域名和摄像头权限');
      });
      sdk.on('cameraReady', () => setMessage('摄像头已连接，正在加载妆效…'));
    } catch (error) {
      console.error(error);
      setStatus('error');
      setMessage(error instanceof Error && error.message === 'WEBAR_CONFIG_MISSING'
        ? '请先在 Cloudflare Secret 配置 WebAR AppID、LicenseKey 和 Token'
        : 'WebAR 初始化失败，请检查摄像头权限和网络');
    }
  };

  useEffect(() => () => stop(), []);

  useEffect(() => {
    if (status === 'ready') sdkRef.current?.setBeautify(beautify);
  }, [beautify, status]);

  const update = (key: keyof BeautifyOptions, value: number) => setBeautify(prev => ({ ...prev, [key]: value }));

  return (
    <section className="rounded-3xl border border-[#E9D6D2] bg-[#241B1D] text-white p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-[#CF3F57]/20 flex items-center justify-center"><Sparkles className="w-4 h-4 text-rose-300" /></div><div><h3 className="text-sm font-bold">腾讯特效 · WebAR 实时试妆</h3><p className="text-[10px] text-white/60">浏览器摄像头实时预览美颜、脸型和妆效</p></div></div>
        <span className={`text-[10px] px-2 py-1 rounded-full ${status === 'ready' ? 'bg-emerald-500/20 text-emerald-200' : status === 'error' ? 'bg-red-500/20 text-red-200' : 'bg-white/10 text-white/70'}`}>{status === 'ready' ? 'LIVE' : status === 'starting' ? '加载中' : status === 'error' ? '需配置' : '未启动'}</span>
      </div>
      <div className="relative overflow-hidden rounded-2xl bg-black aspect-[3/4] max-h-[520px] flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full object-cover" width={720} height={960} />
        {status !== 'ready' && <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-black/20 to-black/70 px-6 text-center"><Camera className="w-8 h-8 text-rose-200" /><p className="text-xs text-white/80">{message}</p></div>}
      </div>
      <div className="flex items-center gap-2">
        {status === 'ready' ? <button onClick={stop} className="flex-1 rounded-xl bg-white/10 py-2 text-xs font-semibold hover:bg-white/20 flex items-center justify-center gap-1.5"><CircleStop className="w-4 h-4" />停止试妆</button> : <button onClick={start} disabled={status === 'starting'} className="flex-1 rounded-xl bg-[#CF3F57] py-2 text-xs font-semibold hover:bg-[#b8334a] disabled:opacity-60 flex items-center justify-center gap-1.5">{status === 'starting' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}开始实时试妆</button>}
        <button disabled={status !== 'ready'} onClick={() => { if (!canvasRef.current) return; const link = document.createElement('a'); link.download = `webar-makeup-${Date.now()}.png`; link.href = canvasRef.current.toDataURL('image/png'); link.click(); }} className="rounded-xl bg-white/10 px-3 py-2 text-xs hover:bg-white/20 disabled:opacity-40" title="保存当前妆面">保存</button>
        <button onClick={() => { setBeautify({ whiten: 0.15, dermabrasion: 0.25, lift: 0.1, eye: 0.08 }); setEffectId(''); sdkRef.current?.setEffect(null as any); }} className="rounded-xl bg-white/10 p-2 hover:bg-white/20" title="重置参数"><RotateCcw className="w-4 h-4" /></button>
      </div>
      <div className="flex items-center justify-between text-[10px] text-white/60"><span>{status === 'ready' ? (faceDetected ? '已识别面部 · 妆效会跟随面部运动' : '正在寻找面部…请保持正面光线') : '启动后将自动识别人脸'}</span><span>{effects.length ? `已加载 ${effects.length} 个腾讯妆效` : '妆效列表待加载'}</span></div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] text-white/75">
        <label>美白 <input type="range" min="0" max="1" step="0.01" value={beautify.whiten ?? 0} onChange={e => update('whiten', Number(e.target.value))} className="w-full accent-rose-400" /></label>
        <label>磨皮 <input type="range" min="0" max="1" step="0.01" value={beautify.dermabrasion ?? 0} onChange={e => update('dermabrasion', Number(e.target.value))} className="w-full accent-rose-400" /></label>
        <label>瘦脸 <input type="range" min="0" max="1" step="0.01" value={beautify.lift ?? 0} onChange={e => update('lift', Number(e.target.value))} className="w-full accent-rose-400" /></label>
        <label>大眼 <input type="range" min="0" max="1" step="0.01" value={beautify.eye ?? 0} onChange={e => update('eye', Number(e.target.value))} className="w-full accent-rose-400" /></label>
      </div>
      <div className="flex items-center gap-2"><input value={effectId} onChange={e => setEffectId(e.target.value)} placeholder="腾讯特效 ID（可选）" className="min-w-0 flex-1 rounded-xl bg-white/10 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/40 outline-none" /><button disabled={!effectId || status !== 'ready'} onClick={() => effectId && sdkRef.current?.setEffect({ id: effectId, intensity: 1, filterIntensity: 1 })} className="rounded-xl bg-white/10 px-3 py-2 text-xs disabled:opacity-40">应用妆效</button></div>
      {effects.length > 0 && <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">{effects.slice(0, 12).map((effect, index) => { const id = effect.EffectId || ''; return <button key={id || index} disabled={status !== 'ready' || !id} onClick={() => { if (!id) return; setEffectId(id); sdkRef.current?.setEffect({ id, intensity: 1, filterIntensity: 1 }); }} className={`shrink-0 w-16 text-left disabled:opacity-40 ${effectId === id ? 'text-rose-200' : 'text-white/70'}`} title={effect.Name || id}><div className="w-16 h-16 rounded-xl overflow-hidden bg-white/10 border border-white/10">{effect.CoverUrl ? <img src={effect.CoverUrl} alt={effect.Name || '腾讯妆效'} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px]">妆效</div>}</div><span className="block mt-1 text-[10px] truncate">{effect.Name || `妆效 ${index + 1}`}</span></button>; })}</div>}
      <p className="text-[10px] leading-relaxed text-white/50">妆效 ID 需要在腾讯特效控制台创建并发布后使用；SDK 的 AppID、LicenseKey、Token 只放服务端签名接口。</p>
    </section>
  );
};
