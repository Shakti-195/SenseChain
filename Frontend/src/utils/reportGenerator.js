/**
 * SenseChain Report Generator
 * PDF  → browser print-to-PDF (zero dependencies, 100% reliable)
 * Excel → SheetJS CDN with CSV fallback (zero npm install)
 */

const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

const fmtTs = (ts) => {
  if (!ts) return 'N/A';
  try {
    const raw = Number(ts);
    const ms = raw < 1e12 ? raw * 1000 : raw;
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false, timeZone: LOCAL_TZ,
    }).format(new Date(ms));
  } catch { return 'N/A'; }
};

const getMeta = () => ({
  generatedAt: new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, timeZone: LOCAL_TZ,
  }).format(new Date()),
  reportId: `SC-${Date.now().toString(36).toUpperCase()}`,
  timezone: LOCAL_TZ,
});

// ── Force-download a blob ────────────────────────────────────────────────
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 300);
};

// ─────────────────────────────────────────────────────────────────────────
//  PDF REPORT — browser print-to-PDF (works everywhere, no CDN needed)
// ─────────────────────────────────────────────────────────────────────────
export const generatePDF = ({ chain = [], integrity = true, chainHeight = 0, userEmail = '' } = {}) => {
  const meta = getMeta();
  const statusColor  = integrity ? '#10b981' : '#dc2626';
  const statusLabel  = integrity ? '✓  CHAIN VERIFIED' : '✗  BREACH DETECTED';
  const totalBlocks  = chainHeight || chain.length;

  // ── Build block table rows ──
  const blockRowsHTML = chain.length > 0
    ? chain.slice().reverse().map((b) => {
        let d = b.data;
        if (typeof d === 'string') { try { d = JSON.parse(d); } catch { d = {}; } }
        d = d || {};
        const hash = b.hash ?? '';
        return `
          <tr>
            <td class="center bold red">#${b.index ?? 0}</td>
            <td class="mono small">${hash.substring(0, 28)}…</td>
            <td class="center mono">${b.nonce ?? 0}</td>
            <td class="center">${d.temperature != null ? d.temperature + '°C' : '—'}</td>
            <td class="center">${d.humidity != null ? d.humidity + '%' : '—'}</td>
            <td class="small">${fmtTs(b.timestamp)}</td>
            <td class="center bold" style="color:${statusColor}">${integrity ? '✓ OK' : '✗ BREACH'}</td>
          </tr>`;
      }).join('')
    : `<tr><td colspan="7" class="center" style="color:#999;padding:20px">No blocks in chain yet. Run Simulation Lab on Dashboard first.</td></tr>`;

  const verifyCode = `SC-HASH-${meta.reportId}-${totalBlocks}-${integrity ? 'OK' : 'BREACH'}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>SenseChain Forensic Report ${meta.reportId}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&family=JetBrains+Mono:wght@400;700&display=swap');

  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',sans-serif;font-size:11px;color:#111;background:#fff;line-height:1.5}

  /* ── COVER ── */
  .cover{min-height:100vh;display:flex;flex-direction:column}
  .cover-header{background:#dc2626;color:#fff;padding:28px 36px;display:flex;align-items:center;justify-content:space-between}
  .brand{display:flex;align-items:center;gap:16px}
  .brand-logo{width:52px;height:52px;background:#fff;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;color:#dc2626;letter-spacing:-1px}
  .brand-name{font-size:24px;font-weight:900;letter-spacing:-0.5px}
  .brand-sub{font-size:9px;letter-spacing:3px;color:#fca5a5;text-transform:uppercase;margin-top:2px}
  .meta-block{text-align:right;font-size:9px;color:#fca5a5;line-height:1.8}
  .meta-block strong{color:#fff;display:block;font-size:10px}

  .cover-body{flex:1;padding:40px 36px}
  .report-eyebrow{font-size:9px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#dc2626;margin-bottom:12px}
  .report-title{font-size:34px;font-weight:900;line-height:1.1;color:#0f0f14;margin-bottom:8px}
  .report-title span{color:#dc2626}
  .status-badge{display:inline-flex;align-items:center;gap:8px;padding:6px 18px;border-radius:50px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#fff;background:${statusColor};margin:16px 0 28px}
  .divider{height:1px;background:#e5e5e5;margin:24px 0}
  .red-divider{height:2px;background:linear-gradient(90deg,#dc2626,#fca5a5,transparent);margin:24px 0}

  /* Executive Summary */
  .summary-box{border:1px solid #e5e5e5;border-radius:10px;padding:20px 24px;margin-bottom:24px;background:#fafafa}
  .summary-label{font-size:8px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#dc2626;margin-bottom:8px}
  .summary-text{color:#555;font-size:11px;line-height:1.7}

  /* Metrics grid */
  .metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#e5e5e5;border:1px solid #e5e5e5;border-radius:10px;overflow:hidden;margin-bottom:28px}
  .metric{background:#fff;padding:16px;text-align:center}
  .metric-val{font-size:18px;font-weight:900;color:#dc2626}
  .metric-val.green{color:#10b981}
  .metric-val.red{color:#dc2626}
  .metric-label{font-size:8px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#999;margin-top:4px}

  /* Issued to + Stamp */
  .issuance{display:flex;justify-content:space-between;align-items:flex-end;margin-top:28px}
  .issued-block h4{font-size:8px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#dc2626;margin-bottom:6px}
  .issued-block p{font-size:11px;color:#555;line-height:1.8}

  .stamp{width:100px;height:100px;border:2.5px solid #dc2626;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;position:relative}
  .stamp::before{content:'';position:absolute;inset:4px;border:1px solid #dc2626;border-radius:50%;opacity:.4}
  .stamp-text{font-size:7.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#dc2626;line-height:1.7}

  /* ── PAGE 2 TABLE ── */
  .page2{padding:36px}
  .page2-header{background:#dc2626;color:#fff;padding:16px 24px;border-radius:10px;display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}
  .page2-header h2{font-size:14px;font-weight:800}
  .page2-header span{font-size:9px;color:#fca5a5}
  .section-title{font-size:14px;font-weight:800;color:#0f0f14;margin-bottom:4px}
  .section-sub{font-size:10px;color:#999;margin-bottom:16px}

  table{width:100%;border-collapse:collapse;font-size:9.5px}
  thead tr{background:#dc2626;color:#fff}
  thead th{padding:9px 10px;text-align:left;font-weight:700;font-size:8.5px;letter-spacing:.5px;text-transform:uppercase}
  tbody tr{border-bottom:1px solid #f0f0f0}
  tbody tr:nth-child(even){background:#fafafa}
  tbody tr:hover{background:#fff5f5}
  td{padding:8px 10px;vertical-align:middle}
  .center{text-align:center}
  .right{text-align:right}
  .bold{font-weight:700}
  .red{color:#dc2626}
  .green{color:#10b981}
  .mono{font-family:'JetBrains Mono',monospace}
  .small{font-size:8.5px}

  /* Signature block */
  .sig-block{display:flex;justify-content:space-between;margin-top:32px;padding-top:16px;border-top:1px solid #e5e5e5}
  .sig-line{width:180px;border-top:1px solid #555;padding-top:6px;font-size:9px;color:#888}
  .verify-code{text-align:center;margin-top:20px;font-size:8px;color:#dc2626;font-family:'JetBrains Mono',monospace;letter-spacing:1px}

  /* Footer */
  .footer{margin-top:32px;padding-top:12px;border-top:1px solid #e5e5e5;display:flex;justify-content:space-between;font-size:8px;color:#bbb;letter-spacing:.5px}

  /* Print rules */
  @media print{
    body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .page-break{page-break-before:always}
    .no-print{display:none}
  }
</style>
</head>
<body>

<!-- ════════════════════════════ PAGE 1 — COVER ════════════════════════════ -->
<div class="cover">
  <!-- Red Header Band -->
  <div class="cover-header">
    <div class="brand">
      <div class="brand-logo">SC</div>
      <div>
        <div class="brand-name">SENSECHAIN</div>
        <div class="brand-sub">Neural Ledger · Blockchain Forensics</div>
      </div>
    </div>
    <div class="meta-block">
      <strong>REPORT ID</strong>${meta.reportId}
      <strong>GENERATED</strong>${meta.generatedAt}
      <strong>TIMEZONE</strong>${meta.timezone}
    </div>
  </div>

  <!-- Cover Body -->
  <div class="cover-body">
    <div class="report-eyebrow">Forensic Audit Report</div>
    <div class="report-title">BLOCKCHAIN<br/><span>FORENSIC</span><br/>AUDIT REPORT</div>

    <div class="status-badge">${statusLabel}</div>
    <div class="red-divider"></div>

    <!-- Executive Summary -->
    <div class="summary-box">
      <div class="summary-label">Executive Summary</div>
      <div class="summary-text">
        ${integrity
          ? 'This report provides a comprehensive forensic analysis of the SenseChain blockchain ledger. All cryptographic hash linkages have been verified using the SHA-256 algorithm. The blockchain is operating within expected parameters with no integrity violations detected during the audit period. All nodes are synchronized and verified.'
          : 'CRITICAL: This report documents a detected integrity breach within the SenseChain blockchain ledger. One or more SHA-256 cryptographic hash linkages have been severed, indicating unauthorized data tampering. Immediate forensic intervention and chain repair is required to restore ledger integrity.'}
      </div>
    </div>

    <!-- Key Metrics -->
    <div class="metrics">
      <div class="metric">
        <div class="metric-val">${totalBlocks}</div>
        <div class="metric-label">Total Blocks</div>
      </div>
      <div class="metric">
        <div class="metric-val" style="color:${statusColor}">${integrity ? 'VERIFIED' : 'BREACHED'}</div>
        <div class="metric-label">SHA-256 Status</div>
      </div>
      <div class="metric">
        <div class="metric-val">SHA-256</div>
        <div class="metric-label">Hash Algorithm</div>
      </div>
      <div class="metric">
        <div class="metric-val">PoW</div>
        <div class="metric-label">Consensus</div>
      </div>
    </div>

    <!-- Issuance + Stamp -->
    <div class="issuance">
      <div class="issued-block">
        <h4>Issued To</h4>
        <p>${userEmail || 'SenseChain Administrator'}<br/>
           Platform: SenseChain Neural Infrastructure v2.1.0<br/>
           Classification: <strong>CONFIDENTIAL — Internal Forensic Use Only</strong></p>
      </div>
      <div class="stamp">
        <div class="stamp-text">
          SENSECHAIN<br/>
          ──────────<br/>
          VERIFIED<br/>
          FORENSIC<br/>
          AUDIT ${new Date().getFullYear()}
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════════ PAGE 2 — BLOCK REGISTRY ═══════════════════════ -->
<div class="page-break"></div>
<div class="page2">
  <div class="page2-header">
    <h2>BLOCKCHAIN LEDGER · FULL BLOCK REGISTRY</h2>
    <span>Report ID: ${meta.reportId} · ${meta.generatedAt}</span>
  </div>

  <div class="section-title">Complete Block Registry</div>
  <div class="section-sub">SHA-256 cryptographic linkage analysis — ${chain.length} on-chain blocks · ${meta.timezone}</div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>SHA-256 Hash (truncated)</th>
        <th>Nonce</th>
        <th>Temp</th>
        <th>Humidity</th>
        <th>Timestamp</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${blockRowsHTML}
    </tbody>
  </table>

  <!-- Signature block -->
  <div class="sig-block">
    <div class="sig-line">Authorized by SenseChain System</div>
    <div class="sig-line" style="text-align:right">Recipient Signature</div>
  </div>

  <div class="verify-code">Verification Code: ${verifyCode}</div>

  <div class="footer">
    <span>SenseChain Neural Infrastructure · SHA-256 Layer-1 Blockchain</span>
    <span>CONFIDENTIAL · For Authorized Use Only</span>
  </div>
</div>

<!-- Auto-print trigger -->
<script>
  window.onload = function() {
    setTimeout(function(){ window.print(); }, 800);
  };
<\/script>

</body>
</html>`;

  // Open in new window and auto-trigger Print → Save as PDF
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) {
    alert('Pop-up blocked! Please allow pop-ups for this site, then click PDF Report again.');
    return 'blocked';
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  return `SenseChain_Report_${meta.reportId}.pdf`;
};

