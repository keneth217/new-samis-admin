<template>
  <Teleport to="body">
    <div v-if="open" class="print-receipt-overlay" @click.self="$emit('close')">
      <div class="print-receipt-container">
        <div class="print-receipt-header">
          <h3>Print Receipt</h3>
          <div class="print-actions">
            <button class="print-close-btn" @click="$emit('close')">
              <span class="material-symbols-outlined">close</span>
            </button>
            <button class="pdf-btn" @click="downloadPdf" :disabled="pdfLoading" aria-label="Download PDF">
              <span v-if="pdfLoading" class="pdf-loading">...</span>
              <span v-else class="material-symbols-outlined">picture_as_pdf</span>
            </button>
            <button class="print-btn" @click="executePrint" :disabled="pdfLoading" aria-label="Print">
              <span class="material-symbols-outlined">print</span>
            </button>
          </div>
        </div>
        <div class="print-receipt-content" id="receiptToPrint" ref="receiptContentRef">
          <!-- Watermark: SAMIS + The Assurance Of Excellence (behind main content, faint light blue) -->
          <div class="receipt-watermark">
            <div class="receipt-watermark-content">
              <div class="receipt-watermark-brand">
                <img v-if="!logoLoadFailed" :src="samisLogoUrl" alt="" class="receipt-watermark-img" @error="onLogoError" />
                <template v-else>
                  <span class="receipt-watermark-s">S</span><span class="receipt-watermark-amis">AMIS</span>
                </template>
              </div>
              <div class="receipt-watermark-tagline">The Assurance Of Excellence</div>
            </div>
          </div>
          <!-- SAMIS Header: image replaces designed header when loaded -->
          <div class="receipt-header-wrapper">
            <template v-if="!headerImageLoadFailed">
              <img :src="headerImageUrl" alt="SAMIS Header" class="receipt-header-image" @error="onHeaderImageError" />
            </template>
            <template v-else>
              <div class="receipt-flag-band-wavy"></div>
              <div class="receipt-letterhead">
                <div class="receipt-logo-left">
                  <img v-if="!logoLoadFailed" :src="samisLogoUrl" alt="SAMIS Systems" class="receipt-logo-img" @error="onLogoError" />
                  <div v-else class="receipt-logo-placeholder">S</div>
                </div>
                <div class="receipt-company-info">
                  <div class="receipt-company-name">SAMIS SYSTEMS LIMITED</div>
                  <div class="receipt-company-address">Po Box 3380-00500</div>
                  <div class="receipt-company-address">NAIROBI</div>
                  <div class="receipt-company-tel">Tel: 0711 082 779</div>
                  <div class="receipt-company-contact">
                    <span>Email: samissystems@gmail.com</span>
                    <span class="receipt-contact-sep">|</span>
                    <span>Website: www.samis.co.ke</span>
                  </div>
                </div>
              </div>
              <div class="receipt-letterhead-border"></div>
            </template>
          </div>

          <!-- Main RECEIPT section -->
          <div class="receipt-main-block">
            <h1 class="receipt-main-title">RECEIPT</h1>
            <div class="receipt-top-grid">
              <div class="receipt-details-box">
                <div class="receipt-details-header">RECEIPT DETAILS</div>
                <div class="receipt-details-body">
                  <div class="receipt-details-labels">
                    <div class="receipt-detail-label">Receipt #:</div>
                    <div class="receipt-detail-label">Receipt Date:</div>
                    <div class="receipt-detail-label">Payment Method:</div>
                  </div>
                  <div class="receipt-details-values">
                    <div class="receipt-detail-value">{{ receipt?.receiptNo || 'N/A' }}</div>
                    <div class="receipt-detail-value">{{ receipt?.receiptDate ? formatReceiptFooterDate(receipt.receiptDate) : 'N/A' }}</div>
                    <div class="receipt-detail-value">{{ (receipt?.paymentMode || 'N/A') }}{{ receipt?.paymentModeNo ? ' - ' + receipt.paymentModeNo : ' -' }}</div>
                  </div>
                </div>
              </div>
              <div class="receipt-amount-box">
                <span class="receipt-amount-label">Payment Amount:</span>
                <span class="receipt-amount-value">{{ formatNumber(receipt?.amount || 0) }}</span>
              </div>
            </div>
          </div>

          <div class="receipt-blue-stripe"></div>

          <!-- Payment description section -->
          <div class="receipt-payment-desc">
            <div class="receipt-desc-row">
              <span class="receipt-desc-label">Received with thanks from:</span>
              <span class="receipt-desc-value underlined">{{ receipt?.schoolName || receipt?.schoolCode || 'N/A' }}</span>
            </div>
            <div class="receipt-desc-row">
              <span class="receipt-desc-label">Amount In Words:</span>
              <span class="receipt-desc-value underlined">{{ numberToWords(receipt?.amount || 0) }}</span>
            </div>
            <div class="receipt-desc-row">
              <span class="receipt-desc-label">Payment For:</span>
              <span class="receipt-desc-value">{{ (receipt?.paymentFor && receipt.paymentFor !== 'null') ? receipt.paymentFor : '- null' }}</span>
            </div>
            <div class="receipt-desc-row receipt-separator-line">
              <span class="receipt-desc-label receipt-separator-line-label"></span>
              <span class="receipt-desc-value receipt-separator-line-value"></span>
            </div>
            <div v-if="receipt?.deleted && receipt?.deleteReason" class="receipt-reversal-note">
              <span class="receipt-label">Reversal Reason:</span>
              <span class="receipt-value">{{ receipt.deleteReason }}</span>
            </div>
          </div>

          <!-- Footer: black line and stamp on same row, thank you text below left -->
          <div class="receipt-footer">
            <div class="receipt-footer-content">
              <div class="receipt-footer-line-row">
                <div class="receipt-footer-black-line"></div>
                <div class="receipt-stamp">
              <div class="receipt-stamp-inner" :class="{ 'receipt-stamp-has-img': !stampImageLoadFailed }">
                <img v-if="!stampImageLoadFailed" :src="stampImageUrl" alt="Stamp" class="receipt-stamp-img" @error="onStampImageError" />
                <template v-else>
                  <div class="receipt-stamp-ring">
                    <span class="receipt-stamp-text">SAMIS SYSTEMS LIMITED</span>
                    <span class="receipt-stamp-sep">✦</span>
                    <span class="receipt-stamp-address">P. O. Box 3380-00500. NAIROBI</span>
                  </div>
                </template>
                <!-- Receipt date on stamp (same format as reference: e.g. 15 Sep-2023, red, centered) -->
                <div class="receipt-stamp-date-overlay">{{ formatReceiptFooterDate(receipt?.receiptDate) }}</div>
              </div>
            </div>
              </div>
              <div class="receipt-footer-left">
                <div class="receipt-footer-text">Thank you for your Business</div>
                <div class="receipt-tagline">The Lord is my Shepherd.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script>
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const samisLogoUrl = new URL('../assets/fb2e3603-c4b0-42da-a75f-1d8888c7b536.jfif', import.meta.url).href;
const headerImageUrl = new URL('../assets/WhatsApp Image 2026-02-20 at 14.49.32 (1).jpeg', import.meta.url).href;
const stampImageUrl = new URL('../assets/WhatsApp Image 2026-02-20 at 14.49.32.jpeg', import.meta.url).href;

