import type { BeautyProduct, IngredientEnrichmentStatus, IngredientRecord } from '../types/beauty';

export interface ProductEnrichmentResult {
  product?: Partial<BeautyProduct>;
  status: IngredientEnrichmentStatus;
  source?: string;
  sourceUrl?: string;
  evidence?: string;
  error?: string;
}

/**
 * The single client entry point used after every product creation path.
 * Credentials and external lookups stay behind the server endpoint.
 */
export async function enrichProduct(product: BeautyProduct, signal?: AbortSignal): Promise<ProductEnrichmentResult> {
  const response = await fetch('/api/products/enrich', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product }),
    signal
  });
  let data: any = null;
  try { data = await response.json(); } catch { data = null; }
  if (!response.ok || !data?.success) {
    return { status: (data?.status as IngredientEnrichmentStatus) || 'failed', error: data?.error || `成分查询失败（HTTP ${response.status}）` };
  }
  const ingredients = Array.isArray(data.product?.ingredients) ? data.product.ingredients.map(String).filter(Boolean) : [];
  const records: IngredientRecord[] = Array.isArray(data.product?.ingredient_records)
    ? data.product.ingredient_records
    : ingredients.map((name: string) => ({ name, verified: data.status === 'confirmed', source: data.source, source_url: data.source_url }));
  return {
    product: { ...data.product, ingredients, ingredient_records: records },
    status: (data.status as IngredientEnrichmentStatus) || (ingredients.length ? 'needs_verification' : 'not_found'),
    source: data.source,
    sourceUrl: data.source_url,
    evidence: data.evidence,
    error: data.error
  };
}
