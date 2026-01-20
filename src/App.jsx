import React, { useState, useEffect } from 'react';
import { Search, MapPin, Clock, Package, Navigation, AlertCircle, TrendingDown } from 'lucide-react';

// 더미 데이터
const DUMMY_STORES = [
  {
    id: 1,
    name: '두쫀쿠 청담본점',
    address: '서울 강남구 청담동 123-45',
    lat: 37.5219,
    lng: 127.0411,
    tags: ['두바이쿠키', '디저트', '쿠키'],
    region: '서울 청담',
    stock_count: 12,
    stock_level: 'moderate',
    updated_at: new Date(Date.now() - 5 * 60000),
    next_restock: new Date(Date.now() + 2 * 60 * 60000),
    building_info: { floor: 1, parking_available: true }
  },
  {
    id: 2,
    name: '두쫀쿠 강남역점',
    address: '서울 강남구 역삼동 567-89',
    lat: 37.4979,
    lng: 127.0276,
    tags: ['두바이쿠키', '디저트', '쿠키'],
    region: '서울 강남',
    stock_count: 3,
    stock_level: 'low',
    updated_at: new Date(Date.now() - 2 * 60000),
    next_restock: new Date(Date.now() + 4 * 60 * 60000),
    building_info: { floor: 2, parking_available: true }
  },
  {
    id: 3,
    name: '두쫀쿠 잠실점',
    address: '서울 송파구 잠실동 234-56',
    lat: 37.5133,
    lng: 127.1028,
    tags: ['두바이쿠키', '디저트', '쿠키'],
    region: '서울 잠실',
    stock_count: 0,
    stock_level: 'out',
    updated_at: new Date(Date.now() - 10 * 60000),
    next_restock: new Date(Date.now() + 30 * 60000),
    building_info: { floor: 1, parking_available: true }
  },
  {
    id: 4,
    name: '두쫀쿠 성수점',
    address: '서울 성동구 성수동 890-12',
    lat: 37.5446,
    lng: 127.0555,
    tags: ['두바이쿠키', '디저트', '쿠키'],
    region: '서울 성수',
    stock_count: 25,
    stock_level: 'plenty',
    updated_at: new Date(Date.now() - 1 * 60000),
    next_restock: null,
    building_info: { floor: 1, parking_available: false }
  }
];

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateArrivalData(userLat, userLng, store) {
  const distance = getDistance(userLat, userLng, store.lat, store.lng);
  const driveTime = Math.round((distance / 25) * 60 + 5);
  const depletionRate = store.stock_level === 'low' ? 0.3 : 0.15;
  const predictedStock = Math.max(0, store.stock_count - Math.round(driveTime * depletionRate));
  
  return {
    distance: distance.toFixed(1),
    driveTime,
    predictedStock,
    arrivalTime: new Date(Date.now() + driveTime * 60000)
  };
}

function StockBadge({ level, count }) {
  const badges = {
    plenty: { text: '여유', color: 'bg-green-500' },
    moderate: { text: '보통', color: 'bg-yellow-500' },
    low: { text: '임박', color: 'bg-orange-500' },
    out: { text: '품절', color: 'bg-red-500' }
  };
  
  const badge = badges[level] || badges.moderate;
  
  return (
    <span className={`${badge.color} text-white px-2 py-1 rounded-full text-xs font-semibold`}>
      {badge.text} ({count}개)
    </span>
  );
}

