'use client';

import { createContext, forwardRef, useCallback, useContext, useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/* ------------------------------------------------------------------ */
/*  Context                                                           */
/* ------------------------------------------------------------------ */

interface RadioCardCtx {
  name: string;
  value: string | undefined;
  onValueChange: (value: string) => void;
}

const Ctx = createContext<RadioCardCtx | null>(null);

function useRadioCardCtx() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('RadioCardItem must be used within RadioCardGroup');
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  RadioCardGroup                                                    */
/* ------------------------------------------------------------------ */

export interface RadioCardGroupProps {
  value?: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export const RadioCardGroup = forwardRef<HTMLDivElement, RadioCardGroupProps>(
  ({ value, onValueChange, children, className }, ref) => {
    const name = useId();
    return (
      <Ctx.Provider value={{ name, value, onValueChange }}>
        <div ref={ref} role="radiogroup" className={cn('flex gap-3', className)}>
          {children}
        </div>
      </Ctx.Provider>
    );
  },
);
RadioCardGroup.displayName = 'RadioCardGroup';

/* ------------------------------------------------------------------ */
/*  RadioCardItem                                                     */
/* ------------------------------------------------------------------ */

export interface RadioCardItemProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export const RadioCardItem = forwardRef<HTMLLabelElement, RadioCardItemProps>(
  ({ value, children, className }, ref) => {
    const { name, value: selected, onValueChange } = useRadioCardCtx();
    const isSelected = selected === value;

    const handleChange = useCallback(() => {
      onValueChange(value);
    }, [onValueChange, value]);

    return (
      <label
        ref={ref}
        className={cn(
          'cursor-pointer rounded-md border p-card-padding transition-colors',
          isSelected ? 'bg-accent/5 border-accent' : 'border-default hover:border-strong',
          className,
        )}
      >
        <input
          type="radio"
          name={name}
          value={value}
          checked={isSelected}
          onChange={handleChange}
          className="sr-only"
        />
        {children}
      </label>
    );
  },
);
RadioCardItem.displayName = 'RadioCardItem';
