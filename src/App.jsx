import React, { useEffect, useState } from "react";
import LightningQR from "./qrCode";
import {
  initializeTicketData,
  postTipComment,
  resizeApp,
  setupAutoResize,
} from "./services/zendeskService";
import { isValidLightningAddress } from "./services/lightningService";
import i18n from "./lib/i18n";

const TIP_AMOUNTS = [100, 1000, 10000];

export default function App({ client }) {
  const [loading, setLoading] = useState(true);
  const [assignee, setAssignee] = useState({ name: "", id: null, avatar: "" });
  const [lightningAddress, setLightningAddress] = useState("");
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [message, setMessage] = useState("");
  const [ticketId, setTicketId] = useState(null);
  const [error, setError] = useState(null);

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
        setError(err.message || i18n.t("errors.failedToLoad"));
        setLoading(false);
      }
    }

    init();
  }, [client]);

  async function onSelectAmount(amount) {
    console.log("[amount]", amount);
    setSelectedAmount(amount);

    if (!isValidLightningAddress(lightningAddress)) {
      setError(i18n.t("errors.noLightningAddress"));
      return;
    }
  }

  async function markAsPaid() {
    if (!ticketId) return setError(i18n.t("errors.noTicketId"));
    if (!selectedAmount) return setError(i18n.t("errors.noTipAmount"));

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
      setMessage("");
    } catch (err) {
      console.error("Failed to post comment", err);
      setError(err.message || i18n.t("errors.failedToPost"));
    }
  }

  if (loading) return <div className="zd-loading">{i18n.t("ui.loading")}</div>;
  return (
    <div className="zd-container">
      <header className="zd-header">
        <h2 className="zd-title">{i18n.t("ui.title")}</h2>
        <div className="zd-agent">
          {assignee.avatar ? (
            <img src={assignee.avatar} alt="agent" className="zd-avatar" />
          ) : (
            <div className="zd-avatar zd-avatar--placeholder" />
          )}
          <div>
            <div className="zd-agent-name">{assignee.name || i18n.t("ui.unassigned")}</div>
            <div className="zd-sub">{i18n.t("ui.agentSubtitle")}</div>
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
              {a.toLocaleString()} {i18n.t("ui.satsLabel")}
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
              {i18n.t("ui.messageLabel")}
            </label>
            <textarea
              id="tip-message"
              className="zd-textarea"
              placeholder={i18n.t("ui.messagePlaceholder")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>
        )}

        <div className="zd-actions">
          <button className="zd-btn zd-btn--primary" onClick={markAsPaid}>
            {i18n.t("ui.markAsPaidButton")}
          </button>
        </div>
      </div>

      <footer className="zd-footer">
        {i18n.t("ui.footer")}
      </footer>
    </div>
  );
}
