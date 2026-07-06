export function DataTable({ columns, empty, rows }) {
  if (!rows.length) return empty

  return (
    <div className="scrollbar-hidden overflow-x-auto rounded-[1.5rem] border border-[var(--app-border)] shadow-[0_12px_35px_rgb(16_24_40/0.04)]">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-[var(--app-surface-muted)] text-xs uppercase tracking-wide text-[var(--app-text-muted)]">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3 font-black">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--app-border)] bg-[var(--app-surface)]">
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-4">
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
