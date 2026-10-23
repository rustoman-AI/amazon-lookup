import React from 'react';
import type { AnalyzedItem } from '../types';
import { ChevronRight } from 'lucide-react';
import { bboxToCssPercentage } from '../../tv-bbox-navigator/src/index';

interface BoundingBoxOverlayProps {
  items: AnalyzedItem[];
  focusedIndex: number;
  onSelectItem: (index: number) => void;
}

export const BoundingBoxOverlay: React.FC<BoundingBoxOverlayProps> = ({
  items,
  focusedIndex,
  onSelectItem,
}) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="absolute inset-0 z-10 pointer-events-none select-none">
      {items.map((item, index) => {
        const isFocused = index === focusedIndex;

        // Converted using open-source tv-bbox-navigator engine:
        const cssLayout = bboxToCssPercentage(item);

        return (
          <div
            key={item.id}
            onClick={() => onSelectItem(index)}
            // Silk Browser spatial cursor: hovering a box focuses it immediately.
            onMouseEnter={() => onSelectItem(index)}
            style={{
              left: cssLayout.left,
              top: cssLayout.top,
              width: cssLayout.width,
              height: cssLayout.height,
            }}
            className={`absolute pointer-events-auto cursor-pointer transition-all duration-300 rounded-lg ${
              isFocused
                ? 'z-30 ring-4 ring-[#FFA41C] bg-amber-500/15 tv-focused-glow border border-white/60'
                : 'z-20 border-2 border-dashed border-cyan-400/50 bg-black/25 hover:border-cyan-300 hover:bg-cyan-950/20'
            }`}
          >
            {/* 4 Corner Geometric Target Brackets */}
            <div className={`absolute -top-1 -left-1 w-3.5 h-3.5 border-t-2 border-l-2 ${isFocused ? 'border-amber-300' : 'border-cyan-400'}`} />
            <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 border-t-2 border-r-2 ${isFocused ? 'border-amber-300' : 'border-cyan-400'}`} />
            <div className={`absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-2 border-l-2 ${isFocused ? 'border-amber-300' : 'border-cyan-400'}`} />
            <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-2 border-r-2 ${isFocused ? 'border-amber-300' : 'border-cyan-400'}`} />

            {/* Floating Price Tag Pill: positioned inside top-left when y_min < 100 to avoid clipping */}
            <div
              className={`absolute ${
                item.y_min < 100 ? 'top-3 left-3' : '-top-9 left-0'
              } transform transition-transform duration-300 ${
                isFocused ? 'scale-105 animate-float-pill' : 'scale-95 opacity-85'
              }`}
            >
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-2xl backdrop-blur-xl border ${
                  isFocused
                    ? 'bg-[#131921]/95 border-[#FFA41C] text-white shadow-[0_4px_25px_rgba(255,164,28,0.5)]'
                    : 'bg-[#0c0f17]/90 border-cyan-500/40 text-cyan-200'
                }`}
              >
                {/* D-Pad index */}
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                    isFocused
                      ? 'bg-[#FFA41C] text-black shadow-[0_0_10px_#FFA41C]'
                      : 'bg-cyan-950 text-cyan-400 border border-cyan-700'
                  }`}
                >
                  {index + 1}
                </div>

                <div className="flex flex-col leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold tracking-tight text-white line-clamp-1 max-w-[190px]">
                      {item.displayLabel}
                    </span>
                    {isFocused && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/30 text-[#FFA41C] text-[9px] font-mono uppercase tracking-wider font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="font-extrabold text-amber-400">
                      {item.exactMatch.estimatedPrice}
                    </span>
                    <span className="text-gray-400 text-[10px]">|</span>
                    <span className="text-cyan-300 text-[10px]">
                      Alt: {item.budgetAlternative.estimatedPrice}
                    </span>
                  </div>
                </div>

                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isFocused ? 'text-[#FFA41C] translate-x-0.5' : 'text-gray-500'}`} />
              </div>
            </div>

            {/* Confidence pill for living room display */}
            <div className="absolute -bottom-7 right-0">
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded shadow-lg backdrop-blur-md border ${
                  isFocused
                    ? 'bg-amber-950/90 text-amber-200 border-amber-500/40'
                    : 'bg-black/80 text-gray-400 border-white/10'
                }`}
              >
                {Math.round(item.confidence * 100)}% match
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
