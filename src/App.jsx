import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  lnurlFromLightningAddress,
  lightningUriFromAddress,
} from "./utils/lnurl";
import I18n from "./lib/i18n";
import LightningQR from "./qrCode";

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
    client.invoke("resize", { height: "500px" });

    // Optional: auto-resize based on content height
    const resizeInterval = setInterval(() => {
      const contentHeight = document.documentElement.scrollHeight;
      client.invoke("resize", { height: `${contentHeight}px` });
    }, 500);

    return () => clearInterval(resizeInterval);
  }, [client]);

  useEffect(() => {
    if (!client) return;

    async function init() {
      try {
        // Step 1: Get ticket and assignee ID
        const data = await client.get(["ticket.id", "ticket.assignee.user.id"]);
        const ticketId = data["ticket.id"];
        const assigneeId = data["ticket.assignee.user.id"];
        console.log("[data]", data);

        setTicketId(ticketId);

        if (!assigneeId) {
          setError("This ticket has no assignee.");
          setLoading(false);
          return;
        }

        // Step 2: Fetch user profile via Zendesk API
        const userResponse = await client.request({
          url: `/api/v2/users/${assigneeId}.json`,
          type: "GET",
          dataType: "json",
        });

        const user = userResponse.user;
        console.log("[user]", user);
        setAssignee({
          id: user.id,
          name: user.name,
          avatar: user.photo ? user.photo.content_url : "",
        });

        // Step 3: Get Lightning Address (custom field)
        const lightningAddress =
          user.user_fields?.lightning_address ||
          user.user_fields?.lightningaddress ||
          "";

        setLightningAddress(lightningAddress);
        setLoading(false);
      } catch (err) {
        console.error("[Zapdesk] Error initializing:", err);
        setError("Failed to load assignee info.");
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

    if (!lightningAddress) {
      setError("No Lightning Address found for the agent.");
      return;
    }

    // try {
    //   const lnurl = await lightningUriFromAddress(lightningAddress, amount);
    //   setLnurlString(lnurl);
    //   console.log("[lnurl]", lnurl);
    //   const qr = await QRCode.toDataURL(lnurl);
    //   setQrDataUrl(qr);
    // } catch (err) {
    //   console.error(err);
    //   setError("Failed to generate LNURL / QR.");
    // }
  }

  async function markAsPaid() {
    if (!ticketId) return setError("Ticket ID not found");
    if (!selectedAmount) return setError("No tip amount selected");

    const body = `Tip: ${selectedAmount} sats\nAgent: ${
      assignee.name
    }\nMessage: ${message || "(none)"}\nLightning Address: ${lightningAddress}`;

    try {
      // Update the ticket by appending a public comment from current user
      await client.request({
        url: `/api/v2/tickets/${ticketId}.json`,
        type: "PUT",
        contentType: "application/json",
        data: JSON.stringify({ ticket: { comment: { body, public: true } } }),
      });

      // Optionally show a small notification to the user
      client.invoke(
        "notify",
        `Thanks! Your tip of ${selectedAmount} sats has been recorded on the ticket.`
      );

      // reset UI
      setSelectedAmount(null);
      setQrDataUrl("");
      setLnurlString("");
      setMessage("");
    } catch (err) {
      console.error("Failed to post comment", err);
      setError("Failed to post the comment to the ticket.");
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
