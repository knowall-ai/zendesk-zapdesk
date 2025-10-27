import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

const LightningInvoiceQR = ({ address, amountSats, size = 220 }) => {
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        if (!address.includes("@"))
          throw new Error("Invalid Lightning Address");

        const [name, domain] = address.split("@");
        const lnurlp = `https://${domain}/.well-known/lnurlp/${encodeURIComponent(
          name
        )}`;
        const metaRes = await fetch(lnurlp);
        const meta = await metaRes.json();

        if (!meta.callback) throw new Error("No LNURL callback found");

        const amountMsat = amountSats * 1000;
        const invRes = await fetch(`${meta.callback}?amount=${amountMsat}`);
        const { pr } = await invRes.json();

        if (!pr) throw new Error("No invoice received from server");

        setInvoice(`lightning:${pr}`);
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    };

    fetchInvoice();
  }, [address, amountSats]);

  if (error) return <div className="zd-error">⚠️ {error}</div>;
  if (!invoice) return <p>Loading invoice...</p>;

  return (
    <div style={{ textAlign: "center" }}>
      <QRCodeSVG value={invoice} size={size} />
    </div>
  );
};

export default LightningInvoiceQR;
