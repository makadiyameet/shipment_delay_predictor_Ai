import { useState, useRef } from "react";

const SAMPLE_DATA = [
  { id: "SHP-1042", origin: "Hamburg", destination: "Rotterdam", carrier: "DHL Freight", weight: "2400kg", category: "Electronics", eta: "2026-05-12", status: "In Transit", daysInTransit: 3, temperature: "Controlled", customsClearance: "Pending" },
  { id: "SHP-1043", origin: "Shanghai", destination: "Frankfurt", carrier: "Maersk", weight: "18000kg", category: "Automotive Parts", eta: "2026-05-15", status: "Delayed", daysInTransit: 22, temperature: "Ambient", customsClearance: "Cleared" },
  { id: "SHP-1044", origin: "New York", destination: "Berlin", carrier: "FedEx Freight", weight: "850kg", category: "Medical Supplies", eta: "2026-05-11", status: "In Transit", daysInTransit: 5, temperature: "Refrigerated", customsClearance: "Pending" },
  { id: "SHP-1045", origin: "Mumbai", destination: "Amsterdam", carrier: "MSC", weight: "24000kg", category: "Textiles", eta: "2026-05-20", status: "In Transit", daysInTransit: 18, temperature: "Ambient", customsClearance: "Pending" },
  { id: "SHP-1046", origin: "Dubai", destination: "Munich", carrier: "DB Schenker", weight: "3200kg", category: "Luxury Goods", eta: "2026-05-13", status: "On Schedule", daysInTransit: 4, temperature: "Controlled", customsClearance: "Cleared" },
];

const RISK_COLORS = {
  High: { bg: "#FCEBEB", text: "#A32D2D", border: "#F09595", dot: "#E24B4A" },
  Medium: { bg: "#FAEEDA", text: "#854F0B", border: "#FAC775", dot: "#EF9F27" },
  Low: { bg: "#EAF3DE", text: "#3B6D11", border: "#C0DD97", dot: "#639922" },
};

function Badge({ risk }) {
  const c = RISK_COLORS[risk];
  return (
    <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 99, background: c.bg, color: c.text, border: `0.5px solid ${c.border}`, whiteSpace: "nowrap" }}>
      <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: c.dot, marginRight: 5, verticalAlign: "middle" }} />
      {risk} Risk
    </span>
  );
}

function MiniBar({ value, color }) {
  return (
    <div style={{ height: 4, background: "var(--color-background-secondary)", borderRadius: 99, overflow: "hidden", width: "100%" }}>
      <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 99 }} />
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "0.85rem 1rem" }}>
      <p style={{ margin: "0 0 4px", fontSize: 11, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
      <p style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 500, color: color || "var(--color-text-primary)" }}>{value}</p>
      {sub && <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>{sub}</p>}
    </div>
  );
}

