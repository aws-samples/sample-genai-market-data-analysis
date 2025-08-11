import { render, screen } from '@testing-library/react'
import Home from './page'

describe('Home', () => {
  it('renders the main heading', () => {
    render(<Home />)
    
    const heading = screen.getByRole('heading', {
      name: /next\.js chat app/i,
    })

    expect(heading).toBeInTheDocument()
  })
})