import React, { useEffect, useState } from 'react';

interface ConfetiProps {
    active: boolean;
    duration?: number;
}

export const Confeti: React.FC<ConfetiProps> = ({ active, duration = 3000 }) => {
    const [particles, setParticles] = useState<any[]>([]);

    useEffect(() => {
        if (active) {
            const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#F7DC6F'];
            const newParticles = Array.from({ length: 50 }).map((_, i) => ({
                id: i,
                x: Math.random() * 100, // %
                y: -10, // Start above screen
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                delay: Math.random() * 0.5,
                duration: Math.random() * 2 + 2, // 2-4s fall
                drift: Math.random() * 50 - 25, // Horizontal drift
            }));
            setParticles(newParticles);

            if (duration > 0) {
                const timer = setTimeout(() => setParticles([]), duration);
                return () => clearTimeout(timer);
            }
        } else {
            setParticles([]);
        }
    }, [active, duration]);

    if (!active || particles.length === 0) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute rounded-sm"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        backgroundColor: p.color,
                        transform: `rotate(${p.rotation}deg)`,
                        animation: `fall ${p.duration}s linear ${p.delay}s forwards`,
                        '--drift': `${p.drift}px`
                    } as any}
                />
            ))}
            <style>{`
        @keyframes fall {
          0% { transform: translateY(0) rotate(0deg) translateX(0); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg) translateX(var(--drift)); opacity: 0; }
        }
      `}</style>
        </div>
    );
};
