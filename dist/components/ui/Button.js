import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';
const Button = forwardRef(({ className, variant = 'primary', size = 'md', isLoading = false, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    const variants = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
        secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500',
        outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-indigo-500',
        ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };
    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    };
    const classes = twMerge(baseStyles, variants[variant], sizes[size], isLoading && 'opacity-70 cursor-not-allowed', disabled && 'opacity-50 cursor-not-allowed', className);
    return (_jsx("button", { ref: ref, className: classes, disabled: isLoading || disabled, ...props, children: isLoading ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }), "Carregando..."] })) : (_jsxs(_Fragment, { children: [leftIcon && _jsx("span", { className: "mr-2", children: leftIcon }), children, rightIcon && _jsx("span", { className: "ml-2", children: rightIcon })] })) }));
});
Button.displayName = 'Button';
export default Button;
