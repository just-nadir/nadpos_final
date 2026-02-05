import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
    test('renders loading spinner', () => {
        render(<LoadingSpinner />);
        expect(screen.getByText(/Yuklanmoqda.../i)).toBeInTheDocument();
    });

    test('has correct styling classes', () => {
        const { container } = render(<LoadingSpinner />);
        expect(container.firstChild).toHaveClass('min-h-screen');
    });
});
