import React, { useEffect, useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Order } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { DollarSign, ShoppingBag, TrendingUp, RefreshCw, BarChart2 } from 'lucide-react';

export const BackstageAnalytics: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const fetchedOrders: Order[] = [];
      snapshot.forEach((doc) => {
        fetchedOrders.push({ ...doc.data(), id: doc.id } as Order);
      });
      setOrders(fetchedOrders);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter completed orders
  const completedOrders = orders.filter((o) => o.status === 'completed');
  
  // 1. Calculations
  const totalSales = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCompletedOrders = completedOrders.length;
  const averageTicket = totalCompletedOrders > 0 ? Math.round(totalSales / totalCompletedOrders) : 0;
  const activeOrdersCount = orders.filter((o) => o.status === 'new' || o.status === 'preparing' || o.status === 'ready').length;

  // 2. Prepare charts data: Group Sales By Date
  const getSalesHistoryData = () => {
    const salesByDate: { [date: string]: number } = {};
    
    completedOrders.forEach((o) => {
      const dateStr = new Date(o.createdAt).toLocaleDateString([], { month: '2-digit', day: '2-digit' });
      salesByDate[dateStr] = (salesByDate[dateStr] || 0) + o.totalAmount;
    });

    const dates = Object.keys(salesByDate).sort();
    // If no data, return a mock trend or empty structure
    if (dates.length === 0) {
      return [
        { name: '05/30', 營業額: 0 },
        { name: '05/31', 營業額: 0 },
        { name: '06/01', 營業額: 0 },
        { name: '06/02', 營業額: 0 },
        { name: '06/03', 營業額: 0 },
      ];
    }

    return dates.map(date => ({
      name: date,
      營業額: salesByDate[date]
    }));
  };

  // 3. Hot Selling Drinks
  const getPopularDrinksData = () => {
    const drinkCounts: { [name: string]: number } = {};
    
    completedOrders.forEach((order) => {
      order.items.forEach((item) => {
        drinkCounts[item.name] = (drinkCounts[item.name] || 0) + item.quantity;
      });
    });

    const sortedDrinks = Object.entries(drinkCounts)
      .map(([name, qty]) => ({ name, 銷量: qty }))
      .sort((a, b) => b.銷量 - a.銷量)
      .slice(0, 5); // top 5

    if (sortedDrinks.length === 0) {
      return [{ name: '暫無飲料銷量', 銷量: 0 }];
    }
    return sortedDrinks;
  };

  // 4. Order Type Breakdown (dine-in vs takeout vs delivery)
  const getOrderTypesData = () => {
    let dineInCount = 0;
    let takeoutCount = 0;
    let deliveryCount = 0;

    completedOrders.forEach((o) => {
      if (o.orderType === 'dine-in') dineInCount++;
      else if (o.orderType === 'takeout') takeoutCount++;
      else if (o.orderType === 'delivery') deliveryCount++;
    });

    const data = [
      { name: '內用餐點', value: dineInCount },
      { name: '外帶自取', value: takeoutCount },
      { name: '外送服務', value: deliveryCount }
    ].filter(item => item.value > 0);

    if (data.length === 0) {
      return [
        { name: '無檔案記錄', value: 1 }
      ];
    }
    return data;
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-4"></div>
        <span className="text-xs text-slate-500">計算營利數據中...</span>
      </div>
    );
  }

  return (
    <div id="backstage-analytics-panel" className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-slate-400 font-medium">總銷售額 Revenue</span>
              <div className="font-mono text-2xl font-extrabold text-slate-800 mt-1">
                ${totalSales}
              </div>
            </div>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign size={18} />
            </span>
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-3.5 flex items-center gap-1">
            <TrendingUp size={11} />
            <span>統計已成交結帳訂單之總額</span>
          </div>
        </div>

        {/* Card 2: Completed Orders */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-slate-400 font-medium">已完成訂單 Orders</span>
              <div className="font-mono text-2xl font-extrabold text-slate-800 mt-1">
                {totalCompletedOrders} 筆
              </div>
            </div>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ShoppingBag size={18} />
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-3.5">
            不包含已作廢取消的訂單數
          </div>
        </div>

        {/* Card 3: Average Ticket */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-slate-400 font-medium">客單價 Average Ticket</span>
              <div className="font-mono text-2xl font-extrabold text-slate-800 mt-1">
                ${averageTicket}
              </div>
            </div>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <DollarSign size={18} />
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-3.5">
            平均每筆結帳訂單消費金額
          </div>
        </div>

        {/* Card 4: Active queue */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-slate-400 font-medium">待處理訂單 Queue</span>
              <div className="font-mono text-2xl font-extrabold text-slate-800 mt-1">
                {activeOrdersCount} 筆
              </div>
            </div>
            <span className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <RefreshCw size={18} className="animate-spin text-purple-500" style={{ animationDuration: '6s' }} />
            </span>
          </div>
          <div className="text-[10px] text-purple-600 font-bold mt-3.5">
            新訂單 / 製作中 / 待取外送中
          </div>
        </div>
      </div>

      {/* Graphs Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graph 1: Sales over time */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5">
            <TrendingUp size={16} className="text-emerald-500" />
            <span>近期日營業額走勢 Daily Sales Trend</span>
          </h3>
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getSalesHistoryData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, background: '#fff', border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="營業額" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 2: Order types distribution (pie) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5">
            <BarChart2 size={16} className="text-blue-500" />
            <span>用餐型態比例 Order Channel Choice</span>
          </h3>
          <div className="h-64 flex flex-col justify-between">
            <div className="flex-1 min-h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getOrderTypesData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {getOrderTypesData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} 筆`, '筆數']} contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend indicators */}
            <div className="flex justify-center gap-5 pb-1 text-[11px] font-semibold text-slate-500">
              {getOrderTypesData().map((item, index) => (
                <div key={item.name} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Graph 3: Hot Sales ranking */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs lg:col-span-3">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5">
            <BarChart2 size={16} className="text-amber-500" />
            <span>暢銷飲品排行榜 Top Popular Drinks</span>
          </h3>
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getPopularDrinksData()} layout="vertical" margin={{ top: 5, right: 10, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#475569" fontSize={11} width={80} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                <Bar dataKey="銷量" fill="#f59e0b" radius={[0, 6, 6, 0]} barSize={16}>
                  {getPopularDrinksData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#34d399" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
