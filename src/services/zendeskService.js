/**
 * Zendesk Service
 * Handles all Zendesk API interactions
 */

/**
 * Initialize the Zendesk client and get ticket/assignee data
 * @param {Object} client - ZAFClient instance
 * @returns {Promise<Object>} Object containing ticketId, assigneeId, and assignee details
 */
export async function initializeTicketData(client) {
  try {
    // Step 1: Get ticket and assignee ID
    const data = await client.get(["ticket.id", "ticket.assignee.user.id"]);
    const ticketId = data["ticket.id"];
    const assigneeId = data["ticket.assignee.user.id"];

    console.log("[Zendesk Service] Ticket data:", data);

    if (!assigneeId) {
      throw new Error("In order to send a zap tip the ticket must be assigned to an agent.");
    }

    // Step 2: Fetch user profile via Zendesk API
    const userResponse = await client.request({
      url: `/api/v2/users/${assigneeId}.json`,
      type: "GET",
      dataType: "json",
    });

    const user = userResponse.user;
    console.log("[Zendesk Service] User data:", user);

    const assignee = {
      id: user.id,
      name: user.name,
      avatar: user.photo ? user.photo.content_url : "",
    };

    // Step 3: Get Lightning Address from custom field
    const lightningAddress =
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
    console.error("[Zendesk Service] Error initializing:", error);
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
 * @returns {Promise<void>}
 */
export async function postTipComment(
  client,
  ticketId,
  amount,
  agentName,
  message,
  lightningAddress
) {
  try {
    const body = `Tip: ${amount} sats\nAgent: ${agentName}\nMessage: ${
      message || "(none)"
    }\nLightning Address: ${lightningAddress}`;

    // Get the comment visibility setting from app settings
    const settings = await client.metadata();
    const privateComments = settings.settings.private_comments || false;
    const isPublic = !privateComments; // If checkbox is checked, comments are private

    // Update the ticket by appending a comment with configured visibility
    await client.request({
      url: `/api/v2/tickets/${ticketId}.json`,
      type: "PUT",
      contentType: "application/json",
      data: JSON.stringify({ ticket: { comment: { body, public: isPublic } } }),
    });

    console.log(`[Zendesk Service] Tip comment posted successfully (${isPublic ? 'public' : 'private'})`);

    // Show notification to the user
    await client.invoke(
      "notify",
      `Thanks! Your tip of ${amount} sats has been recorded on the ticket.`
    );
  } catch (error) {
    console.error("[Zendesk Service] Error posting comment:", error);
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
    console.error("[Zendesk Service] Error resizing app:", error);
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
