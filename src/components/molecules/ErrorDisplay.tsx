import { Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

interface ErrorDisplayProps {
  message: string;
}

export const ErrorDisplay = ({ message }: ErrorDisplayProps) => {
  return (
    <Alert
      icon={<IconAlertCircle size="1rem" />}
      title="エラー"
      color="red"
      variant="filled"
    >
      {message}
    </Alert>
  );
};

export default ErrorDisplay;
