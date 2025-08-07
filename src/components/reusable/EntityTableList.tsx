import React from 'react';

export interface EntityTableListColumn<T> {
  header: string;
  accessor: keyof T | string;
  className?: string;
  render?: (row: T) => React.ReactNode;
}

export interface EntityTableListProps<T> {
  data: T[];
  columns: EntityTableListColumn<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectedRowKeys?: Set<string>;
  onSelectRow?: (rowKey: string) => void;
  renderActions?: (row: T) => React.ReactNode;
  className?: string;
}

function EntityTableList<T>({
  data,
  columns,
  rowKey,
  onRowClick,
  selectedRowKeys,
  onSelectRow,
  renderActions,
  className = '',
}: EntityTableListProps<T>) {
  return (
    <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
      <thead>
        <tr>
          {columns.map((col, idx) => (
            <th key={idx} className={`px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.className || ''}`}>{col.header}</th>
          ))}
          {renderActions && <th className="px-4 py-2" />}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-100">
        {data.map((row, rowIdx) => {
          const key = rowKey(row);
          const isSelected = selectedRowKeys?.has(key);
          return (
            <tr
              key={key}
              className={`hover:bg-blue-50 cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((col, colIdx) => (
                <td key={colIdx} className={`px-4 py-2 whitespace-nowrap ${col.className || ''}`}>
                  {col.render ? col.render(row) : (row as any)[col.accessor]}
                </td>
              ))}
              {renderActions && <td className="px-4 py-2">{renderActions(row)}</td>}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default EntityTableList; 