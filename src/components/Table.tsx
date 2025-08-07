import { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Column {
  header: string | ReactNode;
  accessor: string;
  className?: string;
}

interface TableProps {
  columns: Column[];
  renderRow: (item: any, columns: Column[]) => ReactNode;
  data: any[];
  ariaLabel?: string;
}

const Table = ({ columns, renderRow, data, ariaLabel }: TableProps) => {
  return (
    <ScrollArea className="w-full mt-4 rounded-md border border-gray-200">
      <table className="w-full border-collapse" role="table" aria-label={ariaLabel}>
        <thead className="bg-gray-50">
          <tr className="text-left text-gray-500 text-sm select-none">
            {columns.map((col) => (
              <th
                key={col.accessor}
                scope="col"
                className={`py-3 px-4 font-medium whitespace-nowrap ${col.className ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={item.id !== undefined && item.id !== null ? item.id : `row-${index}`}
              className="even:bg-gray-50 hover:bg-gray-100 cursor-default text-sm"
            >
              {renderRow(item, columns)}
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollArea>
  );
};

export default Table;