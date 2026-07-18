#!/usr/bin/env node
/**
 * Fill Spanish locale from Portuguese using offline PT→ES lexical/morph rules.
 *
 * Targets leaf keys where es still matches en (untranslated), using pt as meaning source.
 * Also converts keys where es was copied from pt unchanged (es === pt).
 *
 * Usage:
 *   node scripts/fill-es-from-pt.mjs           # measure, fill, write es.js
 *   node scripts/fill-es-from-pt.mjs --dry-run # stats only
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { en } from "../packages/shared/src/i18n/locales/en.js";
import { es as esLocale } from "../packages/shared/src/i18n/locales/es.js";
import { pt } from "../packages/shared/src/i18n/locales/pt.js";
import { flatten, setPath, serialize, ptToEs } from "./pt-to-es-convert.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ES_FILE = path.join(ROOT, "packages/shared/src/i18n/locales/es.js");

const dryRun = process.argv.includes("--dry-run");

/** Intentionally same in all locales (brands, units, demos). */
const KEEP_EN_IDENTICAL = new Set([
  "auth.login.demoAdmin",
  "auth.login.demoSuper",
  "nav.brand",
  "nav.moxt",
  "messages.attachment.file",
  "public.nav.faq",
  "public.trustPage.delayAfter",
  "dashboard.discovery.pricePerKg",
  "dashboard.config.services.p2p.title",
  "dashboard.config.services.events.tag",
  "common.kb",
  "settings.notifications.priority.normal",
  "verification.consent.after",
  "verification.steps.selfie",
  "events.categories.networking",
  "parcels.detail.proof.sizeKb",
  "parcels.my.perKg",
  "parcels.favorite.availableKg",
  "parcels.favorite.perKg",
  "jobs.contracts.freelance",
  "marketplace.common.whatsapp",
  "marketplace.common.stock",
  "marketplace.common.reference",
  "marketplace.common.rub",
  "marketplace.types.digital.label",
  "marketplace.extra.deposit.placeholder",
  "marketplace.extra.transmission.manual",
  "marketplace.extra.transmission.automatic",
  "marketplace.extra.fuel.diesel",
  "marketplace.extra.fuel.electric",
  "marketplace.extra.fuel.hybrid",
  "marketplace.extra.fuel.petrol",
  "marketplace.extra.orientation.north",
  "marketplace.extra.orientation.south",
  "marketplace.extra.orientation.east",
  "marketplace.extra.orientation.west",
  "marketplace.extra.energy.a",
  "marketplace.extra.energy.b",
  "marketplace.extra.energy.c",
  "marketplace.extra.energy.d",
  "marketplace.extra.energy.e",
  "marketplace.extra.energy.f",
  "marketplace.extra.energy.g",
  "marketplace.extra.rooms.studio",
  "marketplace.extra.rooms.loft",
  "marketplace.extra.rooms.duplex",
  "marketplace.extra.rooms.penthouse",
  "marketplace.extra.condition.new",
  "marketplace.extra.condition.used",
  "marketplace.extra.condition.refurbished",
  "marketplace.extra.warranty.months",
  "marketplace.extra.warranty.years",
  "marketplace.extra.delivery.express",
  "marketplace.extra.delivery.standard",
  "marketplace.extra.delivery.pickup",
  "marketplace.extra.payment.card",
  "marketplace.extra.payment.cash",
  "marketplace.extra.payment.transfer",
  "marketplace.extra.payment.crypto",
  "marketplace.extra.size.xs",
  "marketplace.extra.size.s",
  "marketplace.extra.size.m",
  "marketplace.extra.size.l",
  "marketplace.extra.size.xl",
  "marketplace.extra.size.xxl",
  "admin.super.email",
  "admin.facts.email",
  "shared.email",
  "shared.ok",
  "shared.id",
  "shared.url",
  "shared.api",
  "shared.pdf",
  "shared.csv",
  "shared.json",
  "shared.html",
  "shared.css",
  "shared.js",
  "shared.tsx",
  "shared.jsx",
  "shared.npm",
  "shared.git",
  "shared.ssh",
  "shared.ssl",
  "shared.tls",
  "shared.http",
  "shared.https",
  "shared.www",
  "shared.com",
  "shared.org",
  "shared.net",
  "shared.io",
  "shared.ai",
  "shared.app",
  "shared.dev",
  "shared.pro",
  "shared.max",
  "shared.min",
  "shared.avg",
  "shared.sum",
  "shared.total",
  "shared.subtotal",
  "shared.vat",
  "shared.tva",
  "shared.gps",
  "shared.sms",
  "shared.pin",
  "shared.otp",
  "shared.qr",
  "shared.nfc",
  "shared.rfid",
  "shared.usb",
  "shared.hdmi",
  "shared.wifi",
  "shared.bluetooth",
  "shared.gmail",
  "shared.outlook",
  "shared.paypal",
  "shared.stripe",
  "shared.visa",
  "shared.mastercard",
  "shared.amex",
  "shared.iban",
  "shared.bic",
  "shared.swift",
  "shared.sepa",
  "shared.kyc",
  "shared.aml",
  "shared.gdpr",
  "shared.ccpa",
  "shared.sla",
  "shared.nps",
  "shared.kpi",
  "shared.roi",
  "shared.crm",
  "shared.erp",
  "shared.hr",
  "shared.it",
  "shared.ceo",
  "shared.cto",
  "shared.cfo",
  "shared.coo",
  "shared.cmo",
  "shared.hr",
  "shared.pr",
  "shared.qa",
  "shared.ui",
  "shared.ux",
  "shared.seo",
  "shared.sem",
  "shared.ppc",
  "shared.cpc",
  "shared.cpm",
  "shared.ctr",
  "shared.roas",
]);

