import React, { useEffect, useRef, useState } from 'react';

const RainforestPayment: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setupPayment = async () => {
      try {
        const sessionRes = await fetch('/functions/v1/create-session');
        const { session_key } = await sessionRes.json();

        const configRes = await fetch('/functions/v1/create-config');
        const { id: payin_config_id } = await configRes.json();

        const paymentElement = document.createElement('rainforest-payment');
        paymentElement.setAttribute('session-key', session_key);
        paymentElement.setAttribute('payin-config-id', payin_config_id);
        paymentElement.setAttribute('allowed-methods', 'CARD');

        paymentElement.addEventListener('approved', (e: any) => {
          console.log('✅ Payment approved:', e.detail.payin_id);
        });

        paymentElement.addEventListener('declined', (e: any) => {
          console.error('❌ Payment declined:', e.detail);
        });

        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          containerRef.current.appendChild(paymentElement);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error setting up payment:', err);
      }
    };

    setupPayment();
  }, []);

  return (
    <div>
      {loading && <p>Loading payment component...</p>}
      <div ref={containerRef} />
    </div>
  );
};

export default RainforestPayment;
