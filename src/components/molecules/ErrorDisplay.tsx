interface ErrorDisplayProps {
  title?: string;
  error: Error | unknown;
}

export const ErrorDisplay = ({ title = 'エラーが発生しました', error }: ErrorDisplayProps) => {
  const getErrorMessage = (error: Error | unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    return '予期せぬエラーが発生しました';
  };

  return (
    <div className="rounded-md bg-red-50 p-4 my-4">
      <div className="flex">
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{getErrorMessage(error)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
