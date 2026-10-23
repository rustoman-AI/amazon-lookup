import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Sparkles,
  ShoppingBag,
  Mic,
  Star,
  Check,
  ShieldCheck,
  Zap,
  Watch,
  Glasses,
  Shirt,
  Headphones,
  Footprints,
  Briefcase,
  Package,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react';
import type { AnalyzedItem, CardSelection } from '../types';

/**
 * Map a detection label/category to a clean vector icon so product cards show
 * an accurate category glyph (Watch, Sunglasses, Jacket, Tech, …) instead of a
 * mismatched stock photo.
 */
function categoryIcon(label: string): LucideIcon {
  const key = label.toLowerCase();
  if (key.includes('watch')) return Watch;
  if (key.includes('sunglass') || key.includes('glass') || key.includes('eyewear')) return Glasses;
  if (key.includes('jacket') || key.includes('cloth') || key.includes('shirt') || key.includes('bomber'))
    return Shirt;
  if (key.includes('headphone') || key.includes('earbud') || key.includes('audio')) return Headphones;
  if (key.includes('shoe') || key.includes('sneaker') || key.includes('boot') || key.includes('foot'))
    return Footprints;
  if (key.includes('bag') || key.includes('backpack') || key.includes('accessory')) return Briefcase;
  return Package;
}

/** A styled square tile rendering the category icon in place of a photo thumbnail. */
function CategoryThumb({ label, accent }: { label: string; accent: 'exact' | 'budget' }) {
  const Icon = categoryIcon(label);
  const ring =
    accent === 'exact'
      ? 'from-amber-500/25 to-amber-400/5 border-amber-400/40 text-[#FFA41C]'
      : 'from-cyan-500/25 to-cyan-400/5 border-cyan-400/40 text-cyan-300';
  return (
    <div
      className={`w-12 h-12 rounded-lg border bg-gradient-to-br ${ring} flex items-center justify-center flex-shrink-0 shadow-inner`}
      aria-hidden="true"
    >
      <Icon className="w-6 h-6" strokeWidth={1.75} />
    </div>
  );
}

interface InferenceSource {
  label: string;
  isLive: boolean;
  latencyMs: number;
}

interface XRayCommerceDrawerProps {
  item: AnalyzedItem;
  itemIndex: number;
  totalItems: number;
  cardSelection: CardSelection;
  onSelectCard: (card: CardSelection) => void;
  onSelectTier?: (tier: CardSelection) => void;
  onTriggerAlexaVoice: () => void;
  onClose: () => void;
  inferenceSource?: InferenceSource | null;
}

