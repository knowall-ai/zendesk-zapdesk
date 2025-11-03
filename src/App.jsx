import React, { useEffect, useState } from "react";
import LightningQR from "./qrCode";
import {
  initializeTicketData,
  postTipComment,
  resizeApp,
  setupAutoResize,
} from "./services/zendeskService";
import { isValidLightningAddress } from "./services/lightningService";

const TIP_AMOUNTS = [100, 1000, 10000];

export default function App({ client }) {
  const [loading, setLoading] = useState(true);
  const [assignee, setAssignee] = useState({ name: "", id: null, avatar: "" });
  const [lightningAddress, setLightningAddress] = useState("");
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [message, setMessage] = useState("");
  const [ticketId, setTicketId] = useState(null);
  const [error, setError] = useState(null);
  const [isPublic, setIsPublic] = useState(false);
  const [isLightAgent, setIsLightAgent] = useState(false);

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

        // Get current user role to determine permissions for posting public comments
        // IMPORTANT: Role detection may return role names for some users (e.g., 'admin', 'agent')
        // or role IDs for others depending on permissions and Zendesk configuration
        try {
          const userData = await client.get(['currentUser.role']);
          const role = userData['currentUser.role'];

          console.log('[Zapdesk] User role detected:', role);

          // Check if user is an admin or agent (both can post public comments)
          const normalizedRole = role && role.toLowerCase();
          const isAdminOrAgent = normalizedRole === 'admin' || normalizedRole === 'agent';

          // Users who are not admin/agent have restricted permissions (light agents, etc.)
          setIsLightAgent(!isAdminOrAgent);

          // Set default checkbox state based on role
          // Admins and agents: public by default (checked and enabled)
          // Other roles (light agents, etc.): private by default (unchecked and disabled)
          setIsPublic(isAdminOrAgent);

          console.log('[Zapdesk] Can post public comments:', isAdminOrAgent);
        } catch (roleErr) {
          console.warn('[Zapdesk] Could not determine user role:', roleErr);

          // FAIL-SAFE: If we can't read the role, restrict to private comments
          // This provides a secure default when role cannot be determined
          setIsLightAgent(true);

          // Default to PRIVATE (unchecked and disabled) for security
          setIsPublic(false);

          console.log('[Zapdesk] Role check failed - restricting to private comments');
        }

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

    if (!isValidLightningAddress(lightningAddress)) {
      setError("No Lightning Address found for the agent.");
      return;
    }
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
        lightningAddress,
        isPublic
      );

      // Reset UI - restore default public state based on user role
      setSelectedAmount(null);
      setMessage("");
      setIsPublic(!isLightAgent); // Admins/agents: true, Restricted users: false
    } catch (err) {
      console.error("Failed to post comment", err);
      setError(err.message || "Failed to post the comment to the ticket.");
    }
  }

  if (loading) return <div className="zd-loading">Loading…</div>;
  return (
    <div className="zd-container">
      <header className="zd-header">
        <h2 className="zd-title">Tip the agent instantly with Bitcoin Lightning</h2>
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

        {selectedAmount && (
          <div className="zd-checkbox-container">
            <label className="zd-checkbox-label">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={isLightAgent}
                className="zd-checkbox"
              />
              <span className={isLightAgent ? "zd-checkbox-text-disabled" : ""}>
                Make tip comment public (visible to end users)
              </span>
            </label>
            {isLightAgent && (
              <div className="zd-checkbox-hint">
                You do not have permission to post public comments
              </div>
            )}
          </div>
        )}

        <div className="zd-actions">
          <button className="zd-btn zd-btn--primary" onClick={markAsPaid}>
            Mark as Paid
          </button>
        </div>
      </div>

      <footer className="zd-footer">
        This widget enables Bitcoin Lightning Network tips. After paying via QR code, click Mark as Paid to record the tip on this ticket.
      </footer>
    </div>
  );
}
