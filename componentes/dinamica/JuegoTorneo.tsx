/**
 * Descripción: Dinámica de copa con bracket eliminatorio y podio final.
 * Mejoras: Sonidos, Animaciones, Mobile-First, Validaciones.
 */
import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Users, Grid, Shuffle, RefreshCw, CheckCircle2, XCircle, UserMinus, HelpCircle, UserCheck, UserX, ArrowRight, Zap, ChefHat, Dices, HandMetal, Hand, Star, Volume2, VolumeX, ChevronRight, ChevronLeft } from 'lucide-react';
import { Restaurante } from '../../tipos';
import { Boton } from '../ui';
import { useSonidos } from './hooks/useSonidos';
import { Confeti } from './efectos/Confeti';

// --- Helper Types & Functions ---
interface Match {
    id: number;
    round: number; // 1: Octavos, 2: Cuartos, 3: Semis, 4: Final, 0: Tercer Puesto
    p1: Restaurante | null;
    p2: Restaurante | null;
    winner: Restaurante | null;
    nextMatchId: number | null;
}

function mezclarArray<T>(array: T[]): T[] {
    return [...array].sort(() => Math.random() - 0.5);
}

// --- Sub-components (Private) ---

// Tarjeta visual de cada partido en el bracket
const MatchCard: React.FC<{ match: Match; isActive: boolean; label?: string; onClick?: () => void; innerRef?: (node: HTMLDivElement | null) => void }> = ({ match, isActive, label, onClick, innerRef }) => (
    <div
        ref={innerRef}
        onClick={onClick}
        className={`relative flex flex-col justify-center w-36 sm:w-44 p-2 sm:p-3 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${isActive
            ? 'scale-105 ring-2 sm:ring-4 ring-primary shadow-[0_0_25px_rgba(255,140,66,0.6)] bg-gradient-to-br from-primary/10 to-primary/5 border-primary z-20'
            : match.winner
                ? 'border-green-500/30 bg-green-500/5 shadow-lg opacity-80 hover:opacity-100'
                : 'border-white/20 bg-surface/80 hover:bg-surface hover:border-white/30'
            }`}>
        {isActive && (
            <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-orange-600 text-white text-[9px] sm:text-xs font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-full animate-pulse shadow-xl z-30 flex items-center gap-1 whitespace-nowrap">
                <Zap size={8} fill="currentColor" /> JUGAR
            </div>
        )}
        {label && (
            <div className="absolute -bottom-4 sm:-bottom-5 left-1/2 -translate-x-1/2 text-[9px] sm:text-xs font-black text-primary uppercase tracking-widest whitespace-nowrap drop-shadow-lg">
                {label}
            </div>
        )}

        {/* Player 1 */}
        <div className={`flex items-center gap-1.5 sm:gap-2.5 mb-1 sm:mb-1.5 p-1.5 sm:p-2 rounded-lg transition-all ${match.winner?.id === match.p1?.id
            ? 'bg-green-500/20 border border-green-500/50 font-bold text-green-400'
            : (match.winner && match.p1 && match.winner.id !== match.p1.id)
                ? 'opacity-40 line-through decoration-red-500/70 bg-red-500/10'
                : isActive && !match.winner
                    ? 'bg-primary/10 border border-primary/30'
                    : 'bg-white/5 border border-white/10'
            }`}>
            <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-surface to-bg overflow-hidden flex-shrink-0 border border-white/20 shadow-inner">
                {match.p1?.imagen_logo_url ? (
                    <img src={match.p1.imagen_logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <ChefHat size={12} className="text-text-muted" />
                    </div>
                )}
            </div>
            <span className="text-[10px] sm:text-xs truncate font-semibold flex-1">{match.p1?.nombre || '...'}</span>
            {match.winner?.id === match.p1?.id && <CheckCircle2 size={12} className="text-green-400 flex-shrink-0" />}
        </div>

        <div className="h-[1px] sm:h-[2px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-0.5 sm:my-1.5"></div>

        {/* Player 2 */}
        <div className={`flex items-center gap-1.5 sm:gap-2.5 p-1.5 sm:p-2 rounded-lg transition-all ${match.winner?.id === match.p2?.id
            ? 'bg-green-500/20 border border-green-500/50 font-bold text-green-400'
            : (match.winner && match.p2 && match.winner.id !== match.p2.id)
                ? 'opacity-40 line-through decoration-red-500/70 bg-red-500/10'
                : isActive && !match.winner
                    ? 'bg-primary/10 border border-primary/30'
                    : 'bg-white/5 border border-white/10'
            }`}>
            <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-surface to-bg overflow-hidden flex-shrink-0 border border-white/20 shadow-inner">
                {match.p2?.imagen_logo_url ? (
                    <img src={match.p2.imagen_logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <ChefHat size={12} className="text-text-muted" />
                    </div>
                )}
            </div>
            <span className="text-[10px] sm:text-xs truncate font-semibold flex-1">{match.p2?.nombre || '...'}</span>
            {match.winner?.id === match.p2?.id && <CheckCircle2 size={12} className="text-green-400 flex-shrink-0" />}
        </div>
    </div>
);

// Panel de control para decidir el ganador (Azar o Manual)
const ControlPartido = ({ match, onResolve, playSound }: { match: Match, onResolve: (id: number, w: Restaurante) => void, playSound: (t: any) => void }) => {
    const [animando, setAnimando] = useState(false);
    const [tempWinner, setTempWinner] = useState<Restaurante | null>(null);
    const [modoDecision, setModoDecision] = useState<'seleccion' | 'azar' | 'manual'>('seleccion');

    useEffect(() => {
        setAnimando(false);
        setTempWinner(null);
        setModoDecision('seleccion');
    }, [match.id]);

    const jugarAzar = () => {
        if (!match.p1 || !match.p2) return;
        setModoDecision('azar');
        setAnimando(true);
        playSound('click');

        let toggles = 0;
        const interval = setInterval(() => {
            toggles++;
            setTempWinner(toggles % 2 === 0 ? match.p1 : match.p2);
            if (toggles % 4 === 0) playSound('click'); // Sonido suave durante sorteo

            if (toggles >= 20) {
                clearInterval(interval);
                const finalWinner = Math.random() > 0.5 ? match.p1! : match.p2!;
                setTempWinner(finalWinner);
                playSound('win');
                setTimeout(() => { setAnimando(false); onResolve(match.id, finalWinner); }, 800);
            }
        }, 100);
    };

    if (!match.p1 || !match.p2) return <div className="neumorphic p-8 text-center text-text-muted">Selecciona un partido activo...</div>;

    const renderCard = (player: Restaurante) => (
        <div className={`p-3 sm:p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 sm:gap-4 ${animando && tempWinner?.id === player.id ? 'bg-primary/20 border-primary scale-105 shadow-lg' : 'bg-surface border-white/5'}`}>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-bg shadow-inner overflow-hidden flex-shrink-0">
                    {player.imagen_logo_url ? <img src={player.imagen_logo_url} className="w-full h-full object-cover" alt="" /> : <ChefHat className="p-2" />}
                </div>
                <span className="font-bold text-sm sm:text-lg leading-tight truncate">{player.nombre}</span>
            </div>
            {modoDecision === 'manual' && (
                <button onClick={() => { playSound('win'); onResolve(match.id, player); }} className="p-2 bg-green-500 text-white rounded-full hover:scale-110 transition-transform shadow-lg shrink-0">
                    <CheckCircle2 size={18} />
                </button>
            )}
        </div>
    );

    const tituloPartido = match.round === 4 ? "GRAN FINAL" : match.round === 0 ? "3er PUESTO" : "Encuentro";

    return (
        <div className="h-full neumorphic p-4 sm:p-6 rounded-3xl border border-white/5 flex flex-col justify-center items-center relative overflow-hidden bg-bg">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                <Trophy size={14} /> {tituloPartido}
            </h3>
            <p className="text-[10px] sm:text-xs text-text-muted mb-4 sm:mb-6">
                {modoDecision === 'seleccion' ? 'Selecciona método' : modoDecision === 'azar' ? 'Simulando...' : 'Elige al ganador'}
            </p>

            <div className="w-full flex flex-col gap-3 sm:gap-4 relative z-10">
                {renderCard(match.p1)}
                <div className="flex justify-center my-1 sm:my-2 relative">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-bg flex items-center justify-center font-black text-text-muted text-[10px] sm:text-xs shadow-inner z-10 border border-white/5">VS</div>
                    {modoDecision === 'manual' && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-white/10 -z-0"></div>}
                </div>
                {renderCard(match.p2)}
            </div>

            <div className="mt-6 sm:mt-8 w-full">
                {modoDecision === 'seleccion' && (
                    <div className="grid grid-cols-2 gap-3 animate-fadeIn">
                        <button onClick={jugarAzar} className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl neumorphic hover:bg-surface/80 border border-white/5 transition-all group">
                            <Dices size={20} className="text-primary group-hover:rotate-12 transition-transform" /><span className="text-[10px] sm:text-xs font-bold">Azar</span>
                        </button>
                        <button onClick={() => { playSound('click'); setModoDecision('manual'); }} className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl neumorphic hover:bg-surface/80 border border-white/5 transition-all group">
                            <HandMetal size={20} className="text-secondary group-hover:scale-110 transition-transform" /><span className="text-[10px] sm:text-xs font-bold">Manual</span>
                        </button>
                    </div>
                )}
                {modoDecision === 'manual' && (
                    <div className="text-center animate-fadeIn">
                        <p className="text-xs text-text-muted mb-4 flex items-center justify-center gap-2"><Hand size={14} /> Toca el botón verde</p>
                        <button onClick={() => setModoDecision('seleccion')} className="text-[10px] underline text-text-muted hover:text-primary">Cancelar</button>
                    </div>
                )}
                {modoDecision === 'azar' && animando && <div className="flex justify-center py-4"><RefreshCw className="animate-spin text-primary" size={28} /></div>}
            </div>
        </div>
    );
};

// --- Main Component ---
interface Props {
    restaurantes: Restaurante[];
    onGanador: (r: Restaurante) => void;
}

export const JuegoTorneo: React.FC<Props> = ({ restaurantes, onGanador }) => {
    const [fase, setFase] = useState<'preliminar' | 'sorteo' | 'bracket' | 'podio'>('preliminar');
    const [participantes, setParticipantes] = useState<Restaurante[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [currentMatchId, setCurrentMatchId] = useState<number | null>(null);
    const [excluidosManuales, setExcluidosManuales] = useState<string[]>([]);
    const [preliminarResult, setPreliminarResult] = useState<{ qualified: Restaurante[], eliminated: Restaurante[] } | null>(null);
    const [animandoPreliminar, setAnimandoPreliminar] = useState(false);
    const [isShuffling, setIsShuffling] = useState(false);
    const [showConfeti, setShowConfeti] = useState(false);

    // Mobile View State
    const [mobileRoundView, setMobileRoundView] = useState<number>(1); // 1: Octavos, 2: Cuartos, 3: Semis, 4: Finales

    // Podio State
    const [podio, setPodio] = useState<{ gold: Restaurante, silver: Restaurante, bronze: Restaurante } | null>(null);

    const { play, enabled: sonidoEnabled, toggle: toggleSonido } = useSonidos();

    // Refs para hacer scroll automático al partido activo
    const matchRefs = useRef<Record<number, HTMLDivElement | null>>({});

    useEffect(() => {
        if (restaurantes.length > 16) setFase('preliminar');
        else {
            setParticipantes(restaurantes);
            setFase('sorteo');
        }
    }, [restaurantes]);

    // Scroll automático al partido activo
    useEffect(() => {
        if (currentMatchId && matchRefs.current[currentMatchId]) {
            const matchElement = matchRefs.current[currentMatchId];
            if (matchElement) {
                // Pequeño delay para asegurar que el DOM esté actualizado
                setTimeout(() => {
                    matchElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'center'
                    });
                }, 150);
            }
        }
    }, [currentMatchId, fase]); // Agregar fase para que también haga scroll cuando cambie de fase

    // --- Logic Methods ---
    const ejecutarPreliminar = () => {
        const poolActivos: Restaurante[] = restaurantes.filter(r => !excluidosManuales.includes(r.id));
        if (poolActivos.length < 2) { alert(`Necesitas al menos 2 participantes.`); return; } // Mínimo 2 para una final directa

        setAnimandoPreliminar(true);
        play('spin');

        setTimeout(() => {
            const shuffled: Restaurante[] = mezclarArray(poolActivos);
            // Ajustar a potencias de 2 (2, 4, 8, 16)
            let limit = 16;
            if (shuffled.length < 4) limit = 2;
            else if (shuffled.length < 8) limit = 4;
            else if (shuffled.length < 16) limit = 8;

            const qualified: Restaurante[] = shuffled.slice(0, limit);
            const eliminated: Restaurante[] = [...shuffled.slice(limit), ...restaurantes.filter(r => excluidosManuales.includes(r.id))];

            setPreliminarResult({ qualified, eliminated });
            setParticipantes(qualified);
            setAnimandoPreliminar(false);
            play('win');
        }, 2000);
    };

    const iniciarBracket = () => {
        setIsShuffling(true);
        play('spin');

        setTimeout(() => {
            const shuffled: Restaurante[] = mezclarArray(participantes);
            const matchesList: Match[] = [];
            let idCounter = 1;

            // Determinar rondas basado en cantidad de participantes
            const totalPlayers = shuffled.length;
            let currentRoundPlayers = shuffled;
            let roundNum = 1; // 1 es la primera ronda (sea octavos, cuartos, o semis)

            // Generar rondas dinámicamente
            // Si son 16 -> Round 1 (Octavos) -> Round 2 (Cuartos) -> Round 3 (Semis) -> Round 4 (Final)
            // Si son 8 -> Round 2 (Cuartos) -> Round 3 (Semis) -> Round 4 (Final)
            // Si son 4 -> Round 3 (Semis) -> Round 4 (Final)
            // Si son 2 -> Round 4 (Final)

            let startRound = 1;
            if (totalPlayers === 8) startRound = 2;
            if (totalPlayers === 4) startRound = 3;
            if (totalPlayers === 2) startRound = 4;

            // Generar primera ronda
            const firstRoundMatches: Match[] = [];
            for (let i = 0; i < totalPlayers / 2; i++) {
                const m: Match = {
                    id: idCounter++,
                    round: startRound,
                    p1: currentRoundPlayers[i * 2] || null,
                    p2: currentRoundPlayers[i * 2 + 1] || null,
                    winner: null,
                    nextMatchId: null
                };
                matchesList.push(m);
                firstRoundMatches.push(m);
            }

            // Generar rondas subsecuentes hasta la final (Round 4)
            let previousRoundMatches = firstRoundMatches;
            for (let r = startRound + 1; r <= 4; r++) {
                const currentMatches: Match[] = [];
                for (let i = 0; i < previousRoundMatches.length / 2; i++) {
                    const m: Match = { id: idCounter++, round: r, p1: null, p2: null, winner: null, nextMatchId: null };
                    // Vincular
                    previousRoundMatches[i * 2].nextMatchId = m.id;
                    previousRoundMatches[i * 2 + 1].nextMatchId = m.id;
                    matchesList.push(m);
                    currentMatches.push(m);
                }
                previousRoundMatches = currentMatches;
            }

            // Round 0: 3er PUESTO (Solo si empezamos antes de la final)
            if (startRound < 4) {
                const tercerPuesto: Match = { id: idCounter++, round: 0, p1: null, p2: null, winner: null, nextMatchId: null };
                matchesList.push(tercerPuesto);
            }

            setMatches(matchesList);

            // Determinar primer partido jugable
            const first = matchesList.find(m => !m.winner && m.p1 && m.p2);
            setCurrentMatchId(first ? first.id : null);

            // Set mobile view to start round
            setMobileRoundView(startRound);

            setIsShuffling(false);
            setFase('bracket');
            play('fanfare');
        }, 1500);
    };

    const resolverMatch = (matchId: number, winner: Restaurante) => {
        const newMatches = [...matches];
        const matchIdx = newMatches.findIndex(m => m.id === matchId);
        if (matchIdx === -1) return;

        const match = newMatches[matchIdx];
        match.winner = winner;

        // --- Lógica de avance ---

        // Caso especial: Semifinales (Round 3) -> Perdedor a 3er Puesto
        if (match.round === 3 && match.p1 && match.p2) {
            const loser = match.p1.id === winner.id ? match.p2 : match.p1;
            const thirdPlaceMatch = newMatches.find(m => m.round === 0);
            if (thirdPlaceMatch) {
                if (!thirdPlaceMatch.p1) thirdPlaceMatch.p1 = loser;
                else thirdPlaceMatch.p2 = loser;
            }
        }

        // Lógica estándar: Avanzar ganador
        if (match.nextMatchId) {
            const nextMatch = newMatches.find(m => m.id === match.nextMatchId);
            if (nextMatch) {
                if (!nextMatch.p1) nextMatch.p1 = winner;
                else nextMatch.p2 = winner;
            }
        }

        setMatches(newMatches);

        // --- Lógica de Finalización y Podio ---
        const finalMatch = newMatches.find(m => m.round === 4);
        const thirdPlaceMatch = newMatches.find(m => m.round === 0);

        // Check si todo terminó
        const finalJugada = !!finalMatch?.winner;
        const tercerPuestoJugado = !thirdPlaceMatch || !!thirdPlaceMatch.winner; // Si no existe match de 3ro, asumimos true

        if (finalJugada && tercerPuestoJugado) {
            const gold = finalMatch!.winner!;
            const silver = finalMatch!.p1?.id === gold.id ? finalMatch!.p2! : finalMatch!.p1!;
            const bronze = thirdPlaceMatch?.winner || silver; // Fallback si no hay 3ro

            setPodio({ gold, silver, bronze });
            setShowConfeti(true);
            play('fanfare');
            setTimeout(() => setFase('podio'), 1500);
            return;
        }

        // --- Determinar siguiente partido activo ---
        // Prioridad: 3er Puesto si está listo
        if (thirdPlaceMatch && thirdPlaceMatch.p1 && thirdPlaceMatch.p2 && !thirdPlaceMatch.winner) {
            setCurrentMatchId(thirdPlaceMatch.id);
            setMobileRoundView(0); // View especial para 3er puesto/finales
            return;
        }

        const next = newMatches.find(m => !m.winner && m.p1 && m.p2);
        if (next) {
            setCurrentMatchId(next.id);
            // Auto-switch mobile view to the round of the next match
            if (next.round > 0) setMobileRoundView(next.round);
        } else {
            setCurrentMatchId(null);
        }
    };

    // --- Renders ---

    // PODIO VIEW
    if (fase === 'podio' && podio) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full animate-fadeIn pb-10">
                <Confeti active={showConfeti} />
                <div className="text-center mb-10">
                    <h2 className="text-4xl md:text-5xl font-bold font-serif text-text-main mb-2">¡Torneo Finalizado!</h2>
                    <p className="text-text-muted text-lg">Aquí están tus campeones</p>
                </div>

                <div className="flex flex-col md:flex-row items-end justify-center gap-8 md:gap-8 w-full max-w-4xl px-6 mb-12">

                    {/* PLATA (2nd) */}
                    <div className="order-2 md:order-1 flex flex-col items-center w-full md:w-1/3 animate-slideIn" style={{ animationDelay: '0.2s' }}>
                        <div className="w-24 h-24 rounded-full border-4 border-gray-300 overflow-hidden mb-4 shadow-xl relative">
                            <img src={podio.silver.imagen_logo_url || ''} className="w-full h-full object-cover grayscale-[0.2]" alt="Silver" />
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-800 font-bold shadow-md border-2 border-bg">2</div>
                        </div>
                        <div className="h-32 w-full bg-gradient-to-t from-gray-400/20 to-gray-300/10 rounded-t-2xl flex flex-col justify-end p-4 text-center border-t border-gray-300/30">
                            <span className="font-bold text-lg text-text-main line-clamp-2">{podio.silver.nombre}</span>
                            <span className="text-xs uppercase font-bold text-gray-400 mt-1">Subcampeón</span>
                        </div>
                    </div>

                    {/* ORO (1st) */}
                    <div className="order-1 md:order-2 flex flex-col items-center w-full md:w-1/3 z-10 animate-slideIn">
                        <div className="absolute -mt-16 text-yellow-500 animate-bounce"><Star size={32} fill="currentColor" /></div>
                        <div className="w-32 h-32 rounded-full border-4 border-yellow-400 overflow-hidden mb-4 shadow-[0_0_30px_rgba(250,204,21,0.4)] relative ring-4 ring-yellow-400/20">
                            <img src={podio.gold.imagen_logo_url || ''} className="w-full h-full object-cover" alt="Gold" />
                            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-yellow-900 font-black text-xl shadow-md border-4 border-bg">1</div>
                        </div>
                        <div className="h-48 w-full bg-gradient-to-t from-yellow-500/20 to-yellow-400/10 rounded-t-2xl flex flex-col justify-end p-6 text-center border-t border-yellow-400/30 relative overflow-hidden">
                            <div className="absolute inset-0 bg-yellow-400/5 animate-pulse"></div>
                            <span className="font-bold text-2xl text-text-main line-clamp-2 leading-tight mb-1 relative z-10">{podio.gold.nombre}</span>
                            <span className="text-xs uppercase font-black text-yellow-500 tracking-widest relative z-10">Gran Campeón</span>
                        </div>
                    </div>

                    {/* BRONCE (3rd) */}
                    <div className="order-3 flex flex-col items-center w-full md:w-1/3 animate-slideIn" style={{ animationDelay: '0.4s' }}>
                        <div className="w-24 h-24 rounded-full border-4 border-orange-700 overflow-hidden mb-4 shadow-xl relative">
                            <img src={podio.bronze.imagen_logo_url || ''} className="w-full h-full object-cover grayscale-[0.4]" alt="Bronze" />
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-orange-700 rounded-full flex items-center justify-center text-orange-100 font-bold shadow-md border-2 border-bg">3</div>
                        </div>
                        <div className="h-24 w-full bg-gradient-to-t from-orange-800/20 to-orange-700/10 rounded-t-2xl flex flex-col justify-end p-4 text-center border-t border-orange-700/30">
                            <span className="font-bold text-lg text-text-main line-clamp-2">{podio.bronze.nombre}</span>
                            <span className="text-xs uppercase font-bold text-orange-700 mt-1">Tercer Lugar</span>
                        </div>
                    </div>
                </div>

                <Boton onClick={() => onGanador(podio.gold)} className="py-4 px-12 text-lg shadow-xl shadow-primary/20 animate-pulse">
                    Ver Detalles del Ganador
                </Boton>
            </div>
        );
    }

    // PRELIMINAR VIEW
    if (fase === 'preliminar') {
        const aspirantesActivos = restaurantes.filter(r => !excluidosManuales.includes(r.id)).length;

        return (
            <div className="flex flex-col h-full animate-fadeIn text-center max-w-6xl mx-auto w-full">
                <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold font-serif mb-2 flex items-center justify-center gap-3"><Users size={32} className="text-secondary" /> Fase Clasificatoria</h2>
                    <p className="text-text-muted mb-3 text-sm md:text-base">Selecciona los participantes. Toca para excluir manualmente.</p>
                    <div className="flex items-center justify-center gap-4 text-sm">
                        <div className="neumorphic px-4 py-2 rounded-xl border border-white/5">
                            <span className="text-text-muted">Aspirantes: </span>
                            <span className="font-bold text-primary text-lg">{aspirantesActivos}</span>
                        </div>
                        {preliminarResult && (
                            <div className="neumorphic px-4 py-2 rounded-xl border border-green-500/30 bg-green-500/10">
                                <span className="text-text-muted">Clasificados: </span>
                                <span className="font-bold text-green-500 text-lg">{preliminarResult.qualified.length}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto neumorphic-inset p-4 md:p-6 rounded-3xl mb-8 relative">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                        {restaurantes.map((rest) => {
                            const isExcluded = excluidosManuales.includes(rest.id);
                            const isQualified = preliminarResult?.qualified.find(r => r.id === rest.id);

                            let style = "border-white/5 cursor-pointer hover:bg-white/5";
                            let Icon = isExcluded ? UserMinus : HelpCircle;
                            let color = "text-text-muted";

                            if (isExcluded) style = "border-red-500/10 bg-black/20 opacity-50 grayscale";

                            if (preliminarResult) {
                                if (isQualified) {
                                    style = "border-green-500/50 bg-green-500/10 ring-2 ring-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)] opacity-100 scale-105 cursor-default";
                                    Icon = UserCheck; color = "text-green-500";
                                } else {
                                    style = isExcluded ? "border-gray-500/20 bg-black/40 opacity-30 grayscale" : "border-red-500/30 bg-red-500/5 opacity-40 grayscale scale-95";
                                    Icon = isExcluded ? UserMinus : UserX;
                                    color = isExcluded ? "text-text-muted" : "text-red-500";
                                }
                            }

                            return (
                                <div key={rest.id} onClick={() => { if (!animandoPreliminar && !preliminarResult) { play('click'); setExcluidosManuales(p => p.includes(rest.id) ? p.filter(id => id !== rest.id) : [...p, rest.id]) } }} className={`neumorphic p-2 md:p-3 flex items-center gap-2 md:gap-3 transition-all duration-300 border ${style}`}>
                                    <div className="w-8 h-8 rounded-full bg-bg border border-white/10 overflow-hidden relative shrink-0">
                                        {rest.imagen_logo_url ? <img src={rest.imagen_logo_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-700" />}
                                        {isExcluded && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><XCircle size={16} className="text-white" /></div>}
                                    </div>
                                    <div className="text-left min-w-0 flex-1">
                                        <p className={`text-[10px] md:text-xs font-bold truncate ${color} ${isExcluded ? 'line-through' : ''}`}>{rest.nombre}</p>
                                    </div>
                                    {(!preliminarResult || Icon !== HelpCircle) && <Icon size={14} className={color} />}
                                </div>
                            )
                        })}
                    </div>
                    {animandoPreliminar && <div className="absolute inset-0 z-20 bg-bg/60 backdrop-blur-sm flex items-center justify-center"><RefreshCw size={48} className="text-primary animate-spin" /></div>}
                </div>
                <div className="flex justify-center">
                    {!preliminarResult ? (
                        <Boton onClick={ejecutarPreliminar} disabled={animandoPreliminar} className="py-4 px-10 text-lg shadow-lg shadow-primary/20 w-full md:w-auto justify-center">{animandoPreliminar ? 'Sorteando...' : 'Iniciar Selección'}</Boton>
                    ) : (
                        <Boton onClick={() => { play('click'); setFase('sorteo'); }} className="py-4 px-12 text-lg !bg-green-600 !text-white shadow-lg w-full md:w-auto justify-center">Continuar <ArrowRight className="ml-2" /></Boton>
                    )}
                </div>
            </div>
        );
    }

    // SORTEO VIEW
    if (fase === 'sorteo') {
        return (
            <div className="flex flex-col items-center justify-center h-full animate-fadeIn text-center">
                <div className="relative w-32 h-32 mb-8">
                    <div className={`absolute inset-0 bg-surface rounded-xl border border-white/10 flex items-center justify-center shadow-2xl ${isShuffling ? 'animate-bounce' : ''}`}>
                        <Shuffle size={48} className="text-text-main" />
                    </div>
                </div>
                <h2 className="text-3xl font-bold font-serif mb-2">{isShuffling ? 'Sorteando Llaves...' : 'Participantes Definidos'}</h2>
                {!isShuffling && <Boton onClick={iniciarBracket} className="py-4 px-10 text-lg"><Grid className="mr-2" /> Generar Cuadrantes</Boton>}
            </div>
        );
    }

    // BRACKET VIEW
    const r1Matches = matches.filter(m => m.round === 1);
    const r2Matches = matches.filter(m => m.round === 2);
    const r3Matches = matches.filter(m => m.round === 3);
    const finalMatch = matches.find(m => m.round === 4);
    const thirdPlaceMatch = matches.find(m => m.round === 0);

    // Filter matches for mobile view
    const getMobileMatches = () => {
        if (mobileRoundView === 1) return r1Matches;
        if (mobileRoundView === 2) return r2Matches;
        if (mobileRoundView === 3) return r3Matches;
        if (mobileRoundView === 4) return [finalMatch!, thirdPlaceMatch!].filter(Boolean);
        return [];
    };

    return (
        <div className="w-full animate-fadeIn flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="mb-4 md:mb-8 flex justify-between items-center shrink-0">
                <div><h2 className="text-xl md:text-3xl font-bold font-serif flex items-center gap-2 md:gap-3"><Trophy className="text-secondary" /> Copa SmartFood</h2></div>
                <div className="flex items-center gap-4">
                    <button onClick={toggleSonido} className="p-2 rounded-full neumorphic text-text-muted hover:text-primary transition-colors">
                        {sonidoEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </button>
                    <div className="text-right hidden md:block"><span className="text-xs font-bold uppercase text-text-muted">Progreso</span><div className="w-32 h-2 bg-surface rounded-full mt-1 border border-white/5"><div className="h-full bg-secondary rounded-full transition-all duration-500" style={{ width: `${(matches.filter(m => m.winner).length / matches.length) * 100}%` }}></div></div></div>
                </div>
            </div>

            {/* Mobile Tabs for Rounds */}
            <div className="lg:hidden flex gap-2 mb-4 overflow-x-auto pb-2 shrink-0">
                {[1, 2, 3, 4].map(r => {
                    const labels = ["Octavos", "Cuartos", "Semis", "Finales"];
                    const isActive = mobileRoundView === r;
                    // Solo mostrar tabs si existen partidos en esa ronda
                    const hasMatches = matches.some(m => m.round === r);
                    if (!hasMatches && r !== 4) return null; // Final siempre mostrar

                    return (
                        <button
                            key={r}
                            onClick={() => { play('click'); setMobileRoundView(r); }}
                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${isActive ? 'bg-primary text-white shadow-lg' : 'neumorphic text-text-muted'}`}
                        >
                            {labels[r - 1]}
                        </button>
                    )
                })}
            </div>

            <div className="flex flex-col lg:flex-row gap-4 md:gap-8 h-full overflow-hidden flex-1">

                {/* BRACKET CONTAINER */}
                <div className="flex-1 neumorphic-inset p-4 md:p-8 rounded-3xl overflow-auto relative bg-gradient-to-br from-bg via-surface/50 to-bg flex flex-col">

                    {/* Mobile View (List) */}
                    <div className="lg:hidden overflow-y-auto flex-1 space-y-4 p-2">
                        {getMobileMatches().map(m => (
                            <div key={m.id} className="w-full flex justify-center">
                                <MatchCard
                                    match={m}
                                    isActive={m.id === currentMatchId}
                                    onClick={() => { if (!m.winner && m.p1 && m.p2) { play('click'); setCurrentMatchId(m.id); } }}
                                    label={m.round === 4 ? "GRAN FINAL" : m.round === 0 ? "3er PUESTO" : undefined}
                                    innerRef={(node) => { matchRefs.current[m.id] = node; }}
                                />
                            </div>
                        ))}
                        {getMobileMatches().length === 0 && <div className="text-center text-text-muted py-10">No hay partidos en esta ronda</div>}
                    </div>

                    {/* Desktop View (Tree) */}
                    <div className="hidden lg:flex overflow-x-auto overflow-y-auto h-full p-8 custom-scrollbar">
                        <div className="relative flex items-stretch gap-12 h-full py-12 mx-auto" style={{ minWidth: 'max-content', width: 'max-content' }}>

                            {/* COLUMNA IZQUIERDA: Rondas 1, 2, 3 */}
                            <div className="flex gap-12">
                                {/* R1 */}
                                {r1Matches.length > 0 && (
                                    <div className="flex flex-col justify-around relative">
                                        {r1Matches.slice(0, r1Matches.length / 2).map(m => (
                                            <div key={m.id} className="relative my-4"><MatchCard match={m} isActive={m.id === currentMatchId} onClick={() => !m.winner && m.p1 && m.p2 && setCurrentMatchId(m.id)} innerRef={(node) => { matchRefs.current[m.id] = node; }} /></div>
                                        ))}
                                    </div>
                                )}
                                {/* R2 */}
                                {r2Matches.length > 0 && (
                                    <div className="flex flex-col justify-around relative">
                                        {r2Matches.slice(0, r2Matches.length / 2).map(m => (
                                            <div key={m.id} className="relative my-4"><MatchCard match={m} isActive={m.id === currentMatchId} onClick={() => !m.winner && m.p1 && m.p2 && setCurrentMatchId(m.id)} innerRef={(node) => { matchRefs.current[m.id] = node; }} /></div>
                                        ))}
                                    </div>
                                )}
                                {/* R3 */}
                                {r3Matches.length > 0 && (
                                    <div className="flex flex-col justify-center relative">
                                        {r3Matches[0] && <div className="relative my-4"><MatchCard match={r3Matches[0]} isActive={r3Matches[0].id === currentMatchId} onClick={() => !r3Matches[0].winner && r3Matches[0].p1 && r3Matches[0].p2 && setCurrentMatchId(r3Matches[0].id)} innerRef={(node) => { matchRefs.current[r3Matches[0].id] = node; }} /></div>}
                                    </div>
                                )}
                            </div>

                            {/* CENTRO: FINAL */}
                            <div className="flex flex-col justify-center items-center px-8 gap-16 relative z-20">
                                {finalMatch && (
                                    <div className="relative scale-125">
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-sm font-black text-yellow-500 uppercase tracking-widest drop-shadow-lg">🏆 FINAL 🏆</div>
                                        <MatchCard match={finalMatch} isActive={finalMatch.id === currentMatchId} onClick={() => !finalMatch.winner && finalMatch.p1 && finalMatch.p2 && setCurrentMatchId(finalMatch.id)} innerRef={(node) => { matchRefs.current[finalMatch.id] = node; }} />
                                    </div>
                                )}
                                {thirdPlaceMatch && (
                                    <div className="relative scale-110">
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-black text-orange-600 uppercase tracking-widest">3er PUESTO</div>
                                        <MatchCard match={thirdPlaceMatch} isActive={thirdPlaceMatch.id === currentMatchId} onClick={() => !thirdPlaceMatch.winner && thirdPlaceMatch.p1 && thirdPlaceMatch.p2 && setCurrentMatchId(thirdPlaceMatch.id)} innerRef={(node) => { matchRefs.current[thirdPlaceMatch.id] = node; }} />
                                    </div>
                                )}
                            </div>

                            {/* COLUMNA DERECHA: Rondas 3, 2, 1 */}
                            <div className="flex gap-12 flex-row-reverse">
                                {/* R1 */}
                                {r1Matches.length > 0 && (
                                    <div className="flex flex-col justify-around relative">
                                        {r1Matches.slice(r1Matches.length / 2).map(m => (
                                            <div key={m.id} className="relative my-4"><MatchCard match={m} isActive={m.id === currentMatchId} onClick={() => !m.winner && m.p1 && m.p2 && setCurrentMatchId(m.id)} innerRef={(node) => { matchRefs.current[m.id] = node; }} /></div>
                                        ))}
                                    </div>
                                )}
                                {/* R2 */}
                                {r2Matches.length > 0 && (
                                    <div className="flex flex-col justify-around relative">
                                        {r2Matches.slice(r2Matches.length / 2).map(m => (
                                            <div key={m.id} className="relative my-4"><MatchCard match={m} isActive={m.id === currentMatchId} onClick={() => !m.winner && m.p1 && m.p2 && setCurrentMatchId(m.id)} innerRef={(node) => { matchRefs.current[m.id] = node; }} /></div>
                                        ))}
                                    </div>
                                )}
                                {/* R3 */}
                                {r3Matches.length > 0 && (
                                    <div className="flex flex-col justify-center relative">
                                        {r3Matches[1] && <div className="relative my-4"><MatchCard match={r3Matches[1]} isActive={r3Matches[1].id === currentMatchId} onClick={() => !r3Matches[1].winner && r3Matches[1].p1 && r3Matches[1].p2 && setCurrentMatchId(r3Matches[1].id)} innerRef={(node) => { matchRefs.current[r3Matches[1].id] = node; }} /></div>}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>

                {/* CONTROL PANEL */}
                <div className="w-full lg:w-80 flex-shrink-0 h-64 lg:h-auto">
                    {matches.find(m => m.id === currentMatchId) ? (
                        <ControlPartido match={matches.find(m => m.id === currentMatchId)!} onResolve={resolverMatch} playSound={play} />
                    ) : (
                        <div className="h-full neumorphic flex items-center justify-center p-8 text-center">
                            <div>
                                <Trophy size={48} className="mx-auto text-yellow-500 mb-4" />
                                <h3 className="text-xl font-bold">¡Torneo Finalizado!</h3>
                                <p className="text-sm text-text-muted mt-2">Revisa el podio o selecciona un partido pendiente.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};