import type { BeautyProduct, TryOnConfig } from '../../types/beauty';
import { LocalLipMaskRenderer, type LocalLipRenderOptions } from './LocalLipMaskRenderer';
import { TencentStaticPhotoAdapter } from './TencentStaticPhotoAdapter';

export type TryOnStatus = 'idle' | 'initializing' | 'ready' | 'processing' | 'error';

export interface TryOnProduct extends BeautyProduct {
  try_on: TryOnConfig;
}

export const normalizeTryOnProduct = (product: BeautyProduct): TryOnProduct => ({
  ...product,
  try_on: product.try_on ?? {
    provider: 'local-lip-mask',
    status: 'fallback',
    defaultIntensity: 75,
    finish: 'dewy',
  },
});

export class TryOnService {
  private readonly localRenderer = new LocalLipMaskRenderer();
  private readonly tencentAdapter = new TencentStaticPhotoAdapter();
  private activeProduct: TryOnProduct | null = null;
  private outputCanvas: HTMLCanvasElement | null = null;

  async initialize(outputCanvas: HTMLCanvasElement, image: HTMLImageElement): Promise<'tencent-effect' | 'local-lip-mask'> {
    this.outputCanvas = outputCanvas;
    await this.localRenderer.initialize();
    try {
      await this.tencentAdapter.initialize({ canvas: outputCanvas, image });
    } catch (error) {
      console.warn('Tencent static photo adapter unavailable; local renderer remains active', error);
    }
    return 'local-lip-mask';
  }

  async applyProduct(product: TryOnProduct, intensity = product.try_on.defaultIntensity ?? 75): Promise<{ provider: 'tencent-effect' | 'local-lip-mask'; faceDetected: boolean }> {
    if (!this.outputCanvas) throw new Error('TRY_ON_NOT_INITIALIZED');
    this.activeProduct = product;
    if (product.try_on.provider === 'tencent-effect' && product.try_on.effectId && product.try_on.status === 'verified') {
      this.tencentAdapter.resetEffects();
      this.tencentAdapter.setEffectId(product.try_on.effectId, Math.max(0, Math.min(1, intensity / 100)));
      return { provider: 'tencent-effect', faceDetected: true };
    }
    if (!product.shade_hex) throw new Error('TRY_ON_SHADE_MISSING');
    const source = await this.getSourceImage();
    const options: LocalLipRenderOptions = {
      color: product.shade_hex,
      intensity,
      finish: product.try_on.finish,
    };
    const faceDetected = this.localRenderer.render(source, this.outputCanvas, options);
    if (!faceDetected) throw new Error('TRY_ON_FACE_NOT_FOUND');
    return { provider: 'local-lip-mask', faceDetected: true };
  }

  setIntensity(intensity: number): Promise<{ provider: 'tencent-effect' | 'local-lip-mask'; faceDetected: boolean }> {
    if (!this.activeProduct) return Promise.reject(new Error('TRY_ON_PRODUCT_MISSING'));
    return this.applyProduct(this.activeProduct, intensity);
  }

  resetEffects(): void {
    this.tencentAdapter.resetEffects();
    this.activeProduct = null;
  }

  async exportImage(): Promise<Blob> {
    if (!this.outputCanvas) throw new Error('TRY_ON_NOT_INITIALIZED');
    if (this.activeProduct?.try_on.provider === 'tencent-effect' && this.activeProduct.try_on.status === 'verified') {
      return this.tencentAdapter.exportImage();
    }
    return new Promise((resolve, reject) => this.outputCanvas!.toBlob(blob => blob ? resolve(blob) : reject(new Error('TRY_ON_EXPORT_FAILED')), 'image/png'));
  }

  dispose(): void {
    this.localRenderer.dispose();
    this.tencentAdapter.dispose();
    this.activeProduct = null;
    this.outputCanvas = null;
  }

  private async getSourceImage(): Promise<HTMLImageElement> {
    const source = new Image();
    source.src = this.outputCanvas?.dataset.sourceImage || '';
    await new Promise<void>((resolve, reject) => {
      if (source.complete && source.naturalWidth) return resolve();
      source.onload = () => resolve();
      source.onerror = () => reject(new Error('TRY_ON_IMAGE_LOAD_FAILED'));
    });
    return source;
  }
}
