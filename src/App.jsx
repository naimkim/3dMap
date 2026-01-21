import React, { useState, useEffect, useRef } from 'react';

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

function StoreCard({ store, userLocation, isActive, onClick, onNavigate }) {
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
  
  const badges = {
    plenty: { text: '여유', color: 'bg-green-500' },
    moderate: { text: '보통', color: 'bg-yellow-500' },
    low: { text: '임박', color: 'bg-orange-500' },
    out: { text: '품절', color: 'bg-red-500' }
  };
  
  const badge = badges[store.stock_level];
  
  return (
    <div 
      className={`border rounded-xl p-4 mb-3 cursor-pointer transition-all ${
        isOutOfStock ? 'opacity-60 bg-gray-50' : 'bg-white hover:shadow-xl'
      } ${isActive ? 'border-purple-500 border-2 shadow-lg' : 'border-gray-200'} ${
        isUrgent ? 'border-orange-400 border-2' : ''
      }`}
      onClick={() => onClick(store)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">{store.name}</h3>
          <p className="text-sm text-gray-600">📍 {store.address}</p>
        </div>
        <span className={`${badge.color} text-white px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2`}>
          {badge.text} ({store.stock_count}개)
        </span>
      </div>
      
      <div className="text-xs text-gray-500 mb-3">
        ⏰ {updatedMinutesAgo}분 전 업데이트
      </div>
      
      {arrivalData && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-3 text-sm mb-2">
            <span className="font-semibold">🚗 {arrivalData.distance}km</span>
            <span className="text-gray-400">·</span>
            <span className="font-semibold">⏱️ {arrivalData.driveTime}분</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">📦 도착 시 예상:</span>
            <span className={`font-bold ${
              willBeOutOfStock ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-green-600'
            }`}>
              {arrivalData.predictedStock}개
            </span>
          </div>
        </div>
      )}
      
      {willBeOutOfStock && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-semibold mb-2">
          ⚠️ 도착 시 품절 가능성 높음
        </div>
      )}
      
      {isUrgent && !willBeOutOfStock && (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 px-3 py-2 rounded-lg text-xs font-semibold mb-2">
          ⏱️ 서둘러야 구매 가능!
        </div>
      )}
      
      {store.next_restock && (
        <div className="text-xs text-gray-600 mb-2">
          다음 입고: {store.next_restock.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
      
      <button 
        disabled={isOutOfStock}
        onClick={(e) => {
          e.stopPropagation();
          onNavigate(store);
        }}
        className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all ${
          isOutOfStock 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
        }`}
      >
        {isOutOfStock ? '품절' : '🧭 길 안내 시작'}
      </button>
    </div>
  );
}

export default function App() {
  const [keyword, setKeyword] = useState('');
  const [region, setRegion] = useState('');
  const [stores, setStores] = useState(DUMMY_STORES);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [polyline, setPolyline] = useState(null);
  const [userMarker, setUserMarker] = useState(null);
  const mapRef = useRef(null);
  
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
  
  useEffect(() => {
    if (userLocation && !map && window.kakao && window.kakao.maps) {
      const container = mapRef.current;
      const options = {
        center: new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng),
        level: 5
      };
      const kakaoMap = new window.kakao.maps.Map(container, options);
      setMap(kakaoMap);
      
      // 사용자 위치 마커 추가
      const userPos = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng);
      const userImageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png';
      const userImageSize = new window.kakao.maps.Size(24, 35);
      const userMarkerImage = new window.kakao.maps.MarkerImage(userImageSrc, userImageSize);
      
      const marker = new window.kakao.maps.Marker({
        position: userPos,
        image: userMarkerImage,
        map: kakaoMap
      });
      
      setUserMarker(marker);
    }
  }, [userLocation, map]);
  
  useEffect(() => {
    if (map && window.kakao && window.kakao.maps) {
      markers.forEach(marker => marker.setMap(null));
      
      const newMarkers = stores.map(store => {
        const markerPosition = new window.kakao.maps.LatLng(store.lat, store.lng);
        
        const imageSrc = store.stock_level === 'out' 
          ? 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png'
          : 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png';
        
        const imageSize = new window.kakao.maps.Size(24, 35);
        const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize);
        
        const marker = new window.kakao.maps.Marker({
          position: markerPosition,
          image: markerImage
        });
        
        marker.setMap(map);
        
        window.kakao.maps.event.addListener(marker, 'click', () => {
          setSelectedStore(store);
          map.setCenter(markerPosition);
        });
        
        const content = `
          <div style="padding:10px;background:white;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.2);min-width:150px;">
            <div style="font-weight:700;margin-bottom:4px;font-size:14px;">${store.name}</div>
            <div style="font-size:12px;color:#666;">재고: ${store.stock_count}개</div>
          </div>
        `;
        
        const infowindow = new window.kakao.maps.InfoWindow({
          content: content
        });
        
        window.kakao.maps.event.addListener(marker, 'mouseover', () => {
          infowindow.open(map, marker);
        });
        
        window.kakao.maps.event.addListener(marker, 'mouseout', () => {
          infowindow.close();
        });
        
        return marker;
      });
      
      setMarkers(newMarkers);
    }
  }, [map, stores]);
  
  useEffect(() => {
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
  }, [keyword, region, userLocation]);
  
  const handleStoreClick = (store) => {
    setSelectedStore(store);
    if (map && window.kakao && window.kakao.maps) {
      const moveLatLon = new window.kakao.maps.LatLng(store.lat, store.lng);
      map.panTo(moveLatLon);
    }
  };
  
  const handleNavigation = (store) => {
    if (!map || !userLocation || !window.kakao || !window.kakao.maps) return;
    
    // 기존 경로선 제거
    if (polyline) {
      polyline.setMap(null);
    }
    
    // 출발지와 도착지
    const startPos = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng);
    const endPos = new window.kakao.maps.LatLng(store.lat, store.lng);
    
    // 경로선 그리기 (직선)
    const linePath = [startPos, endPos];
    
    const newPolyline = new window.kakao.maps.Polyline({
      path: linePath,
      strokeWeight: 5,
      strokeColor: '#667eea',
      strokeOpacity: 0.8,
      strokeStyle: 'solid'
    });
    
    newPolyline.setMap(map);
    setPolyline(newPolyline);
    
    // 출발지와 도착지가 모두 보이도록 지도 범위 조정
    const bounds = new window.kakao.maps.LatLngBounds();
    bounds.extend(startPos);
    bounds.extend(endPos);
    map.setBounds(bounds);
    
    // 카카오맵 앱으로 길찾기 (모바일에서 유용)
    const kakaoMapUrl = `https://map.kakao.com/link/to/${store.name},${store.lat},${store.lng}/from/현재위치,${userLocation.lat},${userLocation.lng}`;
    console.log('카카오맵 길찾기:', kakaoMapUrl);
  };
  
  return (
    <div className="flex h-screen">
      <div className="w-96 bg-white overflow-y-auto shadow-2xl z-10">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <h1 className="text-2xl font-bold mb-2">🗺️ 3D 재고 내비게이션</h1>
          <p className="text-sm opacity-90">정확한 도착 시간과 재고 예측</p>
        </div>
        
        <div className="p-4 bg-white border-b sticky top-0 z-5">
          <input
            type="text"
            placeholder="🔍 상품명/매장명 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="text"
            placeholder="📍 지역 필터 (예: 성수)"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        <div className="p-4">
          <div className="text-sm text-gray-600 mb-3">
            총 {stores.length}개 매장 · {userLocation ? '거리순 정렬' : '위치 정보 없음'}
          </div>
          {stores.map(store => (
            <StoreCard 
              key={store.id} 
              store={store} 
              userLocation={userLocation}
              isActive={selectedStore?.id === store.id}
              onClick={handleStoreClick}
              onNavigate={handleNavigation}
            />
          ))}
        </div>
      </div>
      
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full"></div>
      </div>
    </div>
  );
}