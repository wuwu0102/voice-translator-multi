const GLOSSARY_TERMS = [
  "Testing Adjusting Balancing",
  "Novec 1230",
  "CDU Loop",
  "Liquid Cooling",
  "Cold Aisle",
  "Hot Aisle",
  "Server Rack",
  "Data Center",
  "Fire Alarm",
  "Access Control",
  "Structured Cabling",
  "Patch Panel",
  "Power Density",
  "kW per rack",
  "80kW/rack",
  "Plate Heat Exchanger",
  "Cooling Tower",
  "Differential Pressure",
  "Set Point",
  "Commissioning",
  "Containment",
  "Raised Floor",
  "Humidity",
  "Temperature",
  "Dew Point",
  "Chiller",
  "Busway",
  "CRAC",
  "PDU",
  "UPS",
  "BMS",
  "EMS",
  "VESDA",
  "FM200",
  "CDU",
  "AHU",
  "MAU",
  "PAU",
  "VRV",
  "VRF",
  "Rack",
  "TAB",
  "EPO",
  "CCTV",
  "Fiber",
  "Copper",
  "Pump",
  "PG25"
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function protectGlossary(text) {
  let protectedText = text;
  const glossaryMap = {};
  let index = 1;

  const sortedTerms = [...new Set(GLOSSARY_TERMS)].sort((a, b) => b.length - a.length);

  for (const term of sortedTerms) {
    const placeholder = `__TERM_${String(index).padStart(3, "0")}__`;
    const pattern = new RegExp(escapeRegExp(term), "gi");
    let matchedValue = "";

    protectedText = protectedText.replace(pattern, (match) => {
      if (!matchedValue) {
        matchedValue = match;
      }
      return placeholder;
    });

    if (matchedValue) {
      glossaryMap[placeholder] = matchedValue;
      index += 1;
    }
  }

  return { protectedText, glossaryMap };
}

export function restoreGlossary(text, glossaryMap = {}) {
  return Object.entries(glossaryMap).reduce(
    (acc, [placeholder, term]) => acc.replaceAll(placeholder, term),
    text
  );
}
