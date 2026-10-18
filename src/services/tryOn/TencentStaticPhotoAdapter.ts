import { ArSdk, type BeautifyOptions, type SetEffectParam } from 'tencentcloud-webar';

export interface TencentStaticPhotoConfig {
  canvas: HTMLCanvasElement;
  image: HTMLImageElement;
  onStatus?: (status: 'idle' | 'starting' | 'ready' | 'error', message?: string) => void;
  onFaceDetected?: (detected: boolean) => void;
}

interface WebARCredentials {
  appId: string;
  licenseKey: string;
}

/**
 * The only module allowed to know Tencent's ArSdk lifecycle details.
 * It deliberately supports static images; it does not start a camera stream.
 */
export class TencentStaticPhotoAdapter {
  private sdk: ArSdk | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private image: HTMLImageElement | null = null;
  private status: 'idle' | 'starting' | 'ready' | 'error' = 'idle';
  private statusCallback?: TencentStaticPhotoConfig['onStatus'];
  private faceCallback?: TencentStaticPhotoConfig['onFaceDetected'];

  async initialize(config: TencentStaticPhotoConfig): Promise<void> {
    this.dispose();
    this.canvas = config.canvas;
    this.image = config.image;
    this.statusCallback = config.onStatus;
    this.faceCallback = config.onFaceDetected;
    this.setStatus('starting', '正在初始化腾讯静态图片试妆…');

    const credentialsResponse = await fetch('/api/webar/config');
    if (!credentialsResponse.ok) throw new Error('WEBAR_CONFIG_MISSING');
    const credentialsBody = await credentialsResponse.json() as { success: boolean; config?: WebARCredentials };
    const credentials = credentialsBody.config;
    if (!credentialsBody.success || !credentials?.appId || !credentials.licenseKey) throw new Error('WEBAR_CONFIG_MISSING');

    await new Promise<void>((resolve, reject) => {
      if (this.image?.complete && this.image.naturalWidth) return resolve();
      this.image!.onload = () => resolve();
      this.image!.onerror = () => reject(new Error('WEBAR_IMAGE_LOAD_FAILED'));
    });

    const sdk = new ArSdk({
      auth: {
        appId: credentials.appId,
        licenseKey: credentials.licenseKey,
        authFunc: async () => {
          const response = await fetch('/api/webar/signature');
          if (!response.ok) throw new Error('WEBAR_SIGNATURE_FAILED');
          return response.json();
        },
      },
      module: { beautify: true },
      input: this.image,
      output: this.canvas,
      mirror: false,
      language: 'zh',
      resolution: 720,
    });
    this.sdk = sdk;

    const ready = () => {
      if (!this.sdk || !this.image) return;
      try {
        this.sdk.updateInputImage({
          width: this.image.naturalWidth,
          height: this.image.naturalHeight,
          input: this.image,
          output: this.canvas ?? undefined,
        });
      } catch (error) {
        console.warn('Tencent updateInputImage failed', error);
      }
      this.setStatus('ready', '腾讯静态图片处理已就绪');
    };

    sdk.on('resourceReady', ready);
    sdk.on('ready', ready);
    sdk.on('detectStatusChange', (data) => {
      this.faceCallback?.(Boolean(data?.faceDetected ?? data?.status ?? true));
    });
    sdk.on('result', () => this.faceCallback?.(true));
    sdk.on('error', (error) => {
      console.error('Tencent WebAR error', { code: error?.code, message: error?.message });
      this.setStatus('error', error?.message || '腾讯 WebAR 初始化失败');
    });

    // Some SDK builds expose resourceReady asynchronously; wait for it while
    // retaining ready as a compatibility fallback. The event handlers above
    // are the source of truth for actual SDK readiness.
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error('WEBAR_READY_TIMEOUT')), 15000);
      const onReady = () => { window.clearTimeout(timer); resolve(); };
      sdk.once('resourceReady', onReady);
      sdk.once('ready', onReady);
      sdk.once('error', (error) => { window.clearTimeout(timer); reject(new Error(error?.message || 'WEBAR_INIT_FAILED')); });
    });
  }

  async loadImage(image: HTMLImageElement): Promise<void> {
    if (!this.sdk || !this.canvas) throw new Error('WEBAR_NOT_INITIALIZED');
    this.image = image;
    await new Promise<void>((resolve, reject) => {
      if (image.complete && image.naturalWidth) return resolve();
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('WEBAR_IMAGE_LOAD_FAILED'));
    });
    this.sdk.updateInputImage({ width: image.naturalWidth, height: image.naturalHeight, input: image, output: this.canvas });
  }

  applyEffect(effect: SetEffectParam): void {
    if (!this.sdk || this.status !== 'ready') throw new Error('WEBAR_NOT_READY');
    this.sdk.setEffect(effect, undefined, (error) => console.error('Tencent effect failed', error));
  }

  setIntensity(intensity: number): void {
    if (!this.sdk || this.status !== 'ready') throw new Error('WEBAR_NOT_READY');
    // Tencent's effect API exposes intensity on the material, not arbitrary
    // color parameters. The caller must provide a real published effect ID.
    this.sdk.setEffect({ id: this.currentEffectId, intensity, filterIntensity: intensity });
  }

  private currentEffectId = '';

  setEffectId(effectId: string, intensity: number): void {
    this.currentEffectId = effectId;
    this.applyEffect({ id: effectId, intensity, filterIntensity: intensity });
  }

  resetEffects(): void {
    if (!this.sdk || this.status !== 'ready') return;
    this.sdk.setEffect(null as unknown as SetEffectParam);
    this.currentEffectId = '';
  }

  async exportImage(): Promise<Blob> {
    if (!this.sdk || this.status !== 'ready') throw new Error('WEBAR_NOT_READY');
    const imageData = await this.sdk.takePhoto();
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    canvas.getContext('2d')!.putImageData(imageData, 0, 0);
    return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('WEBAR_EXPORT_FAILED')), 'image/png'));
  }

  dispose(): void {
    this.sdk?.destroy({ stopInputStream: true });
    this.sdk = null;
    this.canvas = null;
    this.image = null;
    this.currentEffectId = '';
    this.status = 'idle';
  }

  private setStatus(status: TencentStaticPhotoAdapter['status'], message?: string): void {
    this.status = status;
    this.statusCallback?.(status, message);
  }
}

export type { BeautifyOptions };
