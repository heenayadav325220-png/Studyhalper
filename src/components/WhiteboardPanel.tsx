import React, { useRef, useState, useEffect } from 'react';
import { Language, t } from '../services/translations';
import { Palette, Trash2, Square, Circle, Edit3, Sparkles } from 'lucide-react';
import { subscribeToWhiteboard, addWhiteboardElement, clearWhiteboardRoom } from '../services/firebaseDb';
import { WhiteboardElement } from '../types';

interface WhiteboardPanelProps {
  lang: Language;
  roomId: string;
  userId: string;
  onEarnXp: (amount: number) => void;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#f43f5e', '#ffffff'];
const SIZES = [2, 4, 8, 12];

export const WhiteboardPanel: React.FC<WhiteboardPanelProps> = ({
  lang,
  roomId,
  userId,
  onEarnXp
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [color, setColor] = useState('#6366f1');
  const [thickness, setThickness] = useState(4);
  const [tool, setTool] = useState<'path' | 'rect' | 'circle'>('path');
  const [elements, setElements] = useState<WhiteboardElement[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);

  // Subscribe to real-time whiteboard elements in Firebase
  useEffect(() => {
    const unsubscribe = subscribeToWhiteboard(roomId, (syncedElements) => {
      setElements(syncedElements);
    });
    return () => unsubscribe();
  }, [roomId]);

  // Handle Resize correctly following guidelines
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      canvas.width = container.clientWidth;
      canvas.height = 420;
      drawAll();
    };

    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [elements]);

  const drawAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear local canvas before redrawing all vectors
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    elements.forEach((el) => {
      try {
        const points = JSON.parse(el.points) as { x: number; y: number }[];
        if (points.length < 1) return;

        ctx.strokeStyle = el.color;
        ctx.lineWidth = el.thickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        if (el.type === 'path') {
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
          ctx.stroke();
        } else if (el.type === 'rect' && points.length >= 2) {
          const start = points[0];
          const end = points[points.length - 1];
          ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
        } else if (el.type === 'circle' && points.length >= 2) {
          const start = points[0];
          const end = points[points.length - 1];
          const r = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
          ctx.arc(start.x, start.y, r, 0, 2 * Math.PI);
          ctx.stroke();
        }
      } catch (err) {
        console.error(err);
      }
    });
  };

  // Trigger drawAll on elements update
  useEffect(() => {
    drawAll();
  }, [elements]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    setCurrentPoints([coords]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const coords = getCoordinates(e);
    if (!coords) return;

    setCurrentPoints((prev) => [...prev, coords]);

    // Draw temporary preview on local canvas
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    drawAll(); // Redraw static background first

    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    if (tool === 'path') {
      const allPoints = [...currentPoints, coords];
      ctx.moveTo(allPoints[0].x, allPoints[0].y);
      for (let i = 1; i < allPoints.length; i++) {
        ctx.lineTo(allPoints[i].x, allPoints[i].y);
      }
      ctx.stroke();
    } else if (tool === 'rect') {
      const start = currentPoints[0];
      ctx.strokeRect(start.x, start.y, coords.x - start.x, coords.y - start.y);
    } else if (tool === 'circle') {
      const start = currentPoints[0];
      const r = Math.sqrt(Math.pow(coords.x - start.x, 2) + Math.pow(coords.y - start.y, 2));
      ctx.arc(start.x, start.y, r, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  const stopDrawing = async () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentPoints.length > 0) {
      const newElement: Omit<WhiteboardElement, 'id'> = {
        roomId,
        type: tool,
        color,
        thickness,
        points: JSON.stringify(currentPoints),
        senderId: userId,
        timestamp: new Date().toISOString()
      };

      try {
        await addWhiteboardElement(roomId, newElement);
        onEarnXp(10); // Earn 10 XP for collaboration/drawing
      } catch (err) {
        console.error("Firebase save element error:", err);
      }
    }
    setCurrentPoints([]);
  };

  const handleClear = async () => {
    try {
      await clearWhiteboardRoom(roomId);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* Controls Header */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-400" />
            {t('whiteboard', lang)}
          </h3>
          <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-md font-mono">
            Room: {roomId}
          </span>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tools Toggle */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 gap-1">
            <button
              onClick={() => setTool('path')}
              className={`p-2 rounded-lg transition ${tool === 'path' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="Pencil"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTool('rect')}
              className={`p-2 rounded-lg transition ${tool === 'rect' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="Rectangle"
            >
              <Square className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTool('circle')}
              className={`p-2 rounded-lg transition ${tool === 'circle' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="Circle"
            >
              <Circle className="w-4 h-4" />
            </button>
          </div>

          {/* Colors */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-5 h-5 rounded-full border transition active:scale-90 ${color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* Thickness */}
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 font-mono">Brush</span>
            {SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setThickness(s)}
                className={`rounded-full transition font-mono text-xs flex items-center justify-center ${thickness === s ? 'text-indigo-400 font-bold scale-110' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Clear */}
          <button
            onClick={handleClear}
            className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            {t('clearCanvas', lang)}
          </button>
        </div>
      </div>

      {/* Drawing Stage Container */}
      <div ref={containerRef} className="relative w-full bg-[#0a0f1d] min-h-[420px]">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 cursor-crosshair touch-none"
        />

        {elements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="text-center">
              <Sparkles className="w-12 h-12 text-indigo-400 mx-auto mb-2 animate-pulse" />
              <p className="text-xs font-mono text-slate-400">
                {lang === 'en' ? 'Start drawing or collaborating!' : 'चित्र बनाना या सहयोग करना शुरू करें!'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
