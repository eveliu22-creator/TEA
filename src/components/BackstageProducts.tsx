import React, { useEffect, useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { Drink } from '../types';
import { CATEGORIES_LIST, INITIAL_DRINKS } from '../data';
import { Plus, Edit3, Trash2, Check, X, Tag, FileText, ToggleLeft, ToggleRight, Database } from 'lucide-react';

export const BackstageProducts: React.FC = () => {
  const [drinks, setDrinks] = useState<Drink[]>(INITIAL_DRINKS);
  const [isEditing, setIsEditing] = useState(false);
  const [editingDrink, setEditingDrink] = useState<Partial<Drink> | null>(null);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'drinks'), (snapshot) => {
      const fetchedDrinks: Drink[] = [];
      snapshot.forEach((doc) => {
        fetchedDrinks.push({ ...doc.data(), id: doc.id } as Drink);
      });
      if (fetchedDrinks.length > 0) {
        setDrinks(fetchedDrinks);
      } else {
        setDrinks(INITIAL_DRINKS);
      }
    }, (error) => {
      console.warn('Backstage Firestore query failed, using local product list:', error);
      setDrinks(INITIAL_DRINKS);
    });

    return () => unsubscribe();
  }, []);

  const handleSeedProducts = async () => {
    if (window.confirm('確定要將預設的精緻飲品組導入雲端資料庫嗎？')) {
      setSeeding(true);
      try {
        const seedPromises = INITIAL_DRINKS.map((drink) => {
          return setDoc(doc(db, 'drinks', drink.id), drink);
        });
        await Promise.all(seedPromises);
        alert('雲端資料庫初始化成功！');
      } catch (error) {
        alert('補種子失敗：' + (error instanceof Error ? error.message : String(error)));
      } finally {
        setSeeding(false);
      }
    }
  };

  const handleOpenAdd = () => {
    setEditingDrink({
      name: '',
      category: CATEGORIES_LIST[0] || '蜜果四季青',
      description: '',
      price: 50,
      priceLarge: undefined,
      isAvailable: true,
      tags: [],
      hasSizeM: true,
      hasSizeL: true
    });
    setIsEditing(true);
  };

  const handleOpenEdit = (drink: Drink) => {
    setEditingDrink({ ...drink });
    setIsEditing(true);
  };

  const handleToggleAvailable = async (drink: Drink) => {
    try {
      const drinkRef = doc(db, 'drinks', drink.id);
      await updateDoc(drinkRef, {
        isAvailable: !drink.isAvailable
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `drinks/${drink.id}`);
    }
  };

  const handleDeleteDrink = async (drinkId: string) => {
    if (!window.confirm('確定要刪除此茶飲商品嗎？此動作無法復原！')) return;
    try {
      const drinkRef = doc(db, 'drinks', drinkId);
      await deleteDoc(drinkRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `drinks/${drinkId}`);
    }
  };

  const handleSaveDrink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDrink || !editingDrink.name?.trim()) return;

    const finalPayload: Omit<Drink, 'id'> = {
      name: editingDrink.name.trim(),
      category: editingDrink.category || CATEGORIES_LIST[0],
      description: editingDrink.description?.trim() || '',
      price: Number(editingDrink.price || 0),
      priceLarge: editingDrink.priceLarge ? Number(editingDrink.priceLarge) : undefined,
      isAvailable: editingDrink.isAvailable ?? true,
      tags: editingDrink.tags || [],
      hasSizeM: editingDrink.hasSizeM ?? true,
      hasSizeL: editingDrink.hasSizeL ?? true,
    };

    try {
      if (editingDrink.id) {
        // Edit existing
        const drinkRef = doc(db, 'drinks', editingDrink.id);
        await updateDoc(drinkRef, { ...finalPayload });
      } else {
        // Create new
        const tempId = 'drink_' + Date.now();
        const docRef = await addDoc(collection(db, 'drinks'), {
          ...finalPayload,
          id: tempId
        });
        // Backfill ID to be equal to document ID or stay tempId
        await updateDoc(docRef, { id: docRef.id });
      }
      setIsEditing(false);
      setEditingDrink(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'drinks');
    }
  };

  // Tag helper
  const [tagInput, setTagInput] = useState('');
  const handleAddTag = () => {
    if (!tagInput.trim() || !editingDrink) return;
    const currentTags = editingDrink.tags || [];
    if (!currentTags.includes(tagInput.trim())) {
      setEditingDrink({
        ...editingDrink,
        tags: [...currentTags, tagInput.trim()]
      });
    }
    setTagInput('');
  };

  const handleRemoveTag = (indexToRemove: number) => {
    if (!editingDrink) return;
    const currentTags = editingDrink.tags || [];
    setEditingDrink({
      ...editingDrink,
      tags: currentTags.filter((_, idx) => idx !== indexToRemove)
    });
  };

  return (
    <div id="backstage-products-panel" className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-150">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">商品庫存管理 ({drinks.length} 款飲品)</h2>
          <p className="text-xs text-slate-400 mt-0.5">實時新增、刪除商品與調整價格及供應狀態</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="seed-defaults-btn"
            type="button"
            onClick={handleSeedProducts}
            disabled={seeding}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer transition disabled:opacity-50"
          >
            <Database size={13} />
            <span>{seeding ? '導入中...' : '匯入預設飲品 Seed Defaults'}</span>
          </button>
          <button
            id="add-new-drink-btn"
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg cursor-pointer transition shadow-sm"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>新增商品 Add Drink</span>
          </button>
        </div>
      </div>

      {/* Grid listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drinks.map((drink) => (
          <div 
            key={drink.id}
            id={`backstage-drink-${drink.id}`}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition duration-250"
          >
            <div>
              <div className="flex justify-between items-start gap-2 mb-3">
                <span className="text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-sm">
                  {drink.category}
                </span>
                
                {/* Available toggle action */}
                <button
                  type="button"
                  onClick={() => handleToggleAvailable(drink)}
                  className="flex items-center gap-1 text-xs font-semibold cursor-pointer transition focus:outline-none"
                  title="切換商品供應狀態"
                >
                  {drink.isAvailable ? (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <ToggleRight size={24} className="text-emerald-500" />
                      <span>現正供應</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-slate-400">
                      <ToggleLeft size={24} className="text-slate-405" />
                      <span>暫停供應</span>
                    </span>
                  )}
                </button>
              </div>

              <h3 className="font-bold text-base text-slate-800 mb-1 flex items-center justify-between">
                <span>{drink.name}</span>
                <span className="font-mono text-emerald-600 font-extrabold text-lg">
                  ${drink.price} {drink.priceLarge ? `/ $${drink.priceLarge}` : ''}
                </span>
              </h3>

              <p className="text-xs text-slate-400 min-h-[32px] line-clamp-2 leading-relaxed mb-3">
                {drink.description || '無描述。'}
              </p>

              {/* Tags panel */}
              {drink.tags && drink.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {drink.tags.map((tag, i) => (
                    <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-50 border border-slate-205 text-slate-600">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-4 text-xs">
              <span className="text-slate-400 font-medium">
                配備規格: {drink.hasSizeM ? 'M' : ''}{drink.hasSizeM && drink.hasSizeL ? '/' : ''}{drink.hasSizeL ? 'L' : ''}尺寸
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(drink)}
                  className="inline-flex items-center gap-1 text-slate-500 border border-slate-250 hover:bg-slate-50 px-2.5 py-1.5 rounded-md font-semibold cursor-pointer transition-colors"
                >
                  <Edit3 size={12} />
                  <span>編輯</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteDrink(drink.id)}
                  className="inline-flex items-center gap-1 text-rose-500 border border-rose-100 hover:bg-rose-50 px-2.5 py-1.5 rounded-md font-semibold cursor-pointer transition-colors"
                >
                  <Trash2 size={12} />
                  <span>刪除</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Editor Modal */}
      {isEditing && editingDrink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-800">
                {editingDrink.id ? '編輯飲品項目 Edit Beverage' : '新增飲品項目 Add Beverage'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-slate-450 p-1 hover:text-slate-650"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveDrink} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-medium text-slate-700">
              {/* Name */}
              <div className="space-y-1">
                <label className="font-semibold block text-slate-700">飲品名稱 *</label>
                <input
                  type="text"
                  required
                  className="w-full text-slate-800 text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded"
                  value={editingDrink.name || ''}
                  onChange={(e) => setEditingDrink({ ...editingDrink, name: e.target.value })}
                  placeholder="e.g. 露梅四季青..."
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="font-semibold block text-slate-700">所屬分類 Category *</label>
                <select
                  required
                  className="w-full text-slate-800 text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded"
                  value={editingDrink.category || ''}
                  onChange={(e) => setEditingDrink({ ...editingDrink, category: e.target.value })}
                >
                  {CATEGORIES_LIST.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Price Row */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-semibold block text-slate-700">中杯(M)或基礎價格 *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full text-slate-800 text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded"
                    value={editingDrink.price ?? 50}
                    onChange={(e) => setEditingDrink({ ...editingDrink, price: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold block text-slate-700">大杯(L)價格 (選填)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full text-slate-800 text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded font-mono"
                    value={editingDrink.priceLarge ?? ''}
                    onChange={(e) => setEditingDrink({ 
                      ...editingDrink, 
                      priceLarge: e.target.value ? Number(e.target.value) : undefined 
                    })}
                    placeholder="若無分尺寸，留空即可"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-semibold block text-slate-700">飲品簡介 Description</label>
                <textarea
                  className="w-full text-slate-850 text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded h-16 resize-none"
                  value={editingDrink.description || ''}
                  onChange={(e) => setEditingDrink({ ...editingDrink, description: e.target.value })}
                  placeholder="e.g. 溫熱手作黑糖搭配香醇鮮奶..."
                />
              </div>

              {/* Size options */}
              <div className="space-y-1.5 bg-slate-50 p-3 rounded border border-slate-200">
                <label className="font-bold text-slate-700 block mb-1">尺寸規格配置 Sizes available</label>
                <div className="flex items-center gap-6">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded text-emerald-500 focus:ring-emerald-400"
                      checked={editingDrink.hasSizeM ?? true}
                      onChange={(e) => setEditingDrink({ ...editingDrink, hasSizeM: e.target.checked })}
                    />
                    <span>供應中杯 M</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded text-emerald-500 focus:ring-emerald-400"
                      checked={editingDrink.hasSizeL ?? true}
                      onChange={(e) => setEditingDrink({ ...editingDrink, hasSizeL: e.target.checked })}
                    />
                    <span>供應大杯 L</span>
                  </label>
                </div>
              </div>

              {/* Tags Manager */}
              <div className="space-y-2">
                <label className="font-semibold block text-slate-700">商品標籤 Tags</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    className="flex-1 text-slate-800 text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 focus:outline-none rounded"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="e.g. 熱銷、特調..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-750 font-bold rounded cursor-pointer"
                  >
                    新增標籤
                  </button>
                </div>

                <div className="flex flex-wrap gap-1">
                  {(editingDrink.tags || []).map((tag, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-full font-semibold">
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(i)}
                        className="text-emerald-600 hover:text-rose-500 p-0.5 focus:outline-none rounded-full"
                      >
                        <X size={10} strokeWidth={2.5} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3.5">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded text-slate-500 font-semibold cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveDrink}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded text-white font-extrabold cursor-pointer"
              >
                儲存商品
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
