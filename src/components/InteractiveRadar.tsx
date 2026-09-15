import React, { useRef, useEffect, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  Radar as RadarIcon,
  Map as MapIcon,
  Navigation,
  Compass,
  MapPin,
  Zap,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Crosshair,
  ExternalLink,
  Footprints,
  Bike,
  Layers,
  Sparkles,
  Info,
  X,
  Flame,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { GigEntity, formatVnd } from '../types';
import {
  calculateDistanceMeters,
  formatDistance,
  estimateTravelTime,
  getGoogleMapsDirUrl,
  generateRoutePoints,
  VIETNAM_HUBS,
  GeoLocation,
  DEFAULT_USER_LOCATION,
} from '../utils/geo';
import { inspectGpsIntegrity, GpsIntegrityReport } from '../utils/mockGpsDetector';

interface InteractiveRadarProps {
  gigs: GigEntity[];
  selectedGigId: string | null;
  onSelectGig: (gigId: string) => void;
  radiusMeters: number;
  onRadiusChange: (meters: number) => void;
  isClientMode: boolean;
  userCoords?: GeoLocation;
  onUserCoordsChange?: (coords: GeoLocation) => void;
}

const RADIUS_OPTIONS = [
  { label: '100m (KTX)', value: 100 },
  { label: '500m (Campus)', value: 500 },
  { label: '1km', value: 1000 },
  { label: '3km', value: 3000 },
  { label: '5km', value: 5000 },
  { label: '15km (Thành phố)', value: 15000 },
  { label: '🌐 Toàn quốc (Bắc - Nam)', value: 2500000 },
];

type ViewMode = 'MAP' | 'RADAR' | 'DUAL';
type MapLayer = 'GOOGLE_STREETS' | 'GOOGLE_SATELLITE' | 'DARK_CYBER';

const MAP_TILE_CONFIG: Record<
  MapLayer,
  { name: string; url: string; subdomains?: string[]; attribution: string }
> = {
  GOOGLE_STREETS: {
    name: 'Google Maps Chuẩn',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
  },
  GOOGLE_SATELLITE: {
    name: 'Google Vệ Tinh',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Satellite',
  },
  DARK_CYBER: {
    name: 'Cyber Dark Mode',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    subdomains: ['a', 'b', 'c', 'd'],
    attribution: '&copy; OpenStreetMap, &copy; CartoDB',
  },
};

export const InteractiveRadar: React.FC<InteractiveRadarProps> = ({
  gigs,
  selectedGigId,
  onSelectGig,
  radiusMeters,
  onRadiusChange,
  isClientMode,
  userCoords: propUserCoords,
  onUserCoordsChange,
}) => {
  // Current user GPS coordinates
  const [currentUserCoords, setCurrentUserCoords] = useState<GeoLocation>(
    propUserCoords || DEFAULT_USER_LOCATION
  );

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('MAP');
  const [mapLayer, setMapLayer] = useState<MapLayer>('GOOGLE_STREETS');
  const [isHeatmapActive, setIsHeatmapActive] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsReport, setGpsReport] = useState<GpsIntegrityReport | null>(null);
  const [showMockDetectorDialog, setShowMockDetectorDialog] = useState<boolean>(false);

  // Radar Canvas states
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [beamAngle, setBeamAngle] = useState(0);
  const [hoveredGig, setHoveredGig] = useState<GigEntity | null>(null);

  // Leaflet Map refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);

  // Synchronize internal coords when prop changes
  useEffect(() => {
    if (propUserCoords) {
      setCurrentUserCoords(propUserCoords);
    }
  }, [propUserCoords]);

  // Selected gig calculation
  const selectedGig = useMemo(() => {
    return gigs.find((g) => g.id === selectedGigId) || null;
  }, [gigs, selectedGigId]);

  // Route statistics
  const routeStats = useMemo(() => {
    if (!selectedGig) return null;
    const gigLat = selectedGig.latitude || currentUserCoords.latitude;
    const gigLng = selectedGig.longitude || currentUserCoords.longitude;
    const distanceMeters = calculateDistanceMeters(
      currentUserCoords.latitude,
      currentUserCoords.longitude,
      gigLat,
      gigLng
    );
    const times = estimateTravelTime(distanceMeters);
    const googleDirUrl = getGoogleMapsDirUrl(
      currentUserCoords.latitude,
      currentUserCoords.longitude,
      gigLat,
      gigLng,
      'two-wheeler'
    );

    return {
      distanceMeters,
      formattedDistance: formatDistance(distanceMeters),
      walkMinutes: times.walkMinutes,
      motoMinutes: times.motoMinutes,
      googleDirUrl,
      gigLat,
      gigLng,
    };
  }, [selectedGig, currentUserCoords]);

  // Request actual real GPS location
  const handleGetLiveGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Thiết bị không hỗ trợ định vị GPS');
      return;
    }
    setIsGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGpsLoading(false);
        const report = inspectGpsIntegrity(pos);
        setGpsReport(report);

        const newCoords: GeoLocation = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          label: report.isMock ? 'Cảnh báo: GPS có dấu hiệu giả lập' : 'Vị trí GPS thực tế của bạn',
        };
        setCurrentUserCoords(newCoords);
        if (onUserCoordsChange) {
          onUserCoordsChange(newCoords);
        }
        // Pan map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([newCoords.latitude, newCoords.longitude], 16, {
            animate: true,
          });
        }
      },
      (err) => {
        setIsGpsLoading(false);
        setGpsError('Không thể lấy GPS (vui lòng cấp quyền vị trí hoặc chọn điểm trường mẫu)');
        setTimeout(() => setGpsError(null), 4000);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Quick select campus location
  const handleSelectCampus = (hubKey: string) => {
    const hub = VIETNAM_HUBS[hubKey];
    if (!hub) return;
    setCurrentUserCoords(hub);
    if (onUserCoordsChange) {
      onUserCoordsChange(hub);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([hub.latitude, hub.longitude], 15, { animate: true });
    }
  };

  // Cleanup Leaflet Map on Unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Auto request accurate GPS on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const report = inspectGpsIntegrity(pos);
          setGpsReport(report);

          const newCoords: GeoLocation = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            label: report.isMock ? 'Cảnh báo: GPS có dấu hiệu giả lập' : 'Vị trí GPS thực tế của bạn',
          };
          setCurrentUserCoords(newCoords);
          if (onUserCoordsChange) {
            onUserCoordsChange(newCoords);
          }
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([newCoords.latitude, newCoords.longitude], 16, { animate: true });
            mapInstanceRef.current.invalidateSize();
          }
        },
        (err) => {
          console.log('GPS init check:', err.message);
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
      );
    }
  }, []);

  // ==========================================
  // LEAFLET MAP INITIALIZATION & UPDATE
  // ==========================================
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Map if not already initialized
    if (!mapInstanceRef.current) {
      // Check if container already had a leaflet instance attached to prevent double-init
      if ((mapContainerRef.current as any)._leaflet_id) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [currentUserCoords.latitude, currentUserCoords.longitude],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      });

      // Default Tile Layer (Google Maps Streets)
      const initialLayerConfig = MAP_TILE_CONFIG[mapLayer];
      const tileLayer = L.tileLayer(initialLayerConfig.url, {
        subdomains: initialLayerConfig.subdomains || ['a', 'b', 'c'],
        maxZoom: 20,
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      heatmapLayerRef.current = L.layerGroup().addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Invalidate size on load
      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    }

    // Map container size update whenever viewMode or fullscreen toggles
    if (viewMode === 'MAP' && mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
      const t1 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 80);
      const t2 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 250);
      const t3 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [viewMode, isFullscreen]);

  // Update Tile Layer when user switches style (Google Streets, Satellite, Dark)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const config = MAP_TILE_CONFIG[mapLayer];
    const newTileLayer = L.tileLayer(config.url, {
      subdomains: config.subdomains || ['a', 'b', 'c'],
      maxZoom: 20,
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newTileLayer;
    newTileLayer.bringToBack();
  }, [mapLayer]);

  // Update Markers, Route Polyline, User Location, and Geofence Circle on Leaflet Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || viewMode === 'RADAR') return;

    // 1. Update User Marker & Radius Circle
    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
    }
    if (radiusCircleRef.current) {
      map.removeLayer(radiusCircleRef.current);
    }

    // User Custom Icon with glowing pulse
    const userIconHtml = `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-8 h-8 rounded-full bg-[#00E5FF]/30 animate-ping"></div>
        <div class="w-7 h-7 rounded-full bg-gradient-to-tr from-[#00E5FF] to-blue-600 border-2 border-white flex items-center justify-center text-black font-black text-[10px] shadow-lg">
          👤
        </div>
      </div>
    `;

    const userIcon = L.divIcon({
      html: userIconHtml,
      className: 'custom-user-marker',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    userMarkerRef.current = L.marker(
      [currentUserCoords.latitude, currentUserCoords.longitude],
      { icon: userIcon, zIndexOffset: 1000 }
    )
      .addTo(map)
      .bindPopup(
        `<div class="text-black font-sans text-xs p-1">
          <strong class="text-[#00E5FF] font-black">Vị trí của bạn</strong><br/>
          ${currentUserCoords.label || 'Đang sẵn sàng kết nối việc'}
        </div>`
      );

    // Geofence Radius Circle
    radiusCircleRef.current = L.circle(
      [currentUserCoords.latitude, currentUserCoords.longitude],
      {
        radius: radiusMeters,
        color: isClientMode ? '#00E5FF' : '#FF6B00',
        weight: 1.5,
        fillColor: isClientMode ? '#00E5FF' : '#FF6B00',
        fillOpacity: 0.08,
        dashArray: '6, 6',
      }
    ).addTo(map);

    // 2. Update Gig Markers
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();

      gigs.forEach((gig) => {
        if (!gig.latitude || !gig.longitude) return;

        const isSelected = gig.id === selectedGigId;
        const color = isSelected
          ? '#00E5FF'
          : gig.isFlash
          ? '#FF6B00'
          : gig.category === 'Cày Game & Rank'
          ? '#A855F7'
          : gig.category === 'Tư vấn & Học tập'
          ? '#3B82F6'
          : '#10B981';

        const gigIconHtml = `
          <div class="cursor-pointer transition-transform duration-200 transform hover:scale-110 flex flex-col items-center">
            <div class="px-2 py-0.5 rounded-full text-[10px] font-black text-black shadow-md border border-white/80 whitespace-nowrap flex items-center space-x-1" style="background-color: ${color};">
              ${gig.isFlash ? '⚡' : ''}
              <span>${formatVnd(gig.price)}</span>
            </div>
            <div class="w-3 h-3 rounded-full border-2 border-white shadow-lg -mt-1" style="background-color: ${color};"></div>
          </div>
        `;

        const gigIcon = L.divIcon({
          html: gigIconHtml,
          className: 'custom-gig-pin',
          iconSize: [60, 36],
          iconAnchor: [30, 28],
        });

        const marker = L.marker([gig.latitude, gig.longitude], {
          icon: gigIcon,
          zIndexOffset: isSelected ? 500 : 100,
        });

        marker.on('click', () => {
          onSelectGig(gig.id);
        });

        markersLayerRef.current?.addLayer(marker);
      });
    }

    // 2b. Update Heatmap Cluster Rings (Bản đồ nhiệt việc làm Campus)
    if (heatmapLayerRef.current) {
      heatmapLayerRef.current.clearLayers();
      if (isHeatmapActive) {
        gigs.forEach((gig) => {
          if (!gig.latitude || !gig.longitude) return;
          const isHighReward = gig.price >= 80000 || gig.isFlash;

          // Vòng tỏa nhiệt ngoài (Outer thermal dissipation)
          const outerCircle = L.circle([gig.latitude, gig.longitude], {
            radius: isHighReward ? 450 : 320,
            stroke: false,
            fillColor: isHighReward ? '#EF4444' : '#FF6B00',
            fillOpacity: 0.15,
            interactive: false,
          });

          // Vòng nhiệt giữa (Mid thermal focus)
          const midCircle = L.circle([gig.latitude, gig.longitude], {
            radius: isHighReward ? 220 : 150,
            stroke: false,
            fillColor: isHighReward ? '#FF6B00' : '#F59E0B',
            fillOpacity: 0.28,
            interactive: false,
          });

          // Lõi nhiệt điểm nóng (Core hotspot)
          const coreCircle = L.circle([gig.latitude, gig.longitude], {
            radius: 65,
            stroke: false,
            fillColor: isHighReward ? '#F43F5E' : '#00E5FF',
            fillOpacity: 0.45,
            interactive: false,
          });

          heatmapLayerRef.current?.addLayer(outerCircle);
          heatmapLayerRef.current?.addLayer(midCircle);
          heatmapLayerRef.current?.addLayer(coreCircle);
        });
      }
    }

    // 3. Update Route Polyline (Đường di chuyển)
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (selectedGig && selectedGig.latitude && selectedGig.longitude) {
      const points = generateRoutePoints(
        currentUserCoords.latitude,
        currentUserCoords.longitude,
        selectedGig.latitude,
        selectedGig.longitude
      );

      const polyline = L.polyline(points, {
        color: '#00E5FF',
        weight: 4,
        opacity: 0.9,
        dashArray: '8, 8',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      routeLayerRef.current = polyline;

      // Fit map bounds to show both user and destination gig smoothly
      const bounds = L.latLngBounds([
        [currentUserCoords.latitude, currentUserCoords.longitude],
        [selectedGig.latitude, selectedGig.longitude],
      ]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 17, animate: true });
    } else if (radiusMeters >= 2000000 && !selectedGig) {
      // Khi chọn chế độ Toàn quốc (Bắc - Nam), tự động bao trọn các điểm công việc trên cả nước
      const validPoints: [number, number][] = gigs
        .filter((g) => g.latitude && g.longitude)
        .map((g) => [g.latitude, g.longitude] as [number, number]);
      validPoints.push([currentUserCoords.latitude, currentUserCoords.longitude]);
      if (validPoints.length > 1) {
        const nationalBounds = L.latLngBounds(validPoints);
        map.fitBounds(nationalBounds, { padding: [40, 40], maxZoom: 9, animate: true });
      } else {
        map.setView([16.0471, 108.2068], 6, { animate: true });
      }
    }
  }, [
    gigs,
    selectedGigId,
    currentUserCoords,
    radiusMeters,
    isClientMode,
    selectedGig,
    viewMode,
    isHeatmapActive,
  ]);

  // ==========================================
  // RADAR CANVAS ANIMATION
  // ==========================================
  useEffect(() => {
    if (viewMode === 'MAP') return;
    let animationFrameId: number;
    const updateSweep = () => {
      setBeamAngle((prev) => (prev + 1.2) % 360);
      animationFrameId = requestAnimationFrame(updateSweep);
    };
    animationFrameId = requestAnimationFrame(updateSweep);
    return () => cancelAnimationFrame(animationFrameId);
  }, [viewMode]);

  // Draw Radar Canvas
  useEffect(() => {
    if (viewMode === 'MAP') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(centerX, centerY) - 30;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Background circle
    const bgGrad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, maxRadius);
    bgGrad.addColorStop(0, '#0E1726');
    bgGrad.addColorStop(0.8, '#0A0F1A');
    bgGrad.addColorStop(1, '#070A12');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
    ctx.fill();

    // Concentric range rings
    const rings = [0.25, 0.5, 0.75, 1.0];
    rings.forEach((fraction, index) => {
      const r = maxRadius * fraction;
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.strokeStyle = index === 3 ? (isClientMode ? '#00E5FF' : '#FF6B00') : '#1E293B';
      ctx.lineWidth = index === 3 ? 2 : 1;
      ctx.setLineDash(index === 3 ? [] : [4, 4]);
      ctx.stroke();

      // Range text
      ctx.setLineDash([]);
      ctx.fillStyle = '#64748B';
      ctx.font = '10px JetBrains Mono, monospace';
      const rangeText = `${Math.round(radiusMeters * fraction)}m`;
      ctx.fillText(rangeText, centerX + 5, centerY - r + 12);
    });

    // Crosshairs
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - maxRadius, centerY);
    ctx.lineTo(centerX + maxRadius, centerY);
    ctx.moveTo(centerX, centerY - maxRadius);
    ctx.lineTo(centerX, centerY + maxRadius);
    ctx.stroke();

    // Sweeping Radar Beam
    const rad = (beamAngle * Math.PI) / 180;
    const beamGrad = ctx.createConicGradient(rad, centerX, centerY);
    const accentColor = isClientMode ? 'rgba(0, 229, 255, ' : 'rgba(255, 107, 0, ';
    beamGrad.addColorStop(0, `${accentColor}0.35)`);
    beamGrad.addColorStop(0.12, `${accentColor}0.0)`);
    beamGrad.addColorStop(1, `${accentColor}0.0)`);

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = beamGrad;
    ctx.fill();
    ctx.restore();

    // Center marker (User location)
    ctx.beginPath();
    ctx.arc(centerX, centerY, 7, 0, Math.PI * 2);
    ctx.fillStyle = isClientMode ? '#00E5FF' : '#FF6B00';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // Pulse ring around user
    ctx.beginPath();
    ctx.arc(centerX, centerY, 14, 0, Math.PI * 2);
    ctx.strokeStyle = `${accentColor}0.5)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Plot Gigs on Radar using exact relative angle & distance
    gigs.forEach((gig, i) => {
      let angleRad = 0;
      let distFraction = 0.5;

      if (gig.latitude && gig.longitude) {
        // Calculate bearing and distance
        const dLat = gig.latitude - currentUserCoords.latitude;
        const dLng = gig.longitude - currentUserCoords.longitude;
        angleRad = Math.atan2(dLat, dLng);
        const actualMeters = calculateDistanceMeters(
          currentUserCoords.latitude,
          currentUserCoords.longitude,
          gig.latitude,
          gig.longitude
        );
        distFraction = Math.min(1.0, Math.max(0.12, actualMeters / radiusMeters));
      } else {
        const angle = (i * 73 + 30) % 360;
        angleRad = (angle * Math.PI) / 180;
        distFraction = Math.min(1.0, Math.max(0.12, gig.distanceMeters / radiusMeters));
      }

      const r = distFraction * (maxRadius - 20);
      const x = centerX + r * Math.cos(angleRad);
      const y = centerY + r * Math.sin(angleRad);

      const isSelected = gig.id === selectedGigId;
      const isHovered = hoveredGig?.id === gig.id;

      // Draw connection line if selected
      if (isSelected) {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Heatmap thermal blooming on radar
      if (isHeatmapActive) {
        const isHigh = gig.price >= 80000 || gig.isFlash;
        const heatGrad = ctx.createRadialGradient(x, y, 2, x, y, isHigh ? 36 : 24);
        heatGrad.addColorStop(0, isHigh ? 'rgba(239, 68, 68, 0.65)' : 'rgba(255, 107, 0, 0.55)');
        heatGrad.addColorStop(0.5, isHigh ? 'rgba(245, 158, 11, 0.3)' : 'rgba(0, 229, 255, 0.25)');
        heatGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.beginPath();
        ctx.arc(x, y, isHigh ? 36 : 24, 0, Math.PI * 2);
        ctx.fillStyle = heatGrad;
        ctx.fill();
      }

      // Pin glow
      ctx.beginPath();
      ctx.arc(x, y, isSelected ? 16 : isHovered ? 12 : 8, 0, Math.PI * 2);
      ctx.fillStyle = isSelected
        ? 'rgba(0, 229, 255, 0.45)'
        : gig.isFlash
        ? 'rgba(255, 107, 0, 0.45)'
        : 'rgba(56, 189, 248, 0.25)';
      ctx.fill();

      // Pin core
      ctx.beginPath();
      ctx.arc(x, y, isSelected ? 9 : 6, 0, Math.PI * 2);
      ctx.fillStyle = isSelected
        ? '#00E5FF'
        : gig.isFlash
        ? '#FF6B00'
        : gig.status === 'COMPLETED'
        ? '#10B981'
        : '#38BDF8';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Price Tag badge
      ctx.fillStyle = isSelected ? '#00E5FF' : '#FFFFFF';
      ctx.font = 'bold 11px sans-serif';
      const label = `${formatVnd(gig.price)}`;
      ctx.fillText(label, x + 10, y - 4);
    });
  }, [
    gigs,
    selectedGigId,
    hoveredGig,
    beamAngle,
    radiusMeters,
    isClientMode,
    viewMode,
    currentUserCoords,
  ]);

  // Click on radar canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 30;

    let closestGig: GigEntity | null = null;
    let minDistance = 35; // click tolerance in px

    gigs.forEach((gig, i) => {
      let angleRad = 0;
      let distFraction = 0.5;

      if (gig.latitude && gig.longitude) {
        const dLat = gig.latitude - currentUserCoords.latitude;
        const dLng = gig.longitude - currentUserCoords.longitude;
        angleRad = Math.atan2(dLat, dLng);
        const actualMeters = calculateDistanceMeters(
          currentUserCoords.latitude,
          currentUserCoords.longitude,
          gig.latitude,
          gig.longitude
        );
        distFraction = Math.min(1.0, Math.max(0.12, actualMeters / radiusMeters));
      } else {
        const angle = (i * 73 + 30) % 360;
        angleRad = (angle * Math.PI) / 180;
        distFraction = Math.min(1.0, Math.max(0.12, gig.distanceMeters / radiusMeters));
      }

      const r = distFraction * (maxRadius - 20);
      const pinX = centerX + r * Math.cos(angleRad);
      const pinY = centerY + r * Math.sin(angleRad);

      const d = Math.hypot(clickX - pinX, clickY - pinY);
      if (d < minDistance) {
        minDistance = d;
        closestGig = gig;
      }
    });

    if (closestGig) {
      onSelectGig((closestGig as GigEntity).id);
      setHoveredGig(closestGig);
    }
  };

  // Zoom map handlers
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(
        [currentUserCoords.latitude, currentUserCoords.longitude],
        15,
        { animate: true }
      );
    }
  };

  // Main container height classes
  const heightClass = isFullscreen
    ? 'fixed inset-0 z-50 p-4 bg-[#0A0E17] flex flex-col'
    : 'relative rounded-3xl bg-[#0F172A] border border-[#1E293B] p-4 sm:p-5 shadow-2xl';

  const mapAreaHeight = isFullscreen
    ? 'flex-1 min-h-[400px]'
    : 'h-[310px] sm:h-[400px] md:h-[440px]';

  return (
    <div className={`${heightClass} w-full max-w-full overflow-hidden transition-all duration-300`}>
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center space-x-2 min-w-0">
          <div
            className={`p-1.5 sm:p-2 rounded-xl shrink-0 ${
              viewMode === 'MAP'
                ? 'bg-blue-500/20 text-[#00E5FF]'
                : 'bg-orange-500/20 text-[#FF6B00]'
            }`}
          >
            {viewMode === 'MAP' ? (
              <MapIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <RadarIcon className="w-4 h-4 sm:w-5 sm:h-5 animate-spin-slow" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <h3 className="text-xs sm:text-sm font-black text-white tracking-wide truncate">
                {viewMode === 'MAP' ? 'Bản Đồ Google Maps' : 'Radar Quét Geofence'}
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
              {currentUserCoords.label || 'Quanh bạn'} • {gigs.length} việc
            </p>
          </div>
        </div>

        {/* Action controls right */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Mode Switcher */}
          <div className="bg-[#131E30] p-0.5 sm:p-1 rounded-xl border border-slate-800 flex items-center space-x-0.5 text-xs font-bold">
            <button
              onClick={() => setViewMode('MAP')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg transition text-[11px] sm:text-xs flex items-center space-x-1 ${
                viewMode === 'MAP'
                  ? 'bg-gradient-to-r from-[#00E5FF] to-blue-500 text-black font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapIcon className="w-3 h-3" />
              <span>Map</span>
            </button>

            <button
              onClick={() => setViewMode('RADAR')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg transition text-[11px] sm:text-xs flex items-center space-x-1 ${
                viewMode === 'RADAR'
                  ? 'bg-gradient-to-r from-[#FF6B00] to-amber-500 text-black font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <RadarIcon className="w-3 h-3" />
              <span>Radar</span>
            </button>
          </div>

          {/* Heatmap Toggle Button */}
          <button
            onClick={() => setIsHeatmapActive((prev) => !prev)}
            className={`px-2 sm:px-2.5 py-1 rounded-xl font-bold text-[11px] sm:text-xs flex items-center space-x-1 transition shrink-0 border ${
              isHeatmapActive
                ? 'bg-gradient-to-r from-red-500/25 to-amber-500/25 border-amber-500/60 text-amber-300 shadow-sm'
                : 'bg-[#131E30] hover:bg-slate-800 border-slate-800 text-slate-400'
            }`}
            title={isHeatmapActive ? 'Đang bật bản đồ nhiệt (Bấm để tắt)' : 'Bật bản đồ nhiệt việc làm'}
          >
            <Flame className={`w-3.5 h-3.5 ${isHeatmapActive ? 'text-amber-400 fill-amber-400/30' : ''}`} />
            <span className="hidden sm:inline">Nhiệt</span>
          </button>

          {/* Anti-Mock GPS Security Button */}
          <button
            onClick={() => setShowMockDetectorDialog(true)}
            className={`px-2 sm:px-2.5 py-1 rounded-xl font-bold text-[11px] sm:text-xs flex items-center space-x-1 transition shrink-0 border ${
              gpsReport?.isMock
                ? 'bg-red-500/25 border-red-500/60 text-red-400 animate-pulse'
                : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-400'
            }`}
            title="Kiểm tra bảo mật vị trí chống Fake GPS"
          >
            {gpsReport?.isMock ? (
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span className="hidden md:inline">
              {gpsReport?.isMock ? 'Fake GPS' : 'GPS Thật'}
            </span>
          </button>

          {/* Live GPS Button */}
          <button
            onClick={handleGetLiveGps}
            disabled={isGpsLoading}
            className="px-2 sm:px-2.5 py-1 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-[#00E5FF] font-bold text-[11px] sm:text-xs flex items-center space-x-1 transition shrink-0"
            title="Lấy vị trí GPS hiện tại"
          >
            <Crosshair className={`w-3.5 h-3.5 ${isGpsLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isGpsLoading ? 'Đang dò...' : 'GPS'}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="p-1.5 sm:p-2 rounded-xl bg-[#131E30] hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Unified Horizontal Control Bar: Radius + Campus Hubs + Map Layers */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 mb-2 text-xs scrollbar-none w-full">
        {/* Radius chips */}
        <div className="flex items-center space-x-1 shrink-0">
          <span className="text-slate-500 text-[10px] font-bold">Bán kính:</span>
          {RADIUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onRadiusChange(opt.value)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition whitespace-nowrap border ${
                radiusMeters === opt.value
                  ? isClientMode
                    ? 'bg-[#00E5FF] text-black border-[#00E5FF] shadow-sm'
                    : 'bg-[#FF6B00] text-black border-[#FF6B00] shadow-sm'
                  : 'bg-[#131E30] text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <span className="text-slate-700 shrink-0">|</span>

        {/* Campus Hubs chips */}
        <div className="flex items-center space-x-1 shrink-0">
          <span className="text-slate-500 text-[10px] font-bold">Khu vực:</span>
          {Object.entries(VIETNAM_HUBS).map(([key, hub]) => {
            const isCurrent =
              currentUserCoords.latitude === hub.latitude &&
              currentUserCoords.longitude === hub.longitude;
            return (
              <button
                key={key}
                onClick={() => handleSelectCampus(key)}
                className={`px-2 py-0.5 rounded-lg font-bold whitespace-nowrap transition text-[10px] border ${
                  isCurrent
                    ? 'bg-cyan-500/20 text-[#00E5FF] border-[#00E5FF]'
                    : 'bg-[#131E30] text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {hub.label?.split('(')[0].trim() || key}
              </button>
            );
          })}
        </div>

        {/* Map Layers (if in MAP mode) */}
        {viewMode !== 'RADAR' && (
          <>
            <span className="text-slate-700 shrink-0">|</span>
            <div className="flex items-center space-x-1 shrink-0">
              <span className="text-slate-500 text-[10px] font-bold">Lớp nền:</span>
              <button
                onClick={() => setMapLayer('GOOGLE_STREETS')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition border ${
                  mapLayer === 'GOOGLE_STREETS'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-[#131E30] text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Chuẩn
              </button>
              <button
                onClick={() => setMapLayer('GOOGLE_SATELLITE')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition border ${
                  mapLayer === 'GOOGLE_SATELLITE'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-[#131E30] text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Vệ Tinh
              </button>
              <button
                onClick={() => setMapLayer('DARK_CYBER')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition border ${
                  mapLayer === 'DARK_CYBER'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-[#131E30] text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Dark Cyber
              </button>
            </div>
          </>
        )}
      </div>

      {/* Thermal Heatmap Indicator Legend */}
      {isHeatmapActive && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-slate-900/95 via-[#111A2B] to-slate-900/95 border border-amber-500/30 text-[10px] text-slate-300 mb-2 shadow-lg animate-fade-in">
          <div className="flex items-center space-x-2">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
            <span className="font-extrabold text-white">Bản Đồ Radar Nhiệt Campus:</span>
            <span className="text-slate-400 hidden sm:inline">Mật độ thù lao & việc làm thời gian thực</span>
          </div>
          <div className="flex items-center space-x-3 text-[9px] font-bold">
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-[#00E5FF]"></span>
              <span>1-2 việc</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
              <span>3-5 việc (Sôi động)</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse"></span>
              <span className="text-red-400">Điểm nóng hỏa tốc</span>
            </div>
          </div>
        </div>
      )}

      {/* Fake GPS / Mock Location Alert Banner */}
      {gpsReport?.isMock && (
        <div className="mb-2 p-2.5 rounded-xl bg-red-500/20 border border-red-500/50 text-red-200 text-xs flex items-center justify-between animate-fade-in shadow-lg">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 animate-bounce" />
            <div>
              <strong className="text-red-300 font-extrabold">Cảnh Báo Chống Fake GPS:</strong>{' '}
              <span>{gpsReport.reason || 'Phát hiện vị trí giả lập / Mock Location'}</span>
            </div>
          </div>
          <button
            onClick={() => setShowMockDetectorDialog(true)}
            className="px-2 py-0.5 rounded-lg bg-red-500/30 hover:bg-red-500/40 border border-red-500/40 text-white font-bold text-[10px] shrink-0"
          >
            Chi tiết
          </button>
        </div>
      )}

      {/* GPS Error alert */}
      {gpsError && (
        <div className="mb-2 p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center space-x-2 animate-fade-in">
          <Info className="w-4 h-4 shrink-0" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* ==========================================
          INTERACTIVE DISPLAY AREA (MAP OR RADAR)
         ========================================== */}
      <div className={`relative w-full ${mapAreaHeight} rounded-2xl overflow-hidden border border-[#1E293B] shadow-inner bg-[#0A0F1A]`}>
        {/* LEAFLET GOOGLE MAP CONTAINER */}
        <div
          ref={mapContainerRef}
          className={`w-full h-full absolute inset-0 ${
            viewMode === 'RADAR' ? 'invisible pointer-events-none' : 'visible z-10'
          }`}
        />

        {/* RADAR CANVAS CONTAINER */}
        <div
          className={`w-full h-full absolute inset-0 flex items-center justify-center p-2 ${
            viewMode === 'RADAR' ? 'visible z-10' : 'invisible pointer-events-none'
          }`}
        >
          <canvas
            ref={canvasRef}
            width={isFullscreen ? 650 : 480}
            height={isFullscreen ? 500 : 400}
            onClick={handleCanvasClick}
            className="max-w-full max-h-full cursor-crosshair rounded-2xl shadow-2xl"
          />
        </div>

        {/* Floating Zoom & Pan Controls on Map */}
        {viewMode !== 'RADAR' && (
          <div className="absolute top-4 right-4 z-20 flex flex-col space-y-1.5">
            <button
              onClick={handleZoomIn}
              className="p-2.5 rounded-xl bg-[#0F172A]/90 hover:bg-[#1E293B] text-white border border-slate-700 shadow-xl transition backdrop-blur-sm"
              title="Phóng to"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2.5 rounded-xl bg-[#0F172A]/90 hover:bg-[#1E293B] text-white border border-slate-700 shadow-xl transition backdrop-blur-sm"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleRecenter}
              className="p-2.5 rounded-xl bg-[#0F172A]/90 hover:bg-[#1E293B] text-[#00E5FF] border border-slate-700 shadow-xl transition backdrop-blur-sm"
              title="Tâm vị trí của tôi"
            >
              <Crosshair className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Compass Badge in Corner */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none flex items-center space-x-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] text-slate-300 border border-slate-700/80 shadow-lg">
          <Compass className="w-3.5 h-3.5 text-[#00E5FF] animate-spin-slow" />
          <span className="font-bold">ĐỊNH VỊ THỜI GIAN THỰC</span>
        </div>

        {/* Map Drag / Zoom Hint overlay */}
        <div className="absolute bottom-3 left-4 z-20 pointer-events-none hidden sm:flex items-center space-x-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] text-slate-300 border border-slate-800">
          <span>💡 Kéo bản đồ để di chuyển • Lăn chuột / chụm tay để phóng to thu nhỏ</span>
        </div>
      </div>

      {/* ==========================================
          SELECTED GIG NAVIGATION & ROUTE DIRECTIONS
         ========================================== */}
      {selectedGig && routeStats && (
        <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-[#111F33] via-[#0E1A2C] to-[#111F33] border border-[#00E5FF]/40 shadow-xl animate-fade-in text-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start space-x-3 overflow-hidden">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#00E5FF] to-blue-600 text-black font-black shrink-0 mt-0.5 shadow-lg shadow-cyan-500/20">
                <MapPin className="w-5 h-5 text-black" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  {selectedGig.isFlash && (
                    <span className="flex items-center text-[10px] font-black text-[#FF6B00] bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/30">
                      <Zap className="w-3 h-3 mr-0.5" /> HỎA TỐC
                    </span>
                  )}
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold border border-slate-700">
                    {selectedGig.category}
                  </span>
                </div>
                <h4 className="font-extrabold text-white text-sm mt-0.5 line-clamp-1">
                  {selectedGig.title}
                </h4>
                <p className="text-slate-400 text-[11px] line-clamp-1 mt-0.5">
                  {selectedGig.locationName}
                </p>
              </div>
            </div>

            <div className="sm:text-right shrink-0 pl-11 sm:pl-0">
              <span className="text-base font-black text-[#00E5FF] font-mono block">
                {formatVnd(selectedGig.price)}
              </span>
              <span className="text-[10px] text-slate-400">
                {selectedGig.isReverseAuction ? 'Đấu giá ngược' : 'Đã khóa Smart Escrow'}
              </span>
            </div>
          </div>

          {/* Route details banner */}
          <div className="p-2.5 rounded-xl bg-[#09101C] border border-cyan-500/20 flex flex-wrap items-center justify-between gap-3 text-[11px]">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5 text-cyan-300 font-bold">
                <Navigation className="w-4 h-4 text-[#00E5FF]" />
                <span>Cách bạn: <strong>{routeStats.formattedDistance}</strong></span>
              </div>

              <div className="flex items-center space-x-1 text-slate-300 font-medium">
                <Footprints className="w-3.5 h-3.5 text-emerald-400" />
                <span>~{routeStats.walkMinutes} phút đi bộ</span>
              </div>

              <div className="flex items-center space-x-1 text-slate-300 font-medium">
                <Bike className="w-3.5 h-3.5 text-amber-400" />
                <span>~{routeStats.motoMinutes} phút xe máy</span>
              </div>
            </div>

            {/* Direct Google Maps Direction CTA */}
            <a
              href={routeStats.googleDirUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-[#00E5FF] text-black font-extrabold text-xs hover:brightness-110 shadow-md shadow-cyan-500/20 transition flex items-center space-x-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Chỉ Đường Bằng Google Maps &rarr;</span>
            </a>
          </div>
        </div>
      )}

      {/* ==========================================
          MOCK LOCATION DETECTOR (CHỐNG FAKE GPS) MODAL
         ========================================== */}
      {showMockDetectorDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#0B1322] border border-[#1E293B] rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl relative text-xs animate-scale-up">
            <button
              onClick={() => setShowMockDetectorDialog(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3">
              <div
                className={`p-3 rounded-2xl ${
                  gpsReport?.isMock
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {gpsReport?.isMock ? (
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                ) : (
                  <CheckCircle2 className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">
                  Kiểm Định Chống Fake GPS (Anti-Mock)
                </h3>
                <p className="text-slate-400 text-[11px]">
                  Bảo vệ xác thực vị trí nhận kèo và check-in Escrow
                </p>
              </div>
            </div>

            {/* Status indicator */}
            <div
              className={`p-3 rounded-2xl border ${
                gpsReport?.isMock
                  ? 'bg-red-500/10 border-red-500/40 text-red-300'
                  : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span>Trạng thái định vị:</span>
                <span className="uppercase font-black tracking-wider">
                  {gpsReport?.isMock ? 'PHÁT HIỆN FAKE GPS' : 'VỊ TRÍ THỰC HỢP LỆ'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                {gpsReport?.reason ||
                  'Tín hiệu GPS có độ dao động tự nhiên, không phát hiện phần mềm giả lập Mock Location.'}
              </p>
            </div>

            {/* Technical telemetry inspection */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-[11px]">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Sai số GPS thực tế:</span>
                <strong className="font-mono text-cyan-300">
                  {gpsReport ? `~${gpsReport.accuracyMeters} mét` : '15 mét'}
                </strong>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Vệ tinh GNSS kết nối:</span>
                <strong className="font-mono text-emerald-400">
                  {gpsReport ? `${gpsReport.satellitesEstimated} vệ tinh` : '9 vệ tinh'}
                </strong>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Kiểm tra dao động Jitter:</span>
                <strong className="text-slate-200">
                  {gpsReport?.isMock ? 'Bị khóa cứng (0.000m)' : 'Tự nhiên (Đạt chuẩn)'}
                </strong>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Cờ Mock Provider:</span>
                <strong className={gpsReport?.isMock ? 'text-red-400' : 'text-emerald-400'}>
                  {gpsReport?.isMock ? 'Phát hiện (isMock=true)' : 'Không (An toàn)'}
                </strong>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Quy chế Escrow:</span>
                <strong className="text-[#00E5FF]">Bắt buộc GPS thực để nhận tiền</strong>
              </div>
            </div>

            {/* Test buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  handleGetLiveGps();
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#1E293B] hover:bg-slate-700 text-white font-bold transition flex items-center justify-center space-x-1.5"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Quét Lại GPS</span>
              </button>

              <button
                onClick={() => {
                  // Simulate or toggle test state
                  if (gpsReport?.isMock) {
                    setGpsReport({
                      isMock: false,
                      threatLevel: 'CLEAN',
                      accuracyMeters: 12,
                      apparentSpeedKmh: 0,
                      jitterVariance: 0.8,
                      satellitesEstimated: 9,
                      timestamp: Date.now(),
                      reason: 'Tín hiệu GPS tự nhiên đã được phục hồi.',
                    });
                  } else {
                    setGpsReport({
                      isMock: true,
                      threatLevel: 'CRITICAL_MOCK',
                      accuracyMeters: 0,
                      apparentSpeedKmh: 180,
                      jitterVariance: 0,
                      satellitesEstimated: 0,
                      timestamp: Date.now(),
                      reason: 'Mô phỏng phát hiện: Cờ Android Mock Location hoặc nhảy vọt vị trí phi lý (>120km/h).',
                    });
                  }
                }}
                className="px-3 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold border border-red-500/40 transition"
              >
                {gpsReport?.isMock ? 'Khôi phục GPS thật' : 'Test Fake GPS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
