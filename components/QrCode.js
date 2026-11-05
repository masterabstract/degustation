'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

// QR code dessiné sur le téléphone (aucun service extérieur).
export default function QrCode({ text, size = 220 }) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    QRCode.toString(text, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#4a0e1e', light: '#fffbf4' } })
      .then(setSvg)
      .catch(() => setSvg(''));
  }, [text]);
  return (
    <div
      className="qr"
      style={{ width: size, height: size }}
      role="img"
      aria-label="QR code pour rejoindre la soirée"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