export default {
  name: 'PrintReceiptOverlay',
  props: {
    open: { type: Boolean, default: false },
    receipt: { type: Object, default: null },
  },
  emits: ['close'],
  data() {
    return {
      samisLogoUrl,
      headerImageUrl,
      stampImageUrl,
      logoLoadFailed: false,
      headerImageLoadFailed: false,
      stampImageLoadFailed: false,
      pdfLoading: false,
    };
  },
  watch: {
    open(val) {
      if (val) {
        this.logoLoadFailed = false;
        this.headerImageLoadFailed = false;
        this.stampImageLoadFailed = false;
      }
    },
  },
  methods: {
    formatNumber(num) {
      return new Intl.NumberFormat('en-KE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num || 0);
    },
    numberToWords(num) {
      const n = Math.floor(parseFloat(num) || 0);
      if (!Number.isFinite(n) || n < 0) return 'N/A SHILLINGS ONLY';
      if (n === 0) return 'ZERO SHILLINGS ONLY';
      const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
      const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
      const toWords = (n) => {
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
        if (n < 1000) return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 ? ' ' + toWords(n % 100) : '');
        if (n < 1000000) return toWords(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 ? ' ' + toWords(n % 1000) : '');
        if (n < 1000000000) return toWords(Math.floor(n / 1000000)) + ' MILLION' + (n % 1000000 ? ' ' + toWords(n % 1000000) : '');
        return 'N/A';
      };
      return toWords(n).trim() + ' SHILLINGS ONLY';
    },
    onLogoError() {
      this.logoLoadFailed = true;
    },
    onHeaderImageError() {
      this.headerImageLoadFailed = true;
    },
    onStampImageError() {
      this.stampImageLoadFailed = true;
    },
    formatReceiptFooterDate(dateStr) {
      const format = (d) => {
        const day = String(d.getDate()).padStart(2, '0');
        const month = d.toLocaleDateString('en-GB', { month: 'short' }); // e.g. "Sep" (capital S, rest lowercase)
        const year = d.getFullYear();
        return `${day} ${month}-${year}`;
      };
      if (!dateStr) return format(new Date());
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return format(d);
      } catch {
        return dateStr;
      }
    },
    async getPdfBlob() {
      const el = this.$refs.receiptContentRef;
      if (!el) return null;
      const container = el.closest('.print-receipt-container');
      const savedMaxWidth = container ? container.style.maxWidth : '';
      const savedWidth = container ? container.style.width : '';
      el.classList.add('receipt-for-pdf');
      /* Widen container so captured receipt matches A5 landscape ratio and fills page (no side space) */
      if (container) {
        container.style.maxWidth = 'none';
        container.style.width = 'min(95vw, 1100px)';
      }
      await this.$nextTick();
      await new Promise((r) => setTimeout(r, 150));
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
      });
      el.classList.remove('receipt-for-pdf');
      if (container) {
        container.style.maxWidth = savedMaxWidth;
        container.style.width = savedWidth;
      }
      const imgW = canvas.width;
      const imgH = canvas.height;
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a5' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const pxToMm = 25.4 / 96;
      const wMm = imgW * pxToMm / 2;
      const hMm = imgH * pxToMm / 2;
      /* Scale to fit entire receipt on page (contain) so header and footer are not cut */
      const scale = Math.min(pdfW / wMm, pdfH / hMm);
      const w = wMm * scale;
      const h = hMm * scale;
      const x = (pdfW - w) / 2;
      const y = (pdfH - h) / 2;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      pdf.addImage(dataUrl, 'JPEG', x, y, w, h);
      return pdf.output('blob');
    },
    async downloadPdf() {
      if (!this.$refs.receiptContentRef) return;
      this.pdfLoading = true;
      try {
        const blob = await this.getPdfBlob();
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Receipt-${this.receipt?.receiptNo || 'receipt'}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('PDF generation failed:', err);
      } finally {
        this.pdfLoading = false;
      }
    },
    async executePrint() {
      if (!this.$refs.receiptContentRef) return;
      this.pdfLoading = true;
      try {
        const blob = await this.getPdfBlob();
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
            URL.revokeObjectURL(url);
          }, 800);
        } else {
          URL.revokeObjectURL(url);
        }
      } catch (err) {
        console.error('Print failed:', err);
      } finally {
        this.pdfLoading = false;
      }
    },
  },
};
</script>

