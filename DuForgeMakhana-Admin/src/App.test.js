import { render, screen } from '@testing-library/react';
import App from './App';
import { MemoryRouter } from 'react-router-dom';

test('renders customer home page by default', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );
  // assuming Home page has a heading <h1>Home</h1>
  expect(screen.getByText(/home/i)).toBeInTheDocument();
});
