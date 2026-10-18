import { FaceLandmarker, FilesetResolver, type NormalizedLandmark } from '@mediapipe/tasks-vision';

export interface LocalLipRenderOptions {
  color: string;
  intensity: number;
  finish?: 'matte' | 'dewy' | 'gloss';
}

export interface LocalMakeupRenderOptions {
  lip?: LocalLipRenderOptions;
  blush?: { color: string; intensity: number; placement?: 'center' | 'cheekbone' | 'undereye' | 'nose' };
  eye?: { color: string; intensity: number };
  brow?: { color: string; intensity: number; style?: string };
  liner?: { color: string; intensity: number; style?: string };
  contour?: { intensity: number; style?: 'nose' | 'jaw' | 'full' };
  highlight?: { intensity: number; area?: 'nose_bridge' | 'triangle' | 'all' };
  lens?: { color: string; intensity: number };
  lash?: { intensity: number; style?: string };
}

const OUTER_LIP = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78];
const INNER_LIP = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80];

export class LocalLipMaskRenderer {
  private landmarker: FaceLandmarker | null = null;

  async initialize(): Promise<void> {
    if (this.landmarker) return;
    const vision = await FilesetResolver.forVisionTasks('/mediapipe-wasm');
    this.landmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: '/models/face_landmarker.task', delegate: 'GPU' },
      runningMode: 'IMAGE',
      numFaces: 1,
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
    });
  }

  render(source: HTMLImageElement | HTMLCanvasElement, output: HTMLCanvasElement, options: LocalLipRenderOptions): boolean {
    return this.renderMakeup(source, output, { lip: options });
  }

  renderMakeup(source: HTMLImageElement | HTMLCanvasElement, output: HTMLCanvasElement, options: LocalMakeupRenderOptions): boolean {
    if (!this.landmarker) throw new Error('LOCAL_LIP_RENDERER_NOT_READY');
    const width = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
    const height = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
    if (!width || !height) throw new Error('LOCAL_IMAGE_INVALID');
    output.width = width;
    output.height = height;
    const context = output.getContext('2d');
    if (!context) throw new Error('LOCAL_CANVAS_UNAVAILABLE');
    context.clearRect(0, 0, width, height);
    context.drawImage(source, 0, 0, width, height);

    const result = this.landmarker.detect(source);
    const landmarks = result.faceLandmarks?.[0];
    if (!landmarks) return false;

    const points = (indices: number[]) => indices.filter(index => landmarks[index]).map(index => {
      const landmark: NormalizedLandmark = landmarks[index];
      return { x: landmark.x * width, y: landmark.y * height };
    });
    const outer = points(OUTER_LIP);
    const inner = points(INNER_LIP);
    if (options.lip) {
      drawMaskedColor(context, width, height, outer, inner, options.lip.color, options.lip.intensity, options.lip.finish);
    }
    const leftEye = points([33, 160, 158, 133, 153, 144]);
    const rightEye = points([362, 385, 387, 263, 373, 380]);
    if (options.eye) {
      drawMaskedColor(context, width, height, points([33, 160, 158, 133, 153, 144, 145, 163]), [], options.eye.color, options.eye.intensity, 'matte');
      drawMaskedColor(context, width, height, points([362, 385, 387, 263, 373, 380, 390, 386]), [], options.eye.color, options.eye.intensity, 'matte');
    }
    if (options.liner) {
      drawLine(context, leftEye, options.liner.color, options.liner.intensity, options.liner.style);
      drawLine(context, rightEye, options.liner.color, options.liner.intensity, options.liner.style);
    }
    if (options.lash) {
      drawLashes(context, leftEye, options.lash.intensity, options.lash.style);
      drawLashes(context, rightEye, options.lash.intensity, options.lash.style);
    }
    if (options.brow) {
      drawMaskedColor(context, width, height, points([70, 63, 105, 66, 107, 55]), [], options.brow.color, options.brow.intensity, 'matte');
      drawMaskedColor(context, width, height, points([336, 296, 334, 293, 300, 285]), [], options.brow.color, options.brow.intensity, 'matte');
    }
    if (options.blush) drawBlush(context, width, height, landmarks, options.blush.color, options.blush.intensity, options.blush.placement);
    if (options.contour) drawContour(context, width, height, landmarks, options.contour.intensity, options.contour.style);
    if (options.highlight) drawHighlight(context, width, height, landmarks, options.highlight.intensity, options.highlight.area);
    if (options.lens) drawLenses(context, width, height, points([468])[0], points([473])[0], options.lens.color, options.lens.intensity);
    return true;
  }

  dispose(): void {
    this.landmarker?.close();
    this.landmarker = null;
  }
}

