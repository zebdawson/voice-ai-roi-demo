const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Simple calculation function
function calc(inputs) {
  const weeksPerMonth = 4.33;
  const cpw = Number(inputs.CPW);
  const AR = Number(inputs.AR);
  const CRa = Number(inputs.CR_answered);
  const CRm = Number(inputs.CR_missed_retry);
  const AOR = Number(inputs.AOR);
  const upliftAR = Number(inputs.Uplift_answer_rate);
  const upliftCR = Number(inputs.Uplift_conversion);
  const voiceCost = Number(inputs.VoiceAICostPerMonth || 0);
  const months = Number(inputs.T_months || 12);

  const MissedCallsMonth = cpw * weeksPerMonth * (1 - AR);
  const BookingsCurrent = cpw * weeksPerMonth * AR * CRa;
  const LostBookingsConservative = cpw * weeksPerMonth * (1 - AR) * CRa;
  const RevenueLostConservative = LostBookingsConservative * AOR;

  const RecoveredBookingsIfRecontacted = MissedCallsMonth * CRm;
  const RevenueRecoveredIfRecontacted = RecoveredBookingsIfRecontacted * AOR;

  const AR_ai = Math.min(1, AR + upliftAR);
  const CR_ai = Math.min(1, CRa + upliftCR);
  const BookingsWithAI = cpw * weeksPerMonth * AR_ai * CR_ai;
  const NetRevenueGainMonthly = (BookingsWithAI - BookingsCurrent) * AOR - voiceCost;
  const PaybackMonths = NetRevenueGainMonthly > 0 ? Math.max(0.1, voiceCost / NetRevenueGainMonthly) : Number.POSITIVE_INFINITY;
  const AnnualizedGain = NetRevenueGainMonthly * 12;
  const CumulativeGainT = NetRevenueGainMonthly * months;

  const LaborHoursSavedMonthly = (MissedCallsMonth - (MissedCallsMonth * CRm)) * 0.25;
  const LaborCostSavedMonthly = Math.max(0, LaborHoursSavedMonthly * (Number(inputs.Labor_month || 0) / 160));

  return {
    MissedCallsMonth,
    BookingsCurrent,
    LostBookingsConservative,
    RevenueLostConservative,
    RecoveredBookingsIfRecontacted,
    RevenueRecoveredIfRecontacted,
    AR_ai,
    CR_ai,
    BookingsWithAI,
    NetRevenueGainMonthly,
    PaybackMonths,
    AnnualizedGain,
    CumulativeGainT,
    LaborHoursSavedMonthly,
    LaborCostSavedMonthly
  };
}

app.post("/api/calc", (req, res) => {
  try {
    const out = calc(req.body || {});
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: "calculation_error" });
  }
});

// Serve built client if exists
const clientBuild = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientBuild));
app.get("*", (req, res) => {
  const index = path.join(clientBuild, "index.html");
  res.sendFile(index, err => {
    if (err) res.status(404).send("Not found");
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server listening on port", port);
});
