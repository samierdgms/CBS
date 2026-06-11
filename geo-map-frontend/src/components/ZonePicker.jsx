import React, { useEffect, useRef } from 'react';
import 'ol/ol.css';
import { Map, View } from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Draw } from 'ol/interaction';
import { Style, Stroke, Fill } from 'ol/style';
import WKT from 'ol/format/WKT';
import { fromLonLat } from 'ol/proj';

const ZonePicker = ({ initialWkt, onSave, lang }) => {
    const mapElement = useRef();
    const mapRef = useRef();
    const sourceRef = useRef(new VectorSource());

    useEffect(() => {
       
        if (initialWkt) {
            try {
                const format = new WKT();
                const feature = format.readFeature(initialWkt, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857'
                });
                sourceRef.current.addFeature(feature);
            } catch (e) {
                console.error("WKT okuma hatası:", e);
            }
        }

        const map = new Map({
            target: mapElement.current,
            layers: [
                new TileLayer({ source: new OSM() }),
                new VectorLayer({
                    source: sourceRef.current,
                    style: new Style({
                        stroke: new Stroke({ color: '#2ecc71', width: 3 }),
                        fill: new Fill({ color: 'rgba(46, 204, 113, 0.2)' })
                    })
                })
            ],
            view: new View({
                center: fromLonLat([35, 39]), 
                zoom: 5
            })
        });

        
        if (sourceRef.current.getFeatures().length > 0) {
            map.getView().fit(sourceRef.current.getExtent(), { padding: [50, 50, 50, 50], duration: 1000 });
        }

        const draw = new Draw({
            source: sourceRef.current,
            type: 'Polygon'
        });

        draw.on('drawstart', () => {
            sourceRef.current.clear(); 
        });

        draw.on('drawend', (event) => {
            const format = new WKT();
            const wkt = format.writeFeature(event.feature, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
            });
            onSave(wkt); 
        });

        map.addInteraction(draw);
        mapRef.current = map;

       
        setTimeout(() => map.updateSize(), 300);

        return () => map.setTarget(undefined);
    }, [initialWkt]);

    return (
        <div className="flex flex-column gap-2">
            <div
                ref={mapElement}
                style={{ width: '100%', height: '400px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #dee2e6' }}
            />
            <div className="flex align-items-center gap-2 p-2 surface-100 border-round">
                <i className="pi pi-info-circle text-blue-500"></i>
                <small className="text-700">
                    {lang === 'tr'
                        ? "Köşeleri belirlemek için tıklayın. Bitirmek için son noktaya çift tıklayın."
                        : "Click to set corners. Double click on the last point to finish."}
                </small>
            </div>
        </div>
    );
};

export default ZonePicker;