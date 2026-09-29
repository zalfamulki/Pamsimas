# PRD: PAMSIMAS Billing Calculator Web App

## 1. Product Overview
**Product Name:** PAMSIMAS Billing Calculator  
**Type:** Single-page web application (static, no backend)  
**Target Users:** PAMSIMAS operators / village water management staff  
**Core Value:** Instant water bill calculation from meter readings with Excel export for record-keeping

---

## 2. Functional Requirements

### 2.1 Core Calculation Feature
| Input Field | Type | Validation |
|-------------|------|------------|
| Meter Awal (Initial Reading) | Number (integer) | Required, ≥ 0 |
| Meter Akhir (Final Reading) | Number (integer) | Required, ≥ Meter Awal |

**Formula:**
```
Pemakaian = Meter Akhir - Meter Awal
Total Tagihan = 5.000 + (Pemakaian × 3.000)
```

**Output Display:**
- Pemakaian (m³)
- Biaya Abonemen: Rp 5.000
- Biaya Pemakaian: Rp [Pemakaian × 3.000]
- **Total Tagihan: Rp [Total]**

### 2.2 Excel Export Feature
- **Trigger:** "Export ke Excel" button
- **Format:** `.xlsx` (single sheet)
- **Columns:** No, Nama Pelanggan, Meter Awal, Meter Akhir, Pemakaian, Abonemen, Biaya Pemakaian, Total Tagihan, Tanggal Input
- **Behavior:** 
  - Appends new row to existing file (if user re-downloads)
  - Or generates fresh file with all entries from current session
- **Library:** SheetJS (xlsx) via CDN — no build step needed

### 2.3 Session Storage (Local Persistence)
- Store entries in `localStorage` so data survives page refresh
- "Hapus Semua" button to clear localStorage
- Optional: "Hapus Baris" per entry

### 2.4 Customer Name Field (Recommended Addition)
- Optional text input: "Nama Pelanggan"
- Included in Excel export
- Helps identify records without database

---

## 3. Non-Functional Requirements

| Requirement | Spec |
|-------------|------|
| **No Database** | Pure client-side (HTML/JS/CSS) |
| **No Build Step** | Single `index.html` + CDN libraries |
| **Offline-Capable** | Works without internet after first load (Service Worker optional) |
| **Mobile Responsive** | Works on phone (primary use case: field officers) |
| **Indonesian Locale** | Currency format: `Rp 1.234.567`, date: `DD/MM/YYYY` |
| **Accessibility** | Semantic HTML, keyboard navigable, sufficient contrast |

---

## 4. Technical Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **HTML/CSS/JS** | Vanilla (ES6 modules) | Zero dependencies, runs anywhere |
| **Excel Export** | SheetJS (xlsx) via CDN | Lightweight, battle-tested |
| **Styling** | Plain CSS + CSS Variables | No framework overhead |
| **Icons** | Inline SVG | No external font/icon requests |
| **Hosting** | GitHub Pages / Netlify / Vercel (static) | Free HTTPS, custom domain support |

---

## 5. UI/UX Specification

### 5.1 Layout (Single Page)
```
┌─────────────────────────────────────┐
│  PAMSIMAS Kalkulator Tagihan Air    │  ← Header
├─────────────────────────────────────┤
│  [Nama Pelanggan]        (optional) │
│  [Meter Awal]      [Meter Akhir]    │  ← Input Row
│  [Hitung]                         │  ← Primary CTA
├─────────────────────────────────────┤
│  HASIL PERHITUNGAN                  │
│  Pemakaian:      XX m³              │
│  Abonemen:       Rp 5.000           │
│  Biaya Pakai:    Rp XX.XXX          │
│  ────────────────────────────────  │
│  TOTAL:          Rp XX.XXX          │  ← Highlighted
├─────────────────────────────────────┤
│  [Simpan & Tambah Lagi]  [Export]   │  ← Actions
├─────────────────────────────────────┤
│  RIWAYAT SESI INI                   │
│  [Table: No | Nama | Awal | Akhir | │
│   Pakai | Abonemen | Biaya | Total] │
│  [Hapus Semua]                      │
└─────────────────────────────────────┘
```

### 5.2 Color Scheme
- Primary: `#0066CC` (water blue)
- Success/Total: `#16A34A` (green)
- Danger/Delete: `#DC2626` (red)
- Background: `#F8FAFC` (light gray)
- Card: `#FFFFFF`

---

## 6. Recommended Enhancements (Beyond Scope)

| Feature | Effort | Value |
|---------|--------|-------|
| **Tariff Tiering** | Low | Support progressive rates (e.g., 0-10m³ = 3k, 11-20m³ = 4k) |
| **Print Receipt** | Low | `window.print()` styled receipt for customer |
| **QR Code on Receipt** | Medium | Encode payment link / customer ID |
| **Multi-user (Local Auth)** | Medium | PIN per operator, separate localStorage namespaces |
| **PWA / Service Worker** | Medium | True offline, installable on homescreen |
| **Google Sheets Sync** | High | Append to Sheet via Apps Script (no DB, cloud backup) |
| **Bulk Import (CSV)** | Medium | Upload CSV of readings → auto-calc all |
| **Reports/Summary** | Low | Monthly total, average usage, top consumers |

---

## 7. Acceptance Criteria

1. ✅ User enters Meter Awal=100, Meter Akhir=115 → Pemakaian=15, Total=Rp 50.000
2. ✅ Invalid input (Akhir < Awal) shows inline error
3. ✅ "Simpan" adds row to history table + localStorage
4. ✅ "Export ke Excel" downloads `.xlsx` with all rows
5. ✅ Refresh page → history persists
6. ✅ Works on Chrome mobile without internet (after first load)
7. ✅ Currency formatted as `Rp 50.000` (dots, no decimals)

---

## 8. File Structure (Proposed)
```
pamsimas/
├── index.html          # Single-file app (HTML + CSS + JS inline)
└── README.md           # Deployment instructions
```
*Single `index.html` is intentional — copy to any web server, works instantly.*

---

## 9. Next Steps
1. Approve PRD → I'll generate the complete `index.html`
2. Deploy to GitHub Pages / Netlify
3. Share URL with operators
4. Gather feedback → iterate on enhancements

---

*Generated: 2026-09-29*