function drawPolygon(context: CanvasRenderingContext2D, points: Array<{ x: number; y: number }>): void {
  if (!points.length) return;
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach(point => context.lineTo(point.x, point.y));
  context.closePath();
  context.fill();
}

function drawMaskedColor(context: CanvasRenderingContext2D, width: number, height: number, outer: Array<{ x: number; y: number }>, inner: Array<{ x: number; y: number }>, color: string, intensity: number, finish?: string): void {
  if (outer.length < 3) return;
  const mask = document.createElement('canvas');
  mask.width = width; mask.height = height;
  const maskContext = mask.getContext('2d')!;
  maskContext.fillStyle = '#fff';
  drawPolygon(maskContext, outer);
  if (inner.length >= 3) {
    maskContext.globalCompositeOperation = 'destination-out';
    drawPolygon(maskContext, inner);
  }
  const tint = document.createElement('canvas');
  tint.width = width; tint.height = height;
  const tintContext = tint.getContext('2d')!;
  tintContext.fillStyle = color;
  tintContext.globalAlpha = Math.max(0, Math.min(1, intensity / 100));
  tintContext.fillRect(0, 0, width, height);
  tintContext.globalCompositeOperation = 'destination-in';
  tintContext.drawImage(mask, 0, 0);
  context.globalCompositeOperation = finish === 'gloss' ? 'soft-light' : 'multiply';
  context.drawImage(tint, 0, 0);
  context.globalCompositeOperation = 'source-over';
  if (finish === 'gloss') {
    context.globalAlpha = Math.max(0.04, Math.min(0.18, intensity / 700));
    context.fillStyle = '#fff';
    const center = outer.reduce((acc, point) => ({ x: acc.x + point.x / outer.length, y: acc.y + point.y / outer.length }), { x: 0, y: 0 });
    context.beginPath(); context.ellipse(center.x, center.y, width * 0.035, height * 0.012, 0, 0, Math.PI * 2); context.fill();
    context.globalAlpha = 1;
  }
}

function drawLine(context: CanvasRenderingContext2D, points: Array<{ x: number; y: number }>, color: string, intensity: number, style?: string): void {
  if (points.length < 3) return;
  context.save();
  context.strokeStyle = color;
  context.globalAlpha = Math.min(0.95, intensity / 100);
  context.lineWidth = Math.max(1, intensity / 24);
  context.lineCap = 'round';
  context.shadowBlur = 1.5;
  context.shadowColor = color;
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach(point => context.lineTo(point.x, point.y));
  if (style === 'winged' || style === 'anime') {
    const last = points[points.length - 1];
    context.lineTo(last.x + (style === 'anime' ? 12 : 8), last.y - 4);
  }
  context.stroke();
  context.restore();
}

function drawLashes(context: CanvasRenderingContext2D, points: Array<{ x: number; y: number }>, intensity: number, style?: string): void {
  if (points.length < 3) return;
  context.save();
  context.strokeStyle = '#241713';
  context.globalAlpha = Math.min(0.9, intensity / 100);
  context.lineWidth = Math.max(1, intensity / 35);
  const start = points[0];
  const end = points[Math.floor(points.length / 2)];
  const count = style === 'anime' ? 7 : style === 'clusters' ? 5 : 3;
  for (let index = 0; index < count; index += 1) {
    const t = index / Math.max(1, count - 1);
    const x = start.x + (end.x - start.x) * t;
    const y = start.y + (end.y - start.y) * t;
    context.beginPath(); context.moveTo(x, y); context.lineTo(x + (x < end.x ? -2 : 2), y - 7 - intensity / 30); context.stroke();
  }
  context.restore();
}

function drawBlush(context: CanvasRenderingContext2D, width: number, height: number, landmarks: NormalizedLandmark[], color: string, intensity: number, placement = 'center'): void {
  const faceWidth = Math.abs((landmarks[454]?.x ?? 0.72) - (landmarks[234]?.x ?? 0.28)) * width;
  const left = cheekPoints(landmarks, [50, 101, 118, 117, 123, 147, 187]);
  const right = cheekPoints(landmarks, [280, 330, 347, 346, 352, 376, 411]);
  if (!left.length || !right.length) return;
  const shift = placement === 'undereye' ? -faceWidth * 0.1 : placement === 'nose' ? faceWidth * 0.06 : placement === 'cheekbone' ? -faceWidth * 0.02 : faceWidth * 0.035;
  const alpha = Math.min(0.42, intensity / 220);
  drawCheekGradient(context, left, color, alpha, shift, width, height);
  drawCheekGradient(context, right, color, alpha, shift, width, height);
}

