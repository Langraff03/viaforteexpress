import { twMerge } from 'tailwind-merge';

interface TableProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: number; // Adicionado colSpan aqui, pode ser movido para uma interface mais específica se necessário
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={twMerge('min-w-full divide-y divide-gray-200', className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className }: TableProps) {
  return (
    <thead className={twMerge('bg-gray-50', className)}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className }: TableProps) {
  return (
    <tbody className={twMerge('bg-white divide-y divide-gray-200', className)}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className }: TableProps) {
  return (
    <tr className={twMerge('hover:bg-gray-50', className)}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className }: TableProps) {
  return (
    <th
      className={twMerge(
        'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
        className
      )}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className, colSpan }: TableProps) {
  return (
    <td
      colSpan={colSpan} // Adicionado atributo colSpan
      className={twMerge(
        'px-6 py-4 whitespace-nowrap text-sm text-gray-900',
        className
      )}
    >
      {children}
    </td>
  );
}