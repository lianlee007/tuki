import { useCallback, useState, useEffect } from 'react';

type SoundType = 'click' | 'spin' | 'win' | 'eliminate' | 'fanfare';

// URLs de ejemplo o placeholders. En producción deberían ser archivos locales optimizados.
const SOUND_URLS: Record<SoundType, string> = {
    click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Pop suave
    spin: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3', // Rueda girando (loop)
    win: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Éxito
    eliminate: 'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3', // Fallo/Eliminación
    fanfare: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3', // Victoria final
};

export const useSonidos = () => {
    const [enabled, setEnabled] = useState(false); // Por defecto desactivado (no intrusivo)
    const [volume, setVolume] = useState(0.3); // Volumen bajo por defecto

    // Precarga de sonidos
    useEffect(() => {
        Object.values(SOUND_URLS).forEach(url => {
            const audio = new Audio(url);
            audio.preload = 'auto';
        });
    }, []);

    const play = useCallback((type: SoundType) => {
        if (!enabled) return;

        try {
            const audio = new Audio(SOUND_URLS[type]);
            audio.volume = volume;
            audio.play().catch(e => console.warn("Audio play failed", e));
        } catch (error) {
            console.warn("Error playing sound", error);
        }
    }, [enabled, volume]);

    const toggle = useCallback(() => setEnabled(prev => !prev), []);

    return { play, enabled, toggle, setVolume, volume };
};
