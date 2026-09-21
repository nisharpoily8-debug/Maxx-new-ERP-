/**
 * Export Utility for Maxpack ERP
 * Generates Excel-compatible CSV files with UTF-8 BOM for Arabic/English characters and currency symbols
 */

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][], metadata?: { title: string; dateRange?: string }) {
  // UTF-8 BOM for Excel to correctly open multilingual and formatted text
  const BOM = '\uFEFF';
  
  const lines: string[] = [];

  // Add Company & Report Metadata Headers
  if (metadata) {
    lines.push(`"MAXPACK PACKAGING LLC - UAE CORPORATE ERP"`);
    lines.push(`"TRN: 100234857600003 | Dubai Investment Park (DIP), UAE"`);
    lines.push(`"Report: ${metadata.title}"`);
    if (metadata.dateRange) {
      lines.push(`"Date Range: ${metadata.dateRange}"`);
    }
    lines.push(`"Generated On: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Dubai' })} (UAE Time)"`);
    lines.push(''); // blank line
  }

  // Header row
  lines.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','));

  // Data rows
  rows.forEach(row => {
    const formattedRow = row.map(cell => {
      if (cell === null || cell === undefined) return '""';
      const cellStr = String(cell).replace(/"/g, '""');
      return `"${cellStr}"`;
    });
    lines.push(formattedRow.join(','));
  });

  const csvContent = BOM + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
