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
import logger from "./utils/logger";

const TIP_AMOUNTS = [100, 1000, 10000];

export default function App({ client }) {
  const [loading, setLoading] = useState(true);
  const [translationsReady, setTranslationsReady] = useState(false);
  const [assignee, setAssignee] = useState({ name: "", id: null, avatar: "" });
  const [lightningAddress, setLightningAddress] = useState("");
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [message, setMessage] = useState("");
  const [ticketId, setTicketId] = useState(null);
  const [error, setError] = useState(null);
  const [isPublic, setIsPublic] = useState(false);
  const [isLightAgent, setIsLightAgent] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState(null);

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
        // Fetch user locale first to load proper translations
        const localeData = await client.get("currentUser.locale");
        const userLocale = localeData["currentUser.locale"];

        logger.log("[Zapdesk] User locale:", userLocale);

        // Load translations for user's locale (await to prevent race condition)
        await i18n.loadTranslations(userLocale);

        // Mark translations as ready before continuing
        setTranslationsReady(true);

        const data = await initializeTicketData(client);

        setTicketId(data.ticketId);
        setAssignee(data.assignee);
        setLightningAddress(data.lightningAddress);

        // Get current user role to determine if they're an admin
        // IMPORTANT: Only admins can read currentUser.role
        // Light agents and regular agents will get a permission error
        try {
          const userData = await client.get(['currentUser.role', 'currentUser']);
          const role = userData['currentUser.role'];
          const currentUser = userData['currentUser'];

          setCurrentUserRole(role);

          console.log('==================================================');
          console.log('[Zapdesk] LOGGED IN USER ROLE:', role);
          console.log('[Zapdesk] CURRENT USER DATA:', currentUser);
          console.log('==================================================');

          // Check if user is an admin
          // Only admins can post public comments
          const isAdmin = role && role.toLowerCase() === 'admin';

          // If not admin, treat as light agent (restricted permissions)
          setIsLightAgent(!isAdmin);

          // Set default checkbox state based on role
          // Admin: public by default (checked and enabled)
          // Non-admin: private by default (unchecked and disabled)
          setIsPublic(isAdmin);

          console.log('[Zapdesk] Is admin:', isAdmin);
          console.log('[Zapdesk] Is light agent:', !isAdmin);
          console.log('[Zapdesk] Public comments by default:', isAdmin);
        } catch (roleErr) {
          console.warn('[Zapdesk] Could not determine user role (permission denied):', roleErr);

          // FAIL-SAFE: If we can't read the role, assume they're NOT an admin
          // This happens for light agents and regular agents who don't have permission
          // to read currentUser.role
          setIsLightAgent(true);
          setCurrentUserRole('unknown (restricted)');

          // Default to PRIVATE (unchecked and disabled) for security
          setIsPublic(false);

          console.log('[Zapdesk] Role check failed - treating as non-admin (light agent)');
          console.log('[Zapdesk] Public comments by default: false');
        }

        setLoading(false);
      } catch (err) {
        logger.error("[Zapdesk] Error initializing:", err);
        // Use bilingual fallback to avoid secondary error if translations not loaded
        setError(err.message || "Failed to load assignee info. / Error al cargar información del agente.");
        setLoading(false);
      }
    }

    init();
  }, [client]);

  async function onSelectAmount(amount) {
    logger.log("[amount]", amount);
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
        lightningAddress,
        isPublic
      );

      // Reset UI - restore default public state based on user role
      setSelectedAmount(null);
      setMessage("");
      setIsPublic(!isLightAgent); // Admins/full agents: true, Light agents: false
    } catch (err) {
      logger.error("Failed to post comment", err);
      setError(err.message || i18n.t("errors.failedToPost"));
    }
  }

  // Show loading state if still loading or translations not ready
  if (loading || !translationsReady) {
    return <div className="zd-loading">Loading… / Cargando…</div>;
  }
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
                Light agents cannot post public comments
              </div>
            )}
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
