<template>
  <Teleport to="body">
    <div v-if="open" class="print-receipt-overlay invoice-print-overlay" @click.self="$emit('close')">
      <div class="print-receipt-container">
        <div class="print-receipt-header">
          <h3>Print Invoice</h3>
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
        <div class="print-receipt-content invoice-print-content" ref="invoiceContentRef">
          <div class="receipt-watermark">
            <div class="receipt-watermark-content">
              <div class="receipt-watermark-brand">
                <img v-if="!logoLoadFailed" :src="samisLogoUrl" alt="" class="receipt-watermark-img" @error="onLogoError" />
                <template v-else>
                  <span class="receipt-watermark-s">SAMIS</span>
                  <span class="receipt-watermark-amis"> SYSTEMS</span>
                </template>
              </div>
              <div class="receipt-watermark-tagline">The Assurance Of Excellence</div>
            </div>
          </div>
          <div class="receipt-header-wrapper">
            <template v-if="!headerImageLoadFailed">
              <img :src="headerImageUrl" alt="SAMIS Header" class="receipt-header-image" @error="onHeaderImageError" />
            </template>
            <template v-else>
              <div class="receipt-letterhead">
                <div class="receipt-logo-left">
                  <img v-if="!logoLoadFailed" :src="samisLogoUrl" alt="SAMIS" class="receipt-logo-img" @error="onLogoError" />
                  <div v-else class="receipt-logo-placeholder">S</div>
                </div>
                <div class="receipt-company-info">
                  <div class="receipt-company-name">SAMIS SYSTEMS LIMITED</div>
                  <div class="receipt-company-address">Po box 3380-00500</div>
                  <div class="receipt-company-address">NAIROBI</div>
                  <div class="receipt-company-tel">Tel: 0711 082 779</div>
                  <div class="receipt-company-contact">
                    <span>Email:samissystems@gmail.com</span>
                    <span class="receipt-contact-sep">|</span>
                    <span>Website: www.samis.co.ke</span>
                  </div>
                </div>
              </div>
              <div class="receipt-letterhead-border"></div>
            </template>
          </div>

          <h1 class="invoice-main-title">INVOICE</h1>

          <div class="invoice-top-grid">
            <div class="receipt-details-box invoice-details-box">
              <div class="receipt-details-header">CUSTOMER DETAILS</div>
              <div class="receipt-detail-row">
                <span class="receipt-value">{{ invoice?.schoolName || 'N/A' }}</span>
              </div>
              <div class="receipt-detail-row">
                <span class="receipt-value">{{ invoice?.schoolCode || 'N/A' }}</span>
              </div>
              <div class="receipt-detail-row">
                <span class="receipt-value">{{ invoice?.schoolEmail || 'N/A' }}</span>
              </div>
              <div class="receipt-detail-row">
                <span class="receipt-value">Phone: {{ invoice?.schoolPhone || 'N/A' }}</span>
              </div>
            </div>
            <div class="receipt-details-box invoice-details-box">
              <div class="receipt-details-header">INVOICE DETAILS</div>
              <div class="receipt-detail-row">
                <span class="receipt-label">Invoice #:</span>
                <span class="receipt-value">{{ invoice?.invoiceNumber || invoice?.invoiceNo || 'N/A' }}</span>
              </div>
              <div class="receipt-detail-row">
                <span class="receipt-label">Invoice Date:</span>
                <span class="receipt-value">{{ invoice?.invoiceDate || 'N/A' }}</span>
              </div>
              <div class="receipt-detail-row">
                <span class="receipt-label">Due Date:</span>
                <span class="receipt-value">{{ invoice?.dueDate || 'N/A' }}</span>
              </div>
            </div>
          </div>

          <div class="invoice-desc-section invoice-desc-blue-surround">
            <table class="invoice-desc-table">
              <thead>
                <tr>
                  <th class="invoice-desc-th">DESCRIPTION</th>
                  <th class="invoice-desc-th">QTY</th>
                  <th class="invoice-desc-th">PRICE</th>
                  <th class="invoice-desc-th">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, i) in invoiceLineItems" :key="i">
                  <td class="invoice-desc-cell-desc">
                    <div class="invoice-desc-cell-inner">
                      <div class="invoice-desc-watermark">
                        <img v-if="!logoLoadFailed" :src="samisLogoUrl" alt="" class="invoice-desc-watermark-img" @error="onLogoError" />
                        <template v-else>
                          <span class="invoice-desc-watermark-s">SAMIS</span>
                          <span class="invoice-desc-watermark-sys">SYSTEMS</span>
                        </template>
                      </div>
                      <div class="invoice-desc-list">
                        <div class="invoice-desc-list-item">Manage students and school details</div>
                        <div class="invoice-desc-list-item">Manage Fee structure, Charges</div>
                        <div class="invoice-desc-list-item">Manage fees receipts, other receipts</div>
                        <div class="invoice-desc-list-item">Manage Bills/Invoices, LPO, LSO</div>
                        <div class="invoice-desc-list-item">Payment Voucher generation</div>
                        <div class="invoice-desc-list-item">Financial Statements Generation</div>
                        <div class="invoice-desc-list-item">Trial Balance, Fee statements</div>
                        <div class="invoice-desc-list-item">Creditors, Debtors</div>
                        <div class="invoice-desc-list-item">Cashbooks e.t.c.</div>
                      </div>
                    </div>
                  </td>
                  <td class="invoice-desc-cell-num">{{ item.qty }}</td>
                  <td class="invoice-desc-cell-num">{{ formatNumber(item.price) }}</td>
                  <td class="invoice-desc-cell-num">{{ formatNumber(item.amount) }}</td>
                </tr>
                <tr v-if="!invoiceLineItems.length">
                  <td class="invoice-desc-cell-desc">
                    <div class="invoice-desc-cell-inner">
                      <div class="invoice-desc-watermark">
                        <img v-if="!logoLoadFailed" :src="samisLogoUrl" alt="" class="invoice-desc-watermark-img" @error="onLogoError" />
                        <template v-else>
                          <span class="invoice-desc-watermark-s">SAMIS</span>
                          <span class="invoice-desc-watermark-sys">SYSTEMS</span>
                        </template>
                      </div>
                      <div class="invoice-desc-list">
                        <div class="invoice-desc-list-item">Manage students and school details</div>
                        <div class="invoice-desc-list-item">Manage Fee structure, Charges</div>
                        <div class="invoice-desc-list-item">Manage fees receipts, other receipts</div>
                        <div class="invoice-desc-list-item">Manage Bills/Invoices, LPO, LSO</div>
                        <div class="invoice-desc-list-item">Payment Voucher generation</div>
                        <div class="invoice-desc-list-item">Financial Statements Generation</div>
                        <div class="invoice-desc-list-item">Trial Balance, Fee statements</div>
                        <div class="invoice-desc-list-item">Creditors, Debtors</div>
                        <div class="invoice-desc-list-item">Cashbooks e.t.c.</div>
                      </div>
                    </div>
                  </td>
                  <td class="invoice-desc-cell-num">1</td>
                  <td class="invoice-desc-cell-num">{{ formatNumber(invoice?.amount || 0) }}</td>
                  <td class="invoice-desc-cell-num">{{ formatNumber(invoice?.amount || 0) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" class="invoice-desc-foot-wrap">
                    <div class="invoice-desc-foot-row-flex">
                      <div class="invoice-payment-section receipt-details-box invoice-payment-inline">
                        <div class="receipt-details-header">Payment Methods we accept:-</div>
                        <div class="receipt-detail-row">
                          <span class="receipt-label">BANK:</span>
                          <span class="receipt-value">EQUITY BANK</span>
                        </div>
                        <div class="receipt-detail-row">
                          <span class="receipt-label">BRANCH:</span>
                          <span class="receipt-value">MOI AVENUE</span>
                        </div>
                        <div class="receipt-detail-row">
                          <span class="receipt-label">NAME:</span>
                          <span class="receipt-value">SAMIS SYSTEMS LIMITED</span>
                        </div>
                        <div class="receipt-detail-row">
                          <span class="receipt-label">ACC NO:</span>
                          <span class="receipt-value">0470285749983</span>
                        </div>
                        <div class="receipt-detail-row">
                          <span class="receipt-label">SWIFT CODE:</span>
                          <span class="receipt-value">EQBLKENA</span>
                        </div>
                        <div class="receipt-detail-row invoice-payment-or-row">
                          <span class="receipt-value">OR</span>
                        </div>
                        <div class="receipt-detail-row">
                          <span class="receipt-label">MPESA PAYBILL NO:</span>
                          <span class="receipt-value">4063569</span>
                        </div>
                        <div class="receipt-detail-row">
                          <span class="receipt-label">ACCOUNT NO:</span>
                          <span class="receipt-value">{{ invoice?.schoolCode || 'N/A' }}</span>
                        </div>
                      </div>
                      <div class="invoice-desc-summary-box">
                        <div class="invoice-desc-foot-row">
                          <span class="invoice-desc-foot-label">Sub Total:</span>
                          <span class="invoice-desc-foot-value">{{ formatNumber(invoiceSubTotal) }}</span>
                        </div>
                        <div class="invoice-desc-foot-row">
                          <span class="invoice-desc-foot-label">VAT (16%):</span>
                          <span class="invoice-desc-foot-value">{{ formatNumber(invoiceVat) }}</span>
                        </div>
                        <div class="invoice-desc-foot-row">
                          <span class="invoice-desc-foot-label">Total Amount:</span>
                          <span class="invoice-desc-foot-value">{{ formatNumber(invoice?.amount || 0) }}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div class="receipt-footer invoice-footer-terms-row">
            <div class="invoice-terms-section receipt-details-box invoice-terms-inline">
              <div class="receipt-details-header">Terms and Conditions</div>
              <div class="receipt-detail-row">
                <span class="receipt-value">SAMIS will not be liable to payments made through other payment methods not listed on this invoice.</span>
              </div>
            </div>
            <div class="receipt-stamp">
              <div class="receipt-stamp-inner">
                <img v-if="!stampImageLoadFailed" :src="stampImageUrl" alt="Stamp" class="receipt-stamp-img" @error="onStampImageError" />
                <template v-else>
                  <div class="receipt-stamp-ring">
                    <span class="receipt-stamp-text">SAMIS SYSTEMS LIMITED</span>
                    <span class="receipt-stamp-sep">✦</span>
                    <span class="receipt-stamp-address">P. O. Box 3380-00500. NAIROBI</span>
                  </div>
                  <div class="receipt-stamp-date">{{ formatInvoiceFooterDate(invoice?.invoiceDate) }}</div>
                </template>
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
  name: 'PrintInvoiceOverlay',
  props: {
    open: { type: Boolean, default: false },
    invoice: { type: Object, default: null },
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
  computed: {
    invoiceLineItems() {
      const inv = this.invoice;
      if (!inv || !inv.items || !inv.items.length) return [];
      return inv.items.map((it) => {
        const qty = parseFloat(it.quantity || it.qty || 1) || 1;
        const price = parseFloat(it.price || it.unitPrice || 0) || 0;
        const amount = parseFloat(it.amount || it.total || 0) || qty * price;
        return { qty, price, amount };
      });
    },
    invoiceSubTotal() {
      const items = this.invoiceLineItems;
      if (items.length) return items.reduce((sum, it) => sum + it.amount, 0);
      return parseFloat(this.invoice?.amount || 0);
    },
    invoiceVat() {
      return 0;
    },
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
    onLogoError() {
      this.logoLoadFailed = true;
    },
    onHeaderImageError() {
      this.headerImageLoadFailed = true;
    },
    onStampImageError() {
      this.stampImageLoadFailed = true;
    },
    formatInvoiceFooterDate(dateStr) {
      const format = (d) => {
        const day = String(d.getDate()).padStart(2, '0');
        const month = d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
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
      const el = this.$refs.invoiceContentRef;
      if (!el) return null;
      const overlay = el.closest('.print-receipt-overlay');
      const container = el.parentElement;
      const a4WidthPx = Math.round((210 * 96) / 25.4);
      const captureWidth = a4WidthPx;
      const oldOverflowOverlay = overlay ? overlay.style.overflow : '';
      const oldMaxWidth = container.style.maxWidth;
      const oldOverflow = container.style.overflow;
      const oldWidth = container.style.width;
      const oldMinWidthEl = el.style.minWidth;
      const oldWidthEl = el.style.width;
      const oldMaxWidthEl = el.style.maxWidth;
      if (overlay) overlay.style.overflow = 'visible';
      container.style.setProperty('max-width', 'none', 'important');
      container.style.setProperty('width', captureWidth + 'px', 'important');
      container.style.overflow = 'visible';
      el.style.setProperty('min-width', captureWidth + 'px', 'important');
      el.style.setProperty('width', captureWidth + 'px', 'important');
      el.style.setProperty('max-width', captureWidth + 'px', 'important');
      await this.$nextTick();
      await new Promise((r) => setTimeout(r, 350));
      el.offsetHeight;
      const captureW = Math.max(captureWidth, el.scrollWidth);
      const captureH = el.scrollHeight;
      let canvas;
      try {
        canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: captureW,
          windowHeight: captureH,
        });
      } finally {
        if (overlay) overlay.style.overflow = oldOverflowOverlay;
        container.style.maxWidth = oldMaxWidth;
        container.style.overflow = oldOverflow;
        container.style.width = oldWidth;
        el.style.minWidth = oldMinWidthEl;
        el.style.width = oldWidthEl;
        el.style.maxWidth = oldMaxWidthEl;
      }
      const imgW = Math.max(1, canvas.width);
      const imgH = Math.max(1, canvas.height);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const pxToMm = 25.4 / 96;
      const wMm = (imgW * pxToMm) / 2;
      const hMm = (imgH * pxToMm) / 2;
      const scaleW = wMm > 0 ? pdfW / wMm : 1;
      const scaleH = hMm > 0 ? pdfH / hMm : 1;
      const scale = Math.min(scaleW, scaleH, 1);
      const w = wMm * scale;
      const h = hMm * scale;
      const x = (pdfW - w) / 2;
      const y = (pdfH - h) / 2;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      pdf.addImage(dataUrl, 'JPEG', x, y, w, h);
      return pdf.output('blob');
    },
    async downloadPdf() {
      if (!this.$refs.invoiceContentRef) return;
      this.pdfLoading = true;
      try {
        const blob = await this.getPdfBlob();
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Invoice-${this.invoice?.invoiceNumber || this.invoice?.invoiceNo || 'invoice'}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('PDF generation failed:', err);
      } finally {
        this.pdfLoading = false;
      }
    },
    async executePrint() {
      if (!this.$refs.invoiceContentRef) return;
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

.invoice-print-overlay {
  overflow-x: auto;
  overflow-y: auto;
  padding: 1rem;
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

.invoice-print-overlay .print-receipt-container {
  width: 794px !important;
  max-width: 794px !important;
  overflow-x: auto;
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

.pdf-btn:disabled,
.print-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.pdf-loading {
  font-size: 1rem;
}

.invoice-print-content {
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.55);
  color: #000;
  font-family: 'Times New Roman', Times, serif;
  box-sizing: border-box;
  max-width: 100%;
  overflow: hidden;
  font-size: 10pt;
  position: relative;
}

.invoice-print-content .receipt-watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-8deg);
  width: 80%;
  height: 60%;
  min-width: 280px;
  min-height: 200px;
  max-width: 420px;
  max-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 0;
}

.invoice-print-content .receipt-watermark-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  height: 100%;
}

.invoice-print-content .receipt-watermark-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
}

.invoice-print-content .receipt-watermark-img {
  width: 180px;
  height: 180px;
  object-fit: contain;
  opacity: 0.58;
  filter: brightness(1.05);
}

.invoice-print-content .receipt-watermark-s,
.invoice-print-content .receipt-watermark-amis {
  font-size: 4rem;
  font-weight: bold;
  color: rgba(70, 130, 200, 0.45);
  font-family: 'Times New Roman', Times, serif;
  line-height: 1;
}

.invoice-print-content .receipt-watermark-tagline {
  font-size: 1.2rem;
  font-style: italic;
  color: rgba(70, 130, 200, 0.42);
  font-family: Georgia, 'Times New Roman', serif;
  margin-top: 8px;
}

.invoice-print-content .receipt-header-wrapper {
  position: relative;
  margin-bottom: 12px;
  border: 1px solid #000;
  border-bottom: none;
  padding: 0 16px;
  overflow: hidden;
}

.invoice-print-content .receipt-header-image {
  width: 100%;
  height: auto;
  max-height: 150px;
  object-fit: contain;
  object-position: top center;
  display: block;
}

.invoice-print-content .receipt-letterhead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0 12px 0;
  position: relative;
  z-index: 2;
}

