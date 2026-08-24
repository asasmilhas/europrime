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
var import_vite = require("vite");
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
      const { nome, whatsapp, email, origem, passageiros, prazo, destinoInteresse, tipoViagem, clickedWhatsApp, userAgent, referrer } = req.body;
      if (!nome || !whatsapp) {
        return res.status(400).json({ error: "Nome e WhatsApp s\xE3o obrigat\xF3rios." });
      }
      const leads = readAllLeads();
      const newLead = {
        id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
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
      return res.status(200).json({ success: true, leadId: newLead.id, totalLeads: leads.length });
    } catch (err) {
      console.error("Error saving lead:", err);
      return res.status(500).json({ error: "Erro ao registrar lead internamente." });
    }
  });
  app.patch("/api/leads/clicked-whatsapp", (req, res) => {
    try {
      const { whatsapp } = req.body;
      if (!whatsapp) return res.status(400).json({ error: "WhatsApp missing" });
      const clean = String(whatsapp).replace(/\D/g, "");
      const leads = readAllLeads();
      let updated = false;
      for (const l of leads) {
        if ((l.whatsapp || "").replace(/\D/g, "") === clean) {
          l.clickedWhatsApp = true;
          l.status = "converteu_whatsapp";
          l.whatsappClickedAt = (/* @__PURE__ */ new Date()).toISOString();
          updated = true;
        }
      }
      if (updated) {
        writeAllLeads(leads);
      }
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: "Failed to update" });
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
