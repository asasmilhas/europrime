var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var import_vite = require("vite");
var FB_PIXEL_ID = "2392372768255601";
var FB_ACCESS_TOKEN = "EAAWZAdAC5F4oBS604fktuumcNAfn9od8jmpKxf8XdoFpZCvhyuiGgJC0Ox3DLTni0QBZCDvBvxzuzxmNlesbo3Y8KGjWN241haqxdJ8LUThe86MzidAzDP9uv3a4FTRR9v1d8uLe91luMYeYgzEETdQa0wJPE01Ah8wVcYZCj5pZCzzWE66409cZBF8mITZBGidaAZDZD";
function hashSha256(val) {
  if (!val || typeof val !== "string") return void 0;
  const clean = val.trim().toLowerCase();
  if (!clean) return void 0;
  return import_crypto.default.createHash("sha256").update(clean).digest("hex");
}
function normalizePhoneForMeta(rawPhone) {
  if (!rawPhone) return void 0;
  let digits = rawPhone.replace(/\D/g, "");
  if (!digits) return void 0;
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith("55")) {
    digits = "55" + digits;
  }
  return hashSha256(digits);
}
async function sendMetaConversionsApiEvent(params) {
  try {
    const names = (params.nome || "").trim().split(" ");
    const firstName = names[0] || "";
    const lastName = names.slice(1).join(" ") || "";
    const eventData = {
      event_name: params.eventName,
      event_time: Math.floor(Date.now() / 1e3),
      event_id: params.eventId || `server_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      event_source_url: params.eventSourceUrl || "https://europrimeviagens.com.br",
      action_source: "website",
      user_data: {
        client_ip_address: params.clientIp || void 0,
        client_user_agent: params.userAgent || void 0
      },
      custom_data: params.customData || {}
    };
    const hashedPhone = normalizePhoneForMeta(params.whatsapp);
    if (hashedPhone) {
      eventData.user_data.ph = [hashedPhone];
    }
    const hashedFn = hashSha256(firstName);
    if (hashedFn) {
      eventData.user_data.fn = [hashedFn];
    }
    const hashedLn = hashSha256(lastName);
    if (hashedLn) {
      eventData.user_data.ln = [hashedLn];
    }
    const hashedEm = hashSha256(params.email);
    if (hashedEm) {
      eventData.user_data.em = [hashedEm];
    }
    const url = `https://graph.facebook.com/v21.0/${FB_PIXEL_ID}/events?access_token=${encodeURIComponent(FB_ACCESS_TOKEN)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [eventData]
      })
    });
    const resJson = await response.json().catch(() => null);
    if (!response.ok) {
      console.warn("[Meta Conversions API] Graph API warning:", resJson);
    } else {
      console.log(`[Meta Conversions API] Event ${params.eventName} accepted:`, resJson?.events_received ?? "OK");
    }
    return resJson;
  } catch (err) {
    console.warn("[Meta Conversions API] Dispatch error:", err);
    return null;
  }
}
var DATA_DIR = import_path.default.join(process.cwd(), "data");
var LEADS_FILE = import_path.default.join(DATA_DIR, "leads.json");
var LEGACY_LEADS_FILE = import_path.default.join(process.cwd(), "leads.json");
function readAllLeads() {
  let leads = [];
  try {
    if (!import_fs.default.existsSync(DATA_DIR)) {
      import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (import_fs.default.existsSync(LEADS_FILE)) {
      const raw = import_fs.default.readFileSync(LEADS_FILE, "utf-8");
      if (raw && raw.trim().length > 0) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          leads = parsed;
        }
      }
    }
    if (leads.length === 0 && import_fs.default.existsSync(LEGACY_LEADS_FILE)) {
      const legacyRaw = import_fs.default.readFileSync(LEGACY_LEADS_FILE, "utf-8");
      if (legacyRaw && legacyRaw.trim().length > 0) {
        const parsedLegacy = JSON.parse(legacyRaw);
        if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
          leads = parsedLegacy;
        }
      }
    }
  } catch (err) {
    console.error("Error reading leads file:", err);
  }
  return leads;
}
function writeAllLeads(leads) {
  try {
    if (!import_fs.default.existsSync(DATA_DIR)) {
      import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
    }
    const dataString = JSON.stringify(leads, null, 2);
    import_fs.default.writeFileSync(LEADS_FILE, dataString, "utf-8");
    try {
      import_fs.default.writeFileSync(LEGACY_LEADS_FILE, dataString, "utf-8");
    } catch (e) {
    }
  } catch (err) {
    console.error("Error writing leads file:", err);
  }
}
function ensureLeadsFile() {
  const leads = readAllLeads();
  writeAllLeads(leads);
}
async function startServer() {
  ensureLeadsFile();
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.post("/api/leads", (req, res) => {
    try {
      const { nome, whatsapp, email, origem, passageiros, prazo, destinoInteresse, tipoViagem, clickedWhatsApp, userAgent, referrer, eventId } = req.body;
      if (!nome || !whatsapp) {
        return res.status(400).json({ error: "Nome e WhatsApp s\xE3o obrigat\xF3rios." });
      }
      const leads = readAllLeads();
      const newLead = {
        id: eventId || `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        dataRegistroBR: (/* @__PURE__ */ new Date()).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
        nome: String(nome).trim(),
        whatsapp: String(whatsapp).trim(),
        email: email ? String(email).trim() : "",
        origem: origem ? String(origem).trim() : "",
        passageiros: passageiros || "1 pessoa",
        prazo: prazo || "",
        destinoInteresse: destinoInteresse || "Europa",
        tipoViagem: tipoViagem || "Turismo",
        clickedWhatsApp: Boolean(clickedWhatsApp),
        status: clickedWhatsApp ? "converteu_whatsapp" : "lead_sem_whatsapp_remarketing",
        userAgent: userAgent || req.headers["user-agent"] || "",
        referrer: referrer || "",
        ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || ""
      };
      leads.unshift(newLead);
      writeAllLeads(leads);
      const clientIp = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").toString().split(",")[0].trim();
      const clientUa = (userAgent || req.headers["user-agent"] || "").toString();
      sendMetaConversionsApiEvent({
        eventName: clickedWhatsApp ? "Lead" : "InitiateCheckout",
        eventId: newLead.id,
        eventSourceUrl: referrer || (req.headers.referer ? req.headers.referer.toString() : "https://europrimeviagens.com.br"),
        clientIp,
        userAgent: clientUa,
        nome: String(nome),
        whatsapp: String(whatsapp),
        email: email ? String(email) : void 0,
        customData: {
          content_name: `Cota\xE7\xE3o EuroPrime - ${destinoInteresse || "Europa"}`,
          content_category: tipoViagem || "Turismo",
          destination: destinoInteresse || "Europa",
          origin_city: origem || "",
          passengers: passageiros || "1 pessoa",
          travel_timeline: prazo || "",
          currency: "BRL",
          value: 1
        }
      }).catch((err) => console.warn("[Meta CAPI Pre-Lead] Background dispatch note:", err));
      return res.status(200).json({ success: true, leadId: newLead.id, totalLeads: leads.length });
    } catch (err) {
      console.error("Error saving lead:", err);
      return res.status(500).json({ error: "Erro ao registrar lead internamente." });
    }
  });
  app.patch("/api/leads/clicked-whatsapp", (req, res) => {
    try {
      const { whatsapp, eventId } = req.body;
      if (!whatsapp) return res.status(400).json({ error: "WhatsApp missing" });
      const clean = String(whatsapp).replace(/\D/g, "");
      const leads = readAllLeads();
      let updated = false;
      let matchedLead = null;
      for (const l of leads) {
        if ((l.whatsapp || "").replace(/\D/g, "") === clean) {
          l.clickedWhatsApp = true;
          l.status = "converteu_whatsapp";
          l.whatsappClickedAt = (/* @__PURE__ */ new Date()).toISOString();
          updated = true;
          if (!matchedLead) matchedLead = l;
        }
      }
      if (updated) {
        writeAllLeads(leads);
      }
      const clientIp = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").toString().split(",")[0].trim();
      const clientUa = (req.headers["user-agent"] || "").toString();
      sendMetaConversionsApiEvent({
        eventName: "Lead",
        // Principal evento de Lead
        eventId: eventId || `lead_${clean}_${Date.now()}`,
        eventSourceUrl: req.headers.referer ? req.headers.referer.toString() : "https://europrimeviagens.com.br",
        clientIp,
        userAgent: clientUa,
        nome: matchedLead?.nome,
        whatsapp,
        email: matchedLead?.email,
        customData: {
          content_name: `Lead WhatsApp Final - ${matchedLead?.destinoInteresse || "Europa"}`,
          destination: matchedLead?.destinoInteresse || "Europa",
          origin_city: matchedLead?.origem || "",
          passengers: matchedLead?.passageiros || "",
          currency: "BRL",
          value: 1
        }
      }).catch((err) => console.warn("[Meta CAPI Lead] Background dispatch note:", err));
      sendMetaConversionsApiEvent({
        eventName: "Contact",
        eventId: `${eventId || `wa_${clean}_${Date.now()}`}_contact`,
        eventSourceUrl: req.headers.referer ? req.headers.referer.toString() : "https://europrimeviagens.com.br",
        clientIp,
        userAgent: clientUa,
        nome: matchedLead?.nome,
        whatsapp,
        email: matchedLead?.email,
        customData: {
          content_name: `WhatsApp Lead EuroPrime - ${matchedLead?.destinoInteresse || "Europa"}`,
          destination: matchedLead?.destinoInteresse || "Europa",
          currency: "BRL",
          value: 1
        }
      }).catch((err) => console.warn("[Meta CAPI Contact] Background dispatch note:", err));
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: "Failed to update" });
    }
  });
  app.post("/api/fb-events", async (req, res) => {
    try {
      const { eventName, eventId, eventSourceUrl, leadData, customData } = req.body;
      const clientIp = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").toString().split(",")[0].trim();
      const clientUa = (req.headers["user-agent"] || "").toString();
      const result = await sendMetaConversionsApiEvent({
        eventName: eventName || "Lead",
        eventId,
        eventSourceUrl: eventSourceUrl || (req.headers.referer ? req.headers.referer.toString() : "https://europrimeviagens.com.br"),
        clientIp,
        userAgent: clientUa,
        nome: leadData?.nome,
        whatsapp: leadData?.whatsapp,
        email: leadData?.email,
        customData
      });
      return res.json({ success: true, result });
    } catch (e) {
      return res.status(500).json({ error: e?.message || "Failed to dispatch FB event" });
    }
  });
  app.get("/api/leads", (req, res) => {
    try {
      const leads = readAllLeads();
      res.json({ count: leads.length, leads });
    } catch (err) {
      res.status(500).json({ error: "Erro ao ler leads." });
    }
  });
  app.get("/api/leads/export.csv", (req, res) => {
    try {
      const leads = readAllLeads();
      let csv = "data_cadastro,nome,primeiro_nome,sobrenome,telefone_whatsapp,origem,passageiros,prazo_viagem,destino,tipo_viagem,status_whatsapp\n";
      for (const l of leads) {
        const names = (l.nome || "").trim().split(" ");
        const firstName = names[0] || "";
        const lastName = names.slice(1).join(" ") || "";
        let cleanPhone = (l.whatsapp || "").replace(/\D/g, "");
        if (cleanPhone.length >= 10 && !cleanPhone.startsWith("55")) {
          cleanPhone = "55" + cleanPhone;
        }
        csv += `"${l.dataRegistroBR || l.createdAt}","${l.nome}","${firstName}","${lastName}","+${cleanPhone}","${l.origem || ""}","${l.passageiros || ""}","${l.prazo || ""}","${l.destinoInteresse || ""}","${l.tipoViagem || ""}","${l.clickedWhatsApp ? "CONVERTEU_WHATSAPP" : "ABANDONOU_SEM_WHATSAPP_REMARKETING"}"
`;
      }
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="leads_remarketing_europrime.csv"');
      res.status(200).send("\uFEFF" + csv);
    } catch (err) {
      res.status(500).send("Erro ao exportar CSV");
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: {
        middlewareMode: true,
        watch: {
          ignored: [
            "**/data/**",
            "**/leads.json",
            "**/.data/**",
            "**/*.log",
            "**/node_modules/**"
          ]
        }
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
