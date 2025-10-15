import { jsx as _jsx } from "react/jsx-runtime";
import { twMerge } from 'tailwind-merge';
export function Table({ children, className }) {
    return (_jsx("div", { className: "overflow-x-auto", children: _jsx("table", { className: twMerge('min-w-full divide-y divide-gray-200', className), children: children }) }));
}
export function TableHeader({ children, className }) {
    return (_jsx("thead", { className: twMerge('bg-gray-50', className), children: children }));
}
export function TableBody({ children, className }) {
    return (_jsx("tbody", { className: twMerge('bg-white divide-y divide-gray-200', className), children: children }));
}
export function TableRow({ children, className }) {
    return (_jsx("tr", { className: twMerge('hover:bg-gray-50', className), children: children }));
}
export function TableHead({ children, className }) {
    return (_jsx("th", { className: twMerge('px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider', className), children: children }));
}
export function TableCell({ children, className, colSpan }) {
    return (_jsx("td", { colSpan: colSpan, className: twMerge('px-6 py-4 whitespace-nowrap text-sm text-gray-900', className), children: children }));
}
