import React from 'react';
import { Button } from 'primereact/button';

const SimulationControl = ({
                               isSimulating,
                               simulationMode, 
                               activeRoute,
                               onSelectPointClick, 
                               onStartClick,       
                               onStopClick,        
                               lang
                           }) => {
    if (!activeRoute) return null;

    return (
        <div className="simulation-control shadow-4 p-3 border-round surface-card text-900 border-1 border-200"
             style={{
                 position: 'absolute',
                 bottom: '25px',
                 left: '300px',
                 zIndex: 1000,
                 minWidth: '240px',
                 pointerEvents: 'auto'
             }}>

            <div className="flex align-items-center gap-2 mb-3 border-bottom-1 border-100 pb-2">
                <i className="pi pi-play-circle text-orange-500 font-bold"></i>
                <span className="font-bold text-sm">
                    {lang === 'tr' ? "Simülasyon Paneli" : "Simulation Panel"}
                </span>
            </div>

            <div className="flex flex-column gap-3">
                
                {simulationMode === 'selecting' && (
                    <small className="text-orange-500 italic">
                        <i className="pi pi-info-circle mr-1"></i>
                        {lang === 'tr' ? "Haritadan bir noktaya tıklayın" : "Click a point on map"}
                    </small>
                )}
                {simulationMode === 'ready' && (
                    <small className="text-green-500 font-bold">
                        <i className="pi pi-check-circle mr-1"></i>
                        {lang === 'tr' ? "Nokta seçildi, başlatabilirsiniz" : "Point selected, you can start"}
                    </small>
                )}

                
                <div className="flex flex-column gap-2">
                    {simulationMode !== 'running' ? (
                        <>
                            <Button
                                label={lang === 'tr' ? "Konum Seç" : "Select Location"}
                                icon="pi pi-map-marker"
                                className={`p-button-sm ${simulationMode === 'selecting' ? 'p-button-help' : 'p-button-outlined'}`}
                                onClick={onSelectPointClick}
                                disabled={isSimulating}
                            />
                            <Button
                                label={lang === 'tr' ? "Simülasyonu Başlat" : "Start Simulation"}
                                icon="pi pi-play"
                                className="p-button-sm p-button-success"
                                onClick={onStartClick}
                                disabled={simulationMode !== 'ready'}
                            />
                        </>
                    ) : (
                        <Button
                            label={lang === 'tr' ? "Simülasyonu Durdur" : "Stop"}
                            icon="pi pi-stop"
                            className="p-button-sm p-button-danger"
                            onClick={onStopClick}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default SimulationControl;