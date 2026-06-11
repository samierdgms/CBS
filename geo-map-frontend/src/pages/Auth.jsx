import React, { useState } from 'react';
import api from '../api/api';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';

const Auth = ({ onLoginSuccess, showToast, lang }) => {
    const [view, setView] = useState('login');
    const [isTokenSent, setIsTokenSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        token: '',
        newPassword: ''
    });

    const t = {
        tr: {
            brandName: "GeoApp",
            tagline: "Mekansal Verilerinizi Keşfedin",
            feature1: "Hassas Geometrik Çizimler",
            feature2: "WMS ve Vektör Katman Yönetimi",
            feature3: "Gelişmiş Analiz Araçları",
            login: "GİRİŞ YAP", register: "KAYIT OL", forgot: "ŞİFREMİ UNUTTUM", reset: "ŞİFREYİ SIFIRLA",
            email: "E-posta", password: "Şifre", username: "Kullanıcı Adı",
            token: "Token (E-postadaki Kod)", newPass: "Yeni Şifre",
            loginBtn: "GİRİŞ", registerBtn: "KAYDOL", sendCode: "KOD GÖNDER", updateBtn: "GÜNCELLE",
            back: "Giriş Ekranına Dön", createAcc: "Yeni hesap oluştur",
            resetReady: "Token ulaştıysa sıfırlama ekranına geçebilirsiniz.",
            proceedToReset: "ŞİFREYİ SIFIRLA EKRANINA GİT",
            success: "Giriş başarılı!", regSuccess: "Kayıt başarılı, giriş yapabilirsiniz.",
            forgotSuccess: "Sıfırlama kodu gönderildi.", resetSuccess: "Şifreniz güncellendi.",
            error: "Bir hata oluştu!"
        }
    }[lang || 'tr'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (view === 'login') {
                const res = await api.post('/Auth/login', {
                    email: formData.email,
                    password: formData.password
                });

                if (res.data.token) {
                    localStorage.setItem('geo_token', res.data.token);
                    const userId = res.data.userId;
                    if (userId) {
                        localStorage.setItem('geo_userId', userId);
                    }
                    localStorage.setItem('geo_username', res.data.username || formData.email.split('@')[0]);
                    showToast('success', t.success);
                    onLoginSuccess();
                }
            } else if (view === 'register') {
                await api.post('/Auth/register', {
                    username: formData.username,
                    email: formData.email,
                    password: formData.password
                });
                showToast('success', t.regSuccess);
                setView('login');
            } else if (view === 'forgot') {
                await api.post('/Auth/forgot-password', { email: formData.email });
                showToast('success', t.forgotSuccess);
                setIsTokenSent(true);
            } else if (view === 'reset') {
                await api.post('/Auth/reset-password', {
                    token: formData.token,
                    newPassword: formData.newPassword
                });
                showToast('success', t.resetSuccess);
                setView('login');
                setIsTokenSent(false);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || t.error;
            showToast('error', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-nogutter min-h-screen">
            {/* SOL TARAF */}
            <div className="hidden md:flex md:col-6 lg:col-7 align-items-center justify-content-center p-6 relative overflow-hidden"
                 style={{
                     background: 'linear-gradient(135deg, var(--primary-color) 0%, #1e293b 100%)',
                     color: '#fff'
                 }}>
                <div className="absolute opacity-10" style={{ transform: 'scale(3)', zIndex: 0 }}>
                    <i className="pi pi-map text-8xl"></i>
                </div>

                <div className="relative z-1 text-center lg:text-left max-w-lg">
                    <div className="flex align-items-center gap-3 mb-4 justify-content-center lg:justify-content-start">
                        <i className="pi pi-map-marker text-6xl text-blue-400"></i>
                        <h1 className="text-6xl font-bold m-0 tracking-tight">{t.brandName}</h1>
                    </div>
                    <p className="text-2xl mb-6 text-blue-100 font-light">{t.tagline}</p>

                    <div className="flex flex-column gap-4 mt-8">
                        <div className="flex align-items-center gap-3">
                            <i className="pi pi-pencil p-3 border-circle bg-blue-500 text-white shadow-2"></i>
                            <span className="text-xl">{t.feature1}</span>
                        </div>
                        <div className="flex align-items-center gap-3">
                            <i className="pi pi-clone p-3 border-circle bg-blue-600 text-white shadow-2"></i>
                            <span className="text-xl">{t.feature2}</span>
                        </div>
                        <div className="flex align-items-center gap-3">
                            <i className="pi pi-chart-bar p-3 border-circle bg-blue-700 text-white shadow-2"></i>
                            <span className="text-xl">{t.feature3}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SAĞ TARAF */}
            <div className="col-12 md:col-6 lg:col-5 flex align-items-center justify-content-center p-4 surface-ground">
                <Card className="w-full md:w-30rem shadow-6 border-round-xl p-3">
                    <div className="text-center mb-5">
                        <div className="md:hidden flex flex-column align-items-center mb-4">
                            <i className="pi pi-map-marker text-5xl text-primary mb-2"></i>
                            <h1 className="text-4xl font-bold m-0 text-primary">GeoApp</h1>
                        </div>
                        <h2 className="m-0 text-3xl font-bold surface-900">
                            {view === 'login' && t.login}
                            {view === 'register' && t.register}
                            {view === 'forgot' && (isTokenSent ? "BİLGİ" : t.forgot)}
                            {view === 'reset' && t.reset}
                        </h2>
                        <p className="text-600 mt-2">Lütfen bilgilerinizi giriniz.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-column gap-4 p-fluid">
                        {view === 'register' && (
                            <div className="flex flex-column gap-2">
                                <label className="font-semibold">{t.username}</label>
                                <IconField iconPosition="left">
                                    <InputIcon className="pi pi-user" />
                                    <InputText
                                        value={formData.username}
                                        placeholder={t.username}
                                        required
                                        onChange={e => setFormData({...formData, username: e.target.value})}
                                    />
                                </IconField>
                            </div>
                        )}

                        {(view === 'login' || view === 'register' || (view === 'forgot' && !isTokenSent)) && (
                            <div className="flex flex-column gap-2">
                                <label className="font-semibold">{t.email}</label>
                                <IconField iconPosition="left">
                                    <InputIcon className="pi pi-envelope" />
                                    <InputText
                                        type="email"
                                        value={formData.email}
                                        placeholder={t.email}
                                        required
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                    />
                                </IconField>
                            </div>
                        )}

                        {(view === 'login' || view === 'register') && (
                            <div className="flex flex-column gap-2">
                                <label className="font-semibold">{t.password}</label>
                                {/* Password bileşeni kendi ikonunu yönetir, IconField'e gerek yoktur */}
                                <Password
                                    value={formData.password}
                                    placeholder={t.password}
                                    required
                                    toggleMask
                                    feedback={view === 'register'}
                                    inputClassName="w-full"
                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                />
                            </div>
                        )}

                        {view === 'forgot' && isTokenSent && (
                            <div className="p-4 bg-blue-50 border-round text-blue-700 text-center line-height-3">
                                <i className="pi pi-info-circle text-2xl mb-2"></i>
                                <p className="m-0">{t.resetReady}</p>
                            </div>
                        )}

                        {view === 'reset' && (
                            <>
                                <IconField iconPosition="left">
                                    <InputIcon className="pi pi-key" />
                                    <InputText
                                        value={formData.token}
                                        placeholder={t.token}
                                        required
                                        onChange={e => setFormData({...formData, token: e.target.value})}
                                    />
                                </IconField>
                                <Password
                                    value={formData.newPassword}
                                    placeholder={t.newPass}
                                    required
                                    toggleMask
                                    inputClassName="w-full"
                                    onChange={e => setFormData({...formData, newPassword: e.target.value})}
                                />
                            </>
                        )}

                        <div className="mt-3">
                            {view === 'forgot' && isTokenSent ? (
                                <Button type="button" label={t.proceedToReset} icon="pi pi-arrow-right"
                                        className="p-button-raised"
                                        onClick={() => { setView('reset'); setIsTokenSent(false); }} />
                            ) : (
                                <Button type="submit" loading={loading}
                                        label={view === 'login' ? t.loginBtn : view === 'register' ? t.registerBtn :
                                            view === 'forgot' ? t.sendCode : t.updateBtn}
                                        icon="pi pi-sign-in" className="p-button-raised" />
                            )}
                        </div>
                    </form>

                    <Divider align="center" className="my-5">
                        <span className="text-400 font-normal text-sm">VEYA</span>
                    </Divider>

                    <div className="flex flex-column gap-3">
                        {view === 'login' && (
                            <>
                                <Button label={t.forgot} onClick={() => setView('forgot')}
                                        className="p-button-text p-button-secondary text-sm" />
                                <Button label={t.createAcc} onClick={() => setView('register')}
                                        className="p-button-outlined" icon="pi pi-user-plus" />
                            </>
                        )}

                        {(view === 'register' || view === 'forgot' || view === 'reset') && (
                            <Button label={t.back} onClick={() => { setView('login'); setIsTokenSent(false); }}
                                    className="p-button-text" icon="pi pi-arrow-left" />
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Auth;