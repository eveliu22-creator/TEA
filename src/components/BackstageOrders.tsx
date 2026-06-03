import React, { useEffect, useState, useRef } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { Order, OrderStatus } from '../types';
import { 
  Clock, Coffee, Play, Check, X, Search, Phone, 
  MapPin, Clipboard, Volume2, User, AlertCircle
} from 'lucide-react';

export const BackstageOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<OrderStatus | 'history'>('new');
  const [playAlert, setPlayAlert] = useState(true);
  const prevOrdersCountRef = useRef<number>(0);
  const isFirstLoadRef = useRef(true);

  // Synthesize double chime when new order arrives
  const playOrderReceivedChime = () => {
    if (!playAlert) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);
      
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.15); // E5
      gain2.gain.setValueAtTime(0.2, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.45);
    } catch (e) {
      console.warn('Web Audio synthesis blocked or unavailable:', e);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders: Order[] = [];
      snapshot.forEach((doc) => {
        fetchedOrders.push({ ...doc.data(), id: doc.id } as Order);
      });
      
      setOrders(fetchedOrders);

      // Check if we received a new "new" status order to trigger the bell chime sound
      const currentNewOrdersCount = fetchedOrders.filter(o => o.status === 'new').length;
      if (!isFirstLoadRef.current && currentNewOrdersCount > prevOrdersCountRef.current) {
        playOrderReceivedChime();
      }
      
      prevOrdersCountRef.current = currentNewOrdersCount;
      isFirstLoadRef.current = false;
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    return () => unsubscribe();
  }, [playAlert]);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      if (!orderId || typeof orderId !== 'string' || orderId.trim() === '') {
        console.warn('Invalid orderId for status update:', orderId);
        return;
      }
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  // Counting orders for badge display
  const countNew = orders.filter(o => o.status === 'new').length;
  const countPreparing = orders.filter(o => o.status === 'preparing').length;
  const countReady = orders.filter(o => o.status === 'ready').length;
  const countCompleted = orders.filter(o => o.status === 'completed' || o.status === 'cancelled').length;

  // Filter orders by active tab + search text
  const filteredOrders = orders.filter((order) => {
    const matchesTab = activeTab === 'history' 
      ? (order.status === 'completed' || order.status === 'cancelled')
      : order.status === activeTab;
      
    if (!matchesTab) return false;

    if (!searchQuery.trim()) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      order.customerName.toLowerCase().includes(searchLower) ||
      order.customerPhone.includes(searchLower) ||
      order.orderNum.toLowerCase().includes(searchLower) ||
      (order.deliveryAddress && order.deliveryAddress.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div id="backstage-orders-panel" className="space-y-6">
      {/* Search and sound controls */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450" />
          <input
            id="backstage-order-search"
            type="text"
            className="w-full pl-10 pr-4 py-2.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            placeholder="搜尋訂單編號 / 顧客姓名 / 電話 / 外送地址..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Audio control button */}
        <button
          type="button"
          onClick={() => {
            setPlayAlert(!playAlert);
            playOrderReceivedChime();
          }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border-2 transition-all cursor-pointer ${
            playAlert
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/50'
              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Volume2 size={15} className={playAlert ? 'text-emerald-600' : 'text-slate-400'} />
          <span>新訂單提示音: {playAlert ? '開啟中' : '已關閉'}</span>
        </button>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-none gap-2">
        <button
          onClick={() => setActiveTab('new')}
          className={`relative pb-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'new'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
        >
          新訂單 (New)
          {countNew > 0 && (
            <span className="ml-2 px-2 py-0.5 text-[10px] font-extrabold bg-indigo-500 text-white rounded-full animate-pulse">
              {countNew}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('preparing')}
          className={`relative pb-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'preparing'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
        >
          製作中 (Preparing)
          {countPreparing > 0 && (
            <span className="ml-2 px-2 py-0.5 text-[10px] font-extrabold bg-amber-500 text-white rounded-full">
              {countPreparing}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('ready')}
          className={`relative pb-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'ready'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
        >
          待取 / 外送 (Ready)
          {countReady > 0 && (
            <span className="ml-2 px-2 py-0.5 text-[10px] font-extrabold bg-emerald-500 text-white rounded-full">
              {countReady}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`relative pb-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'history'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
        >
          歷史檔案 (Archive)
          {countCompleted > 0 && (
            <span className="ml-2 px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-600 rounded-full">
              {countCompleted}
            </span>
          )}
        </button>
      </div>

      {/* Orders Content */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 text-center p-6">
          <Clipboard size={44} className="text-slate-300 mb-3" />
          <h3 className="font-semibold text-slate-600 text-sm">無符合條件之訂單</h3>
          <p className="text-xs text-slate-400 mt-0.5">目前此分類下未有符合搜尋關鍵字的點單狀態</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {filteredOrders.map((order) => (
            <div 
              key={order.id}
              id={`backstage-order-card-${order.id}`}
              className={`bg-white rounded-xl border p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow ${
                order.status === 'new' 
                  ? 'border-l-4 border-l-indigo-500 border-slate-200' 
                  : order.status === 'preparing'
                  ? 'border-l-4 border-l-amber-550 border-slate-200'
                  : order.status === 'ready'
                  ? 'border-l-4 border-l-emerald-500 border-slate-200'
                  : 'border-l-4 border-l-slate-300 border-slate-200'
              }`}
            >
              <div className="space-y-3.5">
                {/* Visual Card Header */}
                <div className="flex justify-between items-start gap-2 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <span className="font-mono text-sm font-extrabold text-slate-800 bg-slate-100 px-2.5 py-1 rounded">
                      {order.orderNum}
                    </span>
                    <div className="text-[10px] text-slate-400">
                      訂單時間: {new Date(order.createdAt).toLocaleString([], { hour12: false })}
                    </div>
                  </div>
                  
                  {/* Order Type Badge */}
                  <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded ${
                    order.orderType === 'dine-in'
                      ? 'bg-blue-550/10 text-blue-700'
                      : order.orderType === 'takeout'
                      ? 'bg-orange-550/10 text-orange-700'
                      : 'bg-purple-550/10 text-purple-700'
                  }`}>
                    {order.orderType === 'dine-in' ? '內用' : order.orderType === 'takeout' ? '外帶' : '外送'}
                  </span>
                </div>

                {/* Customer Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <User size={13} className="text-slate-400 flex-shrink-0" />
                    <span className="font-semibold">{order.customerName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Phone size={13} className="text-slate-400 flex-shrink-0" />
                    <span>{order.customerPhone}</span>
                  </div>
                  {order.orderType === 'delivery' && (
                    <div className="flex items-center gap-1.5 text-slate-600 col-span-1 md:col-span-2">
                      <MapPin size={13} className="text-slate-400 flex-shrink-0" />
                      <span className="line-clamp-1">{order.deliveryAddress}</span>
                    </div>
                  )}
                </div>

                {/* Drink Items list */}
                <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-4 text-xs py-1 border-b border-dashed border-slate-200/60 last:border-b-0 last:pb-0">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5 flex-wrap">
                          <span>{item.name}</span>
                          <span className="text-[10px] font-medium text-slate-450 bg-slate-200 text-slate-700 px-1 py-0.1 rounded">
                            {item.size}杯
                          </span>
                          <span className="font-bold text-emerald-700">x{item.quantity}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium whitespace-pre-wrap">
                          {item.ice} / {item.sweetness}
                          {item.addOns.length > 0 && ` (+${item.addOns.map(a => a.name).join(', ')})`}
                        </div>
                        {item.notes && (
                          <div className="text-[10px] text-amber-700 flex items-start gap-1 font-sans bg-amber-50 px-1.5 py-0.5 rounded-sm">
                            <AlertCircle size={10} className="mt-0.5 flex-shrink-0 text-amber-550" />
                            <span>客製: {item.notes}</span>
                          </div>
                        )}
                      </div>
                      <span className="font-mono text-slate-600 font-semibold text-right">
                        ${item.totalPrice}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footnotes */}
                {order.notes && (
                  <div className="text-xs bg-amber-100/30 text-amber-800 px-3 py-2 rounded border border-amber-100 flex items-start gap-1.5">
                    <Clipboard size={13} className="mt-0.5 text-amber-600 flex-shrink-0" />
                    <span><strong className="font-semibold">整單備註:</strong> {order.notes}</span>
                  </div>
                )}
              </div>

              {/* Card Footer & Stage progression actions */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-4">
                <div className="text-xs">
                  <span className="text-slate-450 font-medium">總計額</span>
                  <div className="font-mono text-lg font-extrabold text-slate-800">
                    ${order.totalAmount}
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className="flex items-center gap-2">
                  {order.status === 'new' && (
                    <>
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        className="p-2 py-1.5 rounded-lg border border-slate-200 text-slate-450 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        拒單 / 取消
                      </button>
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
                      >
                        <Play size={12} strokeWidth={2.5} />
                        接單並製作
                      </button>
                    </>
                  )}

                  {order.status === 'preparing' && (
                    <>
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        className="p-2 py-1.5 rounded-lg border border-slate-200 text-slate-450 hover:bg-rose-50 hover:text-rose-600 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        取消訂單
                      </button>
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        className="inline-flex items-center gap-1 bg-amber-550 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition shadow-xs font-sans"
                      >
                        <Coffee size={12} strokeWidth={2.5} />
                        完成製作
                      </button>
                    </>
                  )}

                  {order.status === 'ready' && (
                    <button
                      type="button"
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-xs font-extrabold cursor-pointer transition shadow-md shadow-emerald-500/10"
                    >
                      <Check size={13} strokeWidth={2.5} />
                      交易完成 / 結帳
                    </button>
                  )}

                  {(order.status === 'completed' || order.status === 'cancelled') && (
                    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-1 rounded ${
                      order.status === 'completed' 
                        ? 'bg-slate-100 text-slate-500' 
                        : 'bg-rose-50 text-rose-600'
                    }`}>
                      {order.status === 'completed' ? '已交易結案' : '已作廢取消'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
