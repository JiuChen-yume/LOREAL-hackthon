export interface RecognitionCandidate {
  candidateId: string;
  brand: string;
  productName: string;
  category: string;
  shade: string;
  specification: string;
  barcode?: string;
  confidence: number;
  source: 'product-api' | 'ocr' | 'barcode' | 'ai';
  evidence: string;
  boundingBox?: { xMin?: number; yMin?: number; xMax?: number; yMax?: number } | null;
  needsConfirmation: boolean;
  status: 'pending' | 'confirmed' | 'saved';
}

export function normalizeRecognitionCandidates(productData: any, ocrData: any): RecognitionCandidate[] {
  const located = Array.isArray(productData?.products) ? productData.products : [];
  if (located.length) return located.map((item: any, index: number) => ({
    candidateId: `candidate_product_${index}`,
    brand: String(item.brand || item.parents || ''),
    productName: String(item.product_name || item.name || '待确认商品'),
    category: String(item.category || ''), shade: String(item.shade_name || item.shade || ''), specification: String(item.size || item.specification || ''),
    confidence: Number(item.confidence || 0), source: productData.ai_assisted ? 'ai' : 'product-api', evidence: String(item.evidence || item.name || ''), boundingBox: item.bbox || null, needsConfirmation: true, status: 'pending'
  }));
  const raw = Array.isArray(ocrData?.product?.products) ? ocrData.product.products : ocrData?.product && typeof ocrData.product === 'object' ? [ocrData.product] : [];
  return raw.filter((item: any) => Boolean(item && (item.brand || item.product_name || item.complete_product_name || item.full_name || item.name || item.ocr_text))).map((item: any, index: number) => ({
    candidateId: `candidate_ocr_${index}`,
    brand: String(item.brand || ''), productName: String(item.complete_product_name || item.product_name || item.full_name || item.name || item.brand || '待确认商品'),
    category: String(item.category || ''), shade: String(item.shade_name || item.shade || ''), specification: String(item.size || item.specification || ''),
    confidence: Number(item.confidence || 0), source: ocrData.provider === 'doubao-vision' ? 'ai' : 'ocr', evidence: String(item.ocr_text || item.full_name || item.product_name || ''), boundingBox: null, needsConfirmation: true, status: 'pending'
  }));
}
