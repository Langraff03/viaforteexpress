import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  className?: string;
}

const Alert = ({ children, variant = 'info', className }: AlertProps) => {
  const variants = {
    info: {
      container: 'bg-blue-50 border-blue-200',
      icon: <Info className="h-5 w-5 text-blue-400" />,
      text: 'text-blue-800',
    },
    success: {
      container: 'bg-green-50 border-green-200',
      icon: <CheckCircle className="h-5 w-5 text-green-400" />,
      text: 'text-green-800',
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200',
      icon: <AlertCircle className="h-5 w-5 text-yellow-400" />,
      text: 'text-yellow-800',
    },
    error: {
      container: 'bg-red-50 border-red-200',
      icon: <XCircle className="h-5 w-5 text-red-400" />,
      text: 'text-red-800',
    },
  };

  return (
    <div
      className={twMerge(
        'rounded-md border p-4',
        variants[variant].container,
        className
      )}
    >
      <div className="flex">
        <div className="flex-shrink-0">{variants[variant].icon}</div>
        <div className={twMerge('ml-3', variants[variant].text)}>{children}</div>
      </div>
    </div>
  );
};

export default Alert;