.invoice-print-content .receipt-logo-left {
  flex-shrink: 0;
}

.invoice-print-content .receipt-logo-img {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: contain;
}

.invoice-print-content .receipt-logo-placeholder {
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

.invoice-print-content .receipt-company-info {
  text-align: center;
  flex: 1;
  padding: 0 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.invoice-print-content .receipt-company-name,
.invoice-print-content .receipt-company-address,
.invoice-print-content .receipt-company-tel,
.invoice-print-content .receipt-company-contact {
  font-family: 'Times New Roman', Times, serif;
  font-size: 18pt;
  font-weight: bold;
  margin: 0;
  line-height: 1.2;
  color: #000;
}

.invoice-print-content .receipt-contact-sep {
  margin: 0 6px;
  color: #999;
}

.invoice-print-content .receipt-letterhead-border {
  height: 8px;
  background: #000;
  margin: 0 -16px 0 -16px;
}

.invoice-print-content .receipt-details-box {
  flex: 1;
  border: 1px solid #000;
}

.invoice-print-content .receipt-details-header {
  background: #4a90d9;
  color: #fff;
  padding: 6px 12px;
  font-weight: bold;
  font-size: 11pt;
  font-family: 'Times New Roman', Times, serif;
  border: none;
  width: 100%;
  box-sizing: border-box;
}

.invoice-print-content .receipt-detail-row {
  display: flex;
  padding: 6px 12px;
  border-top: 1px solid #ddd;
  font-size: 10pt;
  font-family: 'Times New Roman', Times, serif;
  color: #000;
  background: #fff;
}

.invoice-print-content .invoice-payment-section .receipt-detail-row {
  border-top: none;
  padding: 2px 12px;
}

.invoice-print-content .receipt-detail-row .receipt-label {
  min-width: 140px;
  font-weight: bold;
  color: #000;
  flex-shrink: 0;
}

.invoice-print-content .receipt-detail-row .receipt-value {
  flex: 1;
  word-break: break-word;
  font-weight: normal;
  color: #000;
}

.invoice-print-content .receipt-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 16px;
  padding-top: 10px;
  border-top: 2px solid #000;
  position: relative;
  z-index: 1;
  font-family: 'Times New Roman', Times, serif;
}

.invoice-print-content .receipt-footer.invoice-footer-terms-row {
  align-items: stretch;
  gap: 12px;
}

.invoice-print-content .invoice-terms-inline {
  flex: 1;
  min-width: 0;
  margin-bottom: 0;
}

.invoice-print-content .receipt-stamp {
  text-align: right;
  flex-shrink: 0;
}

.invoice-print-content .receipt-stamp-inner {
  width: 130px;
  height: 130px;
  border: 2px solid #1a5fb4;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 0 0 auto;
  padding: 8px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-sizing: border-box;
}

.invoice-print-content .receipt-stamp-ring {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 6pt;
  line-height: 1.15;
  text-align: center;
  text-transform: uppercase;
  color: #fff;
  font-weight: bold;
}

.invoice-print-content .receipt-stamp-sep {
  font-size: 6pt;
  margin: 2px 0;
  color: #fff;
}

.invoice-print-content .receipt-stamp-date {
  font-size: 12pt;
  font-weight: bold;
  color: #dc2626;
  text-transform: uppercase;
  text-align: center;
  line-height: 1.2;
  margin-top: 4px;
}

.invoice-print-content .receipt-stamp-text {
  font-size: 6pt;
  font-weight: bold;
  color: #fff;
}

.invoice-print-content .receipt-stamp-address {
  font-size: 7pt;
  color: #fff;
}

.invoice-print-content .receipt-stamp-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.invoice-main-title {
  font-size: 20pt;
  font-weight: bold;
  text-align: left;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  z-index: 1;
}

.invoice-top-grid {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}

.invoice-details-box {
  flex: 1;
  border: 1px solid #000;
}

.invoice-desc-section.invoice-desc-blue-surround {
  margin-bottom: 12px;
  border: 2px solid #4a90d9;
  position: relative;
  z-index: 1;
  overflow: visible;
  background: #fff;
}

.invoice-desc-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10pt;
  font-family: 'Times New Roman', Times, serif;
}

