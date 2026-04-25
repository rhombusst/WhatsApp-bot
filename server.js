import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// ===================== CONFIG =====================
const TOKEN = "EAARFoZBZCJ9ZAcBRZAZC57YYsthP2ocd6Nm9DCECZC7b4ftSpmc9SvEVZAFK9tKhZAKmK7ZCldU54YC2O685kMbhnTaZCbGgBz91cqFZCdZBajuX0eocZAAZADtnSbIZBMLTrA0dfTBId9Mr7fTWG0iTMuji8erzBCE7bQPAJBSejBZBgQzkxvkmoKZCCJocS50um873MNdVFrAZDZD";
const PHONE_NUMBER_ID = "1057924684076375";
const VERIFY_TOKEN = "myverifytoken"; // must match Meta webhook
// ==================================================


// ================= WEBHOOK VERIFY (GET) =================
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook Verified");
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
});


// ================= RECEIVE MESSAGES (POST) =================
app.post("/webhook", (req, res) => {
  try {
    const body = req.body;

    console.log("📩 Incoming Webhook:", JSON.stringify(body, null, 2));

    // WhatsApp message extraction
    const message =
      body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message) {
      const from = message.from;
      const text = message?.text?.body || "";

      console.log(`Message from ${from}: ${text}`);

      // Example auto reply (optional)
      sendMessage(from, "👋 Thank you! We received your message.");
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook Error:", err);
    res.sendStatus(500);
  }
});


// ================= SEND WHATSAPP MESSAGE =================
async function sendMessage(to, message) {
  try {
    const url = `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: {
          body: message
        }
      })
    });

    const data = await response.json();
    console.log("📤 Sent:", data);

  } catch (err) {
    console.error("Send Error:", err);
  }
}


// ================= INVOICE API (CALL FROM YOUR HTML) =================
app.post("/send-invoice", async (req, res) => {
  const { phone, name, amount, invoiceNo } = req.body;

  if (!phone) {
    return res.status(400).json({ error: "Phone required" });
  }

  const message =
`🧾 Invoice Generated

Name: ${name}
Invoice: ${invoiceNo}
Amount: ₹${amount}

Thank you for visiting 🙏`;

  try {
    await sendMessage(phone, message);
    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send invoice" });
  }
});


// ================= START SERVER =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
