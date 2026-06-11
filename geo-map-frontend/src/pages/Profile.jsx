import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Divider } from 'primereact/divider';

const Profile = ({ onClose, showToast, t }) => {
    const [userData, setUserData] = useState({ username: '', email: '' });
    const [passData, setPassData] = useState({ currentPassword: '', newPassword: '' });
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [loadingPass, setLoadingPass] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/Users/profile');
                setUserData({ username: res.data.username, email: res.data.email });
            } catch (err) {
                showToast('error', "Profil yüklenemedi");
            }
        };
        fetchProfile();
    }, [showToast]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoadingProfile(true);
        try {
            await api.put('/Users/profile', userData);
            showToast('success', t.success);
            localStorage.setItem('geo_username', userData.username);
        } catch (err) {
            showToast('error', "Güncelleme başarısız");
        } finally {
            setLoadingProfile(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setLoadingPass(true);
        try {
            await api.post('/Users/change-password', passData);
            showToast('success', "Şifre güncellendi");
            setPassData({ currentPassword: '', newPassword: '' });
        } catch (err) {
            showToast('error', "Şifre değiştirilemedi");
        } finally {
            setLoadingPass(false);
        }
    };

    return (
        <Dialog
            header={t.profileSettings}
            visible={true}
            style={{ width: '400px' }}
            onHide={onClose}
            className="p-fluid"
            footer={<Button label={t.close} icon="pi pi-times" onClick={onClose} className="p-button-text" />}
        >
            
            <section className="flex flex-column gap-3 mt-2">
                <div className="field">
                    <label htmlFor="username" className="font-bold block mb-2">{t.username}</label>
                    <InputText
                        id="username"
                        value={userData.username}
                        onChange={e => setUserData({...userData, username: e.target.value})}
                    />
                </div>

                <div className="field">
                    <label htmlFor="email" className="font-bold block mb-2">{t.email}</label>
                    <InputText
                        id="email"
                        value={userData.email}
                        onChange={e => setUserData({...userData, email: e.target.value})}
                    />
                </div>

                <Button
                    label={t.updateProfile}
                    icon="pi pi-user-edit"
                    loading={loadingProfile}
                    onClick={handleUpdateProfile}
                />
            </section>

            <Divider align="center" className="my-5">
                <span className="p-tag p-tag-info">{t.changePassword}</span>
            </Divider>

            
            <section className="flex flex-column gap-3">
                <div className="field">
                    <Password
                        placeholder={t.currentPass}
                        value={passData.currentPassword}
                        onChange={e => setPassData({...passData, currentPassword: e.target.value})}
                        toggleMask
                        feedback={false}
                    />
                </div>

                <div className="field">
                    <Password
                        placeholder={t.newPass}
                        value={passData.newPassword}
                        onChange={e => setPassData({...passData, newPassword: e.target.value})}
                        toggleMask
                        promptLabel="Yeni şifre girin"
                        weakLabel="Zayıf"
                        mediumLabel="Orta"
                        strongLabel="Güçlü"
                    />
                </div>

                <Button
                    label={t.changePassword}
                    icon="pi pi-lock"
                    severity="secondary"
                    outlined
                    loading={loadingPass}
                    onClick={handleChangePassword}
                />
            </section>
        </Dialog>
    );
};

export default Profile;