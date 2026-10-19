import { BeautyProduct, MakeupLayer, MakeupLayerType, MakeupLook } from '../../types/beauty';

const layerMap: Array<{ match: RegExp; type: MakeupLayerType; region: string }> = [
  { match: /底妆|粉底|妆前/, type: 'base', region: '全脸' },
  { match: /眉/, type: 'brows', region: '眉毛' },
  { match: /眼线/, type: 'eyeliner', region: '眼线' },
  { match: /睫/, type: 'lashes', region: '睫毛' },
  { match: /眼影|眼妆/, type: 'eyeshadow', region: '眼影' },
  { match: /腮红/, type: 'blush', region: '颧骨/苹果肌' },
  { match: /修容/, type: 'contour', region: '鼻梁/下颌' },
  { match: /高光/, type: 'highlight', region: '鼻梁/面中' },
  { match: /唇|口红/, type: 'lips', region: '上下唇' },
  { match: /美瞳|隐形/, type: 'contacts', region: '虹膜' },
];

export function buildMakeupLayers(look: MakeupLook, products: BeautyProduct[]): MakeupLayer[] {
  const source = look.layers?.length ? look.layers : (look.steps || []).map((step, index) => ({ step, index }));
  const layers = source.map((item: any, index) => {
    const text = typeof item === 'string' ? item : item.step || item.title || '';
    const mapped = layerMap.find(entry => entry.match.test(text));
    const product = products.find(candidate => candidate.product_name && text.includes(candidate.product_name));
    return {
      id: typeof item === 'object' && item.id ? item.id : `layer_${look.id}_${index}`,
      type: typeof item === 'object' && item.type ? item.type : mapped?.type || 'fullLook',
      region: typeof item === 'object' && item.region ? item.region : mapped?.region || '面部整体',
      style: typeof item === 'object' ? item.style : text,
      color: typeof item === 'object' ? item.color : undefined,
      opacity: typeof item === 'object' && Number.isFinite(item.opacity) ? item.opacity : 75,
      feather: typeof item === 'object' && Number.isFinite(item.feather) ? item.feather : 12,
      productId: typeof item === 'object' ? item.productId : product?.id,
      shade: typeof item === 'object' ? item.shade : product?.shade_name,
      enabled: typeof item === 'object' && typeof item.enabled === 'boolean' ? item.enabled : true,
      stepIndex: typeof item === 'object' && Number.isFinite(item.stepIndex) ? item.stepIndex : index,
    } satisfies MakeupLayer;
  });
  return layers.length ? layers : [{ id: `layer_${look.id}_full`, type: 'fullLook', region: '面部整体', opacity: 75, feather: 12, enabled: true, stepIndex: 0 }];
}