function countEsSameAsEn(enFlat, esFlat) {
  let strings = 0;
  let same = 0;
  for (const key of Object.keys(enFlat)) {
    if (typeof enFlat[key] !== "string") continue;
    strings += 1;
    if (esFlat[key] === enFlat[key]) same += 1;
  }
  return { strings, same, pct: strings ? (100 * same) / strings : 0 };
}

function shouldFill(key, enVal, esVal, ptVal) {
  if (typeof enVal !== "string") return false;
  if (ptVal == null || typeof ptVal !== "string") return false;
  if (KEEP_EN_IDENTICAL.has(key)) return false;

  const untranslatedEn = esVal === enVal;
  const copiedPt = esVal === ptVal && ptVal !== enVal;
  if (!untranslatedEn && !copiedPt) return false;
  if (ptVal === enVal && untranslatedEn) return false;
  return true;
}


function preservePlaceholders(enText, esText) {
  if (typeof enText !== "string" || typeof esText !== "string") return esText;
  const placeholders = enText.match(/\{[^{}]+\}/g);
  if (!placeholders?.length) return esText;
  let i = 0;
  return esText.replace(/\{[^{}]+\}/g, () => placeholders[i++] ?? placeholders[placeholders.length - 1]);
}
function lightCleanup(text) {
  return text
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/ ,/g, ",")
    .trim();
}

const enFlat = flatten(en);
const esFlat = flatten(esLocale);
const ptFlat = flatten(pt);

const before = countEsSameAsEn(enFlat, esFlat);
console.log("Before:", {
  identicalToEn: before.same,
  stringLeaves: before.strings,
  pctIdentical: `${before.pct.toFixed(2)}%`,
});

const updates = {};
let skippedKeep = 0;
let skippedNoChange = 0;

for (const key of Object.keys(enFlat)) {
  const enVal = enFlat[key];
  const esVal = esFlat[key];
  const ptVal = ptFlat[key];

  if (KEEP_EN_IDENTICAL.has(key) && esVal === enVal) {
    skippedKeep += 1;
    continue;
  }

  if (!shouldFill(key, enVal, esVal, ptVal)) continue;

  let converted = preservePlaceholders(enVal, lightCleanup(ptToEs(ptVal)));
  if (!converted || converted === esVal) {
    skippedNoChange += 1;
    continue;
  }
  if (converted === enVal && esVal === enVal) {
    skippedNoChange += 1;
    continue;
  }

  updates[key] = converted;
}

console.log("Planned updates:", {
  count: Object.keys(updates).length,
  skippedKeep,
  skippedNoChange,
  dryRun,
});

if (dryRun) process.exit(0);

const next = structuredClone(esLocale);
for (const [key, value] of Object.entries(updates)) {
  setPath(next, key, value);
}

const header = "/** Spanish UI copy for MOXT. */\nexport const es = ";
fs.writeFileSync(ES_FILE, `${header}${serialize(next, 0)}\n`, "utf8");

const afterFlat = flatten(next);
const after = countEsSameAsEn(enFlat, afterFlat);
console.log("After:", {
  identicalToEn: after.same,
  stringLeaves: after.strings,
  pctIdentical: `${after.pct.toFixed(2)}%`,
  filled: Object.keys(updates).length,
  esFile: ES_FILE,
});
