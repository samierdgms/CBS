import React from 'react';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';

const EditToolbar = ({ editMode, saveUpdate, handleCancelEdit, t }) => {
    if (!editMode) return null;

    return (
        <div
            className="fixed left-50 z-5 pulse"
            style={{
                top: '70px', 
                transform: 'translateX(-50%)',
                minWidth: 'max-content'
            }}
        >
            <div className="flex align-items-center gap-3 surface-overlay text-color px-4 py-2 border-round-3xl shadow-6 border-1 border-primary">

               
                <div className="flex align-items-center gap-3">
                    <div className="flex align-items-center justify-content-center bg-primary border-round-circle w-2rem h-2rem">
                        <i className="pi pi-pencil text-primary-inverse font-bold"></i>
                    </div>
                    <div className="flex flex-column">
                        <span className="font-bold text-sm uppercase text-primary tracking-wider">
                            {t.editMode}
                        </span>
                        <span className="text-xs opacity-70">
                            {t.editDesc}
                        </span>
                    </div>
                </div>

               
                <Divider layout="vertical" className="mx-2 hidden md:block" />

                {/* Butonlar Bölümü */}
                <div className="flex gap-2">
                    <Button
                        label={t.save}
                        icon="pi pi-check"
                        severity="success"
                        size="small"
                        className="p-button-rounded"
                        onClick={saveUpdate}
                    />
                    <Button
                        label={t.cancel}
                        icon="pi pi-times"
                        severity="danger"
                        text
                        size="small"
                        className="p-button-rounded"
                        onClick={handleCancelEdit}
                    />
                </div>
            </div>
        </div>
    );
};

export default EditToolbar;