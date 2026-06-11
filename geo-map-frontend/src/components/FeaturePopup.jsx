import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Divider } from 'primereact/divider';
import { ScrollPanel } from 'primereact/scrollpanel';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';

const FeaturePopup = ({
                          selectedFeature, isEditingName, setIsEditingName, tempEditName, setTempEditName,
                          isEditingNote, setIsEditingNote, tempEditNote, setTempEditNote,
                          handleInlineUpdate, formatShapeMeasurement, handleStartEdit, setShowDeleteModal,
                          lang, t, intersectingFeatures, focusOnFeature,
                      }) => {
    if (!selectedFeature) return null;

    const geometryType = selectedFeature.get('type');
    const ownerName = selectedFeature.get('username') || (lang === 'tr' ? 'Bilinmiyor' : 'Unknown');

    return (
        <Card className="shadow-4 border-round-xl w-20rem p-0 overflow-hidden border-none">

           
            <div className="flex flex-column gap-2 mb-3">
                <label className="text-xs font-bold text-500 uppercase">{t.name}</label>
                {isEditingName ? (
                    <div className="p-inputgroup">
                        <InputText
                            value={tempEditName}
                            onChange={(e) => setTempEditName(e.target.value)}
                            autoFocus
                            size="small"
                        />
                        <Button
                            icon="pi pi-save"
                            severity="success"
                            onClick={() => handleInlineUpdate('name')}
                        />
                    </div>
                ) : (
                    <div className="flex align-items-center justify-content-between">
                        <h4 className="m-0 text-900 line-height-2">{selectedFeature.get('name')}</h4>
                        <Button
                            icon="pi pi-pencil"
                            className="p-button-text p-button-secondary p-button-sm"
                            onClick={() => setIsEditingName(true)}
                        />
                    </div>
                )}
            </div>

            
            <div className="flex flex-column gap-1 mb-3">
                <label className="text-xs font-bold text-500 uppercase">
                    {lang === 'tr' ? 'Oluşturan' : 'Created By'}
                </label>
                <div className="flex align-items-center gap-2 bg-bluegray-50 p-2 border-round">
                    <i className="pi pi-user text-primary text-sm"></i>
                    <span className="text-sm font-bold text-primary">
                        {ownerName}
                    </span>
                </div>
            </div>

            
            <div className="flex flex-column gap-2 mb-3">
                <label className="text-xs font-bold text-500 uppercase">{t.note}</label>
                {isEditingNote ? (
                    <div className="p-inputgroup">
                        <InputTextarea
                            value={tempEditNote}
                            onChange={(e) => setTempEditNote(e.target.value)}
                            rows={2}
                            autoResize
                        />
                        <Button
                            icon="pi pi-save"
                            severity="success"
                            onClick={() => handleInlineUpdate('note')}
                        />
                    </div>
                ) : (
                    <div className="flex align-items-start justify-content-between bg-gray-50 p-2 border-round border-1 border-200">
                        <p className="m-0 text-sm text-700 italic">
                            {selectedFeature.get('note') || t.noNote}
                        </p>
                        <Button
                            icon="pi pi-pencil"
                            className="p-button-text p-button-secondary p-button-xs"
                            onClick={() => setIsEditingNote(true)}
                        />
                    </div>
                )}
            </div>

            
            {(geometryType === 'LineString' || geometryType === 'Polygon') && (
                <div className="flex align-items-center gap-2 mb-3 p-2 bg-blue-50 border-round">
                    <i className={`pi ${geometryType === 'LineString' ? 'pi-arrows-h' : 'pi-clone'} text-blue-600`}></i>
                    <span className="text-sm font-bold text-blue-800">
                        {geometryType === 'LineString' ? t.length : t.area}: {formatShapeMeasurement(selectedFeature)}
                    </span>
                </div>
            )}

            <Divider className="my-2" />

            
            {intersectingFeatures && intersectingFeatures.length > 0 && (
                <div className="mb-3">
                    <label className="text-xs font-bold text-500 uppercase block mb-2">
                        {lang === 'tr' ? "Kesişen Şekiller" : "Intersections"}
                    </label>
                    <ScrollPanel style={{ width: '100%', height: '80px' }} className="pr-2">
                        <div className="flex flex-column gap-1">
                            {intersectingFeatures.map(f => (
                                <div
                                    key={f.id}
                                    className="flex flex-column p-2 border-round hover:bg-gray-100 cursor-pointer border-bottom-1 border-100"
                                    onClick={() => focusOnFeature(f.id)}
                                >
                                    <div className="flex align-items-center justify-content-between mb-1">
                                        <span className="text-xs text-800 font-bold"># {f.name}</span>
                                        <Tag value={f.geometryType} className="text-xs" severity="info" />
                                    </div>
                                    
                                    <div className="flex align-items-center gap-1 text-500" style={{ fontSize: '10px' }}>
                                        <i className="pi pi-user" style={{ fontSize: '10px' }}></i>
                                        <span>{f.username || (lang === 'tr' ? 'Bilinmiyor' : 'Unknown')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollPanel>
                </div>
            )}

            
            <div className="flex flex-column gap-1 mb-3 text-xs text-500 font-mono">
                <div className="flex align-items-center gap-1">
                    <i className="pi pi-calendar text-xs"></i>
                    <span>{t.createdAt}: {new Date(selectedFeature.get('createdAt')).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}</span>
                </div>
                {selectedFeature.get('updatedAt') && (
                    <div className="flex align-items-center gap-1">
                        <i className="pi pi-sync text-xs"></i>
                        <span>{t.updatedAt}: {new Date(selectedFeature.get('updatedAt')).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}</span>
                    </div>
                )}
            </div>

            
            <div className="flex gap-2">
                <Button
                    label={t.editPos}
                    icon="pi pi-arrows-alt"
                    className="flex-grow-1 p-button-sm"
                    severity="warning"
                    onClick={handleStartEdit}
                />
                <Button
                    label={t.delete}
                    icon="pi pi-trash"
                    className="p-button-outlined p-button-danger p-button-sm"
                    onClick={() => setShowDeleteModal(true)}
                />
            </div>
        </Card>
    );
};

export default FeaturePopup;