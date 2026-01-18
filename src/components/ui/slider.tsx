import React from 'react';
import { cn } from '../../lib/utils';

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    valueDisplay?: React.ReactNode;
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
    ({ className, label, valueDisplay, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-2 w-full">
                <div className="flex justify-between items-center">
                    {label && <label className="text-sm font-medium text-foreground">{label}</label>}
                    {valueDisplay && <span className="text-xs text-muted-foreground">{valueDisplay}</span>}
                </div>
                <input
                    type="range"
                    className={cn(
                        "w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
            </div>
        );
    }
);
Slider.displayName = 'Slider';
