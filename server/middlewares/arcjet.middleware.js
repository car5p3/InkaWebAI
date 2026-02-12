import aj from "../configs/arcjet.config.js";

const arcjetMiddleware = async (req, res, next) => {
  try {
    console.log("Client IP:", req.ip);

    const decision = await aj.protect(req, { requested: 1 });

    if (!decision) {
      console.warn("Arcjet returned no decision.");
      return res.status(500).json({ message: "Security decision unavailable" });
    }

    let reason = decision.reason;
    let reasonType = null;

    if (typeof reason === 'string') {
      try {
        const parsed = JSON.parse(reason);
        reasonType = parsed.type || null;
        reason = parsed;
      } catch (e) {
        console.error("Failed to parse Arcjet reason string:", e.message);
      }
    } else if (typeof reason === 'object') {
      reasonType = reason.type || null;
    }

    console.log("Arcjet decision:", {
      isDenied: decision.isDenied(),
      reason: reason
    });

    if (decision.isDenied()) {
      if (reasonType === "RATE_LIMIT") {
        return res.status(429).json({ message: "Rate limit exceeded" });
      } else if (reasonType === "BOT") {
        return res.status(403).json({ message: "Bot detected" });
      } else if (reasonType === "BLOCKED") {
        return res.status(403).json({ message: "Blocked by rule" });
      } else if (reasonType === "NOT_ALLOWED") {
        return res.status(403).json({ message: "Not allowed by policy" });
      } else if (reasonType === "NOT_ALLOWED_BY_POLICY") {
        return res.status(403).json({ message: "Policy restriction" });
      } else if (reasonType === "NOT_ALLOWED_BY_RULE") {
        return res.status(403).json({ message: "Access denied by rule" });
      } else if (reasonType === "NOT_ALLOWED_BY_RULE_GROUP") {
        return res.status(403).json({ message: "Denied by rule group" });
      } else {
        return res.status(403).json({
          message: `Access denied: ${reasonType || "Unknown reason, please try again later."}`
        });
      }
    } else {
      next();
    }
  } catch (error) {
    console.error("Arcjet middleware error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export default arcjetMiddleware;