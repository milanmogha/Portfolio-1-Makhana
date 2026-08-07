import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import App from './App';

declare const test: (name: string, fn: () => void) => void;
declare function expect(actual: unknown): { toBeInTheDocument: () => void };

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
