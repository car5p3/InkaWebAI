import { sendEmail } from "../utils/email.js";
import { ChatInstance } from "../models/chat.model.js";
import mongoose from "mongoose";

// Format user messages for email / project requirements
function formatRequirementsFromChat(messages) {
  const userMessages = messages
    .filter((m) => m.sender === "user")
    .map((m) => m.text)
    .join("\n\n");

  return `Collected Requirements from Chat Conversation:\n\n${userMessages}`;
}

// Extract a simple title from first user message
function extractTitleFromText(text) {
  if (!text) return "New chat";
  const lower = text.toLowerCase();
  const keywords = [
    ["web", "Web development"],
    ["website", "Web development"],
    ["mobile", "Mobile app"],
    ["e-commerce", "E-commerce"],
    ["ecommerce", "E-commerce"],
    ["shop", "E-commerce"],
    ["api", "API integration"],
    ["chatbot", "Chatbot"],
    ["design", "Design"],
    ["marketing", "Marketing"],
  ];

  for (const [key, name] of keywords) {
    if (lower.includes(key)) return name;
  }

  const firstSentence = (text.split(/[.?!]/)[0] || text).trim();
  const words = firstSentence.split(/\s+/).slice(0, 6).join(" ");
  let title = words || firstSentence;
  if (title.length > 60) title = title.slice(0, 57) + "...";
  return title;
}

// Handle chat messages
export const chatHandler = async (req, res) => {
  try {
    const { messages, instanceId } = req.body;
    const user = req.user;

    console.log("Chat handler called with:", { 
      messageCount: messages?.length, 
      instanceId, 
      userId: user?._id,
      isAuthenticated: !!user
    });

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid request: messages array required" });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("OPENROUTER_API_KEY not configured");
      return res.status(500).json({ error: "OpenRouter API key not configured" });
    }

    // IMPORTANT: Must be `let` not `const` - if another part of the code modifies this,
    // declaring it as const will throw "Assignment to constant variable" at runtime
    let systemPrompt = `You are a helpful assistant. Collect project requirements step by step. Ask for confirmation before proceeding.`;

    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      })),
    ];

    const requestBody = {
      model: "gpt-4o-mini",
      messages: formattedMessages,
      max_tokens: 800,
      temperature: 0.7,
    };

    console.log("Calling OpenRouter API...");

    let response;
    try {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });
    } catch (fetchErr) {
      console.error("Network error calling OpenRouter:", fetchErr);
      return res.status(502).json({ error: "Failed to contact AI service" });
    }

    // Parse response first
    let data;
    try {
      data = await response.json();
    } catch (parseErr) {
      console.error("Failed to parse OpenRouter response:", parseErr);
      return res.status(502).json({ error: "Invalid response from AI service" });
    }

    // Then check if request was successful
    if (!response.ok) {
      console.error("OpenRouter error response:", {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      return res.status(response.status).json({ 
        error: data.error?.message || data.message || "AI service error" 
      });
    }

    console.log("OpenRouter response received successfully");

    // Extract AI message content - USE LET NOT CONST
    let aiMessageContent = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || "";
    
    // Handle if message is an object
    if (typeof aiMessageContent === "object") {
      aiMessageContent = JSON.stringify(aiMessageContent);
    }

    if (!aiMessageContent) {
      console.error("No AI message in response:", data);
      return res.status(500).json({ error: "No response from AI" });
    }

    // Process the message - create a new variable for the processed version
    let finalMessage = aiMessageContent;
    let shouldNavigate = false;
    let navigateUrl = null;

    // Check for navigation markers
    const navMatch = finalMessage.match(/\[GO_STRIPE(?:\s+(\d+))?\]/i);
    if (navMatch) {
      shouldNavigate = true;
      const cents = navMatch[1] ? parseInt(navMatch[1], 10) : 5000;
      navigateUrl = `/stripe?amount=${cents}`;
      finalMessage = finalMessage.replace(navMatch[0], "").trim();
    }

    // Check for confirmation markers
    const hasConfirmationMarker = finalMessage.includes("[CONFIRMED_PROCEED]");
    if (hasConfirmationMarker) {
      finalMessage = finalMessage.replace("[CONFIRMED_PROCEED]", "").trim();
    }

    // Get or create chat instance (only if user is authenticated)
    let chatInstance = null;
    
    if (user) {
      // User is authenticated - save to database
      if (instanceId && mongoose.isValidObjectId(instanceId)) {
        try {
          chatInstance = await ChatInstance.findOne({ _id: instanceId, user: user._id });
          if (chatInstance) {
            console.log("Found existing chat instance:", instanceId);
          }
        } catch (dbErr) {
          console.error("Error finding chat instance:", dbErr);
        }
      }

      // Create new instance if none exists
      if (!chatInstance) {
        try {
          console.log("Creating new chat instance for user:", user._id);
          chatInstance = await ChatInstance.create({ 
            user: user._id, 
            title: "New chat", 
            messages: [] 
          });
          console.log("Created chat instance:", chatInstance._id);
        } catch (createErr) {
          console.error("Error creating chat instance:", createErr);
          // Don't fail the request, just continue without saving
        }
      }

      // Save messages if we have a chat instance
      if (chatInstance) {
        // Save user message
        const lastUserMessage = [...messages].reverse().find((m) => m.sender === "user");
        if (lastUserMessage) {
          chatInstance.messages.push({ 
            sender: "user", 
            text: lastUserMessage.text 
          });
          
          // Update title if this is the first user message
          const firstUserMessage = messages.find((m) => m.sender === "user");
          if (firstUserMessage && (!chatInstance.title || chatInstance.title === "New chat")) {
            chatInstance.title = extractTitleFromText(firstUserMessage.text);
          }
        }

        // Handle email on confirmation
        if (hasConfirmationMarker) {
          const projectName = messages.find((m) => /project|name/i.test(m.text))?.text || "Web Development Project";
          const requirements = formatRequirementsFromChat(messages);

          try {
            const emailTo = process.env.EMAIL_FROM || process.env.SUPPORT_EMAIL || "hello@demomailtrap.co";
            console.log("Sending requirements email to:", emailTo);
            await sendEmail({ 
              to: emailTo, 
              subject: `Requirements: ${projectName}`, 
              text: requirements 
            });
            console.log("Requirements email sent successfully");
          } catch (emailErr) {
            console.error("Failed to send requirements email:", emailErr);
            // Don't fail the request if email fails
          }
        }

        // Save bot message
        chatInstance.messages.push({ 
          sender: "bot", 
          text: finalMessage 
        });
        
        // Save to database
        try {
          await chatInstance.save();
          console.log("Chat instance saved successfully");
        } catch (saveErr) {
          console.error("Error saving chat instance:", saveErr);
          // Don't fail the request, just log the error
        }
      }
    } else {
      console.log("User not authenticated - chat not saved to database");
    }

    // Return response
    return res.json({ 
      message: finalMessage, 
      shouldNavigate, 
      navigateUrl, 
      instanceId: chatInstance?._id || null 
    });

  } catch (err) {
    console.error("Chat handler unexpected error:", err);
    console.error("Error stack:", err.stack);
    return res.status(500).json({ 
      error: err instanceof Error ? err.message : "Internal server error" 
    });
  }
};

