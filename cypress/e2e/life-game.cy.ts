describe('Life Game E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should load the main page', () => {
    cy.contains("Conway's Game of Life").should('be.visible')
    cy.contains('View on GitHub').should('be.visible')
  })

  it('should display the game grid', () => {
    cy.get('.map').should('be.visible')
    cy.get('.box').should('have.length', 100) // 10x10 grid
  })

  it('should toggle cell state on click', () => {
    // First box should be dead (white background)
    cy.get('.box').first().should('have.class', 'death')

    // Click to make it alive
    cy.get('.box').first().click()
    cy.get('.box').first().should('have.class', 'live')

    // Click again to make it dead
    cy.get('.box').first().click()
    cy.get('.box').first().should('have.class', 'death')
  })

  it('should change grid size', () => {
    // Change height to 5
    cy.get('input[label="Height"]').clear().type('5')
    cy.get('.box').should('have.length', 50) // 5x10 grid

    // Change width to 5
    cy.get('input[label="Width"]').clear().type('5')
    cy.get('.box').should('have.length', 25) // 5x5 grid
  })

  it('should start and stop simulation', () => {
    // Initially button should say "start"
    cy.contains('start').should('be.visible')

    // Click to start
    cy.contains('start').click()
    cy.contains('stop').should('be.visible')

    // Click to stop
    cy.contains('stop').click()
    cy.contains('start').should('be.visible')
  })

  it('should have working GitHub link', () => {
    cy.get('a[href*="github.com"]').should('have.attr', 'target', '_blank')
  })
})
