import React, { useState, useEffect, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import api from '../api/api'; 

const InventoryTable = ({
                            selectedPointA,
                            handlePointSelection,
                            getMeasurementFromWkt,
                            focusOnFeature,
                            setIsTableOpen,
                            lang,
                            t
                        }) => {
   
    const [tableData, setTableData] = useState([]); 
    const [totalRecords, setTotalRecords] = useState(0); 
    const [loading, setLoading] = useState(false); 
    const [lazyParams, setLazyParams] = useState({
        first: 0,
        rows: 8, 
        page: 1,
        search: ''
    });

    
    const loadLazyData = useCallback(async () => {
        setLoading(true);
        try {
            
            const res = await api.get("/geometries/paged", {
                params: {
                    page: lazyParams.page,
                    pageSize: lazyParams.rows,
                    search: lazyParams.search
                }
            });

           
            if (res.data) {
                setTableData(res.data.items || []);
                setTotalRecords(res.data.totalCount || 0);
            }
        } catch (error) {
            console.error("Envanter verisi yüklenemedi:", error);
        } finally {
            setLoading(false);
        }
    }, [lazyParams]);

    
    useEffect(() => {
        loadLazyData();
    }, [loadLazyData]);

    
    const onPage = (event) => {
        setLazyParams({
            ...lazyParams,
            first: event.first,
            rows: event.rows,
            page: (event.first / event.rows) + 1
        });
    };

    const onSearchChange = (e) => {
        const value = e.target.value;
        setLazyParams(prev => ({
            ...prev,
            first: 0, 
            page: 1,
            search: value
        }));
    };

    
    const typeBodyTemplate = (rowData) => {
        const severityMap = {
            'Point': 'success',
            'LineString': 'info',
            'Polygon': 'warning'
        };
        return <Tag value={rowData.geometryType} severity={severityMap[rowData.geometryType] || 'secondary'} />;
    };

    const measurementBodyTemplate = (rowData) => {
        const isSelected = selectedPointA && selectedPointA.id === rowData.id;

        if (rowData.geometryType === 'Point') {
            return (
                <Button
                    key={isSelected ? `sel-${rowData.id}` : `unsel-${rowData.id}`}
                    label={isSelected ? t.selected : t.select}
                    icon={isSelected ? "pi pi-check-circle" : "pi pi-plus-circle"}
                    onClick={() => handlePointSelection(rowData)}
                    className={`p-button-sm ${isSelected ? 'p-button-success' : 'p-button-outlined'}`}
                />
            );
        }
        
        return <span className="text-700">{getMeasurementFromWkt(rowData.wkt, rowData.geometryType)}</span>;
    };

    const dateBodyTemplate = (rowData) => {
        return new Date(rowData.createdAt).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const actionBodyTemplate = (rowData) => (
        <Button
            icon="pi pi-map-marker"
            label={lang === 'tr' ? 'Git' : 'Go'}
            className="p-button-sm p-button-rounded p-button-info p-button-text"
            onClick={() => {
                focusOnFeature(rowData.id);
                setIsTableOpen(false);
            }}
        />
    );

    const renderHeader = () => (
        <div className="flex justify-content-between align-items-center gap-2">
            <span className="text-xl font-bold text-900">
                {lang === 'tr' ? "Kayıtlı Envanterlerim" : "My Inventory"}
            </span>
            <IconField iconPosition="left">
                <InputIcon className="pi pi-search" />
                <InputText
                    value={lazyParams.search}
                    onChange={onSearchChange}
                    placeholder={lang === 'tr' ? "İsim veya not ile ara..." : "Search..."}
                    className="p-inputtext-sm"
                />
            </IconField>
        </div>
    );

    return (
        <Dialog
            header={renderHeader()}
            visible={true}
            style={{ width: '85vw', maxWidth: '1100px' }}
            onHide={() => setIsTableOpen(false)}
            modal
            maximizable
            contentClassName="p-0"
        >
            <DataTable
                value={tableData} 
                lazy 
                paginator
                rows={lazyParams.rows}
                first={lazyParams.first}
                totalRecords={totalRecords} 
                onPage={onPage}
                loading={loading}
                dataKey="id"
                emptyMessage={lang === 'tr' ? "Kayıt bulunamadı." : "No records found."}
                className="p-datatable-sm"
                stripedRows
                responsiveLayout="scroll"
            >
                <Column field="name" header={t.name} sortable />
                <Column
                    field="username"
                    header={lang === 'tr' ? 'Kullanıcı' : 'User'}
                    sortable
                    style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}
                />
                <Column header={lang === 'tr' ? 'Tip' : 'Type'} body={typeBodyTemplate} sortable field="geometryType" />
                <Column header={t.measurement} body={measurementBodyTemplate} />
                <Column field="createdAt" header={t.createdAt} body={dateBodyTemplate} sortable />
                <Column header={lang === 'tr' ? 'İşlem' : 'Action'} body={actionBodyTemplate} style={{ width: '100px' }} />
            </DataTable>
        </Dialog>
    );
};

export default InventoryTable;