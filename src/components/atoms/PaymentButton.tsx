interface PaymentButtonProps {
  onClick: () => void;
  isProcessing: boolean;
}

export const PaymentButton = ({ onClick, isProcessing }: PaymentButtonProps) => (
  <button
    onClick={onClick}
    disabled={isProcessing}
    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {isProcessing ? '処理中...' : '支払いに進む'}
  </button>
);
