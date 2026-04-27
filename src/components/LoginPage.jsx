import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Delete, LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const login = useStore(s => s.login);
    const configuracion = useStore(s => s.configuracion);
    const [pin, setPin] = useState('');
    const [shake, setShake] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const MAX = 4;

    const handleDigit = (d) => {
        if (pin.length >= MAX) return;
        const newPin = pin + d;
        setPin(newPin);
        setError('');
        if (newPin.length >= MAX) tryLogin(newPin);
    };

    const handleDelete = () => {
        setPin(p => p.slice(0, -1));
        setError('');
    };

    const tryLogin = (p = pin) => {
        if (!p) return;
        setLoading(true);
        setTimeout(() => {
            const ok = login(p);
            if (!ok) {
                setShake(true);
                setError('PIN incorrecto. Intenta de nuevo.');
                setPin('');
                setTimeout(() => setShake(false), 600);
            }
            setLoading(false);
        }, 200);
    };

    useEffect(() => {
        const handler = (e) => {
            if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
            if (e.key === 'Backspace') handleDelete();
            if (e.key === 'Enter') tryLogin();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [pin]);

    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];

    return (
        <div style={{
            minHeight: '100vh',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
            <div style={{
                width: '100%',
                maxWidth: 360,
                padding: '0 16px',
            }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <img
                        src="/_preview.png"
                        alt="Logo"
                        style={{ width: 56, height: 56, borderRadius: 16, objectFit: 'contain', margin: '0 auto 16px', display: 'block' }}
                    />
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>
                        {configuracion.nombreKiosco}
                    </div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                        Ingresa tu PIN para acceder
                    </div>
                </div>

                <div style={{
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 20,
                    padding: '28px 24px',
                    boxShadow: '0 8px 30px rgba(17,24,39,0.10)',
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 12,
                        marginBottom: 20,
                        animation: shake ? 'shake 0.5s' : 'none',
                    }}>
                        {Array.from({ length: MAX }).map((_, i) => (
                            <div key={i} style={{
                                width: 14, height: 14,
                                borderRadius: '50%',
                                background: i < pin.length ? '#111827' : '#f3f4f6',
                                border: `2px solid ${i < pin.length ? '#111827' : '#d1d5db'}`,
                                transition: 'all 0.15s',
                                transform: i < pin.length ? 'scale(1.1)' : 'scale(1)',
                            }} />
                        ))}
                    </div>

                    {error && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: '#fef2f2', border: '1px solid #fecaca',
                            borderRadius: 8, padding: '8px 12px',
                            color: '#dc2626', fontSize: 12, marginBottom: 16,
                        }}>
                            <AlertCircle size={13} /> {error}
                        </div>
                    )}

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 8,
                        marginBottom: 16,
                    }}>
                        {keys.map((k) => {
                            const isClear = k === 'C';
                            const isDel = k === '⌫';
                            return (
                                <button
                                    key={k}
                                    onClick={() => {
                                        if (isDel) handleDelete();
                                        else if (isClear) { setPin(''); setError(''); }
                                        else handleDigit(k);
                                    }}
                                    style={{
                                        height: 52,
                                        borderRadius: 10,
                                        border: '1px solid #e5e7eb',
                                        background: isClear ? '#fef2f2' : '#f9fafb',
                                        color: isClear ? '#dc2626' : '#111827',
                                        fontSize: isClear || isDel ? 13 : 20,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'background 0.1s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontFamily: 'inherit',
                                    }}
                                    onMouseDown={e => e.currentTarget.style.background = isClear ? '#fee2e2' : '#f3f4f6'}
                                    onMouseUp={e => e.currentTarget.style.background = isClear ? '#fef2f2' : '#f9fafb'}
                                    onMouseLeave={e => e.currentTarget.style.background = isClear ? '#fef2f2' : '#f9fafb'}
                                >
                                    {isDel ? <Delete size={18} /> : k}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => tryLogin()}
                        disabled={pin.length === 0 || loading}
                        style={{
                            width: '100%', height: 48,
                            borderRadius: 10, border: 'none',
                            background: pin.length > 0 ? '#111827' : '#e5e7eb',
                            color: pin.length > 0 ? '#ffffff' : '#9ca3af',
                            fontSize: 14, fontWeight: 700,
                            cursor: pin.length > 0 ? 'pointer' : 'not-allowed',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: 8, transition: 'all 0.15s', fontFamily: 'inherit',
                            letterSpacing: '0.5px',
                        }}
                    >
                        <LogIn size={16} />
                        {loading ? 'Verificando...' : 'INGRESAR'}
                    </button>
                </div>

            </div>

            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-6px); }
                    40% { transform: translateX(6px); }
                    60% { transform: translateX(-4px); }
                    80% { transform: translateX(4px); }
                }
            `}</style>
        </div>
    );
}
