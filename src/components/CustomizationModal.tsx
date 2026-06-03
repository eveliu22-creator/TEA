import React, { useState, useEffect } from 'react';
import { Drink, CartItem, AddOnOption, ADD_ONS, ICE_LEVELS, SWEETNESS_LEVELS } from '../types';
import { X, Minus, Plus, ShoppingBag, MessageSquare } from 'lucide-react';

interface CustomizationModalProps {
  drink: Drink;
  onClose: () => void;
  onAddToCart: (item: Omit<CartItem, 'id'>) => void;
}

export const CustomizationModal: React.FC<CustomizationModalProps> = ({ drink, onClose, onAddToCart }) => {
  const [size, setSize] = useState<'M' | 'L'>(drink.hasSizeM ? 'M' : 'L');
  const [ice, setIce] = useState<string>('微冰');
  const [sweetness, setSweetness] = useState<string>('半糖');
  const [selectedAddOns, setSelectedAddOns] = useState<AddOnOption[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  // Auto set size if only one size is available
  useEffect(() => {
    if (!drink.hasSizeM && drink.hasSizeL) {
      setSize('L');
    } else if (drink.hasSizeM && !drink.hasSizeL) {
      setSize('M');
    }
  }, [drink]);

  // Handle add-on toggle
  const toggleAddOn = (addon: AddOnOption) => {
    if (selectedAddOns.some(a => a.name === addon.name)) {
      setSelectedAddOns(selectedAddOns.filter(a => a.name !== addon.name));
    } else {
      setSelectedAddOns([...selectedAddOns, addon]);
    }
  };

  // Calculate prices
  const basePrice = (size === 'L' && drink.priceLarge) ? drink.priceLarge : drink.price;
  const addonsPrice = selectedAddOns.reduce((sum, item) => sum + item.price, 0);
  const unitPrice = basePrice + addonsPrice;
  const totalPrice = unitPrice * quantity;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddToCart({
      drink,
      name: drink.name,
      size,
      ice,
      sweetness,
      addOns: selectedAddOns,
      quantity,
      notes: notes.trim(),
      unitPrice,
      totalPrice
    });
    onClose();
  };

  return (
    <div 
      id="customization-modal-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
      onClick={onClose}
    >
      <div 
        id="customization-modal-container"
        className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start p-5 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{drink.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{drink.description}</p>
          </div>
          <button 
            id="close-customization-modal"
            type="button"
            className="p-1 rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-150 transition-colors"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Size Choice */}
          {drink.hasSizeM && drink.hasSizeL && (
            <div className="space-y-2.5">
              <label className="text-sm font-semibold text-slate-700 flex justify-between">
                <span>選擇容量 Size</span>
                <span className="text-xs text-slate-400 font-normal">必選</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  id="size-m-btn"
                  type="button"
                  className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all ${
                    size === 'M'
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 font-semibold shadow-xs'
                      : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
                  }`}
                  onClick={() => setSize('M')}
                >
                  <span className="text-sm">中杯 M</span>
                  <span className="text-sm font-bold">${drink.price}</span>
                </button>
                <button
                  id="size-l-btn"
                  type="button"
                  className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all ${
                    size === 'L'
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 font-semibold shadow-xs'
                      : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
                  }`}
                  onClick={() => setSize('L')}
                >
                  <span className="text-sm">大杯 L</span>
                  <span className="text-sm font-bold">${drink.priceLarge || drink.price}</span>
                </button>
              </div>
            </div>
          )}

          {/* Ice Choice */}
          <div className="space-y-2.5">
            <label className="text-sm font-semibold text-slate-700 flex justify-between">
              <span>冰量選擇 Ice</span>
              <span className="text-xs text-emerald-600 font-normal">固定或自選</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {ICE_LEVELS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`px-4 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                    ice === option.value
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                      : 'bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100 hover:border-slate-200'
                  }`}
                  onClick={() => setIce(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sweetness Choice */}
          <div className="space-y-2.5">
            <label className="text-sm font-semibold text-slate-700 flex justify-between">
              <span>甜度選擇 Sweetness</span>
              <span className="text-xs text-emerald-600 font-normal">自選</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SWEETNESS_LEVELS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`px-3.5 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                    sweetness === option.value
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                      : 'bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100 hover:border-slate-200'
                  }`}
                  onClick={() => setSweetness(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Toppings Choice */}
          <div className="space-y-2.5">
            <label className="text-sm font-semibold text-slate-700 flex justify-between">
              <span>加料配配 Toppings</span>
              <span className="text-xs text-slate-400 font-normal">可複選</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {ADD_ONS.map((addon) => {
                const isSelected = selectedAddOns.some(a => a.name === addon.name);
                return (
                  <button
                    key={addon.name}
                    type="button"
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/30 text-emerald-700 font-semibold'
                        : 'border-slate-100 bg-slate-50/50 text-slate-650 hover:bg-slate-50 hover:border-slate-200'
                    }`}
                    onClick={() => toggleAddOn(addon)}
                  >
                    <span className="text-xs mb-0.5">{addon.name}</span>
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-amber-600">
                      +${addon.price}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes Option */}
          <div className="space-y-2.5">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <MessageSquare size={14} className="text-slate-400" />
              <span>備註/特殊客製化需求 Notes</span>
            </label>
            <input
              type="text"
              className="w-full text-slate-800 text-sm px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              placeholder="e.g. 珍珠軟一點、茶濃一點..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </form>

        {/* Footer (Interactive Add to Bag) */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
          {/* Quantity Selector */}
          <div className="flex items-center gap-4 bg-white px-3 py-2 border border-slate-200 shadow-sm rounded-full">
            <button
              type="button"
              className="w-7 h-7 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-40"
              disabled={quantity <= 1}
              onClick={() => setQuantity(quantity - 1)}
            >
              <Minus size={14} />
            </button>
            <span className="font-mono text-base font-bold text-slate-850 min-w-[20px] text-center">
              {quantity}
            </span>
            <button
              type="button"
              className="w-7 h-7 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Add to Cart button */}
          <button
            id="add-to-cart-submit-btn"
            type="submit"
            onClick={handleSubmit}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-lg shadow-emerald-500/10 active:scale-98 transition-all"
          >
            <ShoppingBag size={18} />
            <span>加入購物袋 ‧ ${totalPrice}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
