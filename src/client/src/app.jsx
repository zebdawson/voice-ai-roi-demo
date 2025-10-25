import React, { useState } from "react";
import profiles from "../../../profiles.json";

const defaultInputs = {
  AOR: 400,
  CPW: 60,
  AR: 0.7,
  CR_answered: 0.12,
  CR_missed_retry: 0.05,
  Labor_month: 2400,
  VoiceAICostPerMonth: 600,
  Uplift_answer_rate: 0.2,
  Uplift_conversion: 0.03,
  T_months: 12
};

function calcLocally(inputs) {
  const weeksPerMonth = 4.33;
  const cpw = Number(inputs.CPW);
  const AR = Number(inputs.AR);
  const CRa = Number(inputs.CR_answered);
  const CRm = Number(inputs.CR_missed_retry);
  const AOR = Number(inputs.AOR);
  const upliftAR = Number(inputs.Uplift_answer_rate);
  const upliftCR = Number(inputs.Uplift_conversion);
  const voiceCost = Number(inputs.VoiceAICostPerMonth);
  const months = Number(inputs.T_months);

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
  const PaybackMonths = NetRevenueGainMonthly > 0 ? Math.max(0.1, voiceCost / NetRevenueGainMonthly) : Infinity;
  const AnnualizedGain = NetRevenueGainMonthly * 12;
  const CumulativeGainT = NetRevenueGainMonthly * months;

  const LaborHoursSavedMonthly = (MissedCallsMonth - (MissedCallsMonth * CRm)) * 0.25;
  const LaborCostSavedMonthly = Math.max(0, LaborHoursSavedMonthly * (Number(inputs.Labor_month) / 160));

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

export default function App() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [result, setResult] = useState(null);

  function update(key, value) {
    setInputs(s => ({ ...s, [key]: value }));
  }

  function applyProfile(profile) {
    setInputs({ ...defaultInputs, ...profile });
    setResult(null);
  }

  function runLocal() {
    setResult(calcLocally(inputs));
  }

  async function runServer() {
    try {
      const res = await fetch("/api/calc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs)
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
      setResult({ error: "Server error" });
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: "Inter, sans-serif", maxWidth: 980, margin: "0 auto" }}>
      <h3>Voice AI ROI Calculator</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label><strong>Average repair order AOR</strong></label>
          <input type="number" value={inputs.AOR} onChange={e => update("AOR", e.target.value)} />
        </div>

        <div>
          <label><strong>Calls per week CPW</strong></label>
          <input type="number" value={inputs.CPW} onChange={e => update("CPW", e.target.value)} />
        </div>

        <div>
          <label><strong>Answer rate AR 0-1</strong></label>
          <input type="number" step="0.01" value={inputs.AR} onChange={e => update("AR", e.target.value)} />
        </div>

        <div>
          <label><strong>Conversion if answered CR_answered 0-1</strong></label>
          <input type="number" step="0.01" value={inputs.CR_answered} onChange={e => update("CR_answered", e.target.value)} />
        </div>

        <div>
          <label><strong>Conversion if recontacted CR_missed_retry 0-1</strong></label>
          <input type="number" step="0.01" value={inputs.CR_missed_retry} onChange={e => update("CR_missed_retry", e.target.value)} />
        </div>

        <div>
          <label><strong>Monthly front-desk labor cost</strong></label>
          <input type="number" value={inputs.Labor_month} onChange={e => update("Labor_month", e.target.value)} />
        </div>

        <div>
          <label><strong>Voice AI cost month</strong></label>
          <input type="number" value={inputs.VoiceAICostPerMonth} onChange={e => update("VoiceAICostPerMonth", e.target.value)} />
        </div>

        <div>
          <label><strong>Uplift answer rate</strong></label>
          <input type="number" step="0.01" value={inputs.Uplift_answer_rate} onChange={e => update("Uplift_answer_rate", e.target.value)} />
        </div>

        <div>
          <label><strong>Uplift conversion</strong></label>
          <input type="number" step="0.01" value={inputs.Uplift_conversion} onChange={e => update("Uplift_conversion", e.target.value)} />
        </div>

        <div>
          <label><strong>Time horizon months</strong></label>
          <input type="number" value={inputs.T_months} onChange={e => update("T_months", e.target.value)} />
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <strong>Prefilled profiles</strong>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {profiles.map((p, i) => (
            <button key={i} onClick={() => applyProfile(p)}>{p.name}</button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={runLocal} style={{ marginRight: 8 }}>Calculate client</button>
        <button onClick={runServer}>Calculate server</button>
      </div>

      <div style={{ marginTop: 18 }}>
        <h4>Results</h4>
        {result ? (
          result.error ? <div><strong>Error:</strong> {result.error}</div> : (
            <div>
              <div><strong>Missed calls month:</strong> {Number(result.MissedCallsMonth).toFixed(1)}</div>
              <div><strong>Bookings now month:</strong> {Number(result.BookingsCurrent).toFixed(1)}</div>
              <div><strong>Estimated revenue lost month (conservative):</strong> ${Number(result.RevenueLostConservative).toFixed(2)}</div>
              <div><strong>Estimated recovered revenue if recontacted month:</strong> ${Number(result.RevenueRecoveredIfRecontacted).toFixed(2)}</div>
              <div><strong>Bookings with Voice AI month:</strong> {Number(result.BookingsWithAI).toFixed(1)}</div>
              <div><strong>Net monthly revenue gain after voice cost:</strong> ${Number(result.NetRevenueGainMonthly).toFixed(2)}</div>
              <div><strong>Payback months:</strong> {isFinite(result.PaybackMonths) ? Number(result.PaybackMonths).toFixed(1) : "Never"}</div>
              <div><strong>Annualized net gain:</strong> ${Number(result.AnnualizedGain).toFixed(2)}</div>
              <div><strong>Cumulative net gain:</strong> ${Number(result.CumulativeGainT).toFixed(2)}</div>
              <div><strong>Estimated labor cost saved month:</strong> ${Number(result.LaborCostSavedMonthly).toFixed(2)}</div>
            </div>
          )
        ) : <div>Run a calculation to see results.</div>}
      </div>
    </div>
  );
}
