import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Alert from './Alert';

describe('Alert', () => {
  it('renders with default variant (info)', () => {
    render(<Alert>Test message</Alert>);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('renders success variant', () => {
    render(<Alert variant="success">Success message</Alert>);
    const alert = screen.getByText('Success message').parentElement?.parentElement;
    expect(alert).toHaveClass('bg-green-50');
  });

  it('renders warning variant', () => {
    render(<Alert variant="warning">Warning message</Alert>);
    const alert = screen.getByText('Warning message').parentElement?.parentElement;
    expect(alert).toHaveClass('bg-yellow-50');
  });

  it('renders error variant', () => {
    render(<Alert variant="error">Error message</Alert>);
    const alert = screen.getByText('Error message').parentElement?.parentElement;
    expect(alert).toHaveClass('bg-red-50');
  });
});