import React, { useState, useEffect } from 'react';
import { getTokenExpiration } from '../utils/tokenHelper';
import { Tag } from 'primereact/tag';
import { Tooltip } from 'primereact/tooltip';

const TokenCountdown = ({ token, onLogout, lang }) => {
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        const expiration = getTokenExpiration(token);
        if (!expiration) return;

        const updateTimer = () => {
            const now = new Date().getTime();
            const distance = expiration - now;

            if (distance < 0) {
                clearInterval(timer);
                onLogout();
                return;
            }
            setTimeLeft(distance);
        };

        const timer = setInterval(updateTimer, 1000);
        updateTimer();

        return () => clearInterval(timer);
    }, [token, onLogout]);

    if (!timeLeft) return null;

    const hours = Math.floor((timeLeft / (1000 * 60 * 60)));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    
    const getSeverity = () => {
        if (timeLeft < 60000) return 'danger'; // 1 dakikadan az
        if (timeLeft < 300000) return 'warning'; // 5 dakikadan az
        return 'info';
    };

    const timeString = `${hours}h ${minutes}m ${seconds}s`;

    return (
        <div className="fixed bottom-0 right-0 m-3 z-5">
            <Tooltip target=".token-tag" content={lang === 'tr' ? 'Oturumun bitmesine kalan süre' : 'Time remaining until session ends'} position="left" />
            <Tag
                className="token-tag shadow-4 px-3 py-2 border-round-pill"
                severity={getSeverity()}
                icon={`pi ${timeLeft < 300000 ? 'pi-exclamation-triangle' : 'pi-clock'}`}
            >
                <div className="flex align-items-center gap-2">
                    <span className="font-medium uppercase text-xs">
                        {lang === 'tr' ? 'Oturum:' : 'Session:'}
                    </span>
                    <span className="font-bold font-mono text-sm">
                        {timeString}
                    </span>
                </div>
            </Tag>
        </div>
    );
};

export default TokenCountdown;