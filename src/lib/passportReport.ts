export function printPassportReport() {
  // Triggers the browser's print dialog. The page uses print CSS in index.css
  // to reformat into a multi-page PDF-friendly layout.
  window.print();
}