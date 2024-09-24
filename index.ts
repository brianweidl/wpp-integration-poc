import { serve } from "bun";
import axios from "axios";

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || "";
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "";
const DEFAULT_PHONE_NUMBER_ID = process.env.DEFAULT_PHONE_NUMBER_ID || "";

async function sendTemplateMessage(req: Request) {
  const body = await req.json();
  let { to, phoneNumberId } = body;

  phoneNumberId = phoneNumberId ?? DEFAULT_PHONE_NUMBER_ID;

  console.log("Phone Number ID:", phoneNumberId);

  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${META_ACCESS_TOKEN}`,
  };

  const data = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template: {
      name: "hello_world",
      language: {
        code: "en_US",
      },
    },
  };

  console.log("Sending WhatsApp Message");
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  const responseData = await response.json();
  console.log("Response:", data);

  return new Response(
    JSON.stringify({ status: "Message Sent", data: responseData }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

async function sendWppMessage(req: Request) {
  const body = await req.json();
  let { to, text, phoneNumberId } = body;

  phoneNumberId = phoneNumberId ?? DEFAULT_PHONE_NUMBER_ID;

  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${META_ACCESS_TOKEN}`,
  };

  const data = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: {
      body: text,
    },
  };

  console.log("Sending WhatsApp Message");
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  const responseData = await response.json();

  return new Response(
    JSON.stringify({ status: "Message Sent", data: responseData }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

async function handleWppMessage(req: Request) {
  const body = await req.json();

  console.log("Received WhatsApp Message:", JSON.stringify(body));

  return new Response(
    JSON.stringify({ status: "Message Received", data: body }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

async function verifyWebhook(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const challenge = url.searchParams.get("hub.challenge");
  const token = url.searchParams.get("hub.verify_token");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified successfully!");
    return new Response(challenge, { status: 200 });
  } else {
    return new Response("Forbidden", { status: 403 });
  }
}

async function registerPhoneNumber(req: Request) {
  const body = await req.json();
  const { phoneNumberId } = body;

  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/register`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${META_ACCESS_TOKEN}`,
  };
  const data = {
    messaging_product: "whatsapp",
    pin: "123456",
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  const responseData = await response.json();
  console.log("Response:", responseData);

  return new Response(
    JSON.stringify({ status: "Phone Number Registered", data: responseData }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

async function subscribeAccountToWebhooks(req: Request) {
  const body = await req.json();
  const { accountId } = body;

  const url = `https://graph.facebook.com/v20.0/${accountId}/subscribed_apps`;

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${META_ACCESS_TOKEN}`,
  };

  const response = await fetch(url, { method: "POST", headers });
  const responseData = await response.json();
  console.log("Response:", responseData);

  return new Response(
    JSON.stringify({
      status: "Account subscribed to webhooks",
      data: responseData,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

async function getPhoneNumbers(req: Request) {
  const body = await req.json();
  const { accountId } = body;

  const url = `https://graph.facebook.com/v20.0/${accountId}/phone_numbers`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${META_ACCESS_TOKEN}`,
  };

  const response = await fetch(url, { headers });
  const data = await response.json();
  console.log("Response:", data);

  return new Response(
    JSON.stringify({ status: "Phone Number fetched", data }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

async function sendWppMediaMessage(req: Request) {
  const body = await req.json();
  let { to, mediaUrl, mediaType, phoneNumberId } = body;

  phoneNumberId = phoneNumberId ?? DEFAULT_PHONE_NUMBER_ID;

  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${META_ACCESS_TOKEN}`,
  };

  const data = {
    messaging_product: "whatsapp",
    to,
    type: mediaType,
    [mediaType]: {
      link: mediaUrl,
    },
  };

  console.log("Sending WhatsApp Media Message");
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  const responseData = await response.json();

  return new Response(
    JSON.stringify({ status: "Media Message Sent", data: responseData }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

async function handleRequest(req: Request) {
  const url = new URL(req.url);
  console.log("Url: ", url.pathname);
  console.log("Method: ", req.method);

  if (req.method === "GET") {
    if (url.pathname === "/webhook") {
      return verifyWebhook(req);
    }

    if (url.pathname === "/media") {
      return new Response(Bun.file("sample-9s.mp3"));
    }
  }

  if (req.method === "POST") {
    if (url.pathname === "/webhook") {
      return handleWppMessage(req);
    }

    if (url.pathname === "/send-wpp-message") {
      return sendWppMessage(req);
    }

    if (url.pathname === "/send-template-message") {
      return sendTemplateMessage(req);
    }

    if (url.pathname === "/send-wpp-media-message") {
      return sendWppMediaMessage(req);
    }

    if (url.pathname === "/register") {
      return registerPhoneNumber(req);
    }

    if (url.pathname === "/phone-numbers") {
      return getPhoneNumbers(req);
    }

    if (url.pathname === "/subscribe") {
      return subscribeAccountToWebhooks(req);
    }
  }

  return new Response("Not Found", { status: 404 });
}

serve({
  port: 3000,
  fetch: handleRequest,
});

console.log("Bun HTTP server running on port 3000");