// Create a new chat instance
export const createInstance = async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ 
        error: "Authentication required",
        requiresLogin: true 
      });
    }

    const { title } = req.body;
    console.log("Creating new instance for user:", user._id);

    const instance = await ChatInstance.create({
      user: user._id,
      title: title || "New chat",
      messages: [],
    });

    console.log("Instance created:", instance._id);
    return res.json({ 
      instanceId: instance._id, 
      title: instance.title 
    });

  } catch (err) {
    console.error("createInstance error:", err);
    console.error("Error stack:", err.stack);
    return res.status(500).json({ 
      error: "Failed to create chat instance" 
    });
  }
};

// List all chat instances for the authenticated user
export const listInstances = async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ 
        error: "Authentication required",
        requiresLogin: true 
      });
    }

    console.log("Listing instances for user:", user._id);

    const instances = await ChatInstance.find({ user: user._id })
      .select("title createdAt updatedAt messages")
      .sort({ updatedAt: -1 })
      .lean();

    const result = instances.map((i) => ({
      id: i._id,
      title: i.title || "Untitled",
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
      messageCount: i.messages?.length || 0,
    }));

    console.log(`Found ${result.length} instances`);
    return res.json({ instances: result });

  } catch (err) {
    console.error("listInstances error:", err);
    console.error("Error stack:", err.stack);
    return res.status(500).json({ 
      error: "Failed to list chat instances" 
    });
  }
};

// Get a specific chat instance by ID
export const getInstance = async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ 
        error: "Authentication required",
        requiresLogin: true 
      });
    }

    const { id } = req.params;
    console.log("Getting instance:", id, "for user:", user._id);
    
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ 
        error: "Invalid instance id" 
      });
    }

    const instance = await ChatInstance.findOne({ 
      _id: id, 
      user: user._id 
    }).lean();

    if (!instance) {
      console.log("Instance not found");
      return res.status(404).json({ 
        error: "Chat instance not found" 
      });
    }

    console.log("Instance found with", instance.messages?.length || 0, "messages");
    return res.json({ instance });

  } catch (err) {
    console.error("getInstance error:", err);
    console.error("Error stack:", err.stack);
    return res.status(500).json({ 
      error: "Failed to get chat instance" 
    });
  }
};

// Delete a chat instance
export const deleteInstance = async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ 
        error: "Authentication required",
        requiresLogin: true 
      });
    }

    const { id } = req.params;
    console.log("Deleting instance:", id);
    
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ 
        error: "Invalid instance id" 
      });
    }

    const instance = await ChatInstance.findOne({ 
      _id: id, 
      user: user._id 
    });

    if (!instance) {
      return res.status(404).json({ 
        error: "Chat instance not found" 
      });
    }

    await ChatInstance.deleteOne({ _id: id });
    console.log("Instance deleted successfully");
    
    return res.json({ 
      success: true, 
      message: "Chat instance deleted" 
    });

  } catch (err) {
    console.error("deleteInstance error:", err);
    console.error("Error stack:", err.stack);
    return res.status(500).json({ 
      error: "Failed to delete chat instance" 
    });
  }
};