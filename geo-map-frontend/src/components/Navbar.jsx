import React from 'react';
import { Menubar } from 'primereact/menubar';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { InputSwitch } from 'primereact/inputswitch';
import { Draw } from 'ol/interaction';
import { useNavigate } from 'react-router-dom';

const Navbar = ({
                    username, theme, toggleTheme, lang, toggleLang,
                    setIsTableOpen, baseLayer, handleBaseLayerChange,
                    activeType, setActiveType, handleLogout, editMode,
                    t, mapRef, sourceRef, setIsDrawing, handleDrawEnd,
                    userRole, setIsProfileOpen, startMeasure,
                    layerVisibility, setLayerVisibility, isSnapEnabled,
                    setIsSnapEnabled,  setIsThematicModalOpen,setIsRoutePanelOpen, 
                    activeRoute,setDrawMode,
                    userPermissions
                }) => {

    const navigate = useNavigate();

    
    const startDrawing = (type, mode = 'geometry') => {
        if (editMode) return; 
        setDrawMode(mode);   
        setActiveType(type);  
    };

    const layerItemTemplate = (layerKey, label, icon) => {
        return (
            <div className="flex align-items-center justify-content-between w-full p-2 px-3 hover:surface-100 cursor-pointer transition-colors transition-duration-150">
                <div className="flex align-items-center gap-2">
                    <i className={`${icon} text-primary`}></i>
                    <span className="font-medium">{label}</span>
                </div>
                <InputSwitch
                    checked={layerVisibility[layerKey]}
                    onChange={(e) => setLayerVisibility(prev => ({ ...prev, [layerKey]: e.value }))}
                    className="p-inputswitch-sm"
                />
            </div>
        );
    };


    const allMenuItems = [
        {
            id: 'QUERY',
            label: lang === 'tr' ? 'Sorgula' : 'Query',
            icon: 'pi pi-search-plus',
            command: () => setIsTableOpen(true)
        },
        {
            id: 'DRAW',
            label: lang === 'tr' ? 'Çizim Araçları' : 'Drawing Tools',
            icon: 'pi pi-pencil',
            items: [
                {
                    label: t.point,
                    icon: 'pi pi-map-marker',
                    command: () => startDrawing('Point', 'geometry'),
                    disabled: editMode
                },
                {
                    label: t.line,
                    icon: 'pi pi-share-alt',
                    command: () => startDrawing('LineString', 'geometry'),
                    disabled: editMode
                },
                {
                    label: t.polygon,
                    icon: 'pi pi-box',
                    command: () => startDrawing('Polygon', 'geometry'),
                    disabled: editMode
                },
                {
                    
                    separator: true
                },
                {
                   
                    template: (item, options) => {
                        return (
                            <div
                                className="flex align-items-center justify-content-between w-full p-2 px-3 hover:surface-100 cursor-pointer"
                                onClick={() => setIsSnapEnabled(!isSnapEnabled)} 
                            >
                                <div className="flex align-items-center gap-2">
                                    <i className="pi pi-magnet text-primary"></i>
                                    <span className="font-medium">
                                        {lang === 'tr' ? 'Yakalama' : 'Snap'}
                                    </span>
                                </div>
                                <InputSwitch
                                    checked={isSnapEnabled}
                                    onChange={(e) => setIsSnapEnabled(e.value)}
                                />
                            </div>
                        );
                    }
                }
            ]
        },
        {
            id: 'MEASURE',
            label: lang === 'tr' ? 'Ölçüm' : 'Measure',
            icon: 'pi pi-sliders-h',
            items: [
                {
                    label: lang === 'tr' ? 'Mesafe Ölç' : 'Measure Distance',
                    icon: 'pi pi-arrows-h',
                    command: () => startMeasure('distance')
                },
                {
                    label: lang === 'tr' ? 'Alan Ölç' : 'Measure Area',
                    icon: 'pi pi-clone',
                    command: () => startMeasure('area')
                }
            ]
        },
        {
            id: 'ROUTES',
            label: lang === 'tr' ? 'Güzergah Yönetimi' : 'Route Management',
            icon: 'pi pi-directions',
            items: [
                {
                    label: lang === 'tr' ? 'Güzergah Listesi' : 'Route List',
                    icon: 'pi pi-list',
                    command: () => setIsRoutePanelOpen(true)
                },
                {
                    label: lang === 'tr' ? 'Durak Ekle' : 'Add Stop',
                    icon: 'pi pi-map-marker',
                    command: () => startDrawing('Point', 'stop'),
                    disabled: !activeRoute
                },
                {
                    separator: true 
                },
                {
                    
                    template: () => layerItemTemplate('routes', lang === 'tr' ? 'Güzergah Görünürlüğü' : 'Route Visibility', 'pi pi-directions')
                },
                {
                    template: () => layerItemTemplate('stops', lang === 'tr' ? 'Durak Görünürlüğü' : 'Stop Visibility', 'pi pi-map-pin')
                }
            ]
        },
        {
            id: 'THEMATIC',
            label: lang === 'tr' ? 'Tematik Analiz' : 'Thematic Analysis',
            icon: 'pi pi-palette',
            command: () => setIsThematicModalOpen(true)
        },
        {
            id: 'LAYERS',
            label: lang === 'tr' ? 'Katman Yönetimi' : 'Layer Management',
            icon: 'pi pi-list',
            items: [
                { template: () => layerItemTemplate('points', t.point, 'pi pi-map-marker') },
                { template: () => layerItemTemplate('lines', t.line, 'pi pi-share-alt') },
                { template: () => layerItemTemplate('polygons', t.polygon, 'pi pi-box') }
            ]
        }
    ];


    const filteredItems = userRole === 'Admin'
        ? allMenuItems
        : allMenuItems.filter(item => userPermissions.includes(item.id));


    filteredItems.push({
        label: lang === 'tr' ? 'Harita Altlığı' : 'Map Base',
        icon: 'pi pi-images',
        items: [
            {
                label: 'OSM',
                icon: baseLayer === 'OSM' ? 'pi pi-check' : '',
                command: () => handleBaseLayerChange('OSM')
            },
            {
                label: 'Satellite',
                icon: baseLayer === 'Satellite' ? 'pi pi-check' : '',
                command: () => handleBaseLayerChange('Satellite')
            }
        ]
    });

    const start = (
        <div className="flex align-items-center gap-2 cursor-pointer pr-4 border-right-1 border-300 mr-2" onClick={() => setIsProfileOpen(true)}>
            <Avatar
                label={username ? username[0].toUpperCase() : 'SE'}
                size="large"
                shape="circle"
                className={`bg-primary ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}
            />
            <span className="font-bold text-xl hidden md:block">{username || "GeoVision"}</span>
        </div>
    );

    const end = (
        <div className="flex align-items-center gap-2">

            {userRole === 'Admin' && (
                <Button
                    icon="pi pi-cog"
                    label="Admin"
                    severity="danger"
                    size="small"
                    onClick={() => navigate('/admin')}
                    className="p-button-rounded p-button-text px-3 h-3rem" // Yüksekliği diğerleriyle aynı (h-3rem)
                />
            )}


            <Button
                icon={theme === 'light' ? 'pi pi-moon' : 'pi pi-sun'}
                onClick={toggleTheme}
                severity="secondary"
                className="p-button-rounded p-button-text w-3rem h-3rem p-0 flex justify-content-center"
                tooltip={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                tooltipOptions={{ position: 'bottom' }}
            />


            <Button
                label={lang.toUpperCase()}
                onClick={toggleLang}
                severity="secondary"
                className="p-button-rounded p-button-text font-bold w-3rem h-3rem p-0 flex justify-content-center"
            />


            <Button
                icon="pi pi-power-off"
                severity="danger"
                onClick={handleLogout}
                className="p-button-rounded p-button-text w-3rem h-3rem p-0 flex justify-content-center"
                tooltip={t.logout}
                tooltipOptions={{ position: 'bottom' }}
            />
        </div>
    );

    return (
        <div className="card shadow-2">
            <Menubar
                model={filteredItems}
                start={start}
                end={end}
                className="border-noround px-4 py-2"
                style={{ borderRadius: '0' }}
            />
        </div>
    );
};

export default Navbar;