import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';

const ThematicModal = ({ visible, onHide, onApply, onClear, t, lang }) => {
    const [selectedLayer, setSelectedLayer] = useState(null);
    const [selectedType, setSelectedType] = useState(null);

    
    useEffect(() => {
        if (!visible) {
            setSelectedLayer(null);
            setSelectedType(null);
        }
    }, [visible]);

    const layers = [
        {
            label: lang === 'tr' ? 'Nokta Katmanı' : 'Point Layer',
            value: 'PointsLayer',
            type: 'Point',
            icon: 'pi pi-map-marker'
        },
        {
            label: lang === 'tr' ? 'Çizgi Katmanı' : 'Line Layer',
            value: 'LinesLayer',
            type: 'LineString',
            icon: 'pi pi-share-alt'
        },
        {
            label: lang === 'tr' ? 'Alan Katmanı' : 'Polygon Layer',
            value: 'PolygonsLayer',
            type: 'Polygon',
            icon: 'pi pi-box'
        }
    ];

    const getOptionsByLayer = () => {
        const layer = layers.find(l => l.value === selectedLayer);
        if (!layer) return [];

        if (layer.type === 'Point') return [
            { label: lang === 'tr' ? 'Isı Haritası (Heatmap)' : 'Heatmap Analysis', value: 'heatmap' },
            { label: lang === 'tr' ? 'Kümeleme (Cluster)' : 'Cluster Analysis', value: 'cluster' }
        ];
        if (layer.type === 'LineString') return [
            { label: lang === 'tr' ? 'Uzunluk Analizi (Metrik)' : 'Length Analysis (Metric)', value: 'line-weight' }
        ];
        if (layer.type === 'Polygon') return [
            { label: lang === 'tr' ? 'Alan Analizi (m²)' : 'Area Analysis (m²)', value: 'poly-choropleth' }
        ];
        return [];
    };

   
    const layerOptionTemplate = (option) => {
        return (
            <div className="flex align-items-center">
                <i className={`${option.icon} mr-2 text-primary`}></i>
                <div>{option.label}</div>
            </div>
        );
    };

    return (
        <Dialog
            header={
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-chart-bar text-primary text-xl"></i>
                    <span>{t.thematicAnalysis || (lang === 'tr' ? 'Tematik Analiz' : 'Thematic Analysis')}</span>
                </div>
            }
            visible={visible}
            style={{ width: '400px' }}
            onHide={onHide}
            className="p-fluid shadow-4"
            footer={
                <div className="flex justify-content-between border-top-1 border-200 pt-3">
                    <Button
                        label={lang === 'tr' ? "Temizle" : "Clear"}
                        icon="pi pi-trash"
                        onClick={onClear}
                        className="p-button-danger p-button-text p-button-sm"
                    />
                    <div className="flex gap-2">
                        <Button label={t.cancel} onClick={onHide} className="p-button-text p-button-sm" />
                        <Button
                            label={lang === 'tr' ? "Uygula" : "Apply"}
                            icon="pi pi-check"
                            onClick={() => onApply(selectedLayer, selectedType)}
                            disabled={!selectedType}
                            severity="primary"
                            raised
                        />
                    </div>
                </div>
            }
        >
            <div className="flex flex-column gap-4 mt-2">
                
                <div className="field">
                    <label className="font-bold block mb-2 text-800">
                        <i className="pi pi-layers mr-2 text-primary"></i>
                        {lang === 'tr' ? 'Hedef Katman' : 'Target Layer'}
                    </label>
                    <Dropdown
                        value={selectedLayer}
                        options={layers}
                        onChange={(e) => {
                            setSelectedLayer(e.value);
                            setSelectedType(null); 
                        }}
                        placeholder={lang === 'tr' ? "Bir katman seçin" : "Select a layer"}
                        itemTemplate={layerOptionTemplate}
                        className="w-full border-round-lg"
                    />
                </div>

                
                <div className={`field transition-all transition-duration-300 ${!selectedLayer ? 'opacity-50' : 'opacity-100'}`}>
                    <label className="font-bold block mb-2 text-800">
                        <i className="pi pi-cog mr-2 text-primary"></i>
                        {lang === 'tr' ? 'Analiz Yöntemi' : 'Analysis Method'}
                    </label>
                    <Dropdown
                        value={selectedType}
                        options={getOptionsByLayer()}
                        onChange={(e) => setSelectedType(e.value)}
                        placeholder={selectedLayer ? (lang === 'tr' ? "Yöntem seçin" : "Select method") : (lang === 'tr' ? "Önce katman seçin" : "Select layer first")}
                        disabled={!selectedLayer}
                        className="w-full border-round-lg"
                    />
                </div>

                {!selectedLayer && (
                    <div className="bg-blue-50 p-3 border-round-lg flex align-items-start gap-3">
                        <i className="pi pi-info-circle text-blue-500 mt-1"></i>
                        <small className="text-blue-700">
                            {lang === 'tr'
                                ? "Analiz seçeneklerini görmek için lütfen listeden bir veri katmanı seçiniz."
                                : "Please select a data layer from the list to see available analysis options."}
                        </small>
                    </div>
                )}
            </div>
        </Dialog>
    );
};

export default ThematicModal;