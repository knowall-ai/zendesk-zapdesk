import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

const buildLnurlEndpoint = (address) => {
  if (!address || !address.includes("@")) {
    throw new Error("Invalid Lightning Address");
  }

  const [name, domain] = address.split("@");
  if (!name || !domain) {
    throw new Error("Invalid Lightning Address");
  }

  return `https://${domain}/.well-known/lnurlp/${encodeURIComponent(name)}`;
};

const LightningInvoiceQR = ({ address, amountSats, size = 220, onPaymentString }) => {
  const [paymentString, setPaymentString] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchInvoice = async () => {
      try {
        setError(null);
        setPaymentString(null);
        onPaymentString?.("");

        const lnurlp = buildLnurlEndpoint(address);
        const metaRes = await fetch(lnurlp);
        if (!metaRes.ok) throw new Error("Could not load LNURL metadata");

        const meta = await metaRes.json();
        if (!meta.callback) throw new Error("No LNURL callback found");

        const amountMsat = amountSats * 1000;
        const callbackUrl = new URL(meta.callback);
        callbackUrl.searchParams.set("amount", String(amountMsat));

        const invRes = await fetch(callbackUrl.toString());
        if (!invRes.ok) throw new Error("Could not create invoice");

        const invoice = await invRes.json();
        const stringToPay = invoice.pr || invoice.lnurl || callbackUrl.toString();
        if (!stringToPay) throw new Error("No payment string received from server");

        const uri = stringToPay.toLowerCase().startsWith("lightning:")
          ? stringToPay
          : `lightning:${stringToPay}`;

        if (!cancelled) {
          setPaymentString(uri);
          onPaymentString?.(uri);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          onPaymentString?.("");
        }
      }
    };

    fetchInvoice();

    return () => {
      cancelled = true;
    };
  }, [address, amountSats, onPaymentString]);

  if (error) return <div className="zd-error">⚠️ {error}</div>;
  if (!paymentString) return <p>Loading invoice...</p>;

  return (
    <div className="zd-qr-code">
      <QRCodeSVG value={paymentString} size={size} />
    </div>
  );
};

export default LightningInvoiceQR;