export default function App() {
  const [shipments, setShipments] = useState(SAMPLE_DATA);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [selected, setSelected] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [bulkDone, setBulkDone] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [csvError, setCsvError] = useState("");
  const fileRef = useRef();

  const analyzeOne = async (shp) => {
    setLoading(l => ({ ...l, [shp.id]: true }));
    const prompt = `You are a logistics AI analyst. Analyze this shipment and predict delay risk.

Shipment data:
- ID: ${shp.id}
- Route: ${shp.origin} → ${shp.destination}
- Carrier: ${shp.carrier}
- Weight: ${shp.weight}
- Category: ${shp.category}
- ETA: ${shp.eta}
- Current status: ${shp.status}
- Days in transit: ${shp.daysInTransit}
- Temperature requirement: ${shp.temperature}
- Customs clearance: ${shp.customsClearance}

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "riskLevel": "High" or "Medium" or "Low",
  "delayProbability": number between 0-100,
  "estimatedDelayDays": number (0 if low risk),
  "primaryReason": "single concise sentence",
  "riskFactors": ["factor 1", "factor 2", "factor 3"],
  "recommendedAction": "one specific actionable recommendation",
  "alternativeCarrier": "suggest a real alternative carrier or null",
  "confidenceScore": number between 70-98
}`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResults(r => ({ ...r, [shp.id]: parsed }));
    } catch (e) {
      setResults(r => ({ ...r, [shp.id]: { error: true } }));
    }
    setLoading(l => ({ ...l, [shp.id]: false }));
  };

  const analyzeAll = async () => {
    setAnalyzing(true);
    setBulkDone(false);
    for (const s of shipments) {
      if (!results[s.id]) await analyzeOne(s);
    }
    setAnalyzing(false);
    setBulkDone(true);
  };

  const handleCSV = (e) => {
    setCsvError("");
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const lines = ev.target.result.trim().split("\n");
        const headers = lines[0].split(",").map(h => h.trim());
        const parsed = lines.slice(1).map((line, i) => {
          const vals = line.split(",").map(v => v.trim());
          const obj = {};
          headers.forEach((h, j) => obj[h] = vals[j] || "");
          return { ...obj, id: obj.id || `SHP-${1100 + i}` };
        }).filter(r => r.origin && r.destination);
        if (parsed.length === 0) throw new Error("No valid rows found");
        setShipments(parsed);
        setResults({});
        setBulkDone(false);
      } catch (err) {
        setCsvError("Invalid CSV format. Please use the sample template.");
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const headers = "id,origin,destination,carrier,weight,category,eta,status,daysInTransit,temperature,customsClearance";
    const row = "SHP-2001,Berlin,Paris,DHL Freight,1200kg,Electronics,2026-05-18,In Transit,2,Ambient,Pending";
    const blob = new Blob([headers + "\n" + row], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "shipments_template.csv"; a.click();
  };

  const analyzed = Object.keys(results).length;
  const highRisk = Object.values(results).filter(r => r.riskLevel === "High").length;
  const medRisk = Object.values(results).filter(r => r.riskLevel === "Medium").length;
  const avgDelay = analyzed ? Math.round(Object.values(results).filter(r => !r.error).reduce((a, r) => a + (r.estimatedDelayDays || 0), 0) / analyzed) : 0;

  return (
    <div style={{ fontFamily: "var(--font-sans)", maxWidth: 680, margin: "0 auto", padding: "1.5rem 1rem" }}>
      <h2 className="sr-only">AI Shipment Delay Predictor — logistics risk analysis dashboard</h2>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#185FA5", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="ti ti-truck" style={{ color: "#E6F1FB", fontSize: 16 }} aria-hidden="true" />
            </div>
            <span style={{ fontWeight: 500, fontSize: 15, color: "var(--color-text-primary)" }}>ShipSense AI</span>
            <span style={{ fontSize: 11, background: "#E6F1FB", color: "#185FA5", padding: "2px 8px", borderRadius: 99 }}>Beta</span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>Predict shipment delays before they happen using AI analysis</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={downloadTemplate} style={{ padding: "7px 14px", fontSize: 12, border: "0.5px solid var(--color-border-tertiary)", borderRadius: 8, background: "transparent", cursor: "pointer", fontFamily: "inherit", color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-download" style={{ fontSize: 14 }} aria-hidden="true" /> CSV Template
          </button>
          <button onClick={() => fileRef.current.click()} style={{ padding: "7px 14px", fontSize: 12, border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, background: "transparent", cursor: "pointer", fontFamily: "inherit", color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-upload" style={{ fontSize: 14 }} aria-hidden="true" /> Upload CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleCSV} />
        </div>
      </div>

      {csvError && <div style={{ fontSize: 13, color: "#A32D2D", background: "#FCEBEB", padding: "8px 12px", borderRadius: 8, marginBottom: "1rem" }}>{csvError}</div>}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "0.5px solid var(--color-border-tertiary)", marginBottom: "1.5rem" }}>
        {["dashboard", "shipments"].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            padding: "8px 16px", fontSize: 13, border: "none", cursor: "pointer", background: "transparent",
            fontFamily: "inherit", color: activeTab === t ? "var(--color-text-primary)" : "var(--color-text-secondary)",
            borderBottom: activeTab === t ? "2px solid #185FA5" : "2px solid transparent",
            fontWeight: activeTab === t ? 500 : 400, textTransform: "capitalize"
          }}>{t === "dashboard" ? "Dashboard" : `Shipments (${shipments.length})`}</button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === "dashboard" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: "1.5rem" }}>
            <StatCard label="Total shipments" value={shipments.length} sub="loaded" />
            <StatCard label="Analyzed" value={analyzed} sub={`of ${shipments.length}`} color="#185FA5" />
            <StatCard label="High risk" value={highRisk} sub="need action" color="#A32D2D" />
            <StatCard label="Avg delay" value={`${avgDelay}d`} sub="estimated" color={avgDelay > 3 ? "#854F0B" : "#3B6D11"} />
          </div>

          {analyzed > 0 && (
            <div style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
              <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Risk distribution</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[["High", "#E24B4A"], ["Medium", "#EF9F27"], ["Low", "#639922"]].map(([level, color]) => {
                  const count = Object.values(results).filter(r => r.riskLevel === level).length;
                  const pct = analyzed ? Math.round((count / analyzed) * 100) : 0;
                  return (
                    <div key={level}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                        <span style={{ color: "var(--color-text-primary)" }}>{level} risk</span>
                        <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{count} shipments ({pct}%)</span>
                      </div>
                      <MiniBar value={pct} color={color} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!bulkDone ? (
            <button onClick={analyzeAll} disabled={analyzing} style={{
              width: "100%", padding: "12px", borderRadius: 8, border: "none", fontSize: 14,
              cursor: analyzing ? "not-allowed" : "pointer", fontFamily: "inherit", fontWeight: 500,
              background: analyzing ? "var(--color-border-tertiary)" : "#185FA5",
              color: analyzing ? "var(--color-text-secondary)" : "#fff"
            }}>
              {analyzing ? `Analyzing shipments… (${analyzed}/${shipments.length})` : `✦ Analyze all ${shipments.length} shipments with AI`}
            </button>
          ) : (
            <div style={{ textAlign: "center", padding: "1rem", background: "#EAF3DE", borderRadius: 8 }}>
              <p style={{ margin: 0, fontSize: 14, color: "#3B6D11", fontWeight: 500 }}>✓ Analysis complete — {highRisk} high-risk shipment{highRisk !== 1 ? "s" : ""} require attention</p>
            </div>
          )}
        </div>
      )}

      {/* Shipments Tab */}
      {activeTab === "shipments" && (
        <div>
          {shipments.map(shp => {
            const res = results[shp.id];
            const isLoading = loading[shp.id];
            const isSelected = selected === shp.id;

            return (
              <div key={shp.id} style={{ border: `0.5px solid ${res?.riskLevel ? RISK_COLORS[res.riskLevel].border : "var(--color-border-tertiary)"}`, borderRadius: "var(--border-radius-lg)", marginBottom: 10, overflow: "hidden" }}>
                {/* Row */}
                <div style={{ padding: "0.85rem 1.25rem", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>{shp.id}</span>
                      {res && !res.error && <Badge risk={res.riskLevel} />}
                      {isLoading && <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Analyzing…</span>}
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>
                      <i className="ti ti-map-pin" style={{ fontSize: 12, marginRight: 4 }} aria-hidden="true" />
                      {shp.origin} → {shp.destination} · {shp.carrier}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{shp.category} · {shp.weight}</span>
                    {!res && !isLoading && (
                      <button onClick={() => analyzeOne(shp)} style={{ padding: "6px 14px", fontSize: 12, border: "0.5px solid #185FA5", borderRadius: 6, background: "transparent", cursor: "pointer", fontFamily: "inherit", color: "#185FA5" }}>
                        Analyze
                      </button>
                    )}
                    {res && !res.error && (
                      <button onClick={() => setSelected(isSelected ? null : shp.id)} style={{ padding: "6px 14px", fontSize: 12, border: "0.5px solid var(--color-border-tertiary)", borderRadius: 6, background: "transparent", cursor: "pointer", fontFamily: "inherit", color: "var(--color-text-primary)" }}>
                        {isSelected ? "Hide" : "Details"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Detail panel */}
                {isSelected && res && !res.error && (
                  <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", padding: "1rem 1.25rem", background: "var(--color-background-secondary)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                      <div>
                        <p style={{ margin: "0 0 4px", fontSize: 11, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Delay probability</p>
                        <p style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 500, color: res.riskLevel === "High" ? "#A32D2D" : res.riskLevel === "Medium" ? "#854F0B" : "#3B6D11" }}>{res.delayProbability}%</p>
                        <MiniBar value={res.delayProbability} color={res.riskLevel === "High" ? "#E24B4A" : res.riskLevel === "Medium" ? "#EF9F27" : "#639922"} />
                      </div>
                      <div>
                        <p style={{ margin: "0 0 4px", fontSize: 11, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Est. delay</p>
                        <p style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 500, color: "var(--color-text-primary)" }}>{res.estimatedDelayDays} day{res.estimatedDelayDays !== 1 ? "s" : ""}</p>
                        <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>AI confidence: {res.confidenceScore}%</p>
                      </div>
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)" }}>Primary risk</p>
                      <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>{res.primaryReason}</p>
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)" }}>Risk factors</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {res.riskFactors?.map((f, i) => (
                          <span key={i} style={{ fontSize: 12, padding: "4px 10px", background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 6, color: "var(--color-text-secondary)" }}>{f}</span>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: "#E6F1FB", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: 8 }}>
                      <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 500, color: "#185FA5", textTransform: "uppercase", letterSpacing: "0.05em" }}>Recommended action</p>
                      <p style={{ margin: 0, fontSize: 13, color: "#0C447C", lineHeight: 1.5 }}>{res.recommendedAction}</p>
                    </div>

                    {res.alternativeCarrier && (
                      <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>
                        <i className="ti ti-refresh" style={{ fontSize: 12, marginRight: 4 }} aria-hidden="true" />
                        Alternative carrier: <strong style={{ color: "var(--color-text-primary)" }}>{res.alternativeCarrier}</strong>
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}