<style scoped>
/* Print Receipt Styles */
.print-receipt-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10050;
}

.print-receipt-container {
  background-color: #fff;
  border-radius: 8px;
  width: 100%;
  max-width: clamp(320px, 95vw, 700px);
  max-height: min(90vh, 900px);
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.print-receipt-header {
  background-color: #4368b9;
  color: #fff;
  padding: clamp(0.75rem, 2vw, 1.25rem) clamp(1rem, 2vw, 1.5rem);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 8px 8px 0 0;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.print-receipt-header h3 {
  margin: 0;
  color: gold;
  font-size: clamp(1rem, 2vw, 1.3rem);
}

.print-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.print-close-btn,
.pdf-btn,
.print-btn {
  background: transparent;
  border: 1px solid gold;
  color: gold;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.print-close-btn:hover,
.pdf-btn:hover:not(:disabled),
.print-btn:hover:not(:disabled) {
  background: gold;
  color: #4368b9;
}

.print-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.pdf-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.pdf-loading {
  font-size: 1rem;
}

.print-receipt-content {
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.55);
  color: #000;
  font-family: 'Times New Roman', Times, serif;
  font-size: 10pt;
  position: relative;
}

.receipt-watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-8deg);
  width: 80%;
  height: 60%;
  min-width: 320px;
  min-height: 240px;
  max-width: 480px;
  max-height: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 0;
}

