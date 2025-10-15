import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';
const Input = forwardRef(({ className, label, error, leftIcon, rightIcon, ...props }, ref) => {
    return (_jsxs("div", { className: "w-full", children: [label && (_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: label })), _jsxs("div", { className: "relative", children: [leftIcon && (_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: leftIcon })), _jsx("input", { ref: ref, className: twMerge('block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm', leftIcon && 'pl-10', rightIcon && 'pr-10', error && 'border-red-300 focus:border-red-500 focus:ring-red-500', className), ...props }), rightIcon && (_jsx("div", { className: "absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none", children: rightIcon }))] }), error && _jsx("p", { className: "mt-1 text-sm text-red-600", children: error })] }));
});
Input.displayName = 'Input';
export default Input;
