/**
 * Portadas de las nueve estructuras.
 *
 * Cada variante cambia la composición completa de la cabecera: dónde va la
 * foto, si el nombre manda o la imagen, si la información vive en una tarjeta,
 * en una franja o dentro de la propia portada. El menú de cada estructura
 * (plantillas/) sigue siendo independiente, pero la primera impresión ya no es
 * la misma página con otra lista.
 */
import React from 'react';
import type { Restaurante } from '../../tipos';
import type { PaletaDerivada } from '../../lib/color';
import { ImagenInteligente, Estrellas, LogoWhatsApp } from '../ui';
import {
  ArrowDown,
  ArrowRight,
  Clock,
  Lock,
  MapPin,
  PenLine,
  Share2,
  Sparkles,
  Star,
} from 'lucide-react';
import type { PortadaId } from './estructuras';

export interface PortadaProps {
  portada: PortadaId;
  restaurante: Restaurante;
  paleta: PaletaDerivada;
  estado: { abierto: boolean; mensaje: string };
  promedio: number;
  cantidadResenas: number;
  cargandoResenas: boolean;
  errorResenas: boolean;
  enlaceWhatsApp: string;
  compartido: boolean;
  saludo?: string;
  onMenu: () => void;
  onResena: () => void;
  onCompartir: () => void;
}

const ANCHO = 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8';