.invoice-desc-table .invoice-desc-th {
  background: #4a90d9;
  color: #fff;
  padding: 6px 10px;
  font-weight: bold;
  text-transform: uppercase;
  text-align: left;
  border: 1px solid #000;
}

.invoice-desc-cell-desc {
  background: #fff;
  border: 1px solid #000;
  padding: 0;
  vertical-align: top;
  width: 55%;
  overflow: visible;
}

.invoice-desc-cell-inner {
  position: relative;
  min-height: 140px;
  padding: 10px 12px;
  overflow: visible;
}

.invoice-desc-watermark {
  position: absolute;
  top: 50%;
  left: 100%;
  transform: translate(-50%, -50%) rotate(-8deg);
  width: 90%;
  max-width: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 0;
}

.invoice-desc-watermark-img {
  width: 200px;
  height: 200px;
  object-fit: contain;
  opacity: 0.5;
  filter: brightness(1.05);
}

.invoice-desc-watermark-s,
.invoice-desc-watermark-sys {
  font-size: 3.5rem;
  font-weight: bold;
  color: rgba(70, 130, 200, 0.4);
  font-family: 'Times New Roman', Times, serif;
  line-height: 1;
}

.invoice-desc-list {
  position: relative;
  z-index: 1;
  font-size: 9pt;
  line-height: 1.5;
  color: #000;
}

