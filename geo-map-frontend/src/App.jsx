import React, { useEffect, useRef, useState, useCallback } from 'react';
import 'ol/ol.css';
import { Map, View, Overlay, Collection , Feature} from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource, XYZ, TileWMS } from 'ol/source';
import { Draw, Modify, Snap } from 'ol/interaction';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Style, Stroke, Fill, Text, Circle as CircleStyle ,Icon } from 'ol/style';
import WKT from 'ol/format/WKT';
import api from './api/api';
import routeApi from './api/routeApi';
import { getCenter } from 'ol/extent';
import { getLength, getArea } from 'ol/sphere';
import { unByKey } from 'ol/Observable';
import { LineString,Point } from 'ol/geom';
import Auth from './pages/Auth';
import { countryCoords, translations } from './constants/constants';
import Navbar from './components/Navbar';
import EditToolbar from './components/EditToolbar';
import FeaturePopup from './components/FeaturePopup';
import InventoryTable from './components/InventoryTable';
import { CountrySearch, DeleteModal } from './components/UIExtras';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';
import TokenCountdown from './components/TokenCountdown';
import { Toast } from 'primereact/toast';
import { Heatmap as HeatmapLayer } from 'ol/layer';
import { Cluster } from 'ol/source';
import ThematicModal from './components/ThematicModal';
import { BrowserRouter as Router, Routes, Route, Navigate,useNavigate } from 'react-router-dom';
import { Sidebar } from 'primereact/sidebar';
import { OrderList } from 'primereact/orderlist';
import { Inplace, InplaceDisplay, InplaceContent } from 'primereact/inplace';
import { InputText } from 'primereact/inputtext';
import { ColorPicker } from 'primereact/colorpicker';
import { Button } from 'primereact/button';
import RouteManager from './components/RouteManager';
import RouteLegend from './components/RouteLegend';
import SimulationControl from './components/SimulationControl';
import * as signalR from '@microsoft/signalr';




