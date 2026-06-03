import React, { useEffect, useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Order } from '../types';
import { X, Clock, Coffee, CheckCircle, Ban, MessageSquare, Phone, MapPin, Sparkles } from 'lucide-react';

interface OrderTrackerModalProps {
  onClose: () => void;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({ onClose }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read order IDs from localStorage
    const savedIds: string[] = JSON.parse(localStorage.getItem('tea_shop_order_ids') || '[]');

    if (savedIds.length === 0) {
      setLoading(false);
      return;
    }

    const activeListeners: (() => void)[] = [];
    const fetchedOrdersMap: { [id: string]: Order } = {};

    savedIds.forEach((id) => {
      if (!id || typeof id !== 'string' || id.trim() === '') return;
      const orderRef = doc(db, 'orders', id);
      const unsubscribe = onSnapshot(
        orderRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            fetchedOrdersMap[id] = { ...data, id: snapshot.id } as Order;
            
            // Sort orders descending by createdAt timestamp
            const sortedArray = Object.values(fetchedOrdersMap).sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setOrders(sortedArray);
          }
          setLoading(false);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, `orders/${id}`);
          setLoading(false);
        }
      );
      activeListeners.push(unsubscribe);
    });

    // Cleanup listeners
    return () => {
      activeListeners.forEach((unsub) => unsub());
    };
  }, []);

  const getStatusDetails = (status: Order['status']) => {
    switch (status) {
      case 'new':
        return { 
          label: '已接單', 
          color: 'bg-indigo-50 text-indigo-700 border-indigo-200', 
          icon: <Clock size={16} className="animate-spin text-indigo-600" />,
          desc: '門市已確認訂單，準備製作中...'
        };
      case 'preparing':
        return { 
          label: '製作中', 
          color: 'bg-amber-50 text-amber-700 border-amber-200', 
          icon: <Coffee size={16} className="animate-bounce text-amber-600" />,
          desc: '茶飲沖泡與配料調製中，請稍候！'
        };
      case 'ready':
        return { 
          label: '可取餐 / 送餐中', 
          color: 'bg-emerald-500 text-white border-emerald-500', 
          icon: <Sparkles size={16} className="animate-pulse" />,
          desc: '飲料已製作完成！歡迎臨店自取或送貨員配送中！'
        };
      case 'completed':
        return { 
          label: '已完成', 
          color: 'bg-slate-100 text-slate-600 border-slate-200', 
          icon: <CheckCircle size={16} className="text-slate-500" />,
          desc: '訂單已完成交易。感謝您的光臨，祝您享用愉快！'
        };
      case 'cancelled':
        return { 
          label: '已取消', 
          color: 'bg-rose-50 text-rose-700 border-rose-200', 
          icon: <Ban size={16} className="text-rose-500" />,
          desc: '本訂單已被取消，若有疑問請致電門市。'
        };
    }
  };

  return (
    <div 
      id="order-tracker-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div 
        id="order-tracker-container"
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-white">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Clock size={18} className="text-emerald-600" />
              <span>實時訂單追蹤 Track Orders</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">顯示您在此瀏覽器下的點單記錄（實時更新狀態）</p>
          </div>
          <button 
            id="close-tracker"
            type="button"
            className="p-1 rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-150 transition"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-4"></div>
              <span className="text-sm text-slate-500">載入點單歷史中...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl p-6 border border-dashed border-slate-200">
              <Coffee size={48} className="text-slate-350 mb-3 animate-pulse" />
              <h3 className="font-semibold text-slate-600">無任何點單記錄</h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                不曾在此瀏覽器中提交任何點單，快去前台挑選好茶吧！
              </p>
            </div>
          ) : (
            orders.map((order) => {
              const statusInfo = getStatusDetails(order.status);
              return (
                <div 
                  key={order.id}
                  id={`tracker-item-${order.id}`}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  {/* Status Banner */}
                  <div className="flex justify-between items-center px-4 py-3 bg-slate-50/65 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-200/70 px-2 py-0.5 rounded-sm">
                        {order.orderNum}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusInfo.color}`}>
                      {statusInfo.icon}
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-3.5">
                    {/* Visual Status Indicator Description */}
                    <div className="text-xs p-3 bg-slate-50 text-slate-600 rounded-lg border border-slate-100/50 flex items-start gap-2">
                      <Coffee size={14} className="mt-0.5 text-emerald-500 flex-shrink-0" />
                      <span>{statusInfo.desc}</span>
                    </div>

                    {/* Order items */}
                    <div className="space-y-1.5">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs py-1">
                          <div className="space-y-0.5 flex-1 pr-4">
                            <div className="font-semibold text-slate-700 flex items-center gap-1">
                              <span>{item.name}</span>
                              <span className="text-[10px] text-slate-400">({item.size})</span>
                              <span className="font-normal text-slate-500 font-mono">x{item.quantity}</span>
                            </div>
                            <div className="text-[10px] text-slate-450">
                              {item.ice} / {item.sweetness}
                              {item.addOns.length > 0 && ` + ${item.addOns.map(a => a.name).join(', ')}`}
                            </div>
                            {item.notes && (
                              <div className="text-[10px] text-amber-600 bg-amber-50/30 px-1.5 py-0.5 rounded-sm inline-block">
                                * 備註: {item.notes}
                              </div>
                            )}
                          </div>
                          <span className="font-mono font-semibold text-slate-600 whitespace-nowrap">
                            ${item.totalPrice}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center text-xs pt-3 border-t border-slate-100">
                      <div className="text-slate-450 flex items-center gap-1.5 flex-wrap">
                        <span className="flex items-center gap-0.5">
                          <Clock size={11} />
                          {order.orderType === 'dine-in' ? '內用' : order.orderType === 'takeout' ? '外帶' : '外送'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <Phone size={11} />
                          {order.customerPhone}
                        </span>
                        {order.orderType === 'delivery' && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-0.5 font-sans line-clamp-1 max-w-[150px]">
                              <MapPin size={11} />
                              {order.deliveryAddress}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="font-sans font-bold text-sm text-slate-800">
                        總金額 <span className="font-mono text-base font-extrabold text-emerald-600">${order.totalAmount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