export const Portada: React.FC<PortadaProps> = ({
  portada,
  restaurante,
  paleta,
  estado,
  promedio,
  cantidadResenas,
  cargandoResenas,
  errorResenas,
  enlaceWhatsApp,
  compartido,
  saludo,
  onMenu,
  onResena,
  onCompartir,
}) => {
  const foto = Boolean(restaurante.imagen_banner_url);
  const ciudad = [restaurante.ciudad, restaurante.pais].filter(Boolean).join(', ');
  const eslogan = restaurante.eslogan || restaurante.descripcion || '';
  const inicial = restaurante.nombre.charAt(0).toUpperCase();

  const Banner: React.FC<{
    className?: string;
    radio?: string;
    eager?: boolean;
    children?: React.ReactNode;
  }> = ({ className = '', radio = '', eager = false, children }) => {
    const esAbsoluto = className.split(/\s+/).includes('absolute');
    return (
    <div
      className={`${esAbsoluto ? '' : 'relative'} overflow-hidden ${radio} ${className}`}
      style={{
        backgroundColor: foto ? paleta.surface : paleta.primary,
        backgroundImage: foto
          ? undefined
          : `radial-gradient(circle at 22% 18%, ${paleta.accentSoft} 0%, transparent 42%), linear-gradient(140deg, ${paleta.primary} 0%, ${paleta.accentSolid} 100%)`,
      }}
    >
      {foto && (
        <ImagenInteligente
          src={restaurante.imagen_banner_url}
          alt=""
          className="h-full w-full"
          loading={eager ? 'eager' : 'lazy'}
        />
      )}
      {children}
    </div>
    );
  };

  const Logo: React.FC<{ tamano?: string; borde?: boolean }> = ({ tamano = 'h-12 w-12', borde = true }) =>
    restaurante.imagen_logo_url ? (
      <span className={`${tamano} shrink-0 overflow-hidden rounded-2xl ${borde ? 'border border-white/25' : ''} block`}>
        <ImagenInteligente src={restaurante.imagen_logo_url} alt="" className="h-full w-full" loading="eager" />
      </span>
    ) : (
      <span
        className={`${tamano} flex shrink-0 items-center justify-center rounded-2xl font-title text-xl font-bold`}
        style={{ backgroundColor: paleta.primary, color: paleta.onPrimary }}
      >
        {inicial}
      </span>
    );

  const Estado: React.FC<{ foto?: boolean }> = () => (
    <span
      className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:text-xs"
      style={{ backgroundColor: paleta.accentSoft, color: paleta.accentText }}
    >
      {estado.abierto ? <Clock size={12} aria-hidden="true" /> : <Lock size={12} aria-hidden="true" />}
      <span className="truncate">{estado.mensaje || (estado.abierto ? 'Abierto ahora' : 'Cerrado')}</span>
    </span>
  );

  const Botones: React.FC<{ sobreFoto?: boolean; compacto?: boolean }> = ({ compacto = false }) => (
    <div className={`flex flex-wrap items-center gap-2.5 ${compacto ? '' : 'sm:gap-3'}`}>
      <button
        type="button"
        onClick={onMenu}
        className={`inline-flex items-center gap-2 rounded-full font-bold af-pulsar ${
          compacto ? 'px-4 py-2 text-[13px]' : 'px-5 py-3 text-sm sm:px-6 sm:text-base'
        }`}
        style={{ backgroundColor: paleta.accentSolid, color: paleta.onPrimary }}
      >
        Ver el menú <ArrowDown size={15} aria-hidden="true" />
      </button>
      {enlaceWhatsApp && (
        <a
          href={enlaceWhatsApp}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex items-center gap-2 rounded-full font-bold af-pulsar ${
            compacto ? 'px-4 py-2 text-[13px]' : 'px-5 py-3 text-sm sm:px-6 sm:text-base'
          }`}
          style={{ backgroundColor: 'transparent', color: paleta.text, border: `1px solid ${paleta.border}` }}
        >
          <LogoWhatsApp className="h-4 w-4" /> WhatsApp
        </a>
      )}
    </div>
  );

  const Meta: React.FC<{ sobreFoto?: boolean }> = () => (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      {cargandoResenas ? (
        <span
          className="h-8 w-28 animate-pulse rounded-full"
          style={{ backgroundColor: paleta.surface }}
        />
      ) : errorResenas ? null : cantidadResenas > 0 ? (
        <span
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
          style={{ backgroundColor: paleta.surface, border: `1px solid ${paleta.border}` }}
        >
          <Estrellas valor={promedio} tamano={13} />
          <span className="text-xs font-semibold tabular-nums">{promedio.toFixed(1)}</span>
          <span className="text-[11px]" style={{ color: paleta.muted }}>
            ({cantidadResenas})
          </span>
        </span>
      ) : null}

      <button
        type="button"
        onClick={onResena}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold af-pulsar"
        style={{ backgroundColor: paleta.surface, border: `1px solid ${paleta.border}`, color: paleta.text }}
      >
        <PenLine size={12} aria-hidden="true" style={{ color: paleta.secondaryText }} /> Escribir reseña
      </button>

      <button
        type="button"
        onClick={onCompartir}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold af-pulsar"
        style={{ backgroundColor: paleta.surface, border: `1px solid ${paleta.border}`, color: paleta.text }}
      >
        <Share2 size={12} aria-hidden="true" style={{ color: paleta.secondaryText }} /> {compartido ? 'Copiado' : 'Compartir'}
      </button>
    </div>
  );

  const H1: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => (
    <h1 className={`font-title font-bold tracking-[-0.03em] ${className}`} style={{ textWrap: 'balance', ...style }}>
      {restaurante.nombre}
    </h1>
  );

  const InfoLinea = ({ tono = 'papel' }: { tono?: 'papel' | 'oscuro' }) => (
    <div
      className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] font-medium"
      style={{ color: tono === 'oscuro' ? paleta.onPrimary : paleta.muted }}
    >
      {restaurante.direccion && (
        <span className="inline-flex items-center gap-1.5">
          <MapPin size={13} aria-hidden="true" style={{ color: paleta.secondaryText }} /> {restaurante.direccion}
        </span>
      )}
      <span className="inline-flex items-center gap-1.5">
        <Clock size={13} aria-hidden="true" style={{ color: paleta.secondaryText }} /> {estado.mensaje || (estado.abierto ? 'Abierto ahora' : 'Cerrado')}
      </span>
      {ciudad && <span>{ciudad}</span>}
    </div>
  );

  /* ------------------------------------------------------------------ */

  if (portada === 'editorial') {
    return (
      <header className="pt-8 sm:pt-10" style={{ backgroundColor: paleta.bg }}>
        <div className={ANCHO}>
          <div className="flex items-center justify-between border-y py-3 text-[10px] font-bold uppercase tracking-[0.22em]" style={{ borderColor: paleta.border, color: paleta.muted }}>
            <span>{ciudad || 'Cocina de autor'}</span>
            <span className="inline-flex items-center gap-1.5">
              {estado.abierto ? <Clock size={11} /> : <Lock size={11} />}
              {estado.abierto ? 'Abierto' : 'Cerrado'}
            </span>
          </div>

          <div className="grid items-center gap-8 py-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14">
            <div className="min-w-0">
              <div className="mb-6 flex items-center gap-3">
                <Logo />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: paleta.secondaryText }}>
                  {restaurante.municipio || restaurante.ciudad || 'Restaurante'}
                </span>
              </div>
              <H1 className="text-[clamp(2.6rem,6.2vw,5.2rem)] leading-[0.94]" style={{ color: paleta.title }} />
              {eslogan && (
                <p className="mt-5 max-w-md text-[15px] leading-relaxed sm:text-lg" style={{ color: paleta.muted }}>
                  {eslogan}
                </p>
              )}
              <div className="mt-8">
                <Botones />
              </div>
              <Meta />
            </div>

            <div className="relative min-w-0">
              <Banner className="aspect-[4/5] sm:aspect-[5/6]" radio="rounded-[2px]" eager />
              <div
                className="absolute -bottom-5 left-4 max-w-[80%] border px-4 py-3 sm:left-6"
                style={{ backgroundColor: paleta.surface, borderColor: paleta.border }}
              >
                <InfoLinea />
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  if (portada === 'tipografico') {
    return (
      <header className="pt-14 sm:pt-20" style={{ backgroundColor: paleta.bg }}>
        <div className={ANCHO}>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.34em]" style={{ color: paleta.secondaryText }}>
              {ciudad || 'Restaurante'}
            </span>
            <Estado />
          </div>

          <H1 className="mt-7 text-[clamp(3rem,12vw,8.5rem)] leading-[0.84]" style={{ color: paleta.title }} />

          <div className="mt-8 grid items-end gap-8 md:grid-cols-[1fr_auto]">
            <p className="max-w-xl text-[15px] leading-relaxed sm:text-lg" style={{ color: paleta.muted }}>
              {eslogan}
            </p>
            <button
              type="button"
              onClick={onMenu}
              className="group inline-flex items-center gap-3 text-sm font-bold af-pulsar"
              style={{ color: paleta.accentText }}
            >
              Ver la carta
              <span className="flex h-10 w-10 items-center justify-center rounded-full border transition-transform group-hover:translate-x-1" style={{ borderColor: paleta.border }}>
                <ArrowRight size={16} />
              </span>
            </button>
          </div>

          <div className="mt-10 h-px w-full" style={{ backgroundColor: paleta.border }} />

          <div className="mt-8 pb-2">
            <Banner className="aspect-[21/7] sm:aspect-[21/5]" radio="rounded-none" eager />
          </div>
        </div>
      </header>
    );
  }

  if (portada === 'bento') {
    return (
      <header className="pt-4 sm:pt-6" style={{ backgroundColor: paleta.bg }}>
        <div className={ANCHO}>
          <div className="grid gap-3 md:grid-cols-4">
            <div
              className="flex min-w-0 flex-col justify-between gap-6 rounded-[26px] p-6 sm:p-8 md:col-span-2 md:row-span-2"
              style={{ backgroundColor: paleta.accentSolid, color: paleta.onPrimary }}
            >
              <div className="flex items-center gap-3">
                <Logo borde={false} />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">
                  {restaurante.municipio || restaurante.ciudad || 'Cocina local'}
                </span>
              </div>
              <H1 className="text-[clamp(2.2rem,5vw,4rem)] leading-[0.95]" style={{ color: paleta.onPrimary }} />
              {eslogan && <p className="max-w-sm text-sm leading-relaxed opacity-90">{eslogan}</p>}
              <div>
                <button
                  type="button"
                  onClick={onMenu}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#111111] af-pulsar"
                >
                  Ver el menú <ArrowDown size={15} />
                </button>
              </div>
            </div>

            <Banner className="min-h-[210px] md:col-span-2" radio="rounded-[26px]" eager />

            <div className="rounded-[26px] p-5" style={{ backgroundColor: paleta.surface, border: `1px solid ${paleta.border}` }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: paleta.muted }}>Valoración</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-2xl font-bold tabular-nums" style={{ color: paleta.title }}>
                  {cantidadResenas > 0 ? promedio.toFixed(1) : '—'}
                </span>
                <Estrellas valor={promedio} tamano={14} />
              </div>
              <button type="button" onClick={onResena} className="mt-2 text-[11px] font-semibold underline underline-offset-4" style={{ color: paleta.secondaryText }}>
                Escribir una reseña
              </button>
            </div>

            <div className="rounded-[26px] p-5" style={{ backgroundColor: paleta.primary, color: paleta.onPrimary }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-75">Hoy</p>
              <p className="mt-2 text-sm font-semibold leading-snug">
                {estado.mensaje || (estado.abierto ? 'Abierto ahora' : 'Cerrado')}
              </p>
              <p className="mt-1 text-xs opacity-80">{ciudad}</p>
            </div>
          </div>
        </div>
      </header>
    );
  }

  if (portada === 'clasico') {
    return (
      <header className="pt-3 sm:pt-5">
        <div className={ANCHO}>
          <Banner className="h-[320px] w-full rounded-[20px] sm:h-[420px] sm:rounded-[28px]" eager />
          <div
            className="relative z-10 -mt-16 mx-3 rounded-[20px] border p-5 sm:mx-6 sm:p-7"
            style={{
              backgroundColor: paleta.surface,
              borderColor: paleta.border,
              boxShadow: '0 28px 60px -28px rgba(0, 0, 0, 0.35)',
            }}
          >
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Logo />
              <Estado />
            </div>
            <H1 className="text-[clamp(2rem,5.2vw,3.8rem)] leading-[0.98]" style={{ color: paleta.title }} />
            {eslogan && (
              <p className="mt-4 max-w-2xl text-[15px] leading-relaxed sm:text-base" style={{ color: paleta.muted }}>
                {eslogan}
              </p>
            )}
            <div className="mt-7">
              <Botones />
            </div>
            <Meta />
            {saludo && (
              <p className="mt-5 inline-flex items-start gap-2 rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed" style={{ backgroundColor: paleta.secondarySoft, color: paleta.secondaryText }}>
                <Sparkles size={13} className="mt-0.5 shrink-0" aria-hidden="true" /> {saludo}
              </p>
            )}
          </div>
        </div>
      </header>
    );
  }

  if (portada === 'inmersivo') {
    return (
      <header style={{ backgroundColor: paleta.bg }}>
        <Banner className="h-[58svh] min-h-[380px] w-full" eager />
        <div className={`${ANCHO} relative z-10 -mt-24`}>
          <div
            className="rounded-[26px] border p-6 sm:p-8"
            style={{
              backgroundColor: paleta.surface,
              borderColor: paleta.border,
              boxShadow: '0 28px 60px -28px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <Logo />
              <Estado />
            </div>
            <H1 className="max-w-4xl text-[clamp(2.3rem,6vw,4.6rem)] leading-[0.94]" style={{ color: paleta.title }} />
            {eslogan && (
              <p className="mt-5 max-w-2xl text-[15px] leading-relaxed sm:text-lg" style={{ color: paleta.muted }}>
                {eslogan}
              </p>
            )}
            <div className="mt-8">
              <Botones />
            </div>
            <Meta />
            <p className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] font-medium" style={{ color: paleta.muted }}>
              {restaurante.direccion && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={12} aria-hidden="true" /> {restaurante.direccion}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Clock size={12} aria-hidden="true" />
                {restaurante.horario_apertura?.slice(0, 5) || '--:--'} – {restaurante.horario_cierre?.slice(0, 5) || '--:--'}
              </span>
              {ciudad && <span>{ciudad}</span>}
            </p>
          </div>
        </div>
      </header>
    );
  }

  if (portada === 'vitrina') {
    return (
      <header className="pt-8 sm:pt-10" style={{ backgroundColor: paleta.bg }}>
        <div className={ANCHO}>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2">
                <Logo tamano="h-9 w-9" />
                <span className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: paleta.secondaryText }}>
                  {ciudad || 'Restaurante'}
                </span>
              </div>
              <H1 className="text-[clamp(2.2rem,5.4vw,4.4rem)] leading-[0.95]" style={{ color: paleta.title }} />
            </div>
            <Botones compacto />
          </div>

          <div className="af-sin-scrollbar -mx-4 mt-8 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            <Banner className="relative aspect-[16/10] w-[84%] shrink-0 snap-start sm:w-[46%]" radio="rounded-[26px]" eager>
              <div
                className="absolute inset-x-4 bottom-4 z-10 rounded-2xl px-4 py-3"
                style={{ backgroundColor: paleta.surface, border: `1px solid ${paleta.border}` }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: paleta.muted }}>La casa</p>
                <p className="mt-1 font-title text-xl font-bold" style={{ color: paleta.title }}>{restaurante.nombre}</p>
              </div>
            </Banner>

            <div
              className="flex w-[62%] shrink-0 snap-start flex-col justify-between rounded-[26px] p-5 sm:w-[27%]"
              style={{ backgroundColor: paleta.secondarySoft }}
            >
              <Clock size={18} style={{ color: paleta.secondaryText }} />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: paleta.secondaryText }}>Hoy</p>
                <p className="mt-1 text-sm font-semibold leading-snug" style={{ color: paleta.text }}>
                  {estado.mensaje || (estado.abierto ? 'Abierto ahora' : 'Cerrado')}
                </p>
              </div>
            </div>

            <div
              className="flex w-[62%] shrink-0 snap-start flex-col justify-between rounded-[26px] p-5 sm:w-[27%]"
              style={{ backgroundColor: paleta.surface, border: `1px solid ${paleta.border}` }}
            >
              <Star size={18} style={{ color: paleta.secondaryText }} />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: paleta.muted }}>Reseñas</p>
                <p className="mt-1 text-sm font-semibold" style={{ color: paleta.text }}>
                  {cantidadResenas > 0 ? `${promedio.toFixed(1)} de 5` : 'Sé el primero'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  if (portada === 'mosaico') {
    return (
      <header className="pt-4 sm:pt-6" style={{ backgroundColor: paleta.bg }}>
        <div className={ANCHO}>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:grid-rows-[150px_150px]">
            <Banner className="col-span-2 row-span-2 min-h-[300px] md:min-h-0" radio="rounded-[24px]" eager>
              <div className="absolute inset-x-5 bottom-5 z-10">
                <p
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]"
                  style={{ backgroundColor: paleta.surface, color: paleta.text, border: `1px solid ${paleta.border}` }}
                >
                  <Sparkles size={11} /> {ciudad || 'Cocina local'}
                </p>
              </div>
            </Banner>

            <div
              className="flex flex-col justify-between rounded-[24px] p-4"
              style={{ backgroundColor: paleta.accentSolid, color: paleta.onPrimary }}
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-80">Reseñas</span>
              <div>
                <p className="text-2xl font-bold tabular-nums">{cantidadResenas > 0 ? promedio.toFixed(1) : '—'}</p>
                <Estrellas valor={promedio} tamano={12} className="text-white" />
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-[24px] p-4" style={{ backgroundColor: paleta.surface, border: `1px solid ${paleta.border}` }}>
              <span className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: paleta.muted }}>Hoy</span>
              <p className="text-xs font-semibold leading-snug" style={{ color: paleta.text }}>
                {estado.abierto ? 'Abierto' : 'Cerrado'}
              </p>
            </div>

            <div
              className="col-span-2 flex flex-col justify-between gap-4 rounded-[24px] p-5 sm:flex-row sm:items-end"
              style={{ backgroundColor: paleta.primary, color: paleta.onPrimary }}
            >
              <div className="min-w-0">
                <H1 className="text-[clamp(1.6rem,4vw,2.6rem)] leading-[0.95]" style={{ color: paleta.onPrimary }} />
                {eslogan && <p className="mt-1 line-clamp-2 max-w-md text-xs opacity-85">{eslogan}</p>}
              </div>
              <button
                type="button"
                onClick={onMenu}
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#111111] af-pulsar"
              >
                Ver el menú <ArrowDown size={13} />
              </button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  if (portada === 'diptico') {
    return (
      <header className="grid min-h-[70svh] md:grid-cols-2" style={{ backgroundColor: paleta.bg }}>
        <Banner className="order-2 min-h-[44svh] md:order-1 md:min-h-full" eager />
        <div
          className="order-1 flex flex-col justify-center gap-6 px-5 py-12 sm:px-10 md:order-2 md:px-12 lg:px-16"
          style={{ backgroundColor: paleta.surface }}
        >
          <div className="flex items-center gap-3">
            <Logo borde={false} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: paleta.muted }}>
              {ciudad || 'Restaurante'}
            </span>
          </div>
          <H1 className="text-[clamp(2.3rem,5.6vw,4.6rem)] leading-[0.93]" style={{ color: paleta.title }} />
          {eslogan && <p className="max-w-md text-[15px] leading-relaxed" style={{ color: paleta.muted }}>{eslogan}</p>}
          <Estado />
          <Botones />
          <Meta />
        </div>
      </header>
    );
  }

  /* compacta */
  return (
    <header className="border-b py-5 sm:py-6" style={{ backgroundColor: paleta.bg, borderColor: paleta.border }}>
      <div className={ANCHO}>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
          <Logo tamano="h-14 w-14" borde={false} />
          <div className="min-w-0 flex-1">
            <H1 className="truncate text-[clamp(1.5rem,3.2vw,2.3rem)] leading-tight" style={{ color: paleta.title }} />
            <InfoLinea />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Botones compacto />
          </div>
        </div>

        {foto && (
          <div className="mt-5 h-24 overflow-hidden rounded-2xl sm:h-28">
            <Banner className="h-full w-full" radio="rounded-2xl" eager />
          </div>
        )}
      </div>
    </header>
  );
};
