/**
 * Zendesk Service
 * Handles all Zendesk API interactions
 */

import logger from "../utils/logger";

/**
 * Initialize the Zendesk client and get ticket/assignee data
 * @param {Object} client - ZAFClient instance
 * @param {string} fieldKey - Custom field key for Lightning Address
 * @returns {Promise<Object>} Object containing ticketId, assigneeId, and assignee details
 */
export async function initializeTicketData(client, fieldKey = "lightning_address") {
  try {
    // Step 1: Get ticket and assignee ID
    const data = await client.get(["ticket.id", "ticket.assignee.user.id"]);
    const ticketId = data["ticket.id"];
    const assigneeId = data["ticket.assignee.user.id"];

    logger.log("[Zendesk Service] Ticket data:", data);

    if (!assigneeId) {
      throw new Error("To send a Lightning tip, the ticket must be assigned to an agent.");
    }

    // Step 2: Fetch user profile via Zendesk API
    const userResponse = await client.request({
      url: `/api/v2/users/${assigneeId}.json`,
      type: "GET",
      dataType: "json",
    });

    const user = userResponse.user;
    logger.log("[Zendesk Service] User data:", user);

    const assignee = {
      id: user.id,
      name: user.name,
      avatar: user.photo ? user.photo.content_url : "",
    };

    // Step 3: Get Lightning Address from custom field
    // Priority 1: User-specified field key (from settings)
    // Priority 2: Canonical 'lightning_address'
    // Priority 3: Common variant 'lightningaddress'
    const lightningAddress =
      user.user_fields?.[fieldKey] ||
      user.user_fields?.lightning_address ||
      user.user_fields?.lightningaddress ||
      "";

    return {
      ticketId,
      assigneeId,
      assignee,
      lightningAddress,
    };
  } catch (error) {
    logger.error("[Zendesk Service] Error initializing:", error);
    throw error;
  }
}

/**
 * Post a tip comment to a Zendesk ticket
 * @param {Object} client - ZAFClient instance
 * @param {string} ticketId - Ticket ID
 * @param {number} amount - Tip amount in sats
 * @param {string} agentName - Agent's name
 * @param {string} message - Optional tip message
 * @param {string} lightningAddress - Agent's Lightning address
 * @param {boolean} isPublic - Whether the comment should be public (visible to end users)
 * @returns {Promise<void>}
 */
export async function postTipComment(
  client,
  ticketId,
  amount,
  agentName,
  message,
  lightningAddress,
  isPublic = false
) {
  try {
    const body = `Tip: ${amount} sats\nAgent: ${agentName}\nMessage: ${
      message || "(none)"
    }\nLightning Address: ${lightningAddress}`;

    // Update the ticket by appending a comment with specified visibility
    await client.request({
      url: `/api/v2/tickets/${ticketId}.json`,
      type: "PUT",
      contentType: "application/json",
      data: JSON.stringify({ ticket: { comment: { body, public: isPublic } } }),
    });

    logger.log(`[Zendesk Service] Tip comment posted successfully (${isPublic ? 'public' : 'private'})`);

    // Show notification to the user
    await client.invoke(
      "notify",
      `Thanks! Your tip of ${amount} sats has been recorded on the ticket.`
    );
  } catch (error) {
    logger.error("[Zendesk Service] Error posting comment:", error);
    throw new Error("Failed to post the comment to the ticket.");
  }
}

/**
 * Resize the Zendesk app iframe
 * @param {Object} client - ZAFClient instance
 * @param {string} height - Height value (e.g., "500px")
 * @returns {Promise<void>}
 */
export async function resizeApp(client, height) {
  try {
    await client.invoke("resize", { height });
  } catch (error) {
    logger.error("[Zendesk Service] Error resizing app:", error);
  }
}

/**
 * Auto-resize the app based on content height
 * @param {Object} client - ZAFClient instance
 * @returns {number} Interval ID for clearing later
 */
export function setupAutoResize(client) {
  const resizeInterval = setInterval(() => {
    const contentHeight = document.documentElement.scrollHeight;
    resizeApp(client, `${contentHeight}px`);
  }, 500);

  return resizeInterval;
}
