import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/ui/Dialog.tsx
import { Dialog as HDialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
export function Dialog({ open, onOpenChange, children }) {
    return (_jsx(Transition, { appear: true, show: open, as: Fragment, children: _jsxs(HDialog, { as: "div", className: "relative z-50", onClose: onOpenChange, children: [_jsx(Transition.Child, { as: Fragment, enter: "ease-out duration-300", enterFrom: "opacity-0", enterTo: "opacity-100", leave: "ease-in duration-200", leaveFrom: "opacity-100", leaveTo: "opacity-0", children: _jsx("div", { className: "fixed inset-0 bg-black bg-opacity-25" }) }), _jsx("div", { className: "fixed inset-0 overflow-y-auto", children: _jsx("div", { className: "flex min-h-full items-center justify-center p-4 text-center", children: _jsx(Transition.Child, { as: Fragment, enter: "ease-out duration-300", enterFrom: "opacity-0 scale-95", enterTo: "opacity-100 scale-100", leave: "ease-in duration-200", leaveFrom: "opacity-100 scale-100", leaveTo: "opacity-0 scale-95", children: _jsx(HDialog.Panel, { className: "w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all", children: children }) }) }) })] }) }));
}
export function DialogContent({ children }) {
    return _jsx("div", { children: children });
}
export function DialogHeader({ children }) {
    return _jsx("div", { className: "mb-4", children: children });
}
export function DialogTitle({ children }) {
    return _jsx(HDialog.Title, { className: "text-lg font-medium leading-6 text-gray-900", children: children });
}
export function DialogFooter({ children }) {
    return _jsx("div", { className: "mt-4 flex justify-end", children: children });
}
