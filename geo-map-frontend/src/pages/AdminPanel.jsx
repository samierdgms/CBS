import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Checkbox } from 'primereact/checkbox';
import ZonePicker from '../components/ZonePicker.jsx';
import { TabView, TabPanel } from 'primereact/tabview';

const AdminPanel = ({ showToast, t, lang, fetchGeometries,theme }) => {
    const navigate = useNavigate();

    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState({ id: null, name: '', permissionIds: [] });
    const [users, setUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
    const [tempWkt, setTempWkt] = useState("");
    const [availablePermissions, setAvailablePermissions] = useState([]);
    const [roles, setRoles] = useState([]); 
    const [allRoles, setAllRoles] = useState([]);
    const [allPermissions, setAllPermissions] = useState([]);
    const [isClearLogsModalOpen, setIsClearLogsModalOpen] = useState(false);
    const [selectedLogBody, setSelectedLogBody] = useState(null); 

    const [totalUsers, setTotalUsers] = useState(0);
    const [userLazyParams, setUserLazyParams] = useState({
        first: 0,
        rows: 10,
        page: 1,
        search: ''
    });


    const [totalRoles, setTotalRoles] = useState(0);
    const [roleLazyParams, setRoleLazyParams] = useState({
        first: 0,
        rows: 5,
        page: 1
    });
    
    const [newUser, setNewUser] = useState({
        username: '',
        email: '',
        password: '',
        roleId: '',
        permissionIds: []
    });

    const [logs, setLogs] = useState([]);
    const [totalLogs, setTotalLogs] = useState(0);
    const [logLazyParams, setLogLazyParams] = useState({
        first: 0,
        rows: 10,
        page: 1,
        searchUser: '',  
        method: null,    
        statusCode: ''   
    });
    const formatJson = (jsonString) => {
        try {
            const parsed = JSON.parse(jsonString);
            return JSON.stringify(parsed, null, 2);
        } catch (e) {
            return jsonString; 
        }
    };
    

    const handleEditClick = async (user) => {
        try {
            
            const [rolePermsRes, userPermsRes] = await Promise.all([
                api.get(`/Admin/roles/${user.roleId}/permissions`),
                api.get(`/Admin/users/${user.id}/permissions`) 
            ]);

            setAvailablePermissions(rolePermsRes.data); 

            setEditingUser({
                ...user,
                permissionIds: userPermsRes.data 
            });
        } catch (err) {
            showToast('error', lang === 'tr' ? "Veriler yüklenemedi" : "Failed to load data");
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/Admin/users/paged', {
                params: {
                    page: userLazyParams.page,
                    pageSize: userLazyParams.rows,
                    search: userLazyParams.search
                }
            });
            
            setUsers(res.data.items);
            setTotalUsers(res.data.totalCount);
        } catch (err) {
            showToast('error', lang === 'tr' ? "Kullanıcılar yüklenemedi" : "Failed to load users");
        } finally {
            setLoading(false);
        }
    };
    
    const fetchRolesPaged = async () => {
        try {
            const res = await api.get('/Admin/roles/paged', {
                params: {
                    page: roleLazyParams.page,
                    pageSize: roleLazyParams.rows
                }
            });
            setRoles(res.data.items);
            setTotalRoles(res.data.totalCount);
        } catch (err) {
            showToast('error', "Rol listesi yüklenemedi");
        }
    };

    const fetchLogsPaged = async () => {
        try {
            const res = await api.get('/Admin/logs/paged', {
                params: {
                    page: logLazyParams.page,
                    pageSize: logLazyParams.rows,
                    searchUser: logLazyParams.searchUser || undefined,
                    method: logLazyParams.method || undefined,
                    statusCode: logLazyParams.statusCode ? parseInt(logLazyParams.statusCode) : undefined
                }
            });
            setLogs(res.data.items);
            setTotalLogs(res.data.totalCount);
        } catch (err) {
            showToast('error', "Loglar yüklenemedi");
        }
    };

    const handleDeleteLog = async (id) => {
        try {
            await api.delete(`/Admin/logs/${id}`);
            showToast('success', "Log başarıyla silindi");
            fetchLogsPaged(); 
        } catch (err) {
            showToast('error', "Log silinirken hata oluştu");
        }
    };

   
    const handleClearAllLogs = () => {
        setIsClearLogsModalOpen(true);
    };


    const confirmClearAllLogs = async () => {
        try {
            await api.delete('/Admin/logs/clear-all');
            showToast('success', lang === 'tr' ? "Tüm loglar temizlendi" : "All logs cleared");
            setIsClearLogsModalOpen(false); 
            fetchLogsPaged(); 
        } catch (err) {
            showToast('error', "Loglar temizlenirken hata oluştu");
        }
    };

    const onLogPage = (event) => {
        setLogLazyParams({
            ...logLazyParams,
            first: event.first,
            rows: event.rows,
            page: (event.first / event.rows) + 1
        });
    };

    const loadMetadata = async () => {
        try {
            const [rolesRes, permsRes] = await Promise.all([
                api.get('/Admin/roles'), 
                api.get('/Admin/permissions')
            ]);
            setAllRoles(rolesRes.data); 
            setAllPermissions(permsRes.data);
        } catch (err) {
            showToast('error', lang === 'tr' ? "Rol ve yetki listesi yüklenemedi" : "Failed to load roles/permissions");
        }
    };
    
    const onUserPage = (event) => {
        setUserLazyParams({
            ...userLazyParams,
            first: event.first,
            rows: event.rows,
            page: (event.first / event.rows) + 1
        });
    };
    
    const onRolePage = (event) => {
        setRoleLazyParams({
            ...roleLazyParams,
            first: event.first,
            rows: event.rows,
            page: (event.first / event.rows) + 1
        });
    };

    useEffect(() => {
        fetchUsers();
    }, [userLazyParams]); 

    useEffect(() => {
        fetchRolesPaged();
    }, [roleLazyParams]); 

    useEffect(() => {
        loadMetadata(); 
    }, []);
    
    useEffect(() => {
        fetchLogsPaged();
    }, [logLazyParams]);
    
    const handleEditRole = async (role) => {
        try {
            const res = await api.get(`/Admin/roles/${role.id}/permissions`);
            setEditingRole({ id: role.id, name: role.name, permissionIds: res.data });
            setIsRoleModalOpen(true);
        } catch (err) {
            showToast('error', "Rol yetkileri yüklenemedi");
        }
    };

    const saveRole = async () => {
        
        if (!editingRole.name || editingRole.name.trim() === "") {
            showToast('warn', lang === 'tr' ? "Lütfen bir rol adı girin" : "Please enter a role name");
            return;
        }

        try {
            
            const payload = {
                ...editingRole,
                
                id: editingRole.id === null ? undefined : editingRole.id
            };

            const res = await api.post('/Admin/roles/manage', payload);

            showToast('success', lang === 'tr' ? "Rol başarıyla kaydedildi" : "Role saved successfully");
            setIsRoleModalOpen(false);
            loadMetadata(); 
        } catch (err) {
            console.error("Role Save Error:", err.response?.data);
            const errorMessage = err.response?.data?.message || (lang === 'tr' ? "Rol kaydedilemedi" : "Role could not be saved");
            showToast('error', errorMessage);
        }
    };
    const handleDeleteRole = async (id) => {
        try {
            await api.delete(`/Admin/roles/${id}`);
            showToast('success', "Rol silindi");
            loadMetadata();
        } catch (err) {
            showToast('error', err.response?.data?.message || "Silme hatası");
        }
    };
    const handleRoleChange = async (newRoleId, isEdit = true) => {
        try {
            const res = await api.get(`/Admin/roles/${newRoleId}/permissions`);
            const roleDefaultPermissionIds = res.data;

            
            setAvailablePermissions(roleDefaultPermissionIds);

            if (isEdit) {
                setEditingUser({
                    ...editingUser,
                    roleId: newRoleId,
                    permissionIds: roleDefaultPermissionIds 
                });
            } else {
                setNewUser({
                    ...newUser,
                    roleId: newRoleId,
                    permissionIds: roleDefaultPermissionIds
                });
            }
        } catch (err) {
            showToast('error', "Rol yetkileri alınamadı");
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/Admin/users/${editingUser.id}`, editingUser);
            showToast('success', lang === 'tr' ? "Kullanıcı güncellendi" : "User updated");
            if (fetchGeometries) fetchGeometries();
            setEditingUser(null);
            fetchUsers();
        } catch (err) {
            showToast('error', t.error);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/Admin/users', newUser);
            showToast('success', t.userCreated);
            setIsAddModalOpen(false);
            setNewUser({ username: '', email: '', password: '', roleId: '', permissionIds: [] });
            fetchUsers();
        } catch (err) {
            showToast('error', err.response?.data?.message || t.error);
        }
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/Admin/users/${userToDelete.id}`);
            showToast('success', t.userDeleted);
            setUserToDelete(null);
            fetchUsers();
        } catch (err) {
            showToast('error', t.error);
        }
    };

    const onPermissionChange = (e, isEdit = true) => {
        let currentIds = isEdit
            ? [...(editingUser.permissionIds || [])]
            : [...(newUser.permissionIds || [])];

        if (e.checked) {
            currentIds.push(e.value);
        } else {
            currentIds = currentIds.filter(id => id !== e.value);
        }

        if (isEdit) {
            setEditingUser({ ...editingUser, permissionIds: currentIds });
        } else {
            setNewUser({ ...newUser, permissionIds: currentIds });
        }
    };

    const handleOpenZonePicker = () => {
        setTempWkt(editingUser.zoneWkt || "");
        setIsZoneModalOpen(true);
    };

    const handleZoneConfirm = () => {
        setEditingUser({ ...editingUser, zoneWkt: tempWkt });
        setIsZoneModalOpen(false);
        showToast('info', lang === 'tr' ? "Bölge koordinatları forma eklendi." : "Zone coordinates added to form.");
    };
    
    
    const roleBodyTemplate = (rowData) => (
        <Tag value={rowData.roleName} severity={rowData.roleName === 'Admin' ? 'danger' : 'info'} />
    );

    const permissionsBodyTemplate = (rowData) => {
        const perms = rowData.permissionCodes || [];
        return (
            <div className="flex gap-1 flex-wrap">
                {perms.map(p => <Tag key={p} value={p} severity="warning" style={{ fontSize: '10px' }} />)}
            </div>
        );
    };

    const zoneBodyTemplate = (rowData) => (
        <span className="flex align-items-center">
            {rowData.zoneWkt
                ? <i className="pi pi-check-circle text-green-500 mr-2" title={rowData.zoneWkt}></i>
                : <i className="pi pi-globe text-blue-400 mr-2"></i>
            }
            {rowData.zoneWkt ? t.defined : t.allMap}
        </span>
    );

    const actionBodyTemplate = (rowData) => (
        <div className="flex gap-2">
            <Button icon="pi pi-user-edit" className="p-button-sm p-button-text" onClick={() => handleEditClick(rowData)} />
            <Button icon="pi pi-trash" className="p-button-sm p-button-text p-button-danger" onClick={() => setUserToDelete(rowData)} />
        </div>
    );

    return (
        <div className={`admin-page-container p-4 min-h-screen surface-ground ${theme}-mode`}>


            <div className="flex justify-content-between align-items-center mb-4 p-3 surface-card shadow-2 border-round-xl">
                <div className="flex align-items-center gap-3">
                    <Button
                        icon="pi pi-home"
                        label={lang === 'tr' ? "Harita" : "Map"}
                        onClick={() => navigate('/')}
                        className="p-button-text p-button-secondary font-bold"
                    />
                    <div className="border-left-1 border-300 h-2rem mx-1"></div>
                    <h2 className={`m-0 text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-color'}`}>
                        {lang === 'tr' ? "Admin Paneli" : "Admin Panel"}
                    </h2>
                </div>
                <Button label={t.addUser} icon="pi pi-plus" onClick={() => setIsAddModalOpen(true)} severity="success" raised />
            </div>

            <TabView className="shadow-2 border-round-xl overflow-hidden">

               
                <TabPanel header={t.userManagement} leftIcon="pi pi-users mr-2">
                    <div className="card surface-card overflow-hidden border-none">
                        <DataTable
                            value={users} lazy paginator first={userLazyParams.first} rows={userLazyParams.rows} totalRecords={totalUsers} onPage={onUserPage} loading={loading} size="small" stripedRows responsiveLayout="scroll">
                            <Column field="username" header={t.username} sortable style={{ fontWeight: 'bold' }}></Column>
                            <Column field="email" header={t.email} sortable></Column>
                            <Column field="roleName" header={t.role} body={roleBodyTemplate} sortable></Column>
                            <Column field="permissionCodes" header={lang === 'tr' ? "Yetkiler" : "Permissions"} body={permissionsBodyTemplate}></Column>
                            <Column header={t.zone} body={zoneBodyTemplate}></Column>
                            <Column header={t.actions} body={actionBodyTemplate} style={{ width: '120px' }}></Column>
                        </DataTable>
                    </div>
                </TabPanel>

                
                <TabPanel header={lang === 'tr' ? "Rol Yönetimi" : "Role Management"} leftIcon="pi pi-shield mr-2">
                    <div className="surface-card p-3 border-round">
                        <Button
                            label={lang === 'tr' ? "Yeni Rol Ekle" : "Add New Role"}
                            icon="pi pi-plus"
                            onClick={() => {
                                setEditingRole({ id: null, name: '', permissionIds: [] });
                                setIsRoleModalOpen(true);
                            }}
                            severity="info"
                            raised
                        />
                    </div>

                    <DataTable
                        value={roles} lazy paginator first={roleLazyParams.first} rows={roleLazyParams.rows} totalRecords={totalRoles} onPage={onRolePage} size="small" stripedRows responsiveLayout="scroll">
                        <Column field="name" header={lang === 'tr' ? "Rol Adı" : "Role Name"} sortable style={{ fontWeight: 'bold' }}></Column>
                        <Column header={lang === 'tr' ? "İşlemler" : "Actions"} body={(rowData) => (
                            <div className="flex gap-2">
                                <Button
                                    icon="pi pi-pencil"
                                    label={lang === 'tr' ? "Yetkileri Düzenle" : "Edit Permissions"}
                                    className="p-button-sm p-button-text"
                                    onClick={() => handleEditRole(rowData)}
                                />
                                <Button
                                    icon="pi pi-trash"
                                    className="p-button-sm p-button-text p-button-danger"
                                    disabled={rowData.name === 'Admin' || rowData.name === 'User'}
                                    onClick={() => handleDeleteRole(rowData.id)}
                                />
                            </div>
                        )}></Column>
                    </DataTable>
                </TabPanel>


               
                <TabPanel header={lang === 'tr' ? "Sistem Logları" : "System Logs"} leftIcon="pi pi-database mr-2">

                    
                    <div className="surface-card p-3 mb-3 border-round shadow-1">
                        <div className="grid p-fluid align-items-end">

                            
                            <div className="col-12 md:col-3">
                                <label className="font-bold block mb-2 text-sm text-700">
                                    <i className="pi pi-user mr-2 text-primary"></i>
                                    {lang === 'tr' ? "Kullanıcı Adı" : "Username"}
                                </label>
                                <InputText
                                    placeholder={lang === 'tr' ? "Kullanıcı adıyla ara..." : "Search by username..."}
                                    value={logLazyParams.searchUser}
                                    onChange={(e) => setLogLazyParams({ ...logLazyParams, searchUser: e.target.value, page: 1, first: 0 })}
                                    className="p-inputtext-sm"
                                />
                            </div>

                            
                            <div className="col-12 md:col-3">
                                <label className="font-bold block mb-2 text-sm text-700">
                                    <i className="pi pi-cog mr-2 text-primary"></i>
                                    {lang === 'tr' ? "İşlem Tipi (Metot)" : "Action Type (Method)"}
                                </label>
                                <Dropdown
                                    value={logLazyParams.method}
                                    options={[
                                        { label: lang === 'tr' ? 'Tümü' : 'All', value: null },
                                        { label: 'GET', value: 'GET' },
                                        { label: 'POST', value: 'POST' },
                                        { label: 'PUT', value: 'PUT' },
                                        { label: 'DELETE', value: 'DELETE' }
                                    ]}
                                    onChange={(e) => setLogLazyParams({ ...logLazyParams, method: e.value, page: 1, first: 0 })}
                                    placeholder={lang === 'tr' ? "İşlem Seçiniz" : "Select Action"}
                                    className="p-inputtext-sm"
                                />
                            </div>

                            
                            <div className="col-12 md:col-3">
                                <label className="font-bold block mb-2 text-sm text-700">
                                    <i className="pi pi-info-circle mr-2 text-primary"></i>
                                    {lang === 'tr' ? "Durum Kodu (Status)" : "Status Code"}
                                </label>
                                <InputText
                                    placeholder={lang === 'tr' ? "Örn: 200, 400, 500" : "e.g., 200, 400, 500"}
                                    value={logLazyParams.statusCode}
                                    onChange={(e) => setLogLazyParams({ ...logLazyParams, statusCode: e.target.value, page: 1, first: 0 })}
                                    className="p-inputtext-sm"
                                />
                            </div>

                            
                            <div className="col-12 md:col-3">
                                <Button
                                    label={lang === 'tr' ? "Tüm Logları Temizle" : "Clear All Logs"}
                                    icon="pi pi-trash"
                                    className="p-button-danger p-button-sm font-bold shadow-1"
                                    onClick={handleClearAllLogs}
                                />
                            </div>

                        </div>
                    </div>

                    
                    <DataTable
                        value={logs} lazy paginator first={logLazyParams.first} rows={logLazyParams.rows}
                        totalRecords={totalLogs} onPage={onLogPage} size="small" stripedRows responsiveLayout="scroll" className="shadow-1 border-round-lg overflow-hidden">

                        <Column field="username" header={lang === 'tr' ? "Kullanıcı" : "User"} style={{ fontWeight: '600' }}></Column>

                        <Column field="method" header={lang === 'tr' ? "Metot" : "Method"} body={(r) => (
                            <Tag value={r.method} severity={r.method === 'POST' ? 'success' : r.method === 'PUT' ? 'warn' : r.method === 'DELETE' ? 'danger' : 'info'} />
                        )} style={{ width: '100px' }}></Column>

                        <Column field="path" header={lang === 'tr' ? "Adres (Path)" : "Address (Path)"} style={{ fontWeight: '500' }}></Column>

                        <Column field="statusCode" header={lang === 'tr' ? "Durum" : "Status"} body={(r) => (
                            <span className={r.statusCode >= 400 ? "text-red-500 font-bold" : "text-green-500 font-bold"}>{r.statusCode}</span>
                        )} style={{ width: '90px' }}></Column>

                        <Column
                            field="requestBody"
                            header={lang === 'tr' ? "İstek Detayı (Body)" : "Request Detail (Body)"}
                            body={(r) => (
                                <div className="flex align-items-center gap-2">
                        <span className="text-xs font-monospace block overflow-hidden text-overflow-ellipsis white-space-nowrap" style={{ maxWidth: '160px' }}>
                        {r.requestBody || <span className="text-400 italic">{lang === 'tr' ? "Boş" : "Empty"}</span>}
                          </span>
                                    {r.requestBody && (
                                        <Button
                                            icon="pi pi-eye"
                                            className="p-button-rounded p-button-text p-button-sm p-0 m-0 text-primary"
                                            onClick={() => setSelectedLogBody(r.requestBody)}
                                            tooltip={lang === 'tr' ? "Detayı Gör" : "View Detail"}
                                            tooltipOptions={{ position: 'top' }}
                                            style={{ width: '24px', height: '24px' }}
                                        />
                                    )}
                                </div>
                            )}
                        ></Column>

                        <Column field="createdAt" header={lang === 'tr' ? "Tarih" : "Date"} body={(r) => new Date(r.createdAt).toLocaleString()} sortable style={{ width: '180px' }}></Column>

                        <Column header={lang === 'tr' ? "İşlemler" : "Actions"} body={(rowData) => (
                            <Button
                                icon="pi pi-trash"
                                className="p-button-sm p-button-text p-button-danger border-round-circle"
                                onClick={() => handleDeleteLog(rowData.id)}
                            />
                        )} style={{ width: '80px', textAlign: 'center' }}></Column>
                    </DataTable>
                </TabPanel>
            </TabView>

            
            <Dialog
                header={
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-user-edit text-primary text-2xl"></i>
                        <span>{editingUser?.username} - {lang === 'tr' ? 'Kullanıcı Düzenle' : 'Edit User'}</span>
                    </div>
                }
                visible={!!editingUser}
                style={{ width: '500px' }}
                onHide={() => setEditingUser(null)}
                className="p-fluid shadow-4"
            >
                {editingUser && (
                    <form onSubmit={handleUpdate} className="flex flex-column gap-4 mt-3">
                        <div className="surface-ground p-3 border-round-lg">
                            <div className="field">
                                <label className="font-bold block mb-2"><i className="pi pi-id-card mr-2 text-primary" ></i>{t.username}</label>
                                <InputText value={editingUser.username} onChange={e => setEditingUser({...editingUser, username: e.target.value})} />
                            </div>
                            <div className="field">
                                <label className="font-bold block mb-2"><i className="pi pi-envelope mr-2 text-primary"></i>{t.email}</label>
                                <InputText value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} />
                            </div>
                            <div className="field">
                                <label className="font-bold block mb-2"><i className="pi pi-shield mr-2 text-primary"></i>{t.role}</label>
                                <Dropdown
                                    value={editingUser.roleId}
                                    options={allRoles}
                                    optionLabel="name"
                                    optionValue="id"
                                    onChange={e => handleRoleChange(e.value, true)}
                                />
                            </div>
                        </div>

                        <div className="border-1 border-200 border-round-lg p-3">
                            <label className="font-bold block mb-3 text-primary flex align-items-center">
                                <i className="pi pi-lock-open mr-2"></i>{lang === 'tr' ? 'Erişim Yetkileri' : 'Access Permissions'}
                            </label>
                            <div className="grid">
                                {allPermissions
                                    .filter(p => availablePermissions.includes(p.id)) 
                                    .map(perm => (
                                        <div key={perm.id} className="col-6 flex align-items-center mb-2">
                                            <Checkbox
                                                inputId={`edit_${perm.id}`}
                                                value={perm.id}
                                                onChange={(e) => onPermissionChange(e, true)}
                                                checked={editingUser.permissionIds?.includes(perm.id)}
                                            />
                                            <label htmlFor={`edit_${perm.id}`} className="ml-2 text-sm cursor-pointer select-none">
                                                {perm.name}
                                            </label>
                                        </div>
                                    ))}
                                {availablePermissions.length === 0 && (
                                    <div className="col-12 text-sm text-500 italic">Bu rol için tanımlanmış yetki bulunamadı.</div>
                                )}
                            </div>
                        </div>

                        <div className="field border-1 border-200 border-round-lg p-3">
                            <div className="flex justify-content-between align-items-center mb-2">
                                <label className="font-bold flex align-items-center">
                                    <i className="pi pi-map-marker mr-2 text-primary"></i>{t.zone}
                                </label>
                                <Button
                                    type="button"
                                    icon="pi pi-map"
                                    label={lang === 'tr' ? "Haritada Seç" : "Select on Map"}
                                    className="p-button-xs p-button-info p-button-outlined"
                                    onClick={handleOpenZonePicker}
                                />
                            </div>
                            <InputTextarea
                                value={editingUser.zoneWkt || ''}
                                onChange={e => setEditingUser({...editingUser, zoneWkt: e.target.value})}
                                rows={2}
                                autoResize
                                className="text-xs font-monospace bg-gray-50"
                                placeholder="WKT format..."
                            />
                        </div>

                        <div className="flex justify-content-end gap-2 pt-2">
                            <Button type="button" label={t.cancel} icon="pi pi-times" onClick={() => setEditingUser(null)} className="p-button-text" />
                            <Button type="submit" label={t.save} icon="pi pi-check" severity="primary" raised />
                        </div>
                    </form>
                )}
            </Dialog>

            
            <Dialog
                header={lang === 'tr' ? "Rol ve Yetki Tanımla" : "Define Role & Permissions"}
                visible={isRoleModalOpen}
                style={{ width: '400px' }}
                onHide={() => setIsRoleModalOpen(false)}
                className="p-fluid"
            >
                <div className="flex flex-column gap-3 mt-2">
                    <div className="field">
                        <label className="font-bold">{lang === 'tr' ? "Rol Adı" : "Role Name"}</label>
                        <InputText
                            value={editingRole.name}
                            onChange={(e) => setEditingRole({...editingRole, name: e.target.value})}
                            placeholder={lang === 'tr' ? "Örn: Editor" : "e.g. Editor"}
                        />
                    </div>
                    <div className="field border-1 border-200 p-3 border-round-lg">
                        <label className="font-bold block mb-2 text-primary flex align-items-center">
                            <i className="pi pi-tags mr-2"></i>
                            {lang === 'tr' ? "Varsayılan Yetki Paketi" : "Default Permission Bundle"}
                        </label>
                        <div className="grid">
                            {allPermissions.map(p => (
                                <div key={p.id} className="col-6 mb-2 flex align-items-center">
                                    <Checkbox
                                        inputId={`role_p_${p.id}`}
                                        value={p.id}
                                        checked={editingRole.permissionIds?.includes(p.id)}
                                        onChange={(e) => {
                                            let ids = [...(editingRole.permissionIds || [])];
                                            if (e.checked) ids.push(p.id);
                                            else ids = ids.filter(id => id !== p.id);
                                            setEditingRole({...editingRole, permissionIds: ids});
                                        }}
                                    />
                                    <label htmlFor={`role_p_${p.id}`} className="ml-2 text-sm cursor-pointer select-none">{p.name}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Button
                        label={lang === 'tr' ? "Rolü Kaydet" : "Save Role"}
                        icon="pi pi-check"
                        onClick={saveRole}
                        severity="success"
                        raised
                    />
                </div>
            </Dialog>

            
            <Dialog
                header={`✨ ${t.addUser}`}
                visible={isAddModalOpen}
                style={{ width: '450px' }}
                onHide={() => setIsAddModalOpen(false)}
                className="p-fluid shadow-4"
            >
                <form onSubmit={handleAddUser} className="flex flex-column gap-3 mt-3">
                    <div className="field">
                        <label htmlFor="new_username" className="font-bold block mb-2">
                            <i className="pi pi-user mr-2 text-primary"></i>
                            {t.username}
                        </label>
                        <InputText
                            id="new_username"
                            value={newUser.username}
                            onChange={e => setNewUser({...newUser, username: e.target.value})}
                            required
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="new_email" className="font-bold block mb-2">
                            <i className="pi pi-envelope mr-2 text-primary"></i>
                            {t.email}
                        </label>
                        <InputText
                            id="new_email"
                            type="email"
                            value={newUser.email}
                            onChange={e => setNewUser({...newUser, email: e.target.value})}
                            required
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="new_password" className="font-bold block mb-2">
                            <i className="pi pi-lock mr-2 text-primary"></i>
                            {t.password}
                        </label>
                        <InputText
                            id="new_password"
                            type="password"
                            value={newUser.password}
                            onChange={e => setNewUser({...newUser, password: e.target.value})}
                            required
                        />
                    </div>

                    <div className="field">
                        <label className="font-bold block mb-2">
                            <i className="pi pi-shield mr-2 text-primary"></i>
                            {t.role}
                        </label>
                        <Dropdown
                            value={newUser.roleId}
                            options={allRoles}
                            optionLabel="name"
                            optionValue="id"
                            onChange={e => handleRoleChange(e.value, false)}
                            placeholder={lang === 'tr' ? "Rol Seçiniz" : "Select a Role"}
                            required
                        />
                    </div>

                    {newUser.roleId && (
                        <div className="border-1 border-200 border-round-lg p-3 bg-gray-50">
                            <label className="font-bold block mb-2 text-sm text-primary">Yetkileri Özelleştir:</label>
                            <div className="grid">
                                {allPermissions.map(perm => (
                                    <div key={perm.id} className="col-6 flex align-items-center mb-1">
                                        <Checkbox
                                            inputId={`new_${perm.id}`}
                                            value={perm.id}
                                            onChange={(e) => onPermissionChange(e, false)}
                                            checked={newUser.permissionIds?.includes(perm.id)}
                                        />
                                        <label htmlFor={`new_${perm.id}`} className="ml-2 text-xs cursor-pointer">{perm.name}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-content-end gap-2 mt-4 border-top-1 border-200 pt-3">
                        <Button type="button" label={t.cancel} icon="pi pi-times" onClick={() => setIsAddModalOpen(false)} className="p-button-text" />
                        <Button type="submit" label={t.save} icon="pi pi-check" severity="success" raised />
                    </div>
                </form>
            </Dialog>

            
            <Dialog
                header={lang === 'tr' ? "Yetki Alanı Çiz" : "Draw Authorization Zone"}
                visible={isZoneModalOpen}
                style={{ width: '90vw', maxWidth: '800px' }}
                onHide={() => setIsZoneModalOpen(false)}
                footer={
                    <div className="flex justify-content-end gap-2">
                        <Button label={t.cancel} icon="pi pi-times" onClick={() => setIsZoneModalOpen(false)} className="p-button-text" />
                        <Button label={lang === 'tr' ? "Konumu Onayla" : "Confirm Location"} icon="pi pi-check" onClick={handleZoneConfirm} severity="success" raised />
                    </div>
                }
            >
                <ZonePicker initialWkt={tempWkt} onSave={(wkt) => setTempWkt(wkt)} lang={lang} />
            </Dialog>

            
            <Dialog
                header={lang === 'tr' ? "⚠️ Hesabı Sil" : "⚠️ Delete Account"}
                visible={!!userToDelete}
                style={{ width: '400px' }}
                onHide={() => setUserToDelete(null)}
                footer={
                    <div className="flex justify-content-end gap-2">
                        <Button label={t.cancel} icon="pi pi-times" onClick={() => setUserToDelete(null)} className="p-button-text" />
                        <Button label={lang === 'tr' ? "Kullanıcıyı Sil" : "Delete User"} icon="pi pi-trash" onClick={confirmDelete} severity="danger" raised />
                    </div>
                }
            >
                <div className="flex flex-column align-items-center gap-3 py-3">
                    <i className="pi pi-exclamation-triangle text-red-500" style={{ fontSize: '3rem' }}></i>
                    <div className="text-center">
                        <p className="m-0 text-xl font-semibold text-900">{userToDelete?.username}</p>
                        <p className="text-gray-600 mt-2">
                            {lang === 'tr'
                                ? "Bu kullanıcının hesabını kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
                                : "Are you sure you want to permanently delete this user account? This action cannot be undone."}
                        </p>
                    </div>
                </div>
            </Dialog>
            
            <Dialog
                header={lang === 'tr' ? "⚠️ Sistem Loglarını Temizle" : "⚠️ Clear System Logs"}
                visible={isClearLogsModalOpen}
                style={{ width: '400px' }}
                onHide={() => setIsClearLogsModalOpen(false)}
                footer={
                    <div className="flex justify-content-end gap-2">
                        <Button label={t.cancel} icon="pi pi-times" onClick={() => setIsClearLogsModalOpen(false)} className="p-button-text" />
                        <Button label={lang === 'tr' ? "Tümünü Sil" : "Delete All"} icon="pi pi-trash" onClick={confirmClearAllLogs} severity="danger" raised />
                    </div>
                }
            >
                <div className="flex flex-column align-items-center gap-3 py-3">
                    <i className="pi pi-exclamation-triangle text-red-500" style={{ fontSize: '3rem' }}></i>
                    <div className="text-center">
                        <p className="m-0 text-xl font-semibold text-900">
                            {lang === 'tr' ? "Tüm Veriler Gizlenecek" : "All Data Will Be Hidden"}
                        </p>
                        <p className="text-gray-600 mt-2">
                            {lang === 'tr'
                                ? "Tüm sistem loglarını temizlemek istediğinizden emin misiniz? Bu işlem geri alınamaz."
                                : "Are you sure you want to permanently clear all system logs? This action cannot be undone."}
                        </p>
                    </div>
                </div>
            </Dialog>
            
            
            <Dialog
                header={
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-search text-primary text-xl"></i>
                        <span>{lang === 'tr' ? 'İstek Gövdesi Detayı' : 'Request Body Detail'}</span>
                    </div>
                }
                visible={!!selectedLogBody}
                style={{ width: '550px' }}
                onHide={() => setSelectedLogBody(null)}
                footer={
                    <div className="flex justify-content-end">
                        <Button label={lang === 'tr' ? "Kapat" : "Close"} icon="pi pi-times" onClick={() => setSelectedLogBody(null)} className="p-button-text" />
                    </div>
                }
                className="p-fluid shadow-4"
            >
                <div
                    className="surface-ground p-3 border-round border-1 border-200 mt-2 overflow-auto backend-log-viewer"
                    style={{ maxHeight: '400px', backgroundColor: theme === 'dark' ? '#1e1e1e' : '#f8f9fa' }}
                >
        <pre
            className="m-0 text-xs font-monospace"
            style={{
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                color: theme === 'dark' ? '#b5cea8' : '#2c3e50'
            }}
        >
            {selectedLogBody ? formatJson(selectedLogBody) : ''}
        </pre>
                </div>
            </Dialog>
        </div>
    );
};


export default AdminPanel;   