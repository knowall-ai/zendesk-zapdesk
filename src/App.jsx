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

const DEFAULT_TIP_AMOUNTS = [100, 1000, 10000];

export default function App({ client }) {
  const [loading, setLoading] = useState(true);
  const [translationsReady, setTranslationsReady] = useState(false);
  const [assignee, setAssignee] = useState({ name: "", id: null, avatar: "" });
  const [lightningAddress, setLightningAddress] = useState("");
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [tipAmounts, setTipAmounts] = useState(DEFAULT_TIP_AMOUNTS);
  const [appTitle, setAppTitle] = useState("Zapdesk");
  const [appDescription, setAppDescription] = useState("");
  const [message, setMessage] = useState("");
  const [ticketId, setTicketId] = useState(null);
  const [error, setError] = useState(null);
  const [isPublic, setIsPublic] = useState(false);
  const [canPostPublic, setCanPostPublic] = useState(false);
  const [roleCheckComplete, setRoleCheckComplete] = useState(false);

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
        // Fetch app metadata (settings) and user locale
        const [metadata, localeData] = await Promise.all([
          client.metadata(),
          client.get("currentUser.locale")
        ]);
        
        const settings = metadata.settings || {};
        const userLocale = localeData["currentUser.locale"];

        logger.log("[Zapdesk] App settings:", settings);
        logger.log("[Zapdesk] User locale:", userLocale);

        // Apply settings: Title & Description
        if (settings.title) setAppTitle(settings.title);
        if (settings.description) setAppDescription(settings.description);

        // Apply settings: Tip Presets
        if (settings.presets) {
          const parsedPresets = settings.presets
            .split(",")
            .map((s) => parseInt(s.trim()))
            .filter((n) => !isNaN(n));
          if (parsedPresets.length > 0) setTipAmounts(parsedPresets);
        }

        // Load translations for user's locale (await to prevent race condition)
        await i18n.loadTranslations(userLocale);

        // Mark translations as ready before continuing
        setTranslationsReady(true);

        // Fetch ticket and assignee data
        const data = await initializeTicketData(client, settings.lightning_address_field);

        setTicketId(data.ticketId);
        setAssignee(data.assignee);
        
        // Use agent's address or fallback
        const addr = data.lightningAddress || settings.fallback_address || "";
        setLightningAddress(addr);

        // Get current user role to determine permissions for posting public comments
        // Performance optimization: check session cache first (Issue #24)
        try {
          let role;
          const cachedRoleData = sessionStorage.getItem("zapdesk_user_role");

          if (cachedRoleData) {
            const parsed = JSON.parse(cachedRoleData);
            role = parsed["currentUser.role"];
            logger.log("[Zapdesk] Using cached user role:", role);
          } else {
            const userData = await client.get(["currentUser.role"]);
            role = userData["currentUser.role"];
            sessionStorage.setItem("zapdesk_user_role", JSON.stringify(userData));
            logger.log("[Zapdesk] User role detected and cached:", role);
          }

          logger.log('[Zapdesk] User role detected:', role);

          // Handle role as string, object, or number
          // Some Zendesk configurations return role as an object {id, name} or just an ID number
          let roleName = role;
          if (typeof role === 'object' && role !== null) {
            roleName = role.name || String(role.id);
          } else if (typeof role !== 'string') {
            roleName = String(role);
          }

          // Normalize role name to lowercase for comparison
          const normalizedRole = (roleName || '').toLowerCase();

          // Check if user is an admin or agent (both can post public comments)
          const canPost = normalizedRole === 'admin' || normalizedRole === 'agent';

          // Store permission state
          setCanPostPublic(canPost);

          // Set default checkbox state based on role
          // Admins and agents: public by default (checked and enabled)
          // Other roles (light agents, etc.): private by default (unchecked and disabled)
          setIsPublic(canPost);

          logger.log('[Zapdesk] Can post public comments:', canPost);

          // Mark role check as complete
          setRoleCheckComplete(true);
        } catch (roleErr) {
          logger.error('[Zapdesk] Could not determine user role:', roleErr);

          // FAIL-SAFE: If we can't read the role, restrict to private comments
          // This provides a secure default when role cannot be determined
          setCanPostPublic(false);

          // Default to PRIVATE (unchecked and disabled) for security
          setIsPublic(false);

          logger.log('[Zapdesk] Role check failed - restricting to private comments');

          // Mark role check as complete even if it failed
          setRoleCheckComplete(true);
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
    if (!roleCheckComplete) return setError(i18n.t("errors.pleaseWait"));
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
      setIsPublic(canPostPublic); // Admins/agents: true, Restricted users: false
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
        <h2 className="zd-title">{appTitle}</h2>
        {appDescription && <div className="zd-description">{appDescription}</div>}
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
          {tipAmounts.map((a) => (
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

        <div className="zd-address-input">
          <label htmlFor="custom-address" className="zd-label">
            {i18n.t("ui.addressLabel", { defaultValue: "Agent Lightning Address" })}
          </label>
          <input
            id="custom-address"
            type="text"
            className="zd-input"
            placeholder="user@provider.com"
            value={lightningAddress}
            onChange={(e) => setLightningAddress(e.target.value)}
          />
        </div>

        {selectedAmount && (
          <div className="zd-qr-area">
            <div className="zd-qr-preview">
              <LightningQR
                address={lightningAddress}
                amountSats={selectedAmount}
                message={message}
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
            <label
              htmlFor="public-comment-checkbox"
              className={`zd-checkbox-label ${!canPostPublic ? "zd-checkbox-label-disabled" : ""}`}
            >
              <input
                id="public-comment-checkbox"
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={!canPostPublic}
                className="zd-checkbox"
              />
              <span className={!canPostPublic ? "zd-checkbox-text-disabled" : ""}>
                {i18n.t("ui.publicCommentLabel")}
              </span>
            </label>
            {!canPostPublic && (
              <div className="zd-checkbox-hint">
                {i18n.t("ui.publicCommentHint")}
              </div>
            )}
          </div>
        )}

        <div className="zd-actions">
          <button
            className="zd-btn zd-btn--primary"
            onClick={markAsPaid}
            disabled={!roleCheckComplete}
          >
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
