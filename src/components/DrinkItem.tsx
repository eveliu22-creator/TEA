import React from 'react';
import { Drink } from '../types';
import { Plus, Flame, Sparkles } from 'lucide-react';

interface DrinkItemProps {
  drink: Drink;
  onSelect: (drink: Drink) => void;
}

export const DrinkItem: React.FC<DrinkItemProps> = ({ drink, onSelect }) => {
  return (
    <div 
      id={`drink-card-${drink.id}`}
      className={`relative flex flex-col justify-between bg-white rounded-2xl border-2 p-5 transition-all duration-300 ${
        drink.isAvailable 
          ? 'border-emerald-50 hover:border-emerald-500/30 hover:shadow-lg shadow-emerald-950/5 cursor-pointer group' 
          : 'border-slate-100 bg-slate-50/50 opacity-60'
      }`}
      onClick={() => drink.isAvailable && onSelect(drink)}
    >
      <div>
        {/* Tags */}
        {drink.tags && drink.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {drink.tags.map((tag, i) => (
              <span 
                key={i} 
                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  tag === '招牌' || tag === '推薦'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                }`}
              >
                {tag === '招牌' && <Flame size={10} className="text-amber-600 animate-pulse" />}
                {tag === '推薦' && <Sparkles size={10} className="text-amber-600" />}
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex justify-between items-start gap-2 mb-1.5">
          <h3 className="font-sans font-semibold text-lg text-slate-800 group-hover:text-emerald-700 transition-colors">
            {drink.name}
          </h3>
          <span className="font-mono text-lg font-bold text-slate-800 whitespace-nowrap">
            ${drink.price}{drink.priceLarge ? `+` : ''}
          </span>
        </div>

        <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px] leading-relaxed">
          {drink.description}
        </p>
      </div>

      <div className="mt-4 flex justify-between items-center pt-3 border-t border-slate-50">
        <div className="text-xs text-slate-400 font-medium">
          {drink.hasSizeM && '中杯 (M)'}
          {drink.hasSizeM && drink.hasSizeL && ' / '}
          {drink.hasSizeL && '大杯 (L)'}
        </div>

        {drink.isAvailable ? (
          <button 
            id={`add-btn-${drink.id}`}
            type="button"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-500/10 hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(drink);
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        ) : (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-400">
            已售完
          </span>
        )}
      </div>
    </div>
  );
};
