import React from 'react';
import { AutoComplete } from 'primereact/autocomplete';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';


export const CountrySearch = ({
                                  isSearchOpen,
                                  setIsSearchOpen,
                                  searchTerm,
                                  setSearchTerm,
                                  lastCountry,
                                  handleCountryChange,
                                  t
                              }) => {

    
    const countryOptions = Object.keys(t.countries).map(key => ({
        name: t.countries[key],
        code: key
    }));

    const searchCountry = (event) => {
        setSearchTerm(event.query);
    };

    return (
        <div className="absolute top-0 right-0 m-3 z-5">
            <span className="p-input-icon-left shadow-4 border-round">
                <i className="pi pi-search" />
                <AutoComplete
                    value={isSearchOpen ? searchTerm : (t.countries[lastCountry] || lastCountry)}
                    suggestions={countryOptions.filter(c =>
                        c.name.toLowerCase().includes(searchTerm.toLowerCase())
                    )}
                    completeMethod={searchCountry}
                    field="name"
                    placeholder={t.searchCountry}
                    onSelect={(e) => {
                        handleCountryChange(e.value.code);
                        setIsSearchOpen(false);
                    }}
                    onFocus={() => {
                        setIsSearchOpen(true);
                        setSearchTerm("");
                    }}
                    onBlur={() => setIsSearchOpen(false)}
                    className="w-15rem"
                    inputClassName="border-round-lg"
                />
            </span>
        </div>
    );
};


export const DeleteModal = ({ handleDelete, setShowDeleteModal, t }) => {

    const footerContent = (
        <div className="flex justify-content-end gap-2">
            <Button
                label={t.cancel}
                icon="pi pi-times"
                onClick={() => setShowDeleteModal(false)}
                className="p-button-text p-button-secondary"
            />
            <Button
                label={t.deleteYes}
                icon="pi pi-trash"
                onClick={handleDelete}
                severity="danger"
                autoFocus
            />
        </div>
    );

    return (
        <Dialog
            header={t.deleteConfirm}
            visible={true}
            style={{ width: '350px' }}
            onHide={() => setShowDeleteModal(false)}
            footer={footerContent}
            draggable={false}
            resizable={false}
        >
            <div className="flex align-items-center justify-content-center flex-column gap-3 mt-2">
                <i className="pi pi-exclamation-triangle text-red-500 text-5xl"></i>
                <p className="m-0 text-center line-height-3">
                    {t.deleteSub}
                </p>
            </div>
        </Dialog>
    );
};