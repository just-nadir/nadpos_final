import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PaymentModal from '../PaymentModal';

describe('PaymentModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: jest.fn(),
        totalAmount: 100000,
        onPay: jest.fn(),
        selectedCustomer: null,
    };

    test('renders payment modal when open', () => {
        render(<PaymentModal {...defaultProps} />);
        expect(screen.getByText(/To'lov qilish/i)).toBeInTheDocument();
        expect(screen.getByText(/100,000/)).toBeInTheDocument();
    });

    test('does not render when closed', () => {
        render(<PaymentModal {...defaultProps} isOpen={false} />);
        expect(screen.queryByText(/To'lov qilish/i)).not.toBeInTheDocument();
    });

    test('toggles split payment mode', () => {
        render(<PaymentModal {...defaultProps} />);

        const splitButton = screen.getByText(/To'lovni bo'lish/i);
        fireEvent.click(splitButton);

        expect(screen.getByText(/Bo'lingan to'lovlar/i)).toBeInTheDocument();
    });

    test('adds split payment', () => {
        render(<PaymentModal {...defaultProps} />);

        // Enable split mode
        fireEvent.click(screen.getByText(/To'lovni bo'lish/i));

        // Add another split
        fireEvent.click(screen.getByText(/To'lov qismi qo'shish/i));

        const selects = screen.getAllByRole('combobox');
        expect(selects.length).toBeGreaterThanOrEqual(2);
    });

    test('shows payment methods', () => {
        render(<PaymentModal {...defaultProps} />);

        expect(screen.getByText(/Naqd/i)).toBeInTheDocument();
        expect(screen.getByText(/Karta/i)).toBeInTheDocument();
        expect(screen.getByText(/Click/i)).toBeInTheDocument();
    });

    test('calls onPay when payment confirmed', () => {
        const onPay = jest.fn();
        render(<PaymentModal {...defaultProps} onPay={onPay} />);

        const payButton = screen.getByText(/To'lash/i);
        fireEvent.click(payButton);

        expect(onPay).toHaveBeenCalled();
    });

    test('calls onClose when cancel clicked', () => {
        const onClose = jest.fn();
        render(<PaymentModal {...defaultProps} onClose={onClose} />);

        const cancelButton = screen.getByText(/Bekor qilish/i);
        fireEvent.click(cancelButton);

        expect(onClose).toHaveBeenCalled();
    });
});
