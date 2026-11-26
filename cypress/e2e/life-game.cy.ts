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
    // Vuetify doesn't put the label on the <input>, so find it via its field's label text
    // Change height to 5 (the grid resizes on the input's change event, fired on blur)
    cy.contains('.v-text-field', 'Height').find('input').as('height')
    cy.get('@height').clear()
    cy.get('@height').type('5')
    cy.get('@height').blur()
    cy.get('.box').should('have.length', 50) // 5x10 grid

    // Change width to 5
    cy.contains('.v-text-field', 'Width').find('input').as('width')
    cy.get('@width').clear()
    cy.get('@width').type('5')
    cy.get('@width').blur()
    cy.get('.box').should('have.length', 25) // 5x5 grid
  })

  it('should keep the grid when a size input is left blank', () => {
    cy.contains('.v-text-field', 'Width').find('input').as('width')
    cy.get('@width').clear()
    cy.get('@width').blur()
    cy.get('@width').should('have.value', '10')
    cy.get('.box').should('have.length', 100)
    cy.get('.box.live').should('have.length', 5)
  })

  it('should start and stop simulation', () => {
    // Initially button should say "Start"
    cy.contains('button', 'Start').should('be.visible')

    // Click to start
    cy.contains('button', 'Start').click()
    cy.contains('button', 'Stop').should('be.visible')

    // Click to stop
    cy.contains('button', 'Stop').click()
    cy.contains('button', 'Start').should('be.visible')
  })

  it('should increase the generation while running', () => {
    cy.contains('Generation: 0').should('be.visible')
    cy.contains('button', 'Start').click()
    // The first generation, like every later one, comes after one interval
    // (1.0s by default), not at once
    cy.contains('Generation: 0').should('be.visible')
    cy.contains('Generation: 1').should('be.visible')
    cy.contains('Generation: 2').should('be.visible')
    cy.contains('button', 'Stop').click()
  })

  it('should fill the grid randomly with Random', () => {
    // Make Math.random deterministic: < 0.5 means alive, so every cell comes alive
    cy.window().then((win) => {
      cy.stub(win.Math, 'random').returns(0.1)
    })
    cy.contains('button', 'Step').click()
    cy.contains('Generation: 1').should('be.visible')

    cy.contains('button', 'Random').click()
    cy.get('.box.live').should('have.length', 100)
    cy.contains('Generation: 0').should('be.visible')
  })

  it('should clear the grid and reset the generation with Clear', () => {
    cy.contains('button', 'Start').click()
    cy.contains('Generation: 1').should('be.visible')

    cy.contains('button', 'Clear').click()
    cy.get('.box.live').should('have.length', 0)
    cy.get('.box.death').should('have.length', 100)
    cy.contains('Generation: 0').should('be.visible')
    // Clear also stops the simulation
    cy.contains('button', 'Start').should('be.visible')
  })

  it('should change the generation interval with the slider', () => {
    cy.contains('Generation Interval: 1.0s').should('be.visible')
    cy.get('.v-slider-thumb').as('thumb')
    cy.get('@thumb').focus()
    cy.get('@thumb').type('{leftArrow}')
    cy.contains('Generation Interval: 0.9s').should('be.visible')
    cy.get('@thumb').type('{home}')
    cy.contains('Generation Interval: 0.1s').should('be.visible')
    cy.get('@thumb').should('have.attr', 'aria-valuenow', '100')
  })

  // Pointer events are triggered on the cells themselves, so Cypress gives them
  // the clientX/clientY of each cell's center and the app finds the cell with
  // document.elementFromPoint (the events bubble up to .map, and pointerup on to
  // window)
  const cell = (i: number, j: number) =>
    cy.get(`.box[data-i="${i}"][data-j="${j}"]`)
  const pointer = {
    eventConstructor: 'PointerEvent',
    button: 0,
    pointerId: 1,
    isPrimary: true,
  }

  it('should paint the cells a drag passes over', () => {
    cy.contains('button', 'Clear').click()

    // Skip (0, 1) and (0, 2) in pointermove: the cells in between are filled in too
    cell(0, 0).trigger('pointerdown', pointer)
    cell(0, 3).trigger('pointermove', pointer)
    cell(1, 3).trigger('pointermove', pointer)
    cell(1, 3).trigger('pointerup', pointer)
    cy.get('.box.live').should('have.length', 5)
    for (const [i, j] of [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 3],
    ]) {
      cell(i, j).should('have.class', 'live')
    }

    // Moving after pointerup paints nothing
    cell(5, 5).trigger('pointermove', pointer)
    cell(5, 5).should('have.class', 'death')

    // Starting on a live cell erases the cells passed over
    cell(0, 0).trigger('pointerdown', pointer)
    cell(0, 3).trigger('pointermove', pointer)
    cell(0, 3).trigger('pointerup', pointer)
    cy.get('.box.live').should('have.length', 1)
    cell(1, 3).should('have.class', 'live')
  })

  it('should advance one generation with Step', () => {
    cy.contains('button', 'Step').click()
    cy.contains('Generation: 1').should('be.visible')
    // The initial glider moves: (1, 2) dies and (4, 2) is born
    cy.get('.box.live').should('have.length', 5)
    cell(1, 2).should('have.class', 'death')
    cell(4, 2).should('have.class', 'live')
    cy.contains('button', 'Start').should('be.visible')
  })

  it('should stop the simulation with Step while running', () => {
    cy.contains('button', 'Start').click()
    cy.contains('Generation: 1').should('be.visible')
    cy.contains('button', 'Step').click()
    cy.contains('button', 'Start').should('be.visible')
    cy.contains('Generation: 2').should('be.visible')
    // No more generations once stopped (the default interval is 1.0s)
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1500)
    cy.contains('Generation: 2').should('be.visible')
  })

  it('should say when the board is no longer changing', () => {
    cy.contains('button', 'Clear').click()
    cy.get('[role="status"]').should(
      'not.contain',
      'The board is no longer changing.',
    )

    // Start on a board that wouldn't change stops at once
    cy.contains('button', 'Start').click()
    cy.get('[role="status"]').should(
      'contain',
      'The board is no longer changing.',
    )
    cy.contains('button', 'Start').should('be.visible')
    cy.contains('Generation: 0').should('be.visible')

    // Editing the board hides the message
    cell(0, 0).trigger('pointerdown', pointer)
    cell(0, 0).trigger('pointerup', pointer)
    cy.get('[role="status"]').should(
      'not.contain',
      'The board is no longer changing.',
    )

    // Step on a single cell: it dies (the board changes), then nothing changes
    cy.contains('button', 'Step').click()
    cy.contains('Generation: 1').should('be.visible')
    cy.get('[role="status"]').should(
      'not.contain',
      'The board is no longer changing.',
    )
    cy.contains('button', 'Step').click()
    cy.get('[role="status"]').should(
      'contain',
      'The board is no longer changing.',
    )
    cy.contains('Generation: 1').should('be.visible')
  })

  it('should restore a shared board from the link', () => {
    // A 4x3 glider (see src/utils/share.ts for the format)
    cy.visit('/#w=4&h=3&c=QuA')
    cy.get('.box').should('have.length', 12)
    cy.get('.box.live').should('have.length', 5)
    cy.get('.box').eq(1).should('have.class', 'live')
    cy.get('.box').eq(0).should('have.class', 'death')
  })

  it('should put the board into the URL with Copy link', () => {
    cy.get('.box').first().click()
    cy.contains('button', 'Copy link').click()
    // Headless browsers may refuse the clipboard, but the address bar is updated either way
    cy.get('.copy-message').should('be.visible')
    cy.location('hash').should('match', /^#w=10&h=10&c=/)
    cy.reload()
    cy.get('.box').first().should('have.class', 'live')
    cy.get('.box.live').should('have.length', 6)
  })

  it('should have working GitHub link', () => {
    cy.get('a[href*="github.com"]').should('have.attr', 'target', '_blank')
  })

  it('should have working Ko-fi link', () => {
    cy.get('a[href="https://ko-fi.com/nulltemp"]')
      .should('be.visible')
      .and('have.attr', 'target', '_blank')
  })
})
