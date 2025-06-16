export default function DetailsSkeleton({ colSpan = 7 }: { colSpan?: number }) {
  return (
    <tr className="bg-blue-50 animate-pulse">
      <td colSpan={colSpan} className="px-8 py-4 text-sm text-blue-900 border-t border-blue-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i}>
              <div className="font-semibold text-xs text-blue-200 mb-1 h-4 w-24 bg-blue-100 rounded" />
              <div className="h-5 w-full bg-blue-100 rounded" />
            </div>
          ))}
        </div>
        <div className="mt-8">
          <div className="font-semibold text-xs text-blue-200 mb-2 h-4 w-32 bg-blue-100 rounded" />
          <div className="h-8 w-full bg-blue-100 rounded" />
        </div>
      </td>
    </tr>
  );
} 