export const XRayCommerceDrawer: React.FC<XRayCommerceDrawerProps> = ({
  item,
  itemIndex,
  totalItems,
  cardSelection,
  onSelectCard,
  onSelectTier: propOnSelectTier,
  onTriggerAlexaVoice,
  onClose,
  // inferenceSource intentionally unused: the LIVE badge now lives only in the
  // top-center pill (App.tsx) to save vertical space in the compact drawer.
}) => {
  const isExactSelected = cardSelection === 'exact';
  const activeProduct = isExactSelected ? item.exactMatch : item.budgetAlternative;
  const qrUrl = activeProduct.asin
    ? `https://www.amazon.com/dp/${activeProduct.asin}`
    : activeProduct.amazonUrl;

  const onSelectTier = (tier: CardSelection) => {
    if (propOnSelectTier) propOnSelectTier(tier);
    if (onSelectCard) onSelectCard(tier);
  };

  return (
    <aside 
      aria-label="Amazon X-Ray Commerce Drawer"
      className="absolute top-0 right-0 bottom-0 w-80 max-w-[92vw] z-40 bg-[#0c0f17]/95 backdrop-blur-2xl border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col text-gray-100 transition-all duration-300 select-none overflow-hidden"
    >
      {/* Compact header with Amazon LookUp X-Ray branding */}
      <div className="p-3 border-b border-white/10 bg-[#131921]/90 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-black tracking-wider text-xs text-[#FF9900] flex items-center gap-1.5 min-w-0">
            <span className="text-white text-[10px] px-1.5 py-0.5 rounded bg-black/60 font-mono">LOOKUP</span>
            <span className="truncate">X-RAY COMMERCE</span>
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-mono">
              {itemIndex + 1}/{totalItems}
            </span>
            <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">
              {Math.round(item.confidence * 100)}%
            </span>
          </div>
        </div>

        {/* Item Display Label & AI Tag */}
        <div>
          <h2 className="text-base font-black text-white tracking-tight leading-tight line-clamp-1">
            {item.displayLabel}
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-gray-300 font-medium bg-white/5 px-1.5 py-0.5 rounded capitalize">
              {item.category.replace('_', ' ')}
            </span>
            <span className="text-[10px] text-cyan-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              AWS Bedrock Vision
            </span>
          </div>
        </div>
        {/* Note: the "LIVE AWS BEDROCK" source badge lives in the top-center pill
            (App.tsx); omitted here to save vertical space on 540px screens. */}
      </div>

      {/* D-Pad Nav Tip (compact single line) */}
      <div className="px-3 py-1 bg-gradient-to-r from-amber-500/10 via-cyan-500/10 to-transparent border-b border-white/5 flex items-center justify-between text-[10px] text-amber-300">
        <span className="flex items-center gap-1 font-medium">
          <span className="px-1 py-0.5 rounded bg-amber-400/20 text-[#FFA41C] font-mono font-bold">▲/▼</span>
          Exact vs Budget
        </span>
        <span className="font-mono text-cyan-300 text-[10px]">
          [ENTER] Cart
        </span>
      </div>

      {/* Comparison Cards Container (compact, no-scroll target on 540px) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0">
        {/* CARD 1: EXACT MATCH (compact) */}
        <div
          onClick={() => onSelectTier('exact')}
          onMouseEnter={() => onSelectTier('exact')}
          className={`relative p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
            isExactSelected
              ? 'bg-[#151c27] border-[#FFA41C] shadow-[0_0_20px_rgba(255,164,28,0.3)] ring-1 ring-amber-400/30'
              : 'bg-[#0f141f]/70 border-white/10 hover:border-white/30 opacity-80'
          }`}
        >
          {/* Top selection badge */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
              <Check className="w-3 h-3 text-[#FFA41C]" />
              Exact Match
            </span>
            {isExactSelected && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-400 text-black font-extrabold uppercase">
                ACTIVE [▲]
              </span>
            )}
          </div>

          <div className="flex gap-2.5">
            <CategoryThumb label={item.category || item.label} accent="exact" />
            <div className="flex-1 min-w-0">
              {item.exactMatch.brand && (
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {item.exactMatch.brand}
                </div>
              )}
              <h3 className="text-xs font-semibold text-white line-clamp-2 leading-snug mt-0.5">
                {item.exactMatch.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-black text-white">
                  {item.exactMatch.estimatedPrice}
                </span>
                <span className="flex items-center gap-1 text-amber-400 text-[10px]">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span className="font-bold">{item.exactMatch.rating || 4.8}</span>
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#00A8E1]/20 text-[#00A8E1] font-black text-[10px]">prime</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: BUDGET ALTERNATIVE ("GET THE LOOK FOR LESS") — compact */}
        <div
          onClick={() => onSelectTier('budget')}
          onMouseEnter={() => onSelectTier('budget')}
          className={`relative p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
            !isExactSelected
              ? 'bg-[#151c27] border-cyan-400 shadow-[0_0_20px_rgba(0,202,255,0.3)] ring-1 ring-cyan-400/30'
              : 'bg-[#0f141f]/70 border-white/10 hover:border-white/30 opacity-80'
          }`}
        >
          {/* Top selection badge */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase tracking-wider">
              <Zap className="w-3 h-3 text-cyan-400" />
              Budget "Get The Look"
            </span>
            {!isExactSelected && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-400 text-black font-extrabold uppercase">
                ACTIVE [▼]
              </span>
            )}
          </div>

          <div className="flex gap-2.5">
            <CategoryThumb label={item.category || item.label} accent="budget" />
            <div className="flex-1 min-w-0">
              {item.budgetAlternative.brand && (
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {item.budgetAlternative.brand}
                </div>
              )}
              <h3 className="text-xs font-semibold text-white line-clamp-2 leading-snug mt-0.5">
                {item.budgetAlternative.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-black text-cyan-400">
                  {item.budgetAlternative.estimatedPrice}
                </span>
                <span className="flex items-center gap-1 text-amber-400 text-[10px]">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span className="font-bold">{item.budgetAlternative.rating || 4.6}</span>
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#00A8E1]/20 text-[#00A8E1] font-black text-[10px]">prime</span>
              </div>
            </div>
          </div>
        </div>

        {/* INSTANT SCAN-TO-BUY QR CODE SECTION (compact; click opens Amazon) */}
        <div 
          onClick={() => window.open(activeProduct.amazonUrl || qrUrl, '_blank', 'noopener,noreferrer')}
          className="p-2.5 rounded-xl bg-gradient-to-br from-black/80 to-[#121824] border border-white/10 flex items-center gap-3 cursor-pointer hover:border-amber-400/50 hover:bg-[#161f2e] transition-all group/qr shadow-lg"
          title="Open Amazon search results in a new tab"
        >
          <div className="p-1.5 rounded-lg bg-white flex-shrink-0 shadow-xl group-hover/qr:scale-105 transition-transform">
            <QRCodeSVG
              value={qrUrl}
              size={64}
              bgColor="#ffffff"
              fgColor="#131921"
              level="M"
              includeMargin={false}
            />
          </div>

          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#FFA41C]">
              <ShoppingBag className="w-3 h-3" />
              <span>Scan or Click to Buy</span>
            </div>
            <p className="text-[10px] text-gray-300 leading-snug mt-0.5">
              Point phone camera or tap to open on Amazon.
            </p>
            {/* Dedicated open-on-Amazon action (the only other window.open entry point). */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(activeProduct.amazonUrl || qrUrl, '_blank', 'noopener,noreferrer');
              }}
              className="mt-1.5 inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-lg bg-[#FF9900] hover:bg-[#FFA41C] text-black text-[10px] font-bold transition-colors"
            >
              <span>Open on Amazon</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar for Fire TV Remote (compact) */}
      <div className="p-2.5 border-t border-white/10 bg-[#0d121b] flex flex-col gap-1.5">
        {/* Interactive Alexa Voice Action Button */}
        <button
          onClick={onTriggerAlexaVoice}
          className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-[#00A8E1] to-[#00CAFF] hover:from-[#0092c4] hover:to-[#00b9e8] text-black font-extrabold text-[11px] shadow-[0_0_20px_rgba(0,202,255,0.4)] transition-all flex items-center justify-center gap-1.5 group active:scale-[0.98]"
        >
          <Mic className="w-3.5 h-3.5 text-black group-hover:scale-110 transition-transform" />
          <span>"Alexa, add this to my cart"</span>
        </button>

        {/* Secondary Info */}
        <div className="flex items-center justify-between text-gray-400 px-0.5">
          <span className="flex items-center gap-1 text-[10px]">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            A-to-z Guarantee
          </span>
          <button
            onClick={onClose}
            className="hover:text-white transition-colors underline font-mono text-[10px]"
          >
            [BACK] Resume
          </button>
        </div>
      </div>
    </aside>
  );
};
