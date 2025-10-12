import React, { useEffect, useState } from "react";
import I18n from "./lib/i18n";
import LightningQR from "./qrCode";
import {
  initializeTicketData,
  postTipComment,
  resizeApp,
  setupAutoResize,
} from "./services/zendeskService";
import { isValidLightningAddress } from "./services/lightningService";

const TIP_AMOUNTS = [100, 1000, 10000]; // sats hardcoded

export default function App({ client }) {
  const [loading, setLoading] = useState(true);
  const [assignee, setAssignee] = useState({ name: "", id: null, avatar: "" });
  const [lightningAddress, setLightningAddress] = useState("");
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [lnurlString, setLnurlString] = useState("");
  const [message, setMessage] = useState("");
  const [ticketId, setTicketId] = useState(null);
  const [error, setError] = useState(null);
  const [amount, setAmount] = useState(null);

  useEffect(() => {
    if (!client) return;

    // Resize once after load
    resizeApp(client, "500px");

    // Setup auto-resize based on content height
    const resizeInterval = setupAutoResize(client);

    return () => clearInterval(resizeInterval);
  }, [client]);

  useEffect(() => {
    if (!client) return;

    async function init() {
      try {
        const data = await initializeTicketData(client);

        setTicketId(data.ticketId);
        setAssignee(data.assignee);
        setLightningAddress(data.lightningAddress);
        setLoading(false);
      } catch (err) {
        console.error("[Zapdesk] Error initializing:", err);
        setError(err.message || "Failed to load assignee info.");
        setLoading(false);
      }
    }

    init();
  }, [client]);

  async function onSelectAmount(amount) {
    console.log("[amount]", amount);
    setSelectedAmount(amount);
    setQrDataUrl("");
    setLnurlString("");

    if (!isValidLightningAddress(lightningAddress)) {
      setError("No Lightning Address found for the agent.");
      return;
    }

    // Note: QR generation is handled by the LightningQR component
    // Uncomment below if you want to generate QR in the parent component
    // try {
    //   const { qrDataUrl, lnurlString } = await generateLightningQR(
    //     lightningAddress,
    //     amount
    //   );
    //   setQrDataUrl(qrDataUrl);
    //   setLnurlString(lnurlString);
    // } catch (err) {
    //   console.error(err);
    //   setError("Failed to generate LNURL / QR.");
    // }
  }

  async function markAsPaid() {
    if (!ticketId) return setError("Ticket ID not found");
    if (!selectedAmount) return setError("No tip amount selected");

    try {
      await postTipComment(
        client,
        ticketId,
        selectedAmount,
        assignee.name,
        message,
        lightningAddress
      );

      // Reset UI
      setSelectedAmount(null);
      setQrDataUrl("");
      setLnurlString("");
      setMessage("");
    } catch (err) {
      console.error("Failed to post comment", err);
      setError(err.message || "Failed to post the comment to the ticket.");
    }
  }

  if (loading) return <div className="zd-loading">Loading…</div>;
  return (
    <div className="zd-container">
      <header className="zd-header">
        <div className="zd-agent">
          {assignee.avatar ? (
            <img src={assignee.avatar} alt="agent" className="zd-avatar" />
          ) : (
            <div className="zd-avatar zd-avatar--placeholder" />
          )}
          <div>
            <div className="zd-agent-name">{assignee.name || "Unassigned"}</div>
            <div className="zd-sub">Tip the agent with sats</div>
          </div>
        </div>
      </header>

      {error && <div className="zd-error">{error}</div>}

      <div className="zd-body">
        <div className="zd-tip-buttons">
          {TIP_AMOUNTS.map((a) => (
            <button
              key={a}
              className={`zd-btn ${
                selectedAmount === a ? "zd-btn--active" : ""
              }`}
              onClick={() => onSelectAmount(a)}
            >
              {a.toLocaleString()} sats
            </button>
          ))}
        </div>

        {selectedAmount && (
          <div className="zd-qr-area">
            <div className="zd-qr-preview">
              <LightningQR
                address={lightningAddress}
                amountSats={selectedAmount}
                size={220}
              />
            </div>
          </div>
        )}

        {selectedAmount && (
          <div className="zd-message-input">
            <label htmlFor="tip-message" className="zd-label">
              Add a message (optional)
            </label>
            <textarea
              id="tip-message"
              className="zd-textarea"
              placeholder="Thank you for your help!"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>
        )}

        <div className="zd-actions">
          <button className="zd-btn zd-btn--primary" onClick={markAsPaid}>
            Mark as Paid
          </button>
        </div>
      </div>

      <footer className="zd-footer">
        Payments via Lightning (LNURL-pay QR). This app does not verify on-chain
        payments — user confirms manually.
      </footer>
    </div>
  );
}
