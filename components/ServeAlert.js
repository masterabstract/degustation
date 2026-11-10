'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

// Alerte « nouveau vin servi » : bandeau en haut de l'écran, vibration (Android) et petit carillon.
// Elle se déclenche quand l'organisateur sert un vin (ou lance la dégustation), jamais au premier
// affichage de la page. Le son peut être coupé ; ce choix est retenu sur le téléphone.
const SOUND_KEY = 'confrerie:son';
let audioCtx = null;

function soundOn() {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'non';
  } catch {
    return true;
  }
}

// Les navigateurs n'autorisent le son qu'après un premier geste de l'utilisateur sur la page :
// on prépare donc le son au premier toucher.
function unlockAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch {}
}

function chime() {
  try {
    if (!audioCtx || audioCtx.state !== 'running') return;
    const t0 = audioCtx.currentTime;
    // deux notes douces, comme un verre que l'on fait tinter
    [
      [1318.5, 0],
      [1760, 0.16],
    ].forEach(([f, d]) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + d);
      g.gain.exponentialRampToValueAtTime(0.22, t0 + d + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.9);
      o.connect(g).connect(audioCtx.destination);
      o.start(t0 + d);
      o.stop(t0 + d + 1);
    });
  } catch {}
}

export default function ServeAlert({ code, tasting, currentPage = null }) {
  const [alert, setAlert] = useState(null); // { number, start }
  const [sound, setSound] = useState(true);
  const seen = useRef(null);
  const hideTimer = useRef(null);

  useEffect(() => {
    setSound(soundOn());
    const h = () => unlockAudio();
    window.addEventListener('pointerdown', h, { passive: true });
    window.addEventListener('keydown', h);
    return () => {
      window.removeEventListener('pointerdown', h);
      window.removeEventListener('keydown', h);
    };
  }, []);

  const phase = tasting?.phase || null;
  const num = tasting?.current_number ?? null;
  useEffect(() => {
    if (!tasting) return;
    const prev = seen.current;
    seen.current = { phase, num };
    if (!prev) return; // premier affichage : pas d'alerte
    const started = prev.phase === 'preparation' && phase === 'degustation';
    const newWine = phase === 'degustation' && num !== null && num !== prev.num;
    if (!started && !newWine) return;
    // pas d'alerte pour le vin dont la fiche est déjà ouverte à l'écran
    if (!started && currentPage !== null && Number(currentPage) === Number(num)) return;
    setAlert({ number: newWine ? num : null, start: started });
    try {
      navigator.vibrate?.([180, 90, 180]);
    } catch {}
    if (soundOn()) chime();
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setAlert(null), 20000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, num]);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  if (!alert) return null;
  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    try {
      localStorage.setItem(SOUND_KEY, next ? 'oui' : 'non');
    } catch {}
    if (next) {
      unlockAudio();
      chime();
    }
  };
  return (
    <div className="serve-alert" role="alert">
      <div className="serve-alert-inner">
        <div className="serve-alert-text">
          <strong>{alert.number ? `Vin n°${alert.number} servi` : 'La dégustation commence'}</strong>
          <span>{alert.number ? 'À vos verres !' : 'Les vins apparaissent dans votre liste.'}</span>
        </div>
        {alert.number && (
          <Link href={`/t/${code}/vin/${alert.number}`} className="btn gold sm" onClick={() => setAlert(null)}>
            Ouvrir sa fiche
          </Link>
        )}
        <button type="button" className="serve-alert-close" aria-label="Fermer l’alerte" onClick={() => setAlert(null)}>
          ×
        </button>
      </div>
      <button type="button" className="serve-alert-sound" onClick={toggleSound}>
        {sound ? 'Couper le son des alertes' : 'Remettre le son des alertes'}
      </button>
    </div>
  );
}