function cheekPoints(landmarks: NormalizedLandmark[], indices: number[]): Array<{ x: number; y: number }> {
  return indices.filter(index => landmarks[index]).map(index => ({ x: landmarks[index].x, y: landmarks[index].y }));
}

function drawCheekGradient(context: CanvasRenderingContext2D, points: Array<{ x: number; y: number }>, color: string, alpha: number, shift: number, width: number, height: number): void {
  const center = points.reduce((sum, point) => ({ x: sum.x + point.x / points.length, y: sum.y + point.y / points.length }), { x: 0, y: 0 });
  const gradient = context.createRadialGradient(center.x * width, center.y * height + shift, 0, center.x * width, center.y * height + shift, Math.max(width * 0.17, 12));
  gradient.addColorStop(0, `${color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`);
  gradient.addColorStop(0.62, `${color}${Math.round(alpha * 120).toString(16).padStart(2, '0')}`);
  gradient.addColorStop(1, `${color}00`);
  context.save();
  context.beginPath();
  context.moveTo(points[0].x * width, points[0].y * height + shift);
  points.slice(1).forEach(point => context.lineTo(point.x * width, point.y * height + shift));
  context.closePath();
  context.clip();
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.restore();
}

function drawContour(context: CanvasRenderingContext2D, width: number, height: number, landmarks: NormalizedLandmark[], intensity: number, style = 'full'): void {
  const noseBridge = landmarks[168] || landmarks[6];
  const noseTip = landmarks[1] || landmarks[4];
  const jawLeft = landmarks[172] || landmarks[136];
  const jawRight = landmarks[397] || landmarks[365];
  if (!noseBridge || !noseTip || !jawLeft || !jawRight) return;
  context.save(); context.strokeStyle = '#704b3d'; context.globalAlpha = Math.min(0.35, intensity / 240); context.lineWidth = Math.max(2, width / 90); context.filter = 'blur(4px)';
  if (style === 'nose' || style === 'full') { drawStroke(context, noseBridge.x * width - width * 0.025, noseBridge.y * height, noseTip.x * width - width * 0.02, noseTip.y * height); drawStroke(context, noseBridge.x * width + width * 0.025, noseBridge.y * height, noseTip.x * width + width * 0.02, noseTip.y * height); }
  if (style === 'jaw' || style === 'full') { drawStroke(context, jawLeft.x * width, jawLeft.y * height, noseTip.x * width - width * 0.08, noseTip.y * height + width * 0.16); drawStroke(context, jawRight.x * width, jawRight.y * height, noseTip.x * width + width * 0.08, noseTip.y * height + width * 0.16); }
  context.restore();
}

function drawHighlight(context: CanvasRenderingContext2D, width: number, height: number, landmarks: NormalizedLandmark[], intensity: number, area = 'all'): void {
  const noseBridge = landmarks[168] || landmarks[6];
  const noseTip = landmarks[1] || landmarks[4];
  const lipCenter = landmarks[13] || landmarks[14];
  if (!noseBridge || !noseTip || !lipCenter) return;
  context.save(); context.fillStyle = '#fff4dc'; context.globalAlpha = Math.min(0.42, intensity / 240); context.filter = 'blur(3px)';
  if (area === 'nose_bridge' || area === 'all') { context.beginPath(); context.ellipse(noseBridge.x * width, noseBridge.y * height + (noseTip.y - noseBridge.y) * height * 0.35, width * 0.012, height * 0.045, 0, 0, Math.PI * 2); context.fill(); }
  if (area === 'triangle' || area === 'all') { context.beginPath(); context.ellipse(lipCenter.x * width, lipCenter.y * height - height * 0.035, width * 0.06, height * 0.025, 0, 0, Math.PI * 2); context.fill(); }
  context.restore();
}

function drawLenses(context: CanvasRenderingContext2D, width: number, height: number, left: { x: number; y: number } | undefined, right: { x: number; y: number } | undefined, color: string, intensity: number): void {
  if (!left || !right) return;
  context.save(); context.fillStyle = color; context.globalAlpha = Math.min(0.65, intensity / 130); context.globalCompositeOperation = 'color';
  [left, right].forEach(point => { context.beginPath(); context.arc(point.x, point.y, Math.max(4, width / 55), 0, Math.PI * 2); context.fill(); });
  context.restore();
}

function drawStroke(context: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
  context.beginPath(); context.moveTo(x1, y1); context.lineTo(x2, y2); context.stroke();
}
