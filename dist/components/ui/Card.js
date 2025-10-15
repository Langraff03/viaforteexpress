import { jsx as _jsx } from "react/jsx-runtime";
import { twMerge } from 'tailwind-merge';
export function Card({ children, className }) {
    return (_jsx("div", { className: twMerge('bg-white rounded-lg shadow-sm', className), children: children }));
}
export function CardHeader({ children, className }) {
    return (_jsx("div", { className: twMerge('px-6 py-4 border-b border-gray-200', className), children: children }));
}
export function CardContent({ children, className }) {
    return (_jsx("div", { className: twMerge('px-6 py-4', className), children: children }));
}
export function CardFooter({ children, className }) {
    return (_jsx("div", { className: twMerge('px-6 py-4 border-t border-gray-200', className), children: children }));
}
