
import React, { useEffect, useRef } from 'react';
import { AudioVisualizerProps } from '../types';

const Visualizer: React.FC<AudioVisualizerProps> = ({ analyser, isActive, accentColor = '#06b6d4' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const bufferLength = analyser ? analyser.frequencyBinCount : 0;
    const dataArray = analyser ? new Uint8Array(bufferLength) : new Uint8Array(0);

    const draw = () => {
      animationId = requestAnimationFrame(draw);

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = Math.min(width, height) * 0.4;
      const time = Date.now() / 1000;

      ctx.clearRect(0, 0, width, height);

      // 1. Atmosphere (Deep Background Glow)
      const atmosGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * 2);
      atmosGradient.addColorStop(0, isActive ? 'rgba(6, 182, 212, 0.08)' : 'rgba(0,0,0,0)');
      atmosGradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = atmosGradient;
      ctx.fillRect(0, 0, width, height);

      // 2. Nebula Shells (Holographic layers)
      const drawNebulaLayer = (rMult: number, opacity: number, color1: string, color2: string, speed: number) => {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const pulse = 1 + Math.sin(time * speed) * 0.05;
        const grad = ctx.createRadialGradient(
          centerX + Math.cos(time * 0.5) * 15, 
          centerY + Math.sin(time * 0.3) * 15, 
          0, 
          centerX, 
          centerY, 
          baseRadius * rMult * pulse
        );
        grad.addColorStop(0, color1);
        grad.addColorStop(0.5, color2);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * rMult * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      if (isActive) {
        // Cyan Nebula
        drawNebulaLayer(0.7, 0.6, 'rgba(6, 182, 212, 0.5)', 'rgba(30, 58, 138, 0.3)', 1.2);
        // Orange Energy
        drawNebulaLayer(0.4, 0.4, 'rgba(245, 158, 11, 0.4)', 'rgba(251, 191, 36, 0.1)', 2.1);
      }

      // 3. The Core (Exact bright center from the image)
      const corePulse = isActive ? 1 + Math.sin(time * 4) * 0.02 : 1;
      const coreGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * 0.25 * corePulse);
      
      if (isActive) {
        coreGrad.addColorStop(0, '#ffffff'); // Pure White center
        coreGrad.addColorStop(0.3, '#fde68a'); // Bright Yellow
        coreGrad.addColorStop(0.6, '#f59e0b'); // Orange
        coreGrad.addColorStop(1, 'transparent');
      } else {
        coreGrad.addColorStop(0, '#1e293b');
        coreGrad.addColorStop(1, 'transparent');
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 0.3 * corePulse, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.shadowBlur = isActive ? 30 : 0;
      ctx.shadowColor = '#f59e0b';
      ctx.fill();
      ctx.restore();

      // 4. Rotating Tech Shells (Subtle lines)
      if (isActive) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = '#06b6d4';
        
        // Outer Dash Ring
        ctx.save();
        ctx.rotate(time * 0.2);
        ctx.beginPath();
        ctx.arc(0, 0, baseRadius * 0.9, 0, Math.PI * 2);
        ctx.setLineDash([2, 20]);
        ctx.stroke();
        ctx.restore();

        // Inner solid-ish ring
        ctx.save();
        ctx.rotate(-time * 0.1);
        ctx.beginPath();
        ctx.arc(0, 0, baseRadius * 0.75, 0, Math.PI * 2);
        ctx.setLineDash([40, 100]);
        ctx.stroke();
        ctx.restore();
        ctx.restore();
      }

      // 5. THE SIGNATURE HORIZONTAL WAVEFORM
      if (isActive && analyser) {
        analyser.getByteFrequencyData(dataArray);
        
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        
        // Neon Blue Line
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(103, 232, 249, 0.95)'; // Very bright cyan
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#22d3ee';

        const sliceWidth = (baseRadius * 1.8) / bufferLength;
        let x = centerX - baseRadius * 0.9;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const yOffset = (v - 1.0) * baseRadius * 0.45;
          const edgeFade = Math.sin((i / bufferLength) * Math.PI);
          const y = centerY + (yOffset * edgeFade);

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();
        
        // Inner white highlight for the wave
        x = centerX - baseRadius * 0.9;
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#ffffff';
        ctx.globalAlpha = 0.5;
        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const yOffset = (v - 1.0) * baseRadius * 0.45;
            const edgeFade = Math.sin((i / bufferLength) * Math.PI);
            const y = centerY + (yOffset * edgeFade);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            x += sliceWidth;
        }
        ctx.stroke();
        
        ctx.restore();
      } else if (isActive) {
        // Dormant flat line
        ctx.beginPath();
        ctx.moveTo(centerX - baseRadius * 0.8, centerY);
        ctx.lineTo(centerX + baseRadius * 0.8, centerY);
        ctx.strokeStyle = 'rgba(103, 232, 249, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyser, isActive]);

  return (
    <div className="relative flex items-center justify-center w-full h-full">
        <canvas
            ref={canvasRef}
            width={1200}
            height={1200}
            className="w-full h-full max-w-[900px] max-h-[900px] z-10"
        />
    </div>
  );
};

export default Visualizer;