function StoreCard({ store, userLocation }) {
  const [arrivalData, setArrivalData] = useState(null);
  
  useEffect(() => {
    if (userLocation) {
      const data = calculateArrivalData(userLocation.lat, userLocation.lng, store);
      setArrivalData(data);
    }
  }, [store, userLocation]);
  
  const isOutOfStock = store.stock_level === 'out';
  const willBeOutOfStock = arrivalData && arrivalData.predictedStock === 0;
  const isUrgent = arrivalData && arrivalData.predictedStock > 0 && arrivalData.predictedStock <= 3;
  
  const updatedMinutesAgo = Math.round((Date.now() - store.updated_at) / 60000);
  
  return (
    <div className={`border rounded-lg p-4 mb-4 transition-all ${
      isOutOfStock ? 'opacity-50 bg-gray-50' : 'bg-white hover:shadow-lg'
    } ${isUrgent ? 'border-orange-400 border-2' : 'border-gray-200'}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg">{store.name}</h3>
          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
            <MapPin size={14} />
            {store.address}
          </p>
        </div>
        <StockBadge level={store.stock_level} count={store.stock_count} />
      </div>
      
      <div className="text-sm text-gray-500 mb-3">
        {updatedMinutesAgo}분 전 업데이트
      </div>
      
      {arrivalData && (
        <div className="bg-blue-50 rounded-lg p-3 mb-3 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Navigation size={16} className="text-blue-600" />
            <span className="font-semibold">{arrivalData.distance}km</span>
            <span className="text-gray-600">·</span>
            <Clock size={16} className="text-blue-600" />
            <span className="font-semibold">{arrivalData.driveTime}분 후 도착</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Package size={16} className={willBeOutOfStock ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-green-600'} />
            <span>도착 시 예상:</span>
            <span className={`font-bold ${
              willBeOutOfStock ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-green-600'
            }`}>
              {arrivalData.predictedStock}개
            </span>
          </div>
          
          {willBeOutOfStock && (
            <div className="flex items-center gap-2 text-red-600 text-sm font-semibold">
              <AlertCircle size={16} />
              <span>도착 시 품절 가능성 높음</span>
            </div>
          )}
          
          {isUrgent && !willBeOutOfStock && (
            <div className="flex items-center gap-2 text-orange-600 text-sm font-semibold">
              <TrendingDown size={16} />
              <span>서둘러야 구매 가능!</span>
            </div>
          )}
        </div>
      )}
      
      {store.next_restock && (
        <div className="text-sm text-gray-600 mb-3">
          다음 입고: {store.next_restock.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
      
      <button 
        disabled={isOutOfStock}
        className={`w-full py-2 rounded-lg font-semibold transition-colors ${
          isOutOfStock 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isOutOfStock ? '품절' : '길 안내 시작'}
      </button>
    </div>
  );
}

export default function App() {
  const [keyword, setKeyword] = useState('');
  const [region, setRegion] = useState('');
  const [stores, setStores] = useState(DUMMY_STORES);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        () => {
          setUserLocation({ lat: 37.4979, lng: 127.0276 });
        }
      );
    } else {
      setUserLocation({ lat: 37.4979, lng: 127.0276 });
    }
  }, []);
  
  const handleSearch = () => {
    setLoading(true);
    
    setTimeout(() => {
      let filtered = DUMMY_STORES;
      
      if (keyword) {
        filtered = filtered.filter(s => 
          s.name.toLowerCase().includes(keyword.toLowerCase()) ||
          s.tags.some(tag => tag.toLowerCase().includes(keyword.toLowerCase()))
        );
      }
      
      if (region) {
        filtered = filtered.filter(s => 
          s.region.toLowerCase().includes(region.toLowerCase())
        );
      }
      
      if (userLocation) {
        filtered.sort((a, b) => {
          if (a.stock_level === 'out' && b.stock_level !== 'out') return 1;
          if (a.stock_level !== 'out' && b.stock_level === 'out') return -1;
          
          const distA = getDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
          const distB = getDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
          return distA - distB;
        });
      }
      
      setStores(filtered);
      setLoading(false);
    }, 300);
  };
  
  useEffect(() => {
    handleSearch();
  }, [keyword, region, userLocation]);
  
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-blue-600 text-white p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-2">3D 실시간 재고 내비게이션</h1>
        <p className="text-blue-100 text-sm">정확한 도착 시간과 재고 예측으로 헛걸음 방지</p>
      </div>
      
      <div className="bg-white shadow-md p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="상품명이나 매장명 검색 (예: 두쫀쿠)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="relative">
            <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="지역 필터 (예: 성수, 강남)"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto p-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">검색 중...</div>
        ) : stores.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            검색 결과가 없습니다
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              총 {stores.length}개 매장 · {userLocation ? '거리순 정렬' : '위치 정보 없음'}
            </div>
            {stores.map(store => (
              <StoreCard 
                key={store.id} 
                store={store} 
                userLocation={userLocation}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}