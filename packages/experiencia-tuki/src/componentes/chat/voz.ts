/**
 * Voz del chat de Tuki.
 *
 * El dictado usa la Web Speech API del navegador y la lectura usa
 * `speechSynthesis`. Así no hay que descargar modelos ni enviar audio a un
 * servicio propio: el micrófono y la voz viven en el navegador.
 *
 * El módulo está aislado para poder cambiar el dictado por Whisper o la voz por
 * Piper más adelante sin tocar el componente del chat.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

/** Quita citas, enlaces y marcas que no deben leerse en voz alta. */
export const limpiarParaLeer = (texto: string): string =>
  texto
    .replace(/\[P\d+\]/gi, '')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/[*_`#>~]/g, ' ')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

interface AlternativaVoz {
  transcript: string;
  confidence: number;
}

interface ResultadoVoz {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [indice: number]: AlternativaVoz;
}

interface ResultadosVoz {
  readonly length: number;
  readonly [indice: number]: ResultadoVoz;
}

interface EventoResultadoVoz {
  readonly resultIndex: number;
  readonly results: ResultadosVoz;
}

interface EventoErrorVoz {
  readonly error: string;
  readonly message?: string;
}

interface ReconocimientoVoz {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((evento: EventoResultadoVoz) => void) | null;
  onerror: ((evento: EventoErrorVoz) => void) | null;
  onend: (() => void) | null;
}

type ConstructorReconocimiento = new () => ReconocimientoVoz;

const obtenerConstructor = (): ConstructorReconocimiento | null => {
  if (typeof window === 'undefined') return null;
  const ventana = window as unknown as {
    SpeechRecognition?: ConstructorReconocimiento;
    webkitSpeechRecognition?: ConstructorReconocimiento;
  };
  return ventana.SpeechRecognition ?? ventana.webkitSpeechRecognition ?? null;
};

const MENSAJES_ERROR: Record<string, string> = {
  'not-allowed': 'No diste permiso al micrófono. Habilítalo en el navegador y vuelve a intentar.',
  'service-not-allowed': 'El navegador bloqueó el dictado por voz. Revisa los permisos del micrófono.',
  'no-speech': 'No te escuché. Acércate al micrófono y vuelve a hablar.',
  'audio-capture': 'No encontré un micrófono disponible.',
  network: 'El dictado del navegador no tiene conexión en este momento.',
  aborted: '',
};

const errorLegible = (codigo: string): string =>
  MENSAJES_ERROR[codigo] ?? 'No pude escucharte. Intenta otra vez.';

export interface OpcionesDictado {
  lang?: string;
  onTextoFinal: (texto: string) => void;
  onError?: (mensaje: string) => void;
}

export interface DictadoVoz {
  soportado: boolean;
  escuchando: boolean;
  parcial: string;
  error: string | null;
  iniciar: () => void;
  detener: () => void;
}

/**
 * Dictado por voz con transcripción parcial visible.
 *
 * El texto final se entrega una sola vez, al terminar de escuchar. Así el modo
 * manos libres no envía tres mensajes si el navegador parte la frase.
 */
export const useDictadoVoz = ({
  lang = 'es-CO',
  onTextoFinal,
  onError,
}: OpcionesDictado): DictadoVoz => {
  const [soportado] = useState(() => Boolean(obtenerConstructor()));
  const [escuchando, setEscuchando] = useState(false);
  const [parcial, setParcial] = useState('');
  const [error, setError] = useState<string | null>(null);
  const reconocimientoRef = useRef<ReconocimientoVoz | null>(null);
  const acumuladoRef = useRef('');
  const activoRef = useRef(false);
  const finalRef = useRef(onTextoFinal);
  const errorRef = useRef(onError);

  finalRef.current = onTextoFinal;
  errorRef.current = onError;

  const detener = useCallback(() => {
    try {
      reconocimientoRef.current?.stop();
    } catch {
      // El reconocimiento ya había terminado; no hay nada que detener.
    }
  }, []);

  const iniciar = useCallback(() => {
    const Constructor = obtenerConstructor();
    if (!Constructor) {
      const mensaje = 'Tu navegador no permite dictado por voz. Escribe la pregunta.';
      setError(mensaje);
      errorRef.current?.(mensaje);
      return;
    }

    // Si había una sesión anterior, se apaga sin disparar sus callbacks.
    const anterior = reconocimientoRef.current;
    if (anterior) {
      anterior.onstart = null;
      anterior.onresult = null;
      anterior.onerror = null;
      anterior.onend = null;
      try {
        anterior.abort();
      } catch {
        // Ya estaba cerrado.
      }
    }

    const reconocimiento = new Constructor();
    reconocimiento.lang = lang;
    reconocimiento.continuous = false;
    reconocimiento.interimResults = true;
    reconocimiento.maxAlternatives = 1;

    reconocimiento.onstart = () => {
      activoRef.current = true;
      acumuladoRef.current = '';
      setError(null);
      setParcial('');
      setEscuchando(true);
    };

    reconocimiento.onresult = (evento) => {
      let interino = '';
      for (let indice = evento.resultIndex; indice < evento.results.length; indice += 1) {
        const resultado = evento.results[indice];
        const alternativa = resultado?.[0];
        if (!alternativa) continue;
        if (resultado.isFinal) {
          acumuladoRef.current += `${alternativa.transcript} `;
        } else {
          interino += alternativa.transcript;
        }
      }
      setParcial(`${acumuladoRef.current} ${interino}`.trim());
    };

    reconocimiento.onerror = (evento) => {
      const mensaje = errorLegible(evento.error);
      if (mensaje) {
        setError(mensaje);
        errorRef.current?.(mensaje);
      }
    };

    reconocimiento.onend = () => {
      setEscuchando(false);
      setParcial('');
      const texto = acumuladoRef.current.trim();
      acumuladoRef.current = '';
      if (!activoRef.current) return;
      activoRef.current = false;
      if (texto) finalRef.current(texto);
    };

    reconocimientoRef.current = reconocimiento;
    setError(null);
    setEscuchando(true);
    try {
      reconocimiento.start();
    } catch {
      setEscuchando(false);
      const mensaje = 'El micrófono ya está en uso por otra aplicación.';
      setError(mensaje);
      errorRef.current?.(mensaje);
    }
  }, [lang]);

  useEffect(
    () => () => {
      const reconocimiento = reconocimientoRef.current;
      if (!reconocimiento) return;
      reconocimiento.onstart = null;
      reconocimiento.onresult = null;
      reconocimiento.onerror = null;
      reconocimiento.onend = null;
      try {
        reconocimiento.abort();
      } catch {
        // Ya estaba cerrado.
      }
    },
    [],
  );

  return { soportado, escuchando, parcial, error, iniciar, detener };
};

export interface OpcionesLectura {
  onFin?: () => void;
}

export interface LecturaVoz {
  soportado: boolean;
  hablando: boolean;
  voz: SpeechSynthesisVoice | null;
  hablar: (texto: string, opciones?: OpcionesLectura) => boolean;
  detener: () => void;
}

const elegirVoz = (voces: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
  const espanol = voces.filter((voz) => voz.lang.toLowerCase().startsWith('es'));
  return (
    espanol.find((voz) => /^es[-_]co/i.test(voz.lang)) ??
    espanol.find((voz) => /^es[-_]mx/i.test(voz.lang)) ??
    espanol.find((voz) => /^es[-_]us/i.test(voz.lang)) ??
    espanol.find((voz) => /^es[-_]es/i.test(voz.lang)) ??
    espanol[0] ??
    null
  );
};

/** Lectura en voz alta con la mejor voz española disponible en el sistema. */
export const useLecturaVoz = (): LecturaVoz => {
  const [soportado] = useState(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window,
  );
  const [hablando, setHablando] = useState(false);
  const [voz, setVoz] = useState<SpeechSynthesisVoice | null>(null);
  const finRef = useRef<(() => void) | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!soportado) return;
    const cargar = () => {
      const voces = window.speechSynthesis.getVoices();
      if (voces.length === 0) return;
      setVoz((actual) => actual ?? elegirVoz(voces));
    };
    cargar();
    window.speechSynthesis.addEventListener('voiceschanged', cargar);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', cargar);
  }, [soportado]);

  const detener = useCallback(() => {
    if (!soportado) return;
    finRef.current = null;
    window.speechSynthesis.cancel();
    setHablando(false);
  }, [soportado]);

  const hablar = useCallback(
    (texto: string, opciones?: OpcionesLectura): boolean => {
      if (!soportado) return false;
      const limpio = limpiarParaLeer(texto);
      if (!limpio) return false;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(limpio);
      if (voz) {
        utterance.voice = voz;
        utterance.lang = voz.lang;
      } else {
        utterance.lang = 'es-CO';
      }
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      finRef.current = opciones?.onFin ?? null;
      utterance.onend = () => {
        setHablando(false);
        const fin = finRef.current;
        finRef.current = null;
        fin?.();
      };
      utterance.onerror = () => {
        setHablando(false);
        finRef.current = null;
      };
      utteranceRef.current = utterance;
      setHablando(true);
      window.speechSynthesis.speak(utterance);
      return true;
    },
    [soportado, voz],
  );

  useEffect(
    () => () => {
      if (soportado) window.speechSynthesis.cancel();
    },
    [soportado],
  );

  return { soportado, hablando, voz, hablar, detener };
};
