import React, { useState, useEffect, useRef } from 'react';

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
  const depletionRate = 0.15; // 기본 소진율
  const predictedStock = Math.max(0, (store.stock_count || 0) - Math.round(driveTime * depletionRate));
  
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
  
  const stockCount = store.stock_count || 0;
  const isOutOfStock = stockCount === 0;
  const willBeOutOfStock = arrivalData && arrivalData.predictedStock === 0;
  const isUrgent = arrivalData && arrivalData.predictedStock > 0 && arrivalData.predictedStock <= 3;
  
  const badges = {
    plenty: { text: '여유', color: 'bg-green-500' },
    moderate: { text: '보통', color: 'bg-yellow-500' },
    low: { text: '임박', color: 'bg-orange-500' },
    out: { text: '품절', color: 'bg-red-500' }
  };
  
  let stockLevel = 'out';
  if (stockCount > 10) stockLevel = 'plenty';
  else if (stockCount > 5) stockLevel = 'moderate';
  else if (stockCount > 0) stockLevel = 'low';
  
  const badge = badges[stockLevel];
  
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
          <h3 className="font-bold text-lg mb-1">{store.title}</h3>
          <p className="text-sm text-gray-600">📍 {store.address}</p>
          {store.category && (
            <p className="text-xs text-gray-500 mt-1">{store.category}</p>
          )}
        </div>
        <span className={`${badge.color} text-white px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2`}>
          {badge.text} ({stockCount}개)
        </span>
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
      
      <button 
        disabled={isOutOfStock}
        onClick={(e) => {
          e.stopPropagation();
          onNavigate(store);
        }}
        className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all ${
          isOutOfStock 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
        }`}
      >
        {isOutOfStock ? '품절' : '🧭 네이버지도 길 안내'}
      </button>
    </div>
  );
}

export default function App() {
  const [keyword, setKeyword] = useState('두바이쿠키');
  const [region, setRegion] = useState('강남');
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
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
        
        const imageSrc = (store.stock_count || 0) === 0
          ? 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png'
          : 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png';
        
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
            <div style="font-weight:700;margin-bottom:4px;font-size:14px;">${store.title}</div>
            <div style="font-size:12px;color:#666;">재고: ${store.stock_count || 0}개</div>
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
  
  const searchStores = async () => {
    if (!keyword) return;
    
    setLoading(true);
    
    try {
      const searchQuery = region ? `${keyword} ${region}` : keyword;
      const response = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}&display=10`);
      
      if (!response.ok) {
        throw new Error('검색 실패');
      }
      
      const data = await response.json();
      
      const storeData = data.items.map((item, index) => ({
        id: index + 1,
        title: item.title.replace(/<\/?b>/g, ''), // HTML 태그 제거
        address: item.address || item.roadAddress,
        lat: item.mapy ? parseFloat(item.mapy) / 10000000 : 37.5,
        lng: item.mapx ? parseFloat(item.mapx) / 10000000 : 127.0,
        category: item.category,
        telephone: item.telephone,
        link: item.link,
        stock_count: Math.floor(Math.random() * 30) // 임시 재고 (실제로는 별도 DB 필요)
      }));
      
      if (userLocation) {
        storeData.sort((a, b) => {
          const distA = getDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
          const distB = getDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
          return distA - distB;
        });
      }
      
      setStores(storeData);
      
    } catch (error) {
      console.error('검색 오류:', error);
      alert('검색에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    searchStores();
  }, [userLocation]);
  
  const handleStoreClick = (store) => {
    setSelectedStore(store);
    if (map && window.kakao && window.kakao.maps) {
      const moveLatLon = new window.kakao.maps.LatLng(store.lat, store.lng);
      map.panTo(moveLatLon);
    }
  };
  
  const handleNavigation = (store) => {
    if (!userLocation) {
      alert('현재 위치를 확인할 수 없습니다');
      return;
    }
    
    // 네이버 지도 길찾기 URL
    const naverMapUrl = `https://map.naver.com/v5/directions/${userLocation.lng},${userLocation.lat},,/${store.lng},${store.lat},${encodeURIComponent(store.title)},/car`;
    
    // 새 창으로 열기
    window.open(naverMapUrl, '_blank');
  };
  
  return (
    <div className="flex h-screen">
      <div className="w-96 bg-white overflow-y-auto shadow-2xl z-10">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
          <h1 className="text-2xl font-bold mb-2">🗺️ 네이버 매장 찾기</h1>
          <p className="text-sm opacity-90">실제 매장 정보로 길 안내</p>
        </div>
        
        <div className="p-4 bg-white border-b sticky top-0 z-5">
          <input
            type="text"
            placeholder="🔍 검색어 (예: 두바이쿠키)"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchStores()}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="text"
            placeholder="📍 지역 (예: 강남)"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchStores()}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={searchStores}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
          >
            {loading ? '검색 중...' : '🔍 검색'}
          </button>
        </div>
        
        <div className="p-4">
          <div className="text-sm text-gray-600 mb-3">
            총 {stores.length}개 매장 · {userLocation ? '거리순 정렬' : '위치 정보 없음'}
          </div>
          {loading ? (
            <div className="text-center py-12 text-gray-500">검색 중...</div>
          ) : stores.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              검색 결과가 없습니다
            </div>
          ) : (
            stores.map(store => (
              <StoreCard 
                key={store.id} 
                store={store} 
                userLocation={userLocation}
                isActive={selectedStore?.id === store.id}
                onClick={handleStoreClick}
                onNavigate={handleNavigation}
              />
            ))
          )}
        </div>
      </div>
      
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full"></div>
      </div>
    </div>
  );
}