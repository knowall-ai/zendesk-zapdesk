import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import i18n from "./lib/i18n";
import logger from "./utils/logger";

const LightningInvoiceQR = ({ address, amountSats, message = "", size = 220 }) => {
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setInvoice(null); // Reset when props change
        setError(null);

        if (!address || !address.includes("@"))
          throw new Error("Invalid Lightning Address");

        const [name, domain] = address.split("@");
        const lnurlp = `https://${domain}/.well-known/lnurlp/${encodeURIComponent(
          name
        )}`;
        
        const metaRes = await fetch(lnurlp);
        if (!metaRes.ok) throw new Error("Could not fetch LNURL metadata");
        const meta = await metaRes.json();

        if (meta.status === "ERROR") throw new Error(meta.reason || "LNURL error");
        if (!meta.callback) throw new Error("No LNURL callback found");

        const callbackUrl = new URL(meta.callback);
        const amountMsat = amountSats * 1000;
        
        // Add amount
        callbackUrl.searchParams.append("amount", amountMsat.toString());
        
        // Add comment (LUD-12) if supported by provider
        if (meta.commentAllowed && message) {
          callbackUrl.searchParams.append("comment", message.slice(0, meta.commentAllowed));
        }

        const invRes = await fetch(callbackUrl.toString());
        if (!invRes.ok) throw new Error("Could not fetch invoice");
        const invData = await invRes.json();

        if (invData.status === "ERROR") throw new Error(invData.reason || "Invoice error");
        if (!invData.pr) throw new Error("No invoice received from server");

        setInvoice(`lightning:${invData.pr}`);
      } catch (err) {
        logger.error("[LNURL] Error fetching invoice:", err);
        setError(err.message);
      }
    };

    fetchInvoice();
  }, [address, amountSats, message]);

  if (error) return <div className="zd-error">⚠️ {error}</div>;
  if (!invoice) return <p>Loading invoice...</p>;

  const copyToClipboard = () => {
    const text = invoice.replace("lightning:", "");
    navigator.clipboard.writeText(text);
    logger.log("[LNURL] Copied invoice to clipboard");
  };

  return (
    <div className="zd-qr-container">
      <div className="zd-qr-svg">
        <QRCodeSVG value={invoice} size={size} />
      </div>
      <div className="zd-qr-actions">
        <button className="zd-btn zd-btn--secondary zd-btn--small" onClick={copyToClipboard}>
          {i18n.t("ui.copyInvoiceButton", { defaultValue: "Copy Invoice" })}
        </button>
      </div>
    </div>
  );
};

export default LightningInvoiceQR;
