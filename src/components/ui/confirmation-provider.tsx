'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ConfirmationOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

interface PromptOptions extends ConfirmationOptions {
  defaultValue?: string;
  placeholder?: string;
}

export interface ConfirmationContextType {
  confirm: (options: string | ConfirmationOptions) => Promise<boolean>;
  prompt: (options: string | PromptOptions) => Promise<string | null>;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export function useConfirmation() {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
}

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText: string;
    cancelText: string;
    variant: 'default' | 'destructive';
    resolve: (value: boolean) => void;
  } | null>(null);

  const [promptState, setPromptState] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText: string;
    cancelText: string;
    defaultValue: string;
    placeholder: string;
    resolve: (value: string | null) => void;
  } | null>(null);

  const [promptValue, setPromptValue] = useState('');

  const confirm = useCallback((options: string | ConfirmationOptions) => {
    return new Promise<boolean>((resolve) => {
      const config: ConfirmationOptions = typeof options === 'string' ? { description: options } : options;
      setConfirmState({
        open: true,
        title: config.title || 'Are you sure?',
        description: config.description || '',
        confirmText: config.confirmText || 'Confirm',
        cancelText: config.cancelText || 'Cancel',
        variant: config.variant || 'default',
        resolve,
      });
    });
  }, []);

  const prompt = useCallback((options: string | PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      const config: PromptOptions = typeof options === 'string' ? { title: options } : options;
      const initialValue = config.defaultValue || '';
      setPromptValue(initialValue);
      setPromptState({
        open: true,
        title: config.title || 'Input required',
        description: config.description || '',
        confirmText: config.confirmText || 'OK',
        cancelText: config.cancelText || 'Cancel',
        defaultValue: initialValue,
        placeholder: config.placeholder || '',
        resolve,
      });
    });
  }, []);

  const handleConfirmClose = (value: boolean) => {
    if (confirmState) {
      confirmState.resolve(value);
      setConfirmState(null);
    }
  };

  const handlePromptClose = (value: string | null) => {
    if (promptState) {
      promptState.resolve(value);
      setPromptState(null);
      setPromptValue('');
    }
  };

  return (
    <ConfirmationContext.Provider value={{ confirm, prompt }}>
      {children}

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmState?.open} onOpenChange={(open) => !open && handleConfirmClose(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmState?.title}</DialogTitle>
            {confirmState?.description && (
              <DialogDescription>{confirmState.description}</DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => handleConfirmClose(false)}>
              {confirmState?.cancelText}
            </Button>
            <Button
              variant={confirmState?.variant === 'destructive' ? 'destructive' : 'default'}
              onClick={() => handleConfirmClose(true)}
            >
              {confirmState?.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prompt Dialog */}
      <Dialog open={!!promptState?.open} onOpenChange={(open) => !open && handlePromptClose(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{promptState?.title}</DialogTitle>
            {promptState?.description && (
              <DialogDescription>{promptState.description}</DialogDescription>
            )}
          </DialogHeader>
          <div className="py-4">
            <Input
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              placeholder={promptState?.placeholder}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handlePromptClose(promptValue);
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handlePromptClose(null)}>
              {promptState?.cancelText}
            </Button>
            <Button onClick={() => handlePromptClose(promptValue)}>
              {promptState?.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmationContext.Provider>
  );
}
