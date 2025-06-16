export default function TableSkeleton() {
  return (
    <div className="w-full animate-pulse">
      <table className="min-w-full w-full bg-white border border-blue-100 rounded-xl shadow">
        <thead className="bg-blue-100">
          <tr>
            <th className="px-2 py-3 text-center"><div className="h-4 bg-blue-200 rounded w-6 mx-auto" /></th>
            <th className="px-4 py-3"><div className="h-4 bg-blue-200 rounded w-24" /></th>
            <th className="px-4 py-3"><div className="h-4 bg-blue-200 rounded w-32" /></th>
            <th className="px-4 py-3"><div className="h-4 bg-blue-200 rounded w-20" /></th>
            <th className="px-4 py-3"><div className="h-4 bg-blue-200 rounded w-20" /></th>
            <th className="px-4 py-3"><div className="h-4 bg-blue-200 rounded w-24" /></th>
            <th className="px-4 py-3 text-center"><div className="h-4 bg-blue-200 rounded w-16 mx-auto" /></th>
          </tr>
        </thead>
        <tbody>
          {[...Array(6)].map((_, i) => (
            <tr key={i}>
              <td className="px-2 py-3 text-center"><div className="h-4 bg-blue-100 rounded w-6 mx-auto" /></td>
              <td className="px-4 py-3"><div className="h-4 bg-blue-100 rounded w-24" /></td>
              <td className="px-4 py-3"><div className="h-4 bg-blue-100 rounded w-32" /></td>
              <td className="px-4 py-3"><div className="h-4 bg-blue-100 rounded w-20" /></td>
              <td className="px-4 py-3"><div className="h-4 bg-blue-100 rounded w-20" /></td>
              <td className="px-4 py-3"><div className="h-4 bg-blue-100 rounded w-24" /></td>
              <td className="px-4 py-3 text-center"><div className="h-4 bg-blue-100 rounded w-16 mx-auto" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 