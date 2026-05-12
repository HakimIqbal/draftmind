import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Pill } from './pill';

describe('Pill', () => {
  it('renders status label', () => {
    render(<Pill status="in_review" />);
    expect(screen.getByText(/in review/i)).toBeInTheDocument();
  });

  it('renders custom label when provided', () => {
    render(<Pill status="draft" label="Custom Label" />);
    expect(screen.getByText('Custom Label')).toBeInTheDocument();
  });

  it('renders dot with correct color for each status', () => {
    const expectedColors: Record<string, string> = {
      draft: '#7A7468',
      in_review: '#C68B3D',
      reviewed: '#6B8E5A',
      refined: '#4A8C5C',
      final: '#E8743C',
      approved: '#6B8E5A',
    };

    for (const [status, color] of Object.entries(expectedColors)) {
      const { container } = render(
        <Pill status={status as Parameters<typeof Pill>[0]['status']} />,
      );
      const dot = container.querySelector('.rounded-full');
      expect(dot).toHaveStyle({ background: color });
    }
  });

  it('applies custom className', () => {
    const { container } = render(<Pill status="draft" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
