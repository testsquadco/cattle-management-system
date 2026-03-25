describe('Cattle Management', () => {
  beforeEach(() => {
    // Visit the cattle management page before each test
    cy.visit('http://localhost:3000/cattle')
  })

  it('should open add cattle form', () => {
    // Click the add cattle button
    cy.get('[data-testid="add-cattle-button"]').click()
    
    // Verify the form is displayed
    cy.get('[data-testid="cattle-form"]').should('be.visible')
  })

  it('should add a breeding cattle successfully', () => {
    // Click the add cattle button
    cy.get('[data-testid="add-cattle-button"]').click()
    
    // Fill in the form
    cy.get('input[name="tag"]').type('010')
    cy.get('input[name="name"]').type('Bachri01')
    cy.get('[data-testid="breed-select"]').click().type('Sahiwal{enter}')
    cy.get('[data-testid="gender-select"]').click().type('Female{enter}')
    cy.get('[data-testid="purpose-select"]').click().type('Breeding{enter}')
    cy.get('input[name="purchaseDate"]').type('2025-02-22')
    cy.get('input[name="weight"]').type('71')
    cy.get('input[name="purchasePrice"]').type('57000')
    cy.get('input[name="transportationCost"]').type('1000')
    cy.get('input[name="colorMarkings"]').type('Brown')
    
    // Fill breeding details
    cy.get('[data-testid="breeding-role-select"]').click().type('Dam{enter}')
    cy.get('[data-testid="mating-method-select"]').click().type('Natural{enter}')
    cy.get('[data-testid="pregnancy-status-select"]').click().type('Not Pregnant{enter}')
    
    // Submit the form
    cy.get('[data-testid="submit-button"]').click()
    
    // Verify success message
    cy.get('[data-testid="success-alert"]').should('be.visible')
    cy.get('[data-testid="success-alert"]').should('contain', 'Cattle added successfully')
  })
}) 