function App() {
    const mapElement = useRef();
    const mapRef = useRef();
    const popupRef = useRef();
    const overlayRef = useRef();
    const sourceRef = useRef(new VectorSource());
    const vectorLayerRef = useRef();
    const originalGeometryRef = useRef(null);
    const [token, setToken] = useState(localStorage.getItem('geo_token'));
    const [username, setUsername] = useState(localStorage.getItem('geo_username') || "");
    const [theme, setTheme] = useState('light');
    const [lang, setLang] = useState('tr');
    const [lastCountry, setLastCountry] = useState('Turkey');
    const [baseLayer, setBaseLayer] = useState('OSM');
    const [isDrawing, setIsDrawing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [tempEditName, setTempEditName] = useState("");
    const [tempEditNote, setTempEditNote] = useState("");
    const [activeType, setActiveType] = useState(null);
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [geometries, setGeometries] = useState([]);
    const [isTableOpen, setIsTableOpen] = useState(false);
    const [selectedPointA, setSelectedPointA] = useState(null);
    const [tempMeasureFeature, setTempMeasureFeature] = useState(null);
    const [intersectingFeatures, setIntersectingFeatures] = useState([]);
    const t = translations[lang];
    const [userRole, setUserRole] = useState(localStorage.getItem('geo_role') || "User");
    const [userZone, setUserZone] = useState(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
    const zoneSourceRef = useRef(new VectorSource());
    const measureSourceRef = useRef(new VectorSource());
    const toast = useRef(null);
    const navigate = useNavigate();
    const [isRoutePanelOpen, setIsRoutePanelOpen] = useState(false);
    const [activeRoute, setActiveRoute] = useState(null);
    const [allRoutes, setAllRoutes] = useState([]);
    const [visibleRouteIds, setVisibleRouteIds] = useState([]);
    const [drawMode, setDrawMode] = useState('geometry'); 
    const [isSnapEnabled, setIsSnapEnabled] = useState(false);
    const snapInteractionRef = useRef(null);
    const snapSourceRef = useRef(new VectorSource());
    const [editingRoute, setEditingRoute] = useState(null); 
    const routeModifyInteractionRef = useRef(null);
    const routeSnapInteractionRef = useRef(null);
    const connectionRef = useRef(null);
    const vehicleSourceRef = useRef(new VectorSource()); 
    const tailSourceRef = useRef(new VectorSource());    
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationRouteId, setSimulationRouteId] = useState(null);
    const [simulationMode, setSimulationMode] = useState('idle');
    const isSimulatingRef = useRef(false);
    const simulationModeRef = useRef('idle');
    const animationRef = useRef(null);
    const lastTargetCoordsRef = useRef(null);
    const [selectedStartPoint, setSelectedStartPoint] = useState(null); 
    const currentUserId = localStorage.getItem('geo_userId');
    const [userPermissions, setUserPermissions] = useState([]);
    const [layerVisibility, setLayerVisibility] = useState({
        points: true,
        lines: true,
        polygons: true,
        routes: true, 
        stops: true
    });
    const [isThematicModalOpen, setIsThematicModalOpen] = useState(false);
    const thematicLayerRef = useRef(null);
    const showToast = (severity, detail) => {
        let summary = '';


        if (severity === 'success') summary = lang === 'tr' ? 'Başarılı' : 'Success';
        else if (severity === 'info') summary = lang === 'tr' ? 'Bilgi' : 'Info';
        else if (severity === 'warn') summary = lang === 'tr' ? 'Uyarı' : 'Warning';
        else summary = lang === 'tr' ? 'Hata' : 'Error';

        toast.current.show({
            severity,
            summary,
            detail,
            life: 3000
        });
    };

    const loadSettings = useCallback(async () => { //Kullanıcı giriş yaptığında profil bilgilerini (rol, yetki alanı/zone) ve kişiselleştirilmiş arayüz ayarlarını (tema, dil, son seçilen ülke) API'den çeken ana yükleme fonksiyonu.  
        if (!token) return;

        try {

            const profileRes = await api.get("/Users/profile");
            if (profileRes.data) {
                setUserRole(profileRes.data.role);
                localStorage.setItem('geo_role', profileRes.data.role);
                const perms = Array.isArray(profileRes.data.permissions)
                    ? profileRes.data.permissions
                    : (profileRes.data.permissions ? profileRes.data.permissions.split(',') : []);
                setUserPermissions(perms);
                if (profileRes.data.zoneWkt) setUserZone(profileRes.data.zoneWkt);
            }


            const settingsRes = await api.get("/UserSettings");
            if (settingsRes.data) {
                const data = settingsRes.data;
                setTheme(data.theme || 'light');
                setLang(data.language || 'tr');
                setLastCountry(data.lastSelectedCountry || 'Turkey');
                setBaseLayer(data.preferredBaseLayer || 'OSM');


                if (mapRef.current) {
                    const coords = countryCoords[data.lastSelectedCountry || 'Turkey'];
                    mapRef.current.getView().animate({
                        center: fromLonLat(coords),
                        zoom: 7,
                        duration: 1000
                    });
                }
            }
        } catch (err) {
            console.error("Ayarlar yüklenemedi:", err.response?.data || err.message);
        }
    }, [token]);


    const fetchGeometries = async () => { //Veritabanındaki tüm geometrik verileri (WKT formatında) çeker, OpenLayers özelliklerine (Feature) dönüştürür ve haritadaki sourceRef kaynağına ekler.
        try {
            const res = await api.get("/geometries");
            setGeometries(res.data);

            const format = new WKT();
            const features = res.data.map(item => {
                const feature = format.readFeature(item.wkt, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857'
                });
                feature.setProperties({ id: item.id, name: item.name });
                return feature;
            });

            
            snapSourceRef.current.clear();
            snapSourceRef.current.addFeatures(features);

        } catch (err) {
            console.error("Geometriler yüklenirken hata:", err);
        }
        
        
    };

    const updateSettingsOnServer = async (overrides = {}) => { //Kullanıcının yaptığı arayüz değişikliklerini (tema, dil vb.) backend tarafında kalıcı hale getirmek için kullanılan senkronizasyon fonksiyonu.
        try {
            const payload = {
                theme: overrides.theme !== undefined ? overrides.theme : theme,
                language: overrides.lang !== undefined ? overrides.lang : lang,
                lastSelectedCountry: overrides.lastCountry !== undefined ? overrides.lastCountry : lastCountry,
                preferredBaseLayer: overrides.baseLayer !== undefined ? overrides.baseLayer : baseLayer
            };
            await api.put("/UserSettings", payload);
        } catch (err) { console.error("Sync error:", err); }
    };

    const handleDrawEnd = async (feature) => { //Harita üzerinde çizim işlemi bittiğinde tetiklenir. Çizilen şekli WKT'ye çevirir; eğer "admin zone seçimi" yapılıyorsa oraya, normal çizimse yeni geometri kaydı olarak API'ye gönderir.
        setIsDrawing(false);
        
        const currentDrawType = activeType;
        setActiveType(null);
        const wkt = new WKT().writeFeature(feature, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' });

        if (drawMode === 'stop' && activeRoute && currentDrawType === 'Point') {
            try {
                await routeApi.addStop(activeRoute.id, { name: "Yeni Durak", wkt });
                showToast('success', "Durak eklendi.");
                await fetchAllRoutes();
                const res = await routeApi.getRouteById(activeRoute.id);
                setActiveRoute(res.data);
                refreshWmsLayer();
            } catch (err) {
                showToast('error', "Durak eklenemedi.");
            } finally {
                setDrawMode('geometry'); 
            }
        }
        else {


            try {
                await api.post("/geometries", {
                    name: t.newRecord,
                    note: "",
                    geometryType: feature.getGeometry().getType(),
                    wkt
                });
                showToast('success', lang === 'tr' ? "ŞEKİL EKLENDİ" : "SHAPE ADDED");
                fetchGeometries();
                refreshWmsLayer();
                sourceRef.current.clear();
            } catch (err) {

                const errorMsg = err.response?.status === 400
                    ? t.outOfZoneError
                    : t.error;
                showToast('error', errorMsg);
                sourceRef.current.removeFeature(feature);
            }
        }
    };

    const formatShapeMeasurement = (feature) => { //Popup içerisinde gösterilmek üzere, seçili şeklin o anki güncel uzunluk veya alan bilgisini okunabilir bir metin formatına sokar.
        if (!feature) return null;
        const geom = feature.getGeometry();
        const type = geom.getType();

        if (type === 'LineString') {
            const length = getLength(geom);
            return length > 1000
                ? `${(length / 1000).toFixed(2)} km`
                : `${length.toFixed(2)} m`;
        } else if (type === 'Polygon') {
            const area = getArea(geom);
            return area > 1000000
                ? `${(area / 1000000).toFixed(2)} km²`
                : `${area.toFixed(2)} m²`;
        }
        return null;
    };

    const handleInlineUpdate = async (field) => { //Popup (bilgi penceresi) açıkken isim veya not alanında yapılan anlık değişiklikleri veritabanına kaydeden fonksiyon.
        const wkt = new WKT().writeFeature(selectedFeature, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' });
        const newName = field === 'name' ? tempEditName : selectedFeature.get('name');
        const newNote = field === 'note' ? tempEditNote : selectedFeature.get('note');
        try {
            await api.put(`/geometries/${selectedFeature.get('id')}`, { id: selectedFeature.get('id'), name: newName, note: newNote, geometryType: selectedFeature.get('type'), wkt });
            selectedFeature.setProperties({ name: newName, note: newNote, updatedAt: new Date().toISOString() });
            showToast('success', lang === 'tr' ? "GÜNCELLENDİ" : "UPDATED");
            setIsEditingName(false); setIsEditingNote(false);
            sourceRef.current.clear();
        } catch { showToast('error', lang === 'tr' ? "HATA!" : "ERROR!"); }
    };

    const handleDelete = async () => { //Seçili olan geometrik şekli ID üzerinden veritabanından siler ve harita üzerindeki listeyi günceller.
        try {
            await api.delete(`/geometries/${selectedFeature.get('id')}`);
            showToast('success', lang === 'tr' ? "SİLİNDİ" : "DELETED");
            setShowDeleteModal(false); closePopup(); fetchGeometries();
            sourceRef.current.clear();
            refreshWmsLayer();
        } catch { showToast('error', lang === 'tr' ? "SİLME HATASI!" : "DELETE ERROR!"); }
    };

    const saveUpdate = async () => {//Düzenleme modu (Edit Mode) aktifken yapılan geometri değişikliklerini (nokta kaydırma vb.) ve güncel bilgileri API'ye göndererek kaydeder.
        const wkt = new WKT().writeFeature(selectedFeature, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' });
        try {
            await api.put(`/geometries/${selectedFeature.get('id')}`, { id: selectedFeature.get('id'), name: selectedFeature.get('name'), note: selectedFeature.get('note'), geometryType: selectedFeature.get('type'), wkt });
            showToast('success', lang === 'tr' ? "KAYDEDİLDİ" : "SAVED");
            setEditMode(false); setSelectedFeature(null); fetchGeometries();
            sourceRef.current.clear();
            refreshWmsLayer();
        } catch (err) {

            const errorMsg = err.response?.status === 400 ? t.outOfZoneError : t.error;
            showToast('error', errorMsg);
        }
    };

    const handleStartEdit = () => { if (selectedFeature) { originalGeometryRef.current = selectedFeature.getGeometry().clone(); setEditMode(true); closePopup(true); } }; //Mevcut bir şekli düzenlemeye başlamadan önce şeklin orijinal halini yedekler (hata payı için) ve düzenleme modunu aktif eder.
    const handleCancelEdit = () => { if (selectedFeature && originalGeometryRef.current) { selectedFeature.setGeometry(originalGeometryRef.current); } setEditMode(false); setSelectedFeature(null); }; //Düzenleme modundan vazgeçildiğinde, şekli orijinal koordinatlarına geri döndüren ve modu kapatan geri alma fonksiyonu.
    const closePopup = (keepState = false) => { popupRef.current?.classList.remove('visible'); overlayRef.current?.setPosition(undefined); setIsEditingName(false); setIsEditingNote(false); if (!keepState && !editMode) setSelectedFeature(null); }; //Harita üzerindeki bilgi penceresini (Overlay) kapatır ve seçili olan özellik (Feature) durumunu sıfırlar.
    const filteredCountries = Object.keys(countryCoords).filter(c => (t.countries[c] || c).toLowerCase().includes(searchTerm.toLowerCase())); //Kullanıcının arama kutusuna yazdığı harflere göre ülke listesini anlık olarak filtreleyen türetilmiş değişken.


    const getFeatureStyle = useCallback((feature) => { //Her bir şeklin haritadaki görünümünü (renk, çizgi kalınlığı, etiket/text) seçilme veya düzenleme durumuna göre dinamik olarak hesaplayan stil fonksiyonu.
        const isSelected = selectedFeature && feature.get('id') === selectedFeature.get('id');
        const isEditing = editMode && isSelected;
        if (feature.get('type') === 'editing_route_path') {
            return new Style({
                stroke: new Stroke({
                    color: '#ff4d4d', 
                    width: 6,
                    lineDash: [2, 10] 
                }),
                
                image: new CircleStyle({
                    radius: 5,
                    fill: new Fill({ color: '#ffffff' }),
                    stroke: new Stroke({ color: '#ff4d4d', width: 2 })
                })
            });
        }
        return new Style({
            stroke: new Stroke({ color: isEditing ? '#f39c12' : (isSelected ? '#3498db' : '#2c3e50'), width: isEditing ? 6 : 3 }),
            fill: new Fill({ color: isEditing ? 'rgba(243, 156, 18, 0.4)' : 'rgba(52, 152, 219, 0.2)' }),
            image: new CircleStyle({ radius: 8, fill: new Fill({ color: isEditing ? '#f39c12' : '#e74c3c' }), stroke: new Stroke({ color: '#fff', width: 2 }) }),
            text: new Text({
                text: feature.get('name') || '',
                font: 'bold 13px Inter',
                fill: new Fill({ color: theme === 'dark' ? '#fff' : '#000' }),
                stroke: new Stroke({ color: theme === 'dark' ? '#000' : '#fff', width: 3 }),
                offsetY: -22
            })
        });
    }, [editMode, selectedFeature, theme]);

    const focusOnFeature = async (id) => {

        let feature = sourceRef.current.getFeatures().find(f => f.get('id') === id);

        if (!feature) {

            try {
                const res = await api.get(`/geometries/${id}`);
                const wktFormat = new WKT();
                feature = wktFormat.readFeature(res.data.wkt, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857'
                });
            } catch (err) { return; }
        }

        if (feature && mapRef.current) {
            const geometry = feature.getGeometry();
            mapRef.current.getView().fit(geometry.getExtent(), {
                duration: 1000,
                padding: [100, 100, 100, 100],
                maxZoom: 10
            });
        }
    };

    const getMeasurementFromWkt = (wkt, type) => { //Verilen bir WKT dizisinden LineString ise uzunluk, Polygon ise alan hesaplaması yaparak metrik birimlerde (m/km) sonuç döndüren yardımcı fonksiyon.
        try {
            const format = new WKT();
            const geometry = format.readGeometry(wkt, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
            });

            if (type === 'LineString') {
                const length = getLength(geometry);
                return length > 1000 ? `${(length / 1000).toFixed(2)} km` : `${length.toFixed(2)} m`;
            } else if (type === 'Polygon') {
                const area = getArea(geometry);
                return area > 1000000 ? `${(area / 1000000).toFixed(2)} km²` : `${area.toFixed(2)} m²`;
            }
            return "-";
        } catch (e) { return "-"; }
    };

    const handlePointSelection = (geo) => { //Envanter tablosunda iki nokta arasındaki mesafeyi ölçmek için kullanılır; ilk ve ikinci nokta seçimini yönetir ve araya mesafe çizgisi çizer.
        if (!selectedPointA) {
            setSelectedPointA(geo);
            showToast('info', t.firstPointSelected);
        } else {
            if (selectedPointA.id === geo.id) {
                setSelectedPointA(null);
                return;
            }

            try {
                const format = new WKT();

                const geomA = format.readGeometry(selectedPointA.wkt);
                const geomB = format.readGeometry(geo.wkt);

                const coordsA = geomA.getCoordinates();
                const coordsB = geomB.getCoordinates();


                const lineGeom = new LineString([coordsA, coordsB]);
                const length = getLength(lineGeom, { projection: 'EPSG:4326' });
                const output = length > 1000 ? `${(length / 1000).toFixed(2)} km` : `${length.toFixed(2)} m`;


                const feature = new Feature({
                    geometry: lineGeom.clone().transform('EPSG:4326', 'EPSG:3857')
                });


                feature.setStyle(new Style({
                    stroke: new Stroke({
                        color: '#e67e22',
                        width: 4,
                        lineDash: [10, 10]
                    }),
                    text: new Text({
                        text: output,
                        font: 'bold 14px Inter',
                        fill: new Fill({ color: '#fff' }),
                        stroke: new Stroke({ color: '#e67e22', width: 3 }),
                        placement: 'line',
                        offsetY: -10
                    })
                }));


                if (tempMeasureFeature) measureSourceRef.current.removeFeature(tempMeasureFeature);

                measureSourceRef.current.addFeature(feature);
                setTempMeasureFeature(feature)


                setIsTableOpen(false);

                setTimeout(() => {
                    mapRef.current.getView().fit(feature.getGeometry().getExtent(), {
                        duration: 1000,
                        padding: [100, 100, 100, 100]
                    });
                }, 100);

                showToast('success', `${t.distanceResult} ${output}`);
            } catch (error) {
                console.error(error);
            } finally {
                setSelectedPointA(null);
            }
        }
    };

    const startMeasure = (type) => { //Harita üzerinde etkileşimli olarak serbest çizimle mesafe veya alan ölçümü yapılmasını sağlayan etkileşim (Interaction) başlatıcı. 
        measureSourceRef.current.clear();
        setActiveType(null);

        let draw;
        if (type === 'distance') {
            draw = new Draw({
                source: measureSourceRef.current,
                type: 'LineString',
                maxPoints: 2
            });
        } else {
            draw = new Draw({
                source: measureSourceRef.current,
                type: 'Polygon'
            });
        }

        draw.on('drawend', (evt) => {
            const geom = evt.feature.getGeometry();
            let output;

            if (type === 'distance') {
                const length = getLength(geom);
                output = length > 1000 ? `${(length / 1000).toFixed(2)} km` : `${length.toFixed(2)} m`;
            } else {
                const area = getArea(geom);
                output = area > 1000000 ? `${(area / 1000000).toFixed(2)} km²` : `${area.toFixed(2)} m²`;
            }

            showToast('success', `${lang === 'tr' ? 'Ölçüm Sonucu' : 'Measurement'}: ${output}`);

            mapRef.current.removeInteraction(draw);
        });

        mapRef.current.addInteraction(draw);
    };

    const handleStartMeasure = () => { //Çizim sırasında kullanıcının mouse hareketine göre mesafeyi anlık (real-time) olarak bildirim (Toast) şeklinde gösteren ölçüm aracı.
        mapRef.current.getInteractions().forEach(interaction => {
            if (interaction instanceof Draw) mapRef.current.removeInteraction(interaction);
        });

        const draw = new Draw({
            source: sourceRef.current,
            type: 'LineString',
            style: new Style({
                stroke: new Stroke({ color: '#f39c12', width: 3, lineDash: [10, 10] })
            })
        });

        mapRef.current.addInteraction(draw);

        let listener;
        draw.on('drawstart', (evt) => {
            setIsDrawing(true);
            const sketch = evt.feature;
            listener = sketch.getGeometry().on('change', (e) => {
                const geom = e.target;
                const length = getLength(geom);
                const output = length > 1000
                    ? `${(length / 1000).toFixed(2)} km`
                    : `${length.toFixed(2)} m`;


                showToast('info', `${t.distance}: ${output}`);
            });
        });

        draw.on('drawend', () => {
            unByKey(listener);
            setIsDrawing(false);
            setActiveType(null);
            mapRef.current.removeInteraction(draw);
        });
    };


    const handleLogout = () => { //LocalStorage'daki tüm oturum verilerini temizler, state'leri sıfırlar ve uygulamayı başlangıç (login) haline döndürür.
        localStorage.removeItem('geo_token');
        localStorage.removeItem('geo_username');
        localStorage.removeItem('geo_role');
        localStorage.removeItem('geo_userId');


        setToken(null);
        setUsername("");
        setUserRole("User");
        setUserZone(null);


        if (sourceRef.current) sourceRef.current.clear();


        window.location.reload();
    };

    const handleCountryChange = (country) => { //Seçilen ülkenin koordinatlarına haritayı kaydırır ve bu tercihi kullanıcının sunucu ayarlarında günceller.
        setLastCountry(country);
        setSearchTerm("");
        setIsSearchOpen(false);
        mapRef.current?.getView().animate({ center: fromLonLat(countryCoords[country]), zoom: 7, duration: 1000 });
        updateSettingsOnServer({ lastCountry: country });
    };

    const handleBaseLayerChange = (type) => { //Harita altlığını (OSM veya Uydu görüntüsü) değiştirir ve tercihi kaydeder.
        setBaseLayer(type);
        updateSettingsOnServer({ baseLayer: type });
    };

    const toggleTheme = () => { //Uygulamanın 'light' ve 'dark' modları arasında geçiş yapmasını sağlar. 
        const next = theme === 'light' ? 'dark' : 'light';
        setTheme(next);
        updateSettingsOnServer({ theme: next });
    };

    const toggleLang = () => { //Uygulamanın dilini (TR/EN) değiştirir ve tüm metinlerin (translations) güncellenmesini tetikler.
        const next = lang === 'tr' ? 'en' : 'tr';
        setLang(next);
        updateSettingsOnServer({ lang: next });
    };

    const refreshWmsLayer = () => {
        if (!mapRef.current) return;
        const layers = mapRef.current.getLayers().getArray();


        layers.forEach(layer => {
            if (layer.getSource() instanceof TileWMS) {
                layer.getSource().updateParams({ 't': new Date().getTime() });
            }
        });
    };

    const handleStartRouteEdit = async (route) => {
        if (editingRoute) return;

        setEditMode(false);
        setActiveType(null);
        setEditingRoute(route);

        const format = new WKT();

        
        if (!route.pathWkt) {
            showToast('error', lang === 'tr' ? 'Güzergah yolu eksik!' : 'Route path is missing!');
            return;
        }

        const routeGeometry = format.readGeometry(route.pathWkt, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
        });

        const feature = new Feature({
            geometry: routeGeometry
        });

        feature.setProperties({
            id: route.id,
            type: 'editing_route_path',
            name: route.name
        });

        sourceRef.current.clear();
        sourceRef.current.addFeature(feature);

        mapRef.current.getView().fit(feature.getGeometry().getExtent(), {
            duration: 1000,
            padding: [100, 100, 100, 100]
        });
    };


    const fetchAllRoutes = useCallback(async () => {
        try {
            const res = await routeApi.getAllRoutes();
            setAllRoutes(res.data);
        } catch (err) {
            console.error("Güzergah listesi çekilemedi:", err);
        }
    }, []);
    
    const handleSaveRoutePath = async () => {
        if (!editingRoute) return;

        try {
            const feature = sourceRef.current.getFeatures().find(f => f.get('type') === 'editing_route_path');
            if (!feature) return;

            const newGeom = feature.getGeometry().clone().transform('EPSG:3857', 'EPSG:4326');
            const newCoords = newGeom.getCoordinates();

            const originalPathGeom = new WKT().readGeometry(editingRoute.pathWkt);
            const originalStops = [...editingRoute.stops].sort((a, b) => a.order - b.order);

            
            let maxDistance = -1;
            let furthestPointIndex = -1;

            for (let i = 0; i < newCoords.length; i++) {
                const currentPoint = newCoords[i];
                const closestOnOriginal = originalPathGeom.getClosestPoint(currentPoint);
                const dist = Math.sqrt(
                    Math.pow(currentPoint[0] - closestOnOriginal[0], 2) +
                    Math.pow(currentPoint[1] - closestOnOriginal[1], 2)
                );

                if (dist > maxDistance) {
                    maxDistance = dist;
                    furthestPointIndex = i;
                }
            }

            if (furthestPointIndex === -1 || maxDistance < 0.0001) {
                showToast('info', lang === 'tr' ? 'Değişiklik saptanmadı.' : 'No change.');
                stopEditing();
                return;
            }

            const addedCoord = newCoords[furthestPointIndex];

            
            const stopPositions = originalStops.map(stop => {
                const sc = new WKT().readGeometry(stop.wkt).getCoordinates();
                let minD = Infinity;
                let bestIdx = 0;

                for (let i = 0; i < newCoords.length; i++) {
                    const d = Math.sqrt(Math.pow(newCoords[i][0] - sc[0], 2) + Math.pow(newCoords[i][1] - sc[1], 2));
                    if (d < minD) {
                        minD = d;
                        bestIdx = i;
                    }
                }
                return { order: stop.order, index: bestIdx };
            });

            
            const passedStops = stopPositions.filter(sp => sp.index < furthestPointIndex);
            const targetOrder = passedStops.length + 1;

            

            
            await routeApi.insertStop(editingRoute.id, targetOrder, {
                name: `Durak ${editingRoute.stops.length + 1}`,
                wkt: `POINT(${addedCoord[0]} ${addedCoord[1]})`
            });

            showToast('success', lang === 'tr' ? 'Durak doğru sıraya eklendi' : 'Stop inserted');
            stopEditing();

            await fetchAllRoutes();
            const res = await routeApi.getRouteById(editingRoute.id);
            setActiveRoute(res.data);
            refreshWmsLayer();

        } catch (err) {
            showToast('error', 'Durak eklenemedi.');
        }
    };

    const stopEditing = () => {
        mapRef.current.removeInteraction(routeModifyInteractionRef.current);
        mapRef.current.removeInteraction(routeSnapInteractionRef.current);
        sourceRef.current.clear();
        if (editingRoute) setVisibleRouteIds(prev => [...prev, editingRoute.id]);
        setEditingRoute(null);
        refreshWmsLayer();
    };


    const updateVehiclePosition = useCallback((newCoords, index) => {
        if (!isSimulatingRef.current) return;

        const source = vehicleSourceRef.current;
        let vehicleFeature = source.getFeatures()[0];

        
        if (!vehicleFeature) {
            const feature = new Feature({ geometry: new Point(newCoords) });
            const carStyle = new Style({
                image: new Icon({
                    src: 'https://cdn-icons-png.flaticon.com/512/744/744465.png',
                    scale: [0.08, 0.08],
                    anchor: [0.5, 0.5],
                    crossOrigin: 'anonymous'
                })
            });
            feature.setStyle(carStyle);
            source.addFeature(feature);
            lastTargetCoordsRef.current = newCoords;
            return;
        }

        
        const startCoords = lastTargetCoordsRef.current || vehicleFeature.getGeometry().getCoordinates();
        const endCoords = newCoords;
        const startTime = performance.now();

       
        const duration = 50;

        
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }

        const animate = (now) => {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / duration, 1); 

            
            const currentX = startCoords[0] + (endCoords[0] - startCoords[0]) * t;
            const currentY = startCoords[1] + (endCoords[1] - startCoords[1]) * t;
            const currentPos = [currentX, currentY];

            
            const dx = endCoords[0] - startCoords[0];
            const dy = endCoords[1] - startCoords[1];
            let rotation = Math.atan2(dx, dy);
            let scaleX = dx < 0 ? 0.08 : -0.08;
            rotation = dx < 0 ? rotation + Math.PI / 2 : rotation - Math.PI / 2;

            
            vehicleFeature.getGeometry().setCoordinates(currentPos);
            vehicleFeature.setStyle(new Style({
                image: new Icon({
                    src: 'https://cdn-icons-png.flaticon.com/512/744/744465.png',
                    scale: [scaleX, 0.08],
                    anchor: [0.5, 0.5],
                    rotation: rotation,
                    rotateWithView: true,
                    crossOrigin: 'anonymous'
                })
            }));

            
            updateTail(currentPos);

            if (t < 1) {
                animationRef.current = requestAnimationFrame(animate);
            }
        };

        lastTargetCoordsRef.current = newCoords;
        animationRef.current = requestAnimationFrame(animate);
    }, []);

    const updateTail = (coord) => {
        
        if (!coord || isNaN(coord[0]) || Math.abs(coord[0]) < 0.01) return;

        const source = tailSourceRef.current;
        let lineFeature = source.getFeatures().find(f => f.get('type') === 'tail');

        
        const tailStyle = new Style({
            stroke: new Stroke({
                color: 'rgba(44, 62, 80, 0.8)', 
                width: 5, 
                lineJoin: 'round',
                lineCap: 'round'
            })
        });

        if (!lineFeature) {
            
            lineFeature = new Feature({
                geometry: new LineString([coord]),
                type: 'tail'
            });
            lineFeature.setStyle(tailStyle);
            source.addFeature(lineFeature);
        } else {
           
            const geom = lineFeature.getGeometry();
            const coords = geom.getCoordinates();

            
            const lastCoord = coords[coords.length - 1];
            const distance = Math.sqrt(
                Math.pow(coord[0] - lastCoord[0], 2) +
                Math.pow(coord[1] - lastCoord[1], 2)
            );

            if (distance > 500000) return; 

            coords.push(coord);
            geom.setCoordinates(coords);
        }

        
        source.changed();
    };



    const handleStopSimulation = async () => {
        try {
            const connId = connectionRef.current?.connectionId;
            
            await api.post(`/Simulation/stop?connectionId=${connId}`);

            if (connectionRef.current && activeRoute) {
                await connectionRef.current.invoke("LeaveSimulation", activeRoute.id);
            }
        } catch (e) { console.error(e); }

        setSimulationMode('idle');
        setIsSimulating(false);
        vehicleSourceRef.current.clear();
        tailSourceRef.current.clear();
    };
    
    const handleSelectPointMode = () => {
        setSimulationMode('selecting');
        showToast('info', lang === 'tr' ? "Haritada başlangıç noktasını işaretleyin" : "Mark start point on map");
    };


    const handleMapClickForSimulation = (coordinate) => {
        const wkt = new WKT().writeGeometry(new Point(toLonLat(coordinate)));
        setSelectedStartPoint(wkt);
        setSimulationMode('ready');

        
        vehicleSourceRef.current.clear();
        const tempMarker = new Feature({ geometry: new Point(coordinate) });
        tempMarker.setStyle(new Style({
            image: new Icon({
                src: 'https://cdn-icons-png.flaticon.com/512/2554/2554922.png', 
                scale: 0.05
            })
        }));
        vehicleSourceRef.current.addFeature(tempMarker);
    };


    const handleFinalStartSimulation = async () => {
        if (!activeRoute || !selectedStartPoint || !connectionRef.current) return;

        try {
            const connId = connectionRef.current.connectionId;
            await api.post(`/Simulation/start/${activeRoute.id}?startWkt=${selectedStartPoint}&connectionId=${connId}`);

            if (connectionRef.current) {
                await connectionRef.current.invoke("JoinSimulation", activeRoute.id);
            }
            isSimulatingRef.current = true;
            setSimulationMode('running');
            setIsSimulating(true);

           
            vehicleSourceRef.current.clear(); 
            tailSourceRef.current.clear();
            

            showToast('success', lang === 'tr' ? "Simülasyon başlatıldı" : "Simulation started");
        } catch (err) {
            showToast('error', "Hata oluştu.");
        }
    };
    
    useEffect(() => {
        if (!mapRef.current || simulationMode !== 'selecting' || !activeRoute) return;

        
        const snapSource = new VectorSource();
        if (activeRoute.pathWkt) {
            const format = new WKT();
            const routeFeature = format.readFeature(activeRoute.pathWkt, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
            });
            snapSource.addFeature(routeFeature);
        }

        
        const drawPoint = new Draw({
            type: 'Point',
            
            style: new Style({
                image: new CircleStyle({
                    radius: 6,
                    fill: new Fill({ color: '#ff9800' }),
                    stroke: new Stroke({ color: '#fff', width: 2 })
                })
            })
        });

       
        const snap = new Snap({
            source: snapSource,
            pixelTolerance: 20 
        });

        mapRef.current.addInteraction(drawPoint);
        mapRef.current.addInteraction(snap);

        
        drawPoint.on('drawend', (evt) => {
            const coord = evt.feature.getGeometry().getCoordinates();
            
            handleMapClickForSimulation(coord);

            
            mapRef.current.removeInteraction(drawPoint);
            mapRef.current.removeInteraction(snap);
        });

        return () => {
            if (mapRef.current) {
                mapRef.current.removeInteraction(drawPoint);
                mapRef.current.removeInteraction(snap);
            }
        };
    }, [simulationMode, activeRoute]);

    

    useEffect(() => {
        if (!mapRef.current || !editingRoute) return;

       
        const existingInteractions = mapRef.current.getInteractions().getArray();

        const modify = new Modify({
            source: sourceRef.current,
            pixelTolerance: 20, 
            hitDetection: true,
           
            filter: (feature) => feature.get('type') === 'editing_route_path'
        });

        
        const snap = new Snap({
            source: sourceRef.current,
            pixelTolerance: 15
        });

        mapRef.current.addInteraction(modify);
        mapRef.current.addInteraction(snap);

        routeModifyInteractionRef.current = modify;
        routeSnapInteractionRef.current = snap;

        modify.on('modifyend', () => {
            showToast('info', lang === 'tr' ? 'Nokta taşındı, kaydetmeyi unutmayın.' : 'Point moved, remember to save.');
        });

        return () => {
            if (mapRef.current) {
                mapRef.current.removeInteraction(modify);
                mapRef.current.removeInteraction(snap);
            }
        };
    }, [editingRoute]);

    useEffect(() => {
        if (!token) return;

        
        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl("http://localhost:5154/simulationHub", {
                accessTokenFactory: () => token,
            })
            .withAutomaticReconnect()
            .build();

        newConnection.start()
            .then(() => {
                console.log("SignalR Connected");
                connectionRef.current = newConnection;
            })
            .catch(err => console.error("SignalR Connection Error: ", err));


        newConnection.on("ReceiveLocation", (data) => {
            
            console.log(`[SignalR Gelen] ID: ${data.currentIndex} | Lon: ${data.longitude} | Lat: ${data.latitude}`);

            
            if (!data.longitude || !data.latitude || data.longitude === 0) {
                console.warn("!!! HATALI KOORDİNAT: Veri 0 veya eksik geldi, işlem durduruldu.");
                return;
            }

            const coords = fromLonLat([data.longitude, data.latitude]);

            
            console.log(`[OL Projeksiyon] EPSG:3857 Coords:`, coords);

            updateVehiclePosition(coords, data.currentIndex);

            if (data.isOffRoute) {
                console.error("!!! ARAÇ GÜZERGAH DIŞINA ÇIKTI!");
                showToast('warn', lang === 'tr' ? "Güzergahtan çıkıldı!" : "Off-route detected!");
            }
        });

        return () => {
            if (newConnection) newConnection.stop();
        };
    }, [token]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    useEffect(() => {
        if (!token) return;


        const filter = userRole === 'Admin'
            ? "IsDeleted = false"
            : `UserId = '${currentUserId}' AND IsDeleted = false`;

        const routeIdFilter = visibleRouteIds.length > 0
            ? `\"Id\" IN (${visibleRouteIds.join(',')})`
            : "1=0";

        
        const stopRouteFilter = visibleRouteIds.length > 0
            ? `RouteId IN (${visibleRouteIds.join(',')})`
            : "1=0";

        const combinedRouteFilter = `(${filter}) AND (${routeIdFilter})`;
        const combinedStopFilter = `(${filter}) AND (${stopRouteFilter})`;
        

        const routesWms = new TileLayer({
            properties: { name: 'RoutesLayer' },
            visible: layerVisibility.routes,
            source: new TileWMS({
                url: 'http://localhost:8080/geoserver/geoapp/wms',
                params: {
                    'LAYERS': 'geoapp:Routes', 
                    'TILED': true,
                    't': new Date().getTime(),
                    'CQL_FILTER': combinedRouteFilter
                },
                serverType: 'geoserver',
            }),
            zIndex: 2 
        });
        
        
        const stopsWms = new TileLayer({
            properties: { name: 'StopsLayer' },
            visible: layerVisibility.stops,
            source: new TileWMS({
                url: 'http://localhost:8080/geoserver/geoapp/wms',
                params: {
                    'LAYERS': 'geoapp:Stops',
                    'TILED': true,
                    't': new Date().getTime(),
                    'CQL_FILTER': combinedStopFilter
                },
                serverType: 'geoserver',
            }),
            zIndex: 3 
        });

        
        const pointsWms = new TileLayer({
            properties: { name: 'PointsLayer' },
            visible: layerVisibility.points,
            source: new TileWMS({
                url: 'http://localhost:8080/geoserver/geoapp/wms',
                params: {
                    'LAYERS': 'geoapp:PointsLayer',
                    'TILED': true,
                    'VERSION': '1.1.1',
                    't': new Date().getTime(),
                    'CQL_FILTER': filter
                },
                serverType: 'geoserver',
            }),
            zIndex: 3
        });


        const linesWms = new TileLayer({
            properties: { name: 'LinesLayer' },
            visible: layerVisibility.lines,
            source: new TileWMS({
                url: 'http://localhost:8080/geoserver/geoapp/wms',
                params: {
                    'LAYERS': 'geoapp:LinesLayer',
                    'TILED': true,
                    'VERSION': '1.1.1',
                    't': new Date().getTime(),
                    'CQL_FILTER': filter
                },
                serverType: 'geoserver',
            }),
            zIndex: 2
        });


        const polygonsWms = new TileLayer({
            properties: { name: 'PolygonsLayer' },
            visible: layerVisibility.polygons,
            source: new TileWMS({
                url: 'http://localhost:8080/geoserver/geoapp/wms',
                params: {
                    'LAYERS': 'geoapp:PolygonsLayer',
                    'TILED': true,
                    'VERSION': '1.1.1',
                    't': new Date().getTime(),
                    'CQL_FILTER': filter
                },
                serverType: 'geoserver',
            }),
            zIndex: 1
        });



        const measureLayer = new VectorLayer({
            source: measureSourceRef.current,
            style: new Style({
                stroke: new Stroke({ color: '#27ae60', width: 3, lineDash: [10, 10] }),
                fill: new Fill({ color: 'rgba(39, 174, 96, 0.2)' })
            }),
            zIndex: 10
        });

        const zoneLayer = new VectorLayer({
            source: zoneSourceRef.current,
            style: new Style({
                stroke: new Stroke({ color: 'rgba(231, 76, 60, 0.8)', width: 3, lineDash: [10, 10] }),
                fill: new Fill({ color: 'rgba(231, 76, 60, 0.05)' })
            }),
            zIndex: 0
        });


        if (mapRef.current) {
            mapRef.current.setTarget(undefined);
            mapRef.current = null;
        }

        const overlay = new Overlay({ element: popupRef.current, autoPan: false, positioning: 'bottom-center', stopEvent: true });
        overlayRef.current = overlay;

        const vectorLayer = new VectorLayer({
            source: sourceRef.current,
            style: (f) => getFeatureStyle(f),
            zIndex: 11
        });
        vectorLayerRef.current = vectorLayer;
        


        const map = new Map({
            target: mapElement.current,
            layers: [
                new TileLayer({
                    source: baseLayer === 'Satellite' ?
                        new XYZ({ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' }) :
                        new OSM()
                }),
                polygonsWms,
                linesWms,
                pointsWms,
                routesWms, 
                stopsWms,
                zoneLayer,
                measureLayer,
                vectorLayer,
                new VectorLayer({
                    source: tailSourceRef.current,
                    zIndex: 13
                }),
                new VectorLayer({
                    source: vehicleSourceRef.current,
                    zIndex: 100, 
                    properties: { name: 'VehicleLayer' }
                })
            ],
            overlays: [overlay],
            view: new View({ center: fromLonLat(countryCoords[lastCountry]), zoom: 7 }),
        });

        mapRef.current = map;
        fetchGeometries();

        setTimeout(() => map.updateSize(), 200);

        return () => {
            if (mapRef.current) {

                mapRef.current.getInteractions().clear();




                if (overlayRef.current) {
                    overlayRef.current.setElement(undefined);
                    mapRef.current.removeOverlay(overlayRef.current);
                }
                mapRef.current.setTarget(undefined);
                mapRef.current = null;
            }
        };
        
        

    }, [token, baseLayer,userRole, currentUserId,location.pathname,visibleRouteIds]);



    const applyThematicView = (layerName, type) => {
        if (!mapRef.current || !layerName || !type) return;


        if (thematicLayerRef.current) mapRef.current.removeLayer(thematicLayerRef.current);

        const format = new WKT();
        const targetType = layerName === 'PointsLayer' ? 'Point' :
            layerName === 'LinesLayer' ? 'LineString' : 'Polygon';

        const analysisFeatures = geometries
            .filter(g => g.geometryType === targetType)
            .map(g => {
                const feature = format.readFeature(g.wkt, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857'
                });
                feature.set('id', g.id);
                return feature;
            });

        const vectorSource = new VectorSource({ features: analysisFeatures });

        if (type === 'heatmap') {
            thematicLayerRef.current = new HeatmapLayer({
                source: vectorSource, blur: 20, radius: 10, zIndex: 100
            });
        } else if (type === 'cluster') {
            const clusterSource = new Cluster({ distance: 40, source: vectorSource });
            thematicLayerRef.current = new VectorLayer({
                source: clusterSource,
                style: (feature) => {
                    const size = feature.get('features').length;
                    return new Style({
                        image: new CircleStyle({ radius: 15, fill: new Fill({ color: '#e67e22' }), stroke: new Stroke({ color: '#fff', width: 2 }) }),
                        text: new Text({ text: size.toString(), fill: new Fill({ color: '#fff' }), font: 'bold 12px Inter' })
                    });
                },
                zIndex: 100
            });
        } else {
            thematicLayerRef.current = new VectorLayer({
                source: vectorSource,
                style: (feature) => {
                    const geom = feature.getGeometry();


                    if (type === 'line-weight') {
                        const length = getLength(geom);

                        let color = '#2ecc71';
                        if (length > 100000) color = '#e74c3c';
                        else if (length > 20000) color = '#f39c12';

                        return new Style({
                            stroke: new Stroke({ color: color, width: 4 })
                        });
                    }


                    if (type === 'poly-choropleth') {
                        const areaM2 = getArea(geom);
                        const areaKm2 = areaM2 / 1000000;

                        let color = '#2ecc71';

                        if (areaKm2 > 50000) {
                            color = '#e74c3c';
                        } else if (areaKm2 > 10000) {
                            color = '#f39c12';
                        }



                        return new Style({
                            fill: new Fill({ color: color + '99' }),
                            stroke: new Stroke({ color: color, width: 2 })
                        });
                    }
                },
                zIndex: 100
            });
        }

        mapRef.current.addLayer(thematicLayerRef.current);
        setIsThematicModalOpen(false);
        showToast('success', t.analysisApplied || (lang === 'tr' ? "Analiz başarıyla uygulandı" : "Analysis applied successfully"));
    };


    const clearThematicView = () => {
        if (thematicLayerRef.current) {
            mapRef.current.removeLayer(thematicLayerRef.current);
            thematicLayerRef.current = null;
            showToast('info', lang === 'tr' ? 'Analiz katmanı kaldırıldı' : 'Analysis layer removed');
        }
        setIsThematicModalOpen(false);
    };
    
    useEffect(() => {
        if (token) {
            routeApi.getAllRoutes().then(res => setAllRoutes(res.data));
        }
    }, [token]);
    
    useEffect(() => {
        if (!mapRef.current) return;


        zoneSourceRef.current.clear();

        if (userZone) {
            try {
                const format = new WKT();
                const feature = format.readFeature(userZone, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857'
                });
                zoneSourceRef.current.addFeature(feature);
            } catch (e) {
                console.error("Yetki alanı çizim hatası:", e);
            }
        }
    }, [userZone, token]);

    useEffect(() => {
        if (!mapRef.current) return;
        const layers = mapRef.current.getLayers().getArray();
        const tileLayer = layers.find(l => l instanceof TileLayer);
        if (tileLayer) {
            tileLayer.setSource(baseLayer === 'Satellite' ?
                new XYZ({ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' }) :
                new OSM());
        }
    }, [baseLayer]);

    useEffect(() => {
        if (!mapRef.current || !activeType) return;

       
        const interactions = mapRef.current.getInteractions().getArray();
        interactions
            .filter(i => i instanceof Draw || i instanceof Snap)
            .forEach(i => mapRef.current.removeInteraction(i));

        
        const draw = new Draw({
            source: sourceRef.current,
            type: activeType,
        });

        draw.on('drawend', (event) => {
            handleDrawEnd(event.feature);
            mapRef.current.removeInteraction(draw);
        });

        mapRef.current.addInteraction(draw);

        
        if (isSnapEnabled) {
            const snap = new Snap({
                source: snapSourceRef.current, 
                pixelTolerance: 15 
            });
            mapRef.current.addInteraction(snap);
        }

        return () => {
            mapRef.current.removeInteraction(draw);
        };
    }, [activeType, isSnapEnabled]); 

    useEffect(() => {
        if (!mapRef.current) return;

        if (!editMode && !activeType && !isDrawing && !editingRoute) {
            sourceRef.current.clear();

        }

        const clickHandler = async (e) => {
            measureSourceRef.current.clear();


            if (tempMeasureFeature || editMode || activeType || isDrawing || isSearchOpen || editingRoute) {
                if (isSearchOpen) setIsSearchOpen(false);
                closePopup();
                return;
            }

            if (simulationMode === 'selecting' || simulationMode === 'running') {
                return;
            }

            const vectorFeature = mapRef.current.forEachFeatureAtPixel(
                e.pixel,
                (f) => f,
                {
                    hitTolerance: 10,
                    layerFilter: (layer) => layer === vectorLayerRef.current
                }
            );

            if (vectorFeature) {
                processFeatureSelection(vectorFeature, e.coordinate);
                return;
            }


            const layers = mapRef.current.getLayers().getArray();


            const activeWmsLayers = layers.filter(l =>
                l instanceof TileLayer &&
                l.getSource() instanceof TileWMS &&
                l.getVisible() &&
                ['PointsLayer', 'LinesLayer', 'PolygonsLayer'].includes(l.get('name'))
            );

            if (activeWmsLayers.length > 0) {
                const viewResolution = mapRef.current.getView().getResolution();
                const filter = userRole === 'Admin' ? "1=1" : `UserId = '${currentUserId}'`;


                const layerNames = activeWmsLayers.map(l => `geoapp:${l.get('name')}`).join(',');


                const multipleFilters = activeWmsLayers.map(() => filter).join(';');

                const url = activeWmsLayers[0].getSource().getFeatureInfoUrl(
                    e.coordinate, viewResolution, 'EPSG:3857',
                    {
                        'INFO_FORMAT': 'application/json',
                        'QUERY_LAYERS': layerNames,
                        'LAYERS': layerNames,
                        'CQL_FILTER': multipleFilters
                    }
                );

                if (url) {
                    try {
                        const response = await fetch(url);

                        if (!response.ok) {
                            const errorText = await response.text();
                            console.error("GeoServer Hatası:", errorText);
                            return;
                        }

                        const data = await response.json();

                        if (data.features && data.features.length > 0) {
                            const feature = data.features[0];


                            const featureId = feature.properties.Id || feature.properties.id || feature.id.split('.').pop();



                            overlayRef.current.setPosition(e.coordinate);
                            popupRef.current.classList.add('visible');


                            handleLoadFeatureToVector(featureId, e.coordinate);
                        } else {
                            closePopup();
                        }
                    } catch (err) {
                        closePopup();
                    }
                }
            } else {
                closePopup();
            }
        };


        const handleLoadFeatureToVector = async (id, coordinate) => {

            try {
                const res = await api.get(`/geometries/${id}`);
                const data = res.data;
                const wktFormat = new WKT();
                const feature = wktFormat.readFeature(data.wkt, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857'
                });


                feature.setProperties({
                    id: data.id,
                    name: data.name || "İsimsiz",
                    note: data.note || "",
                    username: data.username,
                    type: data.geometryType,

                    createdAt: data.createdAt || data.CreatedAt || "Tarih Yok",
                    updatedAt: data.updatedAt || data.UpdatedAt || "Tarih Yok"
                });


                

                sourceRef.current.clear();
                sourceRef.current.addFeature(feature);
                setSelectedFeature(feature);
                setTempEditName(data.name || "");
                setTempEditNote(data.note || "");

                const intersectRes = await api.get(`/geometries/${id}/intersections`);
                setIntersectingFeatures(intersectRes.data);

                if (coordinate) {
                    overlayRef.current.setPosition(coordinate);
                    popupRef.current.classList.add('visible');
                }
            } catch (err) {
                console.error("DEBUG HATASI:", err);
            }
        };

        const processFeatureSelection = async (feature, coordinate) => {
            const featureId = feature.get('id');
            setSelectedFeature(feature);
            setTempEditName(feature.get('name'));
            setTempEditNote(feature.get('note') || "");

            try {
                const res = await api.get(`/geometries/${featureId}/intersections`);
                setIntersectingFeatures(res.data);
            } catch (err) { console.error(err); }

            overlayRef.current.setPosition(coordinate);
            popupRef.current.classList.add('visible');
        };

        mapRef.current.on('singleclick', clickHandler);
        return () => mapRef.current?.un('singleclick', clickHandler);

    }, [activeType, editMode, isDrawing, isSearchOpen, token, tempMeasureFeature, theme,editingRoute,simulationMode]);

    useEffect(() => {
        
        if (!mapRef.current || !vectorLayerRef.current) return;

        let modifyInteraction;

        if (editMode && selectedFeature) {
            
            modifyInteraction = new Modify({
                features: new Collection([selectedFeature]),
                pixelTolerance: 15
            });

            mapRef.current.addInteraction(modifyInteraction);
        }

        return () => {
            
            if (modifyInteraction && mapRef.current) {
                mapRef.current.removeInteraction(modifyInteraction);
            }
        };
    }, [editMode, selectedFeature]); 

    useEffect(() => {

        let themeLink = document.getElementById('app-theme');
        const themeName = theme === 'light' ? 'lara-light-blue' : 'lara-dark-blue';
        const themeHref = `/themes/${themeName}/theme.css`;

        if (themeLink) {

            themeLink.href = themeHref;
        } else {

            themeLink = document.createElement('link');
            themeLink.id = 'app-theme';
            themeLink.rel = 'stylesheet';
            themeLink.href = themeHref;
            document.head.appendChild(themeLink);
        }
    }, [theme]);

    useEffect(() => {
        if (!mapRef.current) return;
        const layers = mapRef.current.getLayers().getArray();

        layers.forEach(layer => {
            const name = layer.get('name');
            if (name === 'PointsLayer') layer.setVisible(layerVisibility.points);
            if (name === 'LinesLayer') layer.setVisible(layerVisibility.lines);
            if (name === 'PolygonsLayer') layer.setVisible(layerVisibility.polygons);
            if (name === 'RoutesLayer') layer.setVisible(layerVisibility.routes);
            if (name === 'StopsLayer') layer.setVisible(layerVisibility.stops);
        });
    }, [layerVisibility]);
    
    useEffect(() => {
        if (allRoutes.length > 0 && visibleRouteIds.length === 0) {
            setVisibleRouteIds(allRoutes.map(r => r.id));
        }
    }, [allRoutes]);
    




    return (
        <div className={`app-container ${theme}-mode`}>
            <Toast ref={toast} />

            {!token ? (
                <Auth
                    onLoginSuccess={() => {
                        setToken(localStorage.getItem('geo_token'));
                        setUsername(localStorage.getItem('geo_username'));
                    }}
                    showToast={showToast}
                    lang={lang}
                />
            ) : (
                <Routes>

                    <Route path="/" element={
                        <>
                            <Navbar
                                username={username}
                                theme={theme}
                                toggleTheme={toggleTheme}
                                lang={lang}
                                toggleLang={toggleLang}
                                setIsTableOpen={setIsTableOpen}
                                baseLayer={baseLayer}
                                handleBaseLayerChange={handleBaseLayerChange}
                                activeType={activeType}
                                setActiveType={setActiveType}
                                handleLogout={handleLogout}
                                editMode={editMode}
                                t={t}
                                mapRef={mapRef}
                                sourceRef={sourceRef}
                                setIsDrawing={setIsDrawing}
                                handleDrawEnd={handleDrawEnd}
                                userRole={userRole}
                                setDrawMode={setDrawMode}
                                setIsProfileOpen={setIsProfileOpen}
                                startMeasure={startMeasure}
                                layerVisibility={layerVisibility}
                                setLayerVisibility={setLayerVisibility}
                                setIsThematicModalOpen={setIsThematicModalOpen}
                                userPermissions={userPermissions}
                                isSnapEnabled={isSnapEnabled}
                                setIsSnapEnabled={setIsSnapEnabled}
                                setIsRoutePanelOpen={setIsRoutePanelOpen} 
                                activeRoute={activeRoute}               
                            />

                            <div ref={mapElement} className="map-container">
                                
                                <CountrySearch
                                    isSearchOpen={isSearchOpen}
                                    setIsSearchOpen={setIsSearchOpen}
                                    searchTerm={searchTerm}
                                    setSearchTerm={setSearchTerm}
                                    lastCountry={lastCountry}
                                    filteredCountries={filteredCountries}
                                    handleCountryChange={handleCountryChange}
                                    t={t}
                                />
                                <EditToolbar editMode={editMode} saveUpdate={saveUpdate} handleCancelEdit={handleCancelEdit} t={t} />
                                
                            </div>
                            
                            {editingRoute && (
                                <div className="route-edit-confirmer shadow-4 p-3 border-round surface-card"
                                     style={{
                                         position: 'absolute',
                                         top: '100px', 
                                         left: '50%',
                                         transform: 'translateX(-50%)',
                                         zIndex: 2000, 
                                         display: 'flex',
                                         gap: '10px',
                                         alignItems: 'center',
                                         pointerEvents: 'auto'
                                     }}>
                                      <span className="font-bold text-sm">
                                      <i className="pi pi-directions mr-2 text-orange-500"></i>
                                       {editingRoute.name} {lang === 'tr' ? 'düzenleniyor...' : 'is being edited...'}
                                       </span>
                                    <Button label={t.save} icon="pi pi-check" className="p-button-success p-button-sm" onClick={handleSaveRoutePath} />
                                    <Button label={t.cancel} icon="pi pi-times" className="p-button-secondary p-button-sm" onClick={stopEditing} />
                                </div>
                            )}
                            {(userRole === 'Admin' || userPermissions.includes('ROUTES')) && (
                                <RouteLegend
                                    routes={allRoutes}
                                    activeRoute={activeRoute}
                                    visibleRouteIds={visibleRouteIds}
                                    setVisibleRouteIds={setVisibleRouteIds}
                                    t={t}
                                    onSelectRoute={setActiveRoute}
                                    lang={lang}
                                    onStartRouteEdit={handleStartRouteEdit}
                                    isEditModeActive={!!editingRoute}
                                />
                            )}
                            <SimulationControl
                                isSimulating={isSimulating}
                                simulationMode={simulationMode}
                                activeRoute={activeRoute}
                                onSelectPointClick={handleSelectPointMode} 
                                onStartClick={handleFinalStartSimulation} 
                                onStopClick={handleStopSimulation}        
                                lang={lang}
                            />
                            <RouteManager
                                visible={isRoutePanelOpen}
                                onHide={() => setIsRoutePanelOpen(false)}
                                allRoutes={allRoutes}
                                setAllRoutes={setAllRoutes}
                                activeRoute={activeRoute}
                                setActiveRoute={setActiveRoute}
                                lang={lang}
                                t={t}
                                showToast={showToast}
                                refreshWmsLayer={refreshWmsLayer}
                                setDrawMode={setDrawMode}
                                setActiveType={setActiveType}
                            />
                            <div id="stable-overlay-container" style={{ display: token ? 'block' : 'none' }}>
                                                     <div ref={popupRef} className="ol-popup">
                                    <FeaturePopup
                                        selectedFeature={selectedFeature}
                                        intersectingFeatures={intersectingFeatures}
                                        focusOnFeature={focusOnFeature}
                                        isEditingName={isEditingName}
                                        setIsEditingName={setIsEditingName}
                                        tempEditName={tempEditName}
                                        setTempEditName={setTempEditName}
                                        isEditingNote={isEditingNote}
                                        setIsEditingNote={setIsEditingNote}
                                        tempEditNote={tempEditNote}
                                        setTempEditNote={setTempEditNote}
                                        handleInlineUpdate={handleInlineUpdate}
                                        formatShapeMeasurement={formatShapeMeasurement}
                                        handleStartEdit={handleStartEdit}
                                        setShowDeleteModal={setShowDeleteModal}
                                        lang={lang}
                                        t={t}
                                    />
                                </div>
                            </div>

                            {showDeleteModal && <DeleteModal handleDelete={handleDelete} setShowDeleteModal={setShowDeleteModal} t={t} />}

                            {isTableOpen && (
                                <InventoryTable
                                    geometries={geometries}
                                    selectedPointA={selectedPointA}
                                    handlePointSelection={handlePointSelection}
                                    getMeasurementFromWkt={getMeasurementFromWkt}
                                    focusOnFeature={focusOnFeature}
                                    setIsTableOpen={setIsTableOpen}
                                    lang={lang}
                                    t={t}
                                />
                            )}

                            <ThematicModal
                                visible={isThematicModalOpen}
                                onHide={() => setIsThematicModalOpen(false)}
                                onApply={applyThematicView}
                                onClear={clearThematicView}
                                t={t}
                                lang={lang}
                            />

                            {isProfileOpen && <Profile onClose={() => setIsProfileOpen(false)} showToast={showToast} t={t} />}

                            <TokenCountdown token={token} onLogout={handleLogout} lang={lang} />
                        </>
                    } />


                    <Route path="/admin" element={
                        userRole === 'Admin' ? (
                            <AdminPanel
                                onClose={() => window.location.href = "/"}
                                showToast={showToast}
                                t={t}
                                lang={lang}
                                fetchGeometries={fetchGeometries}
                                theme={theme}
                            />
                        ) : (
                            <Navigate to="/" />
                        )
                    } />
                </Routes>
            )}
        </div>
    );
}

export default App;