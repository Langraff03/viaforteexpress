import { twMerge } from 'tailwind-merge';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={twMerge('bg-white rounded-lg shadow-sm', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={twMerge('px-6 py-4 border-b border-gray-200', className)}>
      {children}
    </div>
  );
}

export function CardContent({ children, className }: CardProps) {
  return (
    <div className={twMerge('px-6 py-4', className)}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className }: CardProps) {
  return (
    <div className={twMerge('px-6 py-4 border-t border-gray-200', className)}>
      {children}
    </div>
  );
}