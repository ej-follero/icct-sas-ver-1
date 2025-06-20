import React from 'react';

interface PrintLayoutProps {
  title: string;
  data: any[];
  columns: {
    header: string;
    accessor: string;
  }[];
  totalItems: number;
}

export const PrintLayout = ({
  title,
  data,
  columns,
  totalItems,
}: PrintLayoutProps): (() => void) => {
  const printContent = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
          }
          .print-header {
            text-align: center;
            margin-bottom: 20px;
          }
          .print-header h1 {
            font-size: 24px;
            color: #000;
            margin-bottom: 8px;
          }
          .print-header p {
            font-size: 14px;
            color: #666;
          }
          .print-table {
            width: 100%;
            border-collapse: collapse;
          }
          .print-table th,
          .print-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
            font-size: 12px;
            text-align: center;
          }
          .print-table th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          .print-table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .print-footer {
            text-align: center;
            margin-top: 100px;
            font-size: 12px;
            color: #666;
          }
          @page {
            margin: 1cm;
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>${title}</h1>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        <table class="print-table">
          <thead>
            <tr>
              ${columns.map(col => `<th>${col.header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(item => `
              <tr>
                ${columns.map(col => `<td>${item[col.accessor]}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="print-footer">
          <p>Total ${title}: ${totalItems}</p>
          <p>Page 1 of 1</p>
        </div>
      </body>
    </html>
  `;

  return () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };
}; 