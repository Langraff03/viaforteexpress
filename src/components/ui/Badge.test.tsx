import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from './Badge';

describe('Badge', () => {
  it('renders with default variant', () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText('Default');
    expect(badge).toHaveClass('bg-gray-100');
  });

  it('renders success variant', () => {
    render(<Badge variant="success">Success</Badge>);
    const badge = screen.getByText('Success');
    expect(badge).toHaveClass('bg-green-100');
  });

  it('renders warning variant', () => {
    render(<Badge variant="warning">Warning</Badge>);
    const badge = screen.getByText('Warning');
    expect(badge).toHaveClass('bg-yellow-100');
  });

  it('renders with custom className', () => {
    render(<Badge className="custom-class">Custom</Badge>);
    const badge = screen.getByText('Custom');
    expect(badge).toHaveClass('custom-class');
  });
});