.receipt-watermark-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  height: 100%;
}

.receipt-watermark-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
}

.receipt-watermark-img {
  width: 180px;
  height: 180px;
  object-fit: contain;
  opacity: 0.6;
  filter: brightness(1.12) contrast(1.12);
}

.receipt-watermark-s {
  font-size: 7rem;
  font-weight: bold;
  color: rgba(70, 130, 200, 0.24);
  font-family: 'Times New Roman', Times, serif;
  line-height: 1;
}

.receipt-watermark-amis {
  font-size: 7rem;
  font-weight: bold;
  color: rgba(70, 130, 200, 0.24);
  font-family: 'Times New Roman', Times, serif;
  line-height: 1;
}

.receipt-watermark-tagline {
  font-size: 1.6rem;
  font-style: italic;
  color: rgba(70, 130, 200, 0.55);
  font-family: Georgia, 'Times New Roman', serif;
  margin-top: 10px;
  letter-spacing: 0.5px;
}

.receipt-header-wrapper {
  position: relative;
  margin-bottom: 12px;
  border: 1px solid #000;
  border-bottom: none;
  padding: 0 16px 0 16px;
  overflow: hidden;
}

.receipt-header-image {
  width: 100%;
  height: auto;
  max-height: 150px;
  object-fit: contain;
  object-position: top center;
  display: block;
}

.receipt-flag-band-wavy {
  position: absolute;
  top: 0;
  left: 0;
  width: 150px;
  height: 28px;
  z-index: 1;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 150 28'%3E%3Cdefs%3E%3Cpath id='w' d='M0 14 Q 25 0 50 14 T 100 14 T 150 14'/%3E%3C/defs%3E%3Cuse href='%23w' fill='none' stroke='%23006600' stroke-width='10' transform='translate(0,2)'/%3E%3Cuse href='%23w' fill='none' stroke='%23000' stroke-width='10' transform='translate(0,9)'/%3E%3Cuse href='%23w' fill='none' stroke='%23bb0000' stroke-width='10' transform='translate(0,16)'/%3E%3C/svg%3E") no-repeat;
  background-size: 100% 100%;
}

.receipt-letterhead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0 12px 0;
  position: relative;
  z-index: 2;
}

.receipt-logo-left,
.receipt-logo-right {
  flex-shrink: 0;
}

.receipt-logo-img {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: contain;
}