// ─────────────────────────────────────────────────────────────────────────
//  EXCEL REPORT — SheetJS CDN with CSV fallback
// ─────────────────────────────────────────────────────────────────────────
const loadScript = (src) =>
  new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`CDN failed: ${src}`));
    document.head.appendChild(s);
  });

export const generateExcel = async ({ chain = [], integrity = true, chainHeight = 0, userEmail = '' } = {}) => {
  const meta = getMeta();

  // Try SheetJS CDN
  try {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
    const XLSX = window.XLSX;
    if (!XLSX) throw new Error('XLSX not found after CDN load');

    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary
    const ws1 = XLSX.utils.aoa_to_sheet([
      ['SENSECHAIN — BLOCKCHAIN FORENSIC AUDIT REPORT'],
      [],
      ['Report ID',      meta.reportId],
      ['Generated At',   meta.generatedAt],
      ['Timezone',       meta.timezone],
      ['Platform',       'SenseChain Neural Infrastructure v2.1.0'],
      ['Issued To',      userEmail || 'SenseChain Administrator'],
      ['Classification', 'CONFIDENTIAL — Internal Forensic Use'],
      [],
      ['LEDGER STATISTICS'],
      ['Total Blocks',   chainHeight || chain.length],
      ['Chain Integrity',integrity ? 'VERIFIED ✓' : 'BREACHED ✗'],
      ['Hash Algorithm', 'SHA-256'],
      ['Consensus',      'Proof-of-Work'],
      ['Genesis Block',  chain.length > 0 ? `#${chain[0]?.index ?? 0}` : 'N/A'],
      ['Latest Block',   chain.length > 0 ? `#${chain[chain.length - 1]?.index ?? 0}` : 'N/A'],
      [],
      ['STATUS', integrity ? '✓ ALL HASHES VERIFIED — CHAIN INTACT' : '✗ CRITICAL BREACH — CHAIN COMPROMISED'],
    ]);
    ws1['!cols'] = [{ wch: 24 }, { wch: 55 }];
    ws1['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

    // Sheet 2: Block Registry
    const headers = ['Block #', 'SHA-256 Hash', 'Nonce', 'Temperature (°C)', 'Humidity (%)', 'Node ID', 'Timestamp', 'Integrity Status'];
    const rows = chain.length > 0
      ? chain.map(b => {
          let d = b.data;
          if (typeof d === 'string') { try { d = JSON.parse(d); } catch { d = {}; } }
          d = d || {};
          return [b.index ?? 0, b.hash ?? '', b.nonce ?? 0, d.temperature ?? '', d.humidity ?? '', d.node_id ?? 'SENSE-NODE-01', fmtTs(b.timestamp), integrity ? 'VERIFIED' : 'BREACHED'];
        })
      : [['No blocks', '', '', '', '', '', '', '']];
    const ws2 = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws2['!cols'] = [{ wch: 10 }, { wch: 68 }, { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 18 }, { wch: 26 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Block Registry');

    // Sheet 3: Telemetry
    const telRows = chain.filter(b => {
      let d = b.data; if (typeof d === 'string') { try { d = JSON.parse(d); } catch { return false; } } return d && (d.temperature != null || d.humidity != null);
    }).map(b => {
      let d = b.data; if (typeof d === 'string') { try { d = JSON.parse(d); } catch { d = {}; } }
      return [b.index ?? 0, fmtTs(b.timestamp), d.temperature ?? '', d.humidity ?? '', d.node_id ?? ''];
    });
    const ws3 = XLSX.utils.aoa_to_sheet([['Block #', 'Timestamp', 'Temperature (°C)', 'Humidity (%)', 'Node ID'], ...(telRows.length ? telRows : [['No data', '', '', '', '']])]);
    ws3['!cols'] = [{ wch: 10 }, { wch: 26 }, { wch: 18 }, { wch: 15 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'Telemetry');

    // Force-download with correct .xlsx extension
    const wbBin = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    const buf = new ArrayBuffer(wbBin.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < wbBin.length; i++) view[i] = wbBin.charCodeAt(i) & 0xff;
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const filename = `SenseChain_Audit_${meta.reportId}.xlsx`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.style.display = 'none';
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 300);
    return filename;

  } catch (xlsxErr) {
    console.warn('SheetJS CDN failed, falling back to CSV:', xlsxErr);

    // ── CSV Fallback (always works, opens in Excel) ──
    const BOM = '\uFEFF'; // UTF-8 BOM so Excel shows special chars correctly
    const csvHeader = 'Block #,SHA-256 Hash,Nonce,Temperature (°C),Humidity (%),Node ID,Timestamp,Integrity Status\n';
    const csvRows = chain.length > 0
      ? chain.map(b => {
          let d = b.data; if (typeof d === 'string') { try { d = JSON.parse(d); } catch { d = {}; } } d = d || {};
          return [b.index ?? 0, `"${b.hash ?? ''}"`, b.nonce ?? 0, d.temperature ?? '', d.humidity ?? '', d.node_id ?? 'SENSE-NODE-01', fmtTs(b.timestamp), integrity ? 'VERIFIED' : 'BREACHED'].join(',');
        }).join('\n')
      : 'No blocks,,,,,,\n';

    const csvContent = BOM + `SenseChain Forensic Audit Report\nReport ID:,${meta.reportId}\nGenerated:,${meta.generatedAt}\nTimezone:,${meta.timezone}\nIntegrity:,${integrity ? 'VERIFIED' : 'BREACHED'}\nTotal Blocks:,${chain.length}\n\n${csvHeader}${csvRows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `SenseChain_Audit_${meta.reportId}.csv`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.style.display = 'none';
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 300);
    return filename;
  }
};