.invoice-desc-list-item {
  padding: 1px 0;
  text-indent: 0;
}

.invoice-desc-cell-num {
  background: #fff;
  border: 1px solid #000;
  padding: 6px 10px;
  text-align: left;
  color: #000;
}

.invoice-desc-foot-wrap {
  padding: 0;
  border: none;
  background: transparent;
  vertical-align: bottom;
}

.invoice-desc-foot-row-flex {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
  flex-wrap: wrap;
}

.invoice-payment-inline {
  flex: 0 1 auto;
  max-width: 420px;
  min-width: 300px;
  margin-bottom: 0;
}

.invoice-desc-summary-box {
  flex: 0 0 auto;
  margin-left: auto;
  width: max-content;
  max-width: 260px;
  min-width: 200px;
  background: #6c757d;
  border: 1px solid #000;
  font-weight: bold;
  color: #fff;
  font-size: 10pt;
}

.invoice-desc-summary-box .invoice-desc-foot-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  border-bottom: 1px solid #000;
}

.invoice-desc-summary-box .invoice-desc-foot-row:last-child {
  border-bottom: none;
}

.invoice-desc-summary-box .invoice-desc-foot-label {
  text-align: right;
  padding-right: 12px;
  flex: 1;
}

.invoice-desc-summary-box .invoice-desc-foot-value {
  text-align: right;
  padding-left: 8px;
  min-width: 80px;
}

.invoice-payment-section.receipt-details-box {
  margin-bottom: 0;
  border: none;
  position: relative;
  z-index: 1;
  width: 100%;
  box-sizing: border-box;
  background: #fff;
  font-family: 'Times New Roman', Times, serif;
}

.invoice-terms-section.receipt-details-box {
  margin-bottom: 12px;
  border: none;
  position: relative;
  z-index: 1;
  width: 100%;
  box-sizing: border-box;
  background: #fff;
  font-family: 'Times New Roman', Times, serif;
}

@media only screen and (max-width: 768px) {
  .print-receipt-container {
    width: 100%;
    max-width: min(90vw, 600px);
    max-height: min(90vh, 600px);
  }
  .invoice-print-overlay .print-receipt-container {
    width: 794px !important;
    max-width: 794px !important;
  }
}

@media only screen and (max-width: 480px) {
  .print-receipt-container {
    width: 100%;
    padding: 1rem;
    border-radius: 0;
    max-height: 100vh;
  }
  .invoice-print-overlay .print-receipt-container {
    width: 794px !important;
    max-width: 794px !important;
  }
}
</style>
