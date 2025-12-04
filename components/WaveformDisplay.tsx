import React, { useEffect, useRef } from 'react';

interface WaveformDisplayProps {
  audioBuffer: AudioBuffer | null;
  isPlaying: boolean;
  currentTime: number; // Normalized 0-1 represents playback progress
}

const WaveformDisplay: React.FC<WaveformDisplayProps> = ({ audioBuffer, isPlaying, currentTime }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear canvas
    ctx.fillStyle = '#f8fafc'; // Slate-50
    ctx.fillRect(0, 0, width, height);

    // Draw Grid (ECG/PCG style)
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Vertical grid lines
    for (let x = 0; x <= width; x += 40) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    // Horizontal grid lines
    for (let y = 0; y <= height; y += 40) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    if (!audioBuffer) {
      // Draw flatline
      ctx.strokeStyle = '#0ea5e9'; // medical-500
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      return;
    }

    // Draw Waveform
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#0284c7'; // medical-600
    ctx.beginPath();

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      
      // Downsampling for visualization (Get peaks)
      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      
      // Convert to y coordinates
      const yMin = (1 + min) * amp;
      const yMax = (1 + max) * amp;
      
      // Note: canvas y increases downwards. 
      // y=height/2 is zero crossing. 
      // We draw a vertical line representing the range at this pixel
      ctx.moveTo(i, (height / 2) - (max * amp * 0.9)); // Scale slightly
      ctx.lineTo(i, (height / 2) - (min * amp * 0.9));
    }
    
    ctx.stroke();

    // Draw Playhead
    if (isPlaying || currentTime > 0) {
        const xPos = currentTime * width; // currentTime is 0-1
        ctx.strokeStyle = '#ef4444'; // Red playhead
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(xPos, 0);
        ctx.lineTo(xPos, height);
        ctx.stroke();
    }

  }, [audioBuffer, currentTime, isPlaying]);

  return (
    <div className="relative w-full h-64 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden shadow-inner">
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute top-2 left-2 text-xs font-mono text-slate-400">
        GAIN: 40x | FILTER: 20-500Hz | V: 10mm/mV
      </div>
    </div>
  );
};

export default WaveformDisplay;