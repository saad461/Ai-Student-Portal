'use client';

import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface CaptchaProps {
  onVerify: (isValid: boolean) => void;
}

export interface CaptchaHandle {
  reset: () => void;
  validate: (input: string) => boolean;
}

export const Captcha = forwardRef<CaptchaHandle, CaptchaProps>(({ onVerify }, ref) => {
  const [captchaText, setCaptchaText] = useState('');
  const [userInput, setUserInput] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    drawCaptcha(result);
    setUserInput('');
    onVerify(false);
  };

  const drawCaptcha = (text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add some noise (lines)
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255},0.3)`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Add some noise (dots)
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255},0.3)`;
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Text
    ctx.font = 'bold 30px serif';
    ctx.textBaseline = 'middle';

    // Apply blur effect
    ctx.filter = 'blur(1.5px)';

    const startX = 20;
    for (let i = 0; i < text.length; i++) {
      ctx.save();
      ctx.translate(startX + i * 25, canvas.height / 2);
      ctx.rotate((Math.random() - 0.5) * 0.4);
      ctx.fillStyle = `rgb(${Math.random() * 100},${Math.random() * 100},${Math.random() * 100})`;
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }

    // Reset filter
    ctx.filter = 'none';
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  useImperativeHandle(ref, () => ({
    reset: generateCaptcha,
    validate: (input: string) => {
      const isValid = input.toLowerCase() === captchaText.toLowerCase();
      onVerify(isValid);
      return isValid;
    }
  }));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <canvas
          ref={canvasRef}
          width={180}
          height={50}
          className="rounded border border-muted bg-muted shadow-inner pointer-events-none"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={generateCaptcha}
          className="h-10 w-10 shrink-0"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <Input
        placeholder="Enter characters shown above"
        value={userInput}
        onChange={(e) => {
          const val = e.target.value;
          setUserInput(val);
          const isV = val.toLowerCase() === captchaText.toLowerCase();
          onVerify(isV);
        }}
        className="text-center font-mono tracking-widest uppercase"
      />
    </div>
  );
});

Captcha.displayName = 'Captcha';