.receipt-logo-placeholder {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1a5fb4 0%, #2d7dd2 100%);
  color: #fff;
  font-size: 20pt;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.receipt-company-info {
  text-align: center;
  flex: 1;
  padding: 0 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.receipt-company-name {
  font-family: 'Times New Roman', Times, serif;
  font-size: 18pt;
  font-weight: bold;
  margin-bottom: 0;
  color: #000;
  line-height: 1.2;
}

.receipt-company-address {
  font-family: 'Times New Roman', Times, serif;
  font-size: 18pt;
  font-weight: bold;
  margin: 0;
  line-height: 1.2;
}

.receipt-company-tel {
  font-family: 'Times New Roman', Times, serif;
  font-size: 18pt;
  font-weight: bold;
  margin: 0;
  line-height: 1.2;
}

.receipt-company-contact {
  font-family: 'Times New Roman', Times, serif;
  font-size: 18pt;
  font-weight: bold;
  font-style: italic;
  color: #000;
  margin: 0;
  line-height: 1.2;
}

.receipt-contact-sep {
  margin: 0 6px;
  color: #999;
}

.receipt-letterhead-border {
  height: 8px;
  background: #000;
  margin: 0 -16px 0 -16px;
}

.receipt-main-block {
  margin-bottom: 8px;
}

.receipt-main-title {
  font-family: 'Times New Roman', Times, serif;
  font-size: 20pt;
  font-weight: bold;
  text-align: center;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.receipt-top-grid {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 8px;
}

.receipt-details-box {
  flex: 0 1 auto;
  max-width: 360px;
  min-width: 270px;
  border: 1px solid #000;
}

.receipt-details-header {
  background: #4a90d9;
  color: #fff;
  padding: 2px 6px;
  font-weight: bold;
  font-size: 12px;
}

.receipt-details-body {
  display: flex;
  font-size: 12px;
}

.receipt-details-labels {
  flex: 0 0 auto;
  min-width: 95px;
  background-color: #e5e7eb;
  padding: 2px 6px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.receipt-detail-label {
  padding: 2px 0;
  font-weight: bold;
  border-bottom: 1px solid #d1d5db;
}

.receipt-details-labels .receipt-detail-label:last-child {
  border-bottom: none;
}

.receipt-details-values {
  flex: 1;
  background-color: #fff;
  padding: 2px 6px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.receipt-detail-value {
  padding: 2px 0;
  border-bottom: 1px solid #ddd;
}

.receipt-details-values .receipt-detail-value:last-child {
  border-bottom: none;
}

.receipt-amount-box {
  flex: 0 0 270px;
  min-width: 270px;
  margin-left: auto;
  margin-right: 24px;
  margin-top: 18px;
  border: 1px solid #000;
  padding: 2px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.receipt-amount-label {
  font-size: 10pt;
  font-weight: bold;
  flex-shrink: 0;
}

.receipt-amount-value {
  font-size: 13pt;
  font-weight: bold;
  text-align: left;
  flex: 1;
}

.receipt-blue-stripe {
  height: 4px;
  background: #2563eb;
  position: relative;
  z-index: 1;
  margin: 8px -1.25rem 10px -1.25rem;
  width: calc(100% + 2.5rem);
}

.receipt-payment-desc {
  margin: 10px 0 0 0;
  position: relative;
  z-index: 1;
}

.receipt-desc-row {
  display: flex;
  padding: 2px 0;
  gap: 10px;
  font-size: 10pt;
  align-items: center;
}

.receipt-desc-label {
  flex-shrink: 0;
  font-weight: bold;
}

.receipt-desc-value {
  flex: 1;
  font-weight: bold;
}

.receipt-desc-value.underlined {
  border-bottom: 1px solid #000;
}

.receipt-separator-line {
  padding: 0;
  min-height: 0;
}

.receipt-separator-line .receipt-desc-label {
  border: none;
}

/* Match width of "Payment For:" so line starts after the colon like the other two */
.receipt-separator-line-label {
  min-width: 90px;
  width: 90px;
}

.receipt-separator-line-value {
  border-top: 2px solid #000;
  min-height: 0;
  padding-top: 2px;
}

.receipt-reversal-note {
  margin-top: 8px;
  padding: 8px;
  background: #ffecec;
  border-left: 4px solid #b91c1c;
  display: flex;
  gap: 10px;
  font-size: 10pt;
}

.receipt-reversal-note .receipt-label {
  color: #b91c1c;
  min-width: 120px;
  font-weight: bold;
}

.receipt-footer {
  margin-top: 0;
  padding-top: 10px;
  position: relative;
  z-index: 1;
}

.receipt-footer-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.receipt-footer-line-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.receipt-footer-black-line {
  flex: 1;
  height: 0;
  border-top: 4px solid #000;
  min-width: 80px;
}

.receipt-footer-left {
  flex: 0 0 auto;
}

.receipt-footer-text {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 2px;
}

.receipt-tagline {
  font-size: 12px;
  font-style: italic;
  color: #444;
}

.receipt-stamp {
  text-align: center;
}

.receipt-stamp-inner {
  position: relative;
  width: 170px;
  height: 170px;
  border-radius: 50%;
  overflow: visible;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto 2px auto;
  padding: 8px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-sizing: border-box;
}
.receipt-stamp-inner.receipt-stamp-has-img {
  overflow: hidden;
}
.receipt-stamp-date-overlay {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 12pt;
  font-weight: bold;
  font-style: italic;
  color: #dc2626;
  text-align: center;
  line-height: 1.2;
  z-index: 2;
  white-space: nowrap;
  text-transform: capitalize;
}

.receipt-stamp-inner.receipt-stamp-has-img {
  background: transparent;
}

.receipt-stamp-ring {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  font-size: 6pt;
  line-height: 1.15;
  text-align: center;
  text-transform: uppercase;
  color: #fff;
  font-weight: bold;
}

.receipt-stamp-sep {
  font-size: 6pt;
  margin: 2px 0;
  color: #fff;
}


.receipt-stamp-text {
  font-size: 6pt;
  font-weight: bold;
  color: #fff;
}

.receipt-stamp-address {
  font-size: 7pt;
  color: #fff;
}

.receipt-stamp-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

/* PDF capture: wider boxes and larger font sizes (apply when generating PDF) */
.receipt-for-pdf.print-receipt-content {
  font-size: 13pt !important;
}
.receipt-for-pdf .receipt-details-box {
  max-width: 560px;
  min-width: 420px;
}
.receipt-for-pdf .receipt-details-header {
  font-size: 16px !important;
}
.receipt-for-pdf .receipt-details-body {
  font-size: 15px !important;
}
.receipt-for-pdf .receipt-detail-label {
  font-size: 15px !important;
}
.receipt-for-pdf .receipt-detail-value {
  font-size: 15px !important;
}
.receipt-for-pdf .receipt-details-labels {
  min-width: 120px;
}
.receipt-for-pdf .receipt-amount-box {
  flex: 0 0 380px;
  min-width: 380px;
}
.receipt-for-pdf .receipt-amount-label {
  font-size: 14pt !important;
}
.receipt-for-pdf .receipt-amount-value {
  font-size: 19pt !important;
}
.receipt-for-pdf .receipt-main-title {
  font-size: 26pt !important;
}
.receipt-for-pdf .receipt-desc-row {
  font-size: 13pt !important;
}
.receipt-for-pdf .receipt-desc-label {
  font-size: 13pt !important;
}
.receipt-for-pdf .receipt-desc-value {
  font-size: 13pt !important;
}
.receipt-for-pdf .receipt-reversal-note {
  font-size: 12pt !important;
}
.receipt-for-pdf .receipt-separator-line-value {
  font-size: 13pt !important;
}
.receipt-for-pdf .receipt-footer-text {
  font-size: 16px !important;
}
.receipt-for-pdf .receipt-tagline {
  font-size: 15px !important;
}
.receipt-for-pdf .receipt-stamp-date-overlay {
  font-size: 15pt !important;
}
.receipt-for-pdf .receipt-stamp-text,
.receipt-for-pdf .receipt-stamp-address {
  font-size: 9pt !important;
}

@media only screen and (max-width: 768px) {
  .print-receipt-container {
    width: 100%;
    max-width: min(90vw, 600px);
    max-height: min(90vh, 600px);
  }
}

@media only screen and (max-width: 480px) {
  .print-receipt-container {
    width: 100%;
    padding: 1rem;
    border-radius: 0;
    max-height: 100vh;
  }
}
</style>

<style>
/* Unscoped: PDF capture font sizes must apply when .receipt-for-pdf is added at runtime */
.receipt-for-pdf.print-receipt-content { font-size: 13pt !important; }
.receipt-for-pdf .receipt-details-header { font-size: 16px !important; }
.receipt-for-pdf .receipt-details-body { font-size: 15px !important; }
.receipt-for-pdf .receipt-detail-label { font-size: 15px !important; }
.receipt-for-pdf .receipt-detail-value { font-size: 15px !important; }
.receipt-for-pdf .receipt-amount-label { font-size: 14pt !important; }
.receipt-for-pdf .receipt-amount-value { font-size: 19pt !important; }
.receipt-for-pdf .receipt-main-title { font-size: 26pt !important; }
.receipt-for-pdf .receipt-desc-row { font-size: 13pt !important; }
.receipt-for-pdf .receipt-desc-label { font-size: 13pt !important; }
.receipt-for-pdf .receipt-desc-value { font-size: 13pt !important; }
.receipt-for-pdf .receipt-footer-text { font-size: 16px !important; }
.receipt-for-pdf .receipt-tagline { font-size: 15px !important; }
.receipt-for-pdf .receipt-stamp-date-overlay { font-size: 15pt !important; }
</style>