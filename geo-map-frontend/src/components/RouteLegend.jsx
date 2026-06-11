import React from 'react';

const RouteLegend = ({
                         routes,
                         activeRoute,
                         visibleRouteIds = [],
                         setVisibleRouteIds,
                         onStartRouteEdit,
                         isEditModeActive,
                         onSelectRoute, 
                         t,
                         lang
                     }) => {

    if (!routes || routes.length === 0) return null;

    
    const toggleVisibility = (e, id) => {
        e.stopPropagation(); 
        if (visibleRouteIds.includes(id)) {
            setVisibleRouteIds(visibleRouteIds.filter(vId => vId !== id));
        } else {
            setVisibleRouteIds([...visibleRouteIds, id]);
        }
    };

    return (
        <div className="route-legend shadow-4 p-3 border-round surface-card text-900 border-1 border-200 fadein animation-duration-500"
             style={{
                 position: 'absolute',
                 bottom: '25px',
                 left: '25px',
                 zIndex: 1000,
                 minWidth: '260px',
                 pointerEvents: 'none'
             }}>

            
            <div className="flex align-items-center gap-2 mb-3 border-bottom-1 border-100 pb-2">
                <i className="pi pi-map text-primary font-bold"></i>
                <span className="font-bold text-sm">
                    {t.activeRoutes || (lang === 'tr' ? "Güzergahlar" : "Routes")}
                </span>
            </div>

            
            <div className="flex flex-column gap-2" style={{ pointerEvents: 'auto' }}>
                {routes.map(r => {
                    const isSelected = activeRoute && r.id === activeRoute.id;
                    const isVisible = visibleRouteIds.includes(r.id);

                    return (
                        <div
                            key={r.id}
                            
                            className={`flex align-items-center justify-content-between p-2 border-round transition-all cursor-pointer ${
                                isSelected ? 'bg-primary-reverse border-left-3 border-primary shadow-2' : 'hover:surface-100'
                            }`}
                            onClick={() => onSelectRoute(r)} 
                        >
                            <div className="flex align-items-center gap-2">

                                
                                <i
                                    className={`pi ${isVisible ? 'pi-eye' : 'pi-eye-slash'} cursor-pointer text-sm transition-colors`}
                                    style={{ color: isVisible ? r.color : '#bdc3c7' }}
                                    onClick={(e) => toggleVisibility(e, r.id)}
                                    title={isVisible ? (lang === 'tr' ? 'Gizle' : 'Hide') : (lang === 'tr' ? 'Göster' : 'Show')}
                                />

                                
                                <i
                                    className={`pi pi-pencil cursor-pointer text-sm hover:text-primary transition-colors ${isEditModeActive && isSelected ? 'text-primary' : 'text-500'}`}
                                    onClick={(e) => {
                                        e.stopPropagation(); 
                                        onStartRouteEdit(r);
                                    }}
                                    title={lang === 'tr' ? 'Güzergahı Düzenle' : 'Edit Route'}
                                />

                                
                                <div style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    backgroundColor: r.color,
                                    opacity: isVisible ? 1 : 0.3,
                                    boxShadow: isVisible ? '0 0 4px rgba(0,0,0,0.3)' : 'none'
                                }}></div>

                                
                                <span className={`text-xs ${isSelected ? 'font-bold' : 'font-medium'} ${!isVisible ? 'text-400 line-through' : ''}`}>
                                    {r.name}
                                </span>
                            </div>

                            
                            {isSelected && (
                                <i className="pi pi-bullseye text-primary scalein animation-duration-300" style={{ fontSize: '0.7rem' }}></i>
                            )}
                        </div>
                    );
                })}
            </div>

            
            {isEditModeActive ? (
                <div className="mt-2 pt-2 border-top-1 border-100 text-center">
                    <small className="text-orange-500 font-bold block scalein">
                        <i className="pi pi-spin pi-spinner mr-1" style={{fontSize: '0.7rem'}}></i>
                        {lang === 'tr' ? 'Güzergah Çizgisi Düzenleniyor...' : 'Editing Path...'}
                    </small>
                </div>
            ) : activeRoute ? (
                <div className="mt-2 pt-2 border-top-1 border-100 text-center">
                    <small className="text-primary font-bold block scalein">
                        <i className="pi pi-info-circle mr-1" style={{fontSize: '0.7rem'}}></i>
                        {lang === 'tr' ? 'Düzenlemek için kaleme basın' : 'Click pencil to edit'}
                    </small>
                </div>
            ) : (
                <div className="text-center mt-2 pt-2 border-top-1 border-100 italic">
                    <small className="text-500">
                        {lang === 'tr' ? 'Düzenlemek için listeden seçin' : 'Select to edit'}
                    </small>
                </div>
            )}
        </div>
    );
};

export default RouteLegend;