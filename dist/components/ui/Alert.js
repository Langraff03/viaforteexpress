import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
const Alert = ({ children, variant = 'info', className }) => {
    const variants = {
        info: {
            container: 'bg-blue-50 border-blue-200',
            icon: _jsx(Info, { className: "h-5 w-5 text-blue-400" }),
            text: 'text-blue-800',
        },
        success: {
            container: 'bg-green-50 border-green-200',
            icon: _jsx(CheckCircle, { className: "h-5 w-5 text-green-400" }),
            text: 'text-green-800',
        },
        warning: {
            container: 'bg-yellow-50 border-yellow-200',
            icon: _jsx(AlertCircle, { className: "h-5 w-5 text-yellow-400" }),
            text: 'text-yellow-800',
        },
        error: {
            container: 'bg-red-50 border-red-200',
            icon: _jsx(XCircle, { className: "h-5 w-5 text-red-400" }),
            text: 'text-red-800',
        },
    };
    return (_jsx("div", { className: twMerge('rounded-md border p-4', variants[variant].container, className), children: _jsxs("div", { className: "flex", children: [_jsx("div", { className: "flex-shrink-0", children: variants[variant].icon }), _jsx("div", { className: twMerge('ml-3', variants[variant].text), children: children })] }) }));
};
export default Alert;
