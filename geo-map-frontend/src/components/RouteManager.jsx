import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { ColorPicker } from 'primereact/colorpicker';
import { InputText } from 'primereact/inputtext';
import { OrderList } from 'primereact/orderlist';
import { Inplace, InplaceDisplay, InplaceContent } from 'primereact/inplace';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import routeApi from '../api/routeApi';

const RouteManager = ({
                          visible, onHide, allRoutes, setAllRoutes, activeRoute, setActiveRoute,
                          lang, t, showToast, refreshWmsLayer, setDrawMode, setActiveType
                      }) => {

    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newRouteName, setNewRouteName] = useState('');
    const [editingStopId, setEditingStopId] = useState(null);

   

    const handleCreateRoute = async () => {
        if (!newRouteName.trim()) return;
        try {
            const res = await routeApi.createRoute({ name: newRouteName, color: "#3498db" });
            const allRes = await routeApi.getAllRoutes();
            setAllRoutes(allRes.data);
            setActiveRoute(res.data.route);
            showToast('success', t.routeCreated || "Güzergah oluşturuldu.");
            setShowCreateDialog(false);
            setNewRouteName('');
        } catch (err) {
            showToast('error', t.error);
        }
    };

    const confirmDeleteRoute = (id) => {
        confirmDialog({
            message: t.deleteConfirm || "Bu güzergahı ve içindeki tüm durakları silmek istediğinize emin misiniz?",
            header: t.warn || "Uyarı",
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: t.yes || "Evet",
            rejectLabel: t.no || "Hayır",
            acceptClassName: 'p-button-danger',
            accept: () => handleDeleteRoute(id)
        });
    };

    const handleDeleteRoute = async (id) => {
        try {
            await routeApi.deleteRoute(id);
            setAllRoutes(allRoutes.filter(r => r.id !== id));
            if (activeRoute?.id === id) setActiveRoute(null);
            refreshWmsLayer(); 
            showToast('warn', t.routeDeleted || "Güzergah silindi.");
        } catch (err) {
            showToast('error', t.error);
        }
    };

    const handleRouteNameChange = (val) => {
        setActiveRoute(prev => ({ ...prev, name: val }));
    };

    const updateRouteMetadata = async (newName, newColor) => {
        if (!activeRoute) return;
        try {
            await routeApi.updateRoute(activeRoute.id, {
                name: newName || activeRoute.name,
                color: newColor ? `#${newColor}` : activeRoute.color
            });
            const res = await routeApi.getRouteById(activeRoute.id);
            setActiveRoute(res.data);
            const allRes = await routeApi.getAllRoutes();
            setAllRoutes(allRes.data);
            refreshWmsLayer();
        } catch (err) {
            showToast('error', t.error);
        }
    };



    const handleStopUpdate = async (stopId, newName) => {
        if (!newName || !newName.trim()) {
            setEditingStopId(null);
            return;
        }
        try {
            await routeApi.updateStop(activeRoute.id, stopId, { name: newName });

            
            const res = await routeApi.getRouteById(activeRoute.id);
            setActiveRoute(res.data);

           
            refreshWmsLayer();

            
            const allRes = await routeApi.getAllRoutes();
            setAllRoutes(allRes.data);

            setEditingStopId(null);
            showToast('success', t.updated || "Durak adı güncellendi.");
        } catch (err) {
            showToast('error', t.error);
        }
    };

    const handleDeleteStop = async (stopId) => {
        try {
            await routeApi.deleteStop(activeRoute.id, stopId);

           
            const res = await routeApi.getRouteById(activeRoute.id);
            setActiveRoute(res.data);

            
            refreshWmsLayer();

            showToast('info', t.deleted || "Durak kaldırıldı.");
        } catch (err) {
            showToast('error', t.error);
        }
    };

    const handleStopReorder = async (newList) => {
        setActiveRoute(prev => ({ ...prev, stops: newList }));
        try {
            await routeApi.reorderStops(activeRoute.id, newList.map(s => s.id));
            refreshWmsLayer();
        } catch (err) {
            showToast('error', t.error);
        }
    };

    return (
        <>
            <ConfirmDialog />

            <Dialog
                header={t.routeManagerTitle || "Güzergah ve Durak Paneli"}
                visible={visible}
                onHide={onHide}
                style={{ width: '75vw' }}
                maximizable modal
                className="route-manager-dialog"
            >
                <div className="grid">
                   
                    <div className="col-12 md:col-4 border-right-1 border-200">
                        <div className="flex justify-content-between align-items-center mb-3 px-2">
                            <span className="text-xl font-bold">{t.lists || "Listeler"}</span>
                            <Button
                                icon="pi pi-plus"
                                className="p-button-success p-button-sm p-button-rounded"
                                onClick={() => setShowCreateDialog(true)}
                                tooltip={t.newRoute}
                            />
                        </div>
                        <DataTable
                            value={allRoutes}
                            selectionMode="single"
                            selection={activeRoute}
                            onSelectionChange={(e) => setActiveRoute(e.value)}
                            dataKey="id"
                            scrollable scrollHeight="450px"
                            className="p-datatable-sm"
                        >
                            <Column field="name" header={t.routeName || "Güzergah"} />
                            <Column body={(rowData) => (
                                <Button
                                    icon="pi pi-trash"
                                    className="p-button-text p-button-danger p-0 w-2rem h-2rem"
                                    onClick={() => confirmDeleteRoute(rowData.id)}
                                />
                            )} style={{ width: '3.5rem' }} />
                        </DataTable>
                    </div>

                   
                    <div className="col-12 md:col-8 p-3">
                        {activeRoute ? (
                            <>
                                <div className="flex align-items-center justify-content-between mb-4 surface-50 p-2 border-round border-1 border-200">
                                    <div className="flex align-items-center gap-2 flex-grow-1">
                                        <ColorPicker
                                            value={activeRoute.color?.replace('#','')}
                                            onChange={(e) => updateRouteMetadata(null, e.value)}
                                        />
                                        <InputText
                                            value={activeRoute.name || ''}
                                            onChange={(e) => handleRouteNameChange(e.target.value)}
                                            onBlur={(e) => updateRouteMetadata(e.target.value, null)}
                                            className="font-bold border-none bg-transparent p-1 text-xl w-full"
                                            style={{ color: activeRoute.color }}
                                        />
                                    </div>
                                    <Button
                                        label={t.addStop || "Durak Ekle"}
                                        icon="pi pi-map-marker"
                                        className="p-button-sm p-button-raised ml-2"
                                        onClick={() => {
                                            setDrawMode('stop');
                                            setActiveType('Point');
                                            onHide(); 
                                        }}
                                    />
                                </div>

                                <OrderList
                                    value={activeRoute.stops}
                                    onChange={(e) => handleStopReorder(e.value)}
                                    dragdrop
                                    className="compact-orderlist"
                                    itemTemplate={(item) => (
                                        <div className="flex align-items-center p-1 px-2 gap-2 surface-card border-round mb-1 shadow-1 border-1 border-100">
                                            <i className="pi pi-bars cursor-move text-400" />
                                            <Tag value={item.order} severity="info" />

                                            <div className="flex-grow-1 flex align-items-center">
                                                <Inplace
                                                    active={editingStopId === item.id}
                                                    onActivate={() => setEditingStopId(item.id)}
                                                    onDeactivate={() => setEditingStopId(null)}
                                                    closable={false}
                                                    className="flex-grow-1"
                                                >
                                                    <InplaceDisplay className="py-1 px-2 w-full text-left">
                                                        {item.name || "İsimsiz"}
                                                    </InplaceDisplay>
                                                    <InplaceContent>
                                                        <InputText
                                                            className="p-inputtext-sm w-full"
                                                            autoFocus
                                                            defaultValue={item.name}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleStopUpdate(item.id, e.target.value);
                                                                if (e.key === 'Escape') setEditingStopId(null);
                                                            }}
                                                            onBlur={(e) => handleStopUpdate(item.id, e.target.value)}
                                                        />
                                                    </InplaceContent>
                                                </Inplace>

                                                
                                                <Button
                                                    icon="pi pi-pencil"
                                                    className="p-button-rounded p-button-text p-button-info p-0 w-2rem h-2rem"
                                                    onClick={() => setEditingStopId(item.id)}
                                                />
                                            </div>

                                            <Button
                                                icon="pi pi-times"
                                                className="p-button-rounded p-button-danger p-button-text p-0 w-2rem h-2rem"
                                                onClick={() => handleDeleteStop(item.id)}
                                            />
                                        </div>
                                    )}
                                />
                            </>
                        ) : (
                            <div className="text-center py-8 text-500">
                                <i className="pi pi-directions text-6xl mb-3"></i>
                                <p>{t.selectRoute || "Düzenlemek için bir güzergah seçin."}</p>
                            </div>
                        )}
                    </div>
                </div>
            </Dialog>

            {/* Yeni Güzergah Dialogu */}
            <Dialog
                header={t.newRoute || "Yeni Güzergah Oluştur"}
                visible={showCreateDialog}
                onHide={() => setShowCreateDialog(false)}
                style={{ width: '350px' }}
                footer={
                    <div>
                        <Button label={t.cancel} icon="pi pi-times" onClick={() => setShowCreateDialog(false)} className="p-button-text" />
                        <Button label={t.save} icon="pi pi-check" onClick={handleCreateRoute} autoFocus />
                    </div>
                }
            >
                <div className="flex flex-column gap-2 mt-2">
                    <label htmlFor="routeName" className="text-sm font-bold">{t.name || "Güzergah Adı"}</label>
                    <InputText
                        id="routeName"
                        value={newRouteName}
                        onChange={(e) => setNewRouteName(e.target.value)}
                        autoFocus
                        className="w-full"
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateRoute()}
                    />
                </div>
            </Dialog>
        </>
    );
};

export default RouteManager;