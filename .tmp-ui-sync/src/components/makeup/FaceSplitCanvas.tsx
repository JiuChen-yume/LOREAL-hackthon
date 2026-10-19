import React, { useState, useRef, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Upload, 
  Camera, 
  Sparkles, 
  Layers, 
  SlidersHorizontal,
  Maximize2
} from 'lucide-react';
import { homePortraitImg, makeupGlamourImg, makeupLookImg } from '../../data/mockData';
import { Face3DViewer } from './Face3DViewer';

interface FaceSplitCanvasProps {
  lipColor: string;
  lipDepth: number;
  lipEnabled: boolean;
  cheekColor: string;
  cheekAmount: number;
  cheekEnabled: boolean;
  eyeColor: string;
  eyeIntensity: number;
  eyeEnabled: boolean;
  baseFinish: 'dewy' | 'matte';
  baseCoverage: number;
  viewMode: 'split' | '3d' | 'zoom';
  onViewModeChange: (mode: 'split' | '3d' | 'zoom') => void;
  userPhotoUrl: string;
  onUploadPhoto: (url: string) => void;
}

export const FaceSplitCanvas: React.FC<FaceSplitCanvasProps> = ({
  lipColor,
  lipDepth,
  lipEnabled,
  cheekColor,
  cheekAmount,
  cheekEnabled,
  eyeColor,
  eyeIntensity,
  eyeEnabled,
  baseFinish,
  baseCoverage,
  viewMode,
  onViewModeChange,
  userPhotoUrl,
  onUploadPhoto
}) => {
  const [sliderPos, setSliderPos] = useState(50); // 0 to 100%
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const startPanRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Preset bare faces
  const presetBareFaces = [
    { id: 'natural', name: '自然素颜', url: homePortraitImg },
    { id: 'fair', name: '冷调净透', url: makeupGlamourImg },
    { id: 'warm', name: '暖调柔和', url: makeupLookImg },
  ];

  // Dragging slider logic
  const handleSliderMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPos(pct);
  };

  const handleMouseDownSlider = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingSlider(true);
  };

  const handleTouchStartSlider = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsDraggingSlider(true);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingSlider) {
        handleSliderMove(e.clientX);
      } else if (isPanning) {
        setPanPos({
          x: e.clientX - startPanRef.current.x,
          y: e.clientY - startPanRef.current.y
        });
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isDraggingSlider && e.touches.length > 0) {
        handleSliderMove(e.touches[0].clientX);
      } else if (isPanning && e.touches.length > 0) {
        setPanPos({
          x: e.touches[0].clientX - startPanRef.current.x,
          y: e.touches[0].clientY - startPanRef.current.y
        });
      }
    };

    const onEnd = () => {
      setIsDraggingSlider(false);
      setIsPanning(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDraggingSlider, isPanning]);

  // Handle local image upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUploadPhoto(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col space-y-2.5 w-full">
      {/* 1. View Mode Pills & Upload Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-white/80 p-0.5 rounded-full border border-[#EDE5DE] shadow-2xs">
          <button
            onClick={() => onViewModeChange('split')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              viewMode === 'split' 
                ? 'bg-[#962F43] text-white shadow-xs' 
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            对比滑块
          </button>
          <button
            onClick={() => onViewModeChange('3d')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${
              viewMode === '3d' 
                ? 'bg-[#962F43] text-white shadow-xs' 
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3D 立体模型</span>
          </button>
          <button
            onClick={() => onViewModeChange('zoom')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${
              viewMode === 'zoom' 
                ? 'bg-[#962F43] text-white shadow-xs' 
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>放大微距</span>
          </button>
        </div>

        {/* Upload Button */}
        <div className="flex items-center gap-1.5">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1 rounded-full bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium border border-[#EDE5DE] flex items-center gap-1 shadow-2xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-[#962F43]" />
            <span>上传我的照片</span>
          </button>
        </div>
      </div>

      {/* Preset Face Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
        <span className="text-[11px] text-stone-400 whitespace-nowrap">或者选用示例脸型：</span>
        {presetBareFaces.map((face) => (
          <button
            key={face.id}
            onClick={() => onUploadPhoto(face.url)}
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap border transition-all ${
              userPhotoUrl === face.url 
                ? 'border-[#962F43] bg-rose-50/70 text-[#962F43] font-semibold' 
                : 'border-stone-200 bg-white/80 text-stone-600 hover:bg-white'
            }`}
          >
            <div className="w-3.5 h-3.5 rounded-full overflow-hidden">
              <img src={face.url} alt={face.name} className="w-full h-full object-cover" />
            </div>
            <span>{face.name}</span>
          </button>
        ))}
      </div>

      {/* 2. Main Interactive Viewport Canvas */}
      <div 
        ref={containerRef}
        className="relative w-full aspect-3/4 sm:aspect-4/5 max-h-[460px] bg-stone-100 rounded-3xl overflow-hidden border border-[#EDE5DE] shadow-sm select-none"
      >
        {/* VIEW MODE 1: 3D MODEL */}
        {viewMode === '3d' && (
          <Face3DViewer
            lipColor={lipColor}
            lipDepth={lipDepth}
            lipEnabled={lipEnabled}
            cheekColor={cheekColor}
            cheekAmount={cheekAmount}
            cheekEnabled={cheekEnabled}
            eyeColor={eyeColor}
            eyeIntensity={eyeIntensity}
            eyeEnabled={eyeEnabled}
            baseFinish={baseFinish}
            baseCoverage={baseCoverage}
          />
        )}

        {/* VIEW MODE 2: SPLIT BEFORE / AFTER SLIDER or ZOOM */}
        {viewMode !== '3d' && (
          <div 
            className="relative w-full h-full overflow-hidden"
            onMouseDown={(e) => {
              if (viewMode === 'zoom') {
                setIsPanning(true);
                startPanRef.current = { x: e.clientX - panPos.x, y: e.clientY - panPos.y };
              }
            }}
            onTouchStart={(e) => {
              if (viewMode === 'zoom' && e.touches.length === 1) {
                setIsPanning(true);
                startPanRef.current = { x: e.touches[0].clientX - panPos.x, y: e.touches[0].clientY - panPos.y };
              }
            }}
          >
            {/* The Base Photo (Transformed by Zoom & Pan) */}
            <div 
              className="absolute inset-0 w-full h-full transition-transform origin-center"
              style={{
                transform: `scale(${zoomLevel}) translate(${panPos.x / zoomLevel}px, ${panPos.y / zoomLevel}px)`
              }}
            >
              {/* Full Background Photo: Bare Skin (BEFORE) */}
              <img 
                src={userPhotoUrl} 
                alt="Bare face before makeup" 
                className="w-full h-full object-cover object-center filter grayscale-[8%]"
              />

              {/* AFTER LAYER: Clipped by Slider Position */}
              <div 
                className="absolute inset-0 overflow-hidden"
                style={{
                  clipPath: viewMode === 'split' ? `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)` : 'none'
                }}
              >
                {/* Full Makeup Applied Photo */}
                <img 
                  src={userPhotoUrl} 
                  alt="Face after makeup" 
                  className="w-full h-full object-cover object-center"
                />

                {/* 1. Dynamic Foundation Layer (Base finish & smoothing) */}
                <div 
                  className="absolute inset-0 pointer-events-none mix-blend-soft-light transition-opacity duration-300"
                  style={{
                    backgroundColor: baseFinish === 'dewy' ? '#FFF5EE' : '#FCEAE6',
                    opacity: (baseCoverage / 100) * 0.45
                  }}
                />

                {/* 2. Dynamic Lip Makeup Overlay */}
                {lipEnabled && (
                  <div 
                    className="absolute inset-x-[36%] bottom-[23%] h-[12%] rounded-[50%] pointer-events-none blur-[2px] transition-all duration-200"
                    style={{
                      backgroundColor: lipColor,
                      opacity: (lipDepth / 100) * 0.88,
                      mixBlendMode: 'multiply'
                    }}
                  />
                )}

                {/* 3. Dynamic Cheek Blush Overlay (Left & Right apples) */}
                {cheekEnabled && (
                  <>
                    {/* Left Cheek */}
                    <div 
                      className="absolute left-[16%] top-[48%] w-[26%] h-[20%] rounded-full pointer-events-none blur-[14px] transition-all duration-200"
                      style={{
                        backgroundColor: cheekColor,
                        opacity: (cheekAmount / 100) * 0.58,
                        mixBlendMode: 'color-burn'
                      }}
                    />
                    {/* Right Cheek */}
                    <div 
                      className="absolute right-[16%] top-[48%] w-[26%] h-[20%] rounded-full pointer-events-none blur-[14px] transition-all duration-200"
                      style={{
                        backgroundColor: cheekColor,
                        opacity: (cheekAmount / 100) * 0.58,
                        mixBlendMode: 'color-burn'
                      }}
                    />
                  </>
                )}

                {/* 4. Dynamic Eyeshadow Overlay */}
                {eyeEnabled && (
                  <>
                    <div 
                      className="absolute left-[20%] top-[34%] w-[22%] h-[10%] rounded-full pointer-events-none blur-[6px] transition-all duration-200"
                      style={{
                        backgroundColor: eyeColor,
                        opacity: (eyeIntensity / 100) * 0.65,
                        mixBlendMode: 'multiply'
                      }}
                    />
                    <div 
                      className="absolute right-[20%] top-[34%] w-[22%] h-[10%] rounded-full pointer-events-none blur-[6px] transition-all duration-200"
                      style={{
                        backgroundColor: eyeColor,
                        opacity: (eyeIntensity / 100) * 0.65,
                        mixBlendMode: 'multiply'
                      }}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Split Slider Divider Line with Knob matching 5b1e751c1e23c4d0c9f614c9787202b8.jpg */}
            {viewMode === 'split' && (
              <div 
                className="absolute top-0 bottom-0 z-20 cursor-ew-resize flex items-center justify-center"
                style={{ left: `${sliderPos}%` }}
                onMouseDown={handleMouseDownSlider}
                onTouchStart={handleTouchStartSlider}
              >
                {/* Vertical White Line */}
                <div className="w-[2px] h-full bg-white shadow-md pointer-events-none" />

                {/* Center Circular Grab Knob */}
                <div className="absolute w-8 h-8 rounded-full bg-stone-900/90 border-2 border-white shadow-lg flex items-center justify-center text-white text-[11px] font-bold active:scale-110 transition-transform">
                  <span className="text-[12px] leading-none tracking-tight">⇹</span>
                </div>

                {/* Floating Yellow Indicator from user image */}
                <div className="absolute left-6 w-5 h-5 rounded-full bg-amber-400 text-stone-900 flex items-center justify-center shadow-md animate-bounce pointer-events-none text-xs font-bold">
                  ↔
                </div>
              </div>
            )}

            {/* BADGES matching 5b1e751c1e23c4d0c9f614c9787202b8.jpg */}
            {viewMode === 'split' && (
              <>
                <div className="absolute top-3 left-3 z-10 px-2.5 py-0.5 rounded-full bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-bold tracking-wider shadow-sm">
                  BEFORE
                </div>

                <div className="absolute top-3 right-3 z-10 px-3 py-0.5 rounded-full bg-[#962F43] text-white text-[10px] font-bold tracking-wider shadow-sm">
                  YOUR LIPSTICK
                </div>
              </>
            )}

            {/* Zoom Controls Overlay (Visible in Zoom mode or always handy) */}
            <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 bg-white/90 backdrop-blur-md p-1 rounded-full border border-stone-200/80 shadow-xs">
              <button
                onClick={() => setZoomLevel(prev => Math.min(3.0, prev + 0.5))}
                className="p-1 text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-full"
                title="放大"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-bold text-stone-700 px-1 font-mono">
                {zoomLevel.toFixed(1)}x
              </span>
              <button
                onClick={() => setZoomLevel(prev => Math.max(1.0, prev - 0.5))}
                className="p-1 text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-full"
                title="缩小"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              {zoomLevel > 1 && (
                <button
                  onClick={() => {
                    setZoomLevel(1.0);
                    setPanPos({ x: 0, y: 0 });
                  }}
                  className="p-1 text-stone-500 hover:text-stone-900 rounded-full"
                  title="重置"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Floating Hint for Zoom/Pan */}
            {zoomLevel > 1 && (
              <div className="absolute bottom-3 left-3 z-20 bg-stone-900/80 text-white text-[10px] px-2.5 py-1 rounded-full">
                按住画面拖动可查看唇纹、睫毛与毛孔细节
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
