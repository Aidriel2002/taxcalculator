import React, { useState, useEffect, useCallback } from 'react';
import './styles.css'

export default function TaxCalculator() {
  const defaultInputs = {
    abc: 0,
    expensesVatInc: 0,
    expensesNonVat: 0,
    retentionPercent: 0,
    undeclaredExpenses: 0
  };

  const [currentPage, setCurrentPage] = useState('calculator');
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcExpression, setCalcExpression] = useState('');
  const [calcPrevValue, setCalcPrevValue] = useState(null);
  const [calcOperation, setCalcOperation] = useState(null);
  const [calcWaitingForOperand, setCalcWaitingForOperand] = useState(false);

  const [inputs, setInputs] = useState(() => {
    try {
      const saved = localStorage.getItem('taxCalculatorInputs');
      return saved ? JSON.parse(saved) : defaultInputs;
    } catch {
      return defaultInputs;
    }
  });

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('taxCalculatorHistory');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [calculations, setCalculations] = useState({});

  useEffect(() => {
    localStorage.setItem('taxCalculatorInputs', JSON.stringify(inputs));
  }, [inputs]);

  useEffect(() => {
    localStorage.setItem('taxCalculatorHistory', JSON.stringify(history));
  }, [history]);

  const calculateTaxes = useCallback(() => {
    const { abc, expensesVatInc, expensesNonVat, retentionPercent, undeclaredExpenses } = inputs;

    const priceVatEx = abc / 1.12;
    const outputVat = abc - priceVatEx;
    const inputVat = (expensesVatInc / 1.12) * 0.12;
    const expensesVatEx = expensesVatInc - inputVat;
    const taxableIncome = abc - expensesVatEx - expensesNonVat;
    const outputVatCalc = priceVatEx * 0.12;
    const withholdingVat5 = priceVatEx * 0.05;
    const vatStillPayable = outputVatCalc - withholdingVat5 - inputVat;
    const incomeTaxDue = taxableIncome * 0.25;
    const withholdingIt2 = priceVatEx * 0.02;
    const incomeTaxStillPayable = incomeTaxDue - withholdingIt2;
    const totalTaxesPayable = vatStillPayable + incomeTaxStillPayable;
    const totalIfNoWithholding = outputVatCalc - inputVat + incomeTaxDue;
    const netIncomeAfterTax = abc - expensesVatInc - expensesNonVat - totalIfNoWithholding;
    const percentIncome = 1 - (expensesVatInc + expensesNonVat + totalIfNoWithholding) / abc;
    const checqueComp = abc - withholdingVat5 - withholdingIt2;
    const chequeReceivable = checqueComp * (1 - retentionPercent / 100);
    const tpc1Percent = undeclaredExpenses > 0 ? (undeclaredExpenses / abc) : 0;
    const netIncomeAfterTpc1 = netIncomeAfterTax - undeclaredExpenses;

    setCalculations({
      priceVatEx, outputVat, abc, expensesVatInc, inputVat, expensesVatEx, expensesNonVat,
      taxableIncome, outputVatCalc, withholdingVat5, vatStillPayable, incomeTaxDue,
      withholdingIt2, incomeTaxStillPayable, totalTaxesPayable, totalIfNoWithholding,
      netIncomeAfterTax, percentIncome, chequeReceivable, undeclaredExpenses,
      tpc1Percent, netIncomeAfterTpc1, checqueComp
    });
  }, [inputs]);

  useEffect(() => {
    calculateTaxes();
  }, [calculateTaxes]);

  const handleInputChange = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num || 0);
  };

  const formatPercent = (num) => `${(num * 100).toFixed(2)}%`;

  const saveCalculation = () => {
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      inputs: { ...inputs },
      results: { ...calculations }
    };
    setHistory(prev => [newEntry, ...prev]);
    alert('Calculation saved successfully!');
  };

  const loadCalculation = (entry) => {
    setInputs(entry.inputs);
    setCurrentPage('calculator');
  };

  const deleteCalculation = (id) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      setHistory([]);
    }
  };

  const printCalculation = () => {
    const resultsSection = document.querySelector('.results-section');
    const tableContent = resultsSection.querySelector('.results-table');
    const newWin = window.open('');
    newWin.document.write(`
      <html>
        <head>
          <title>Multifactors Sales Tax</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; margin-bottom: 30px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background-color: #f2f2f2; }
            .section-title td { background-color: #667eea; color: white; font-weight: bold; }
            .value { text-align: right; }
          </style>
        </head>
        <body>
          <h1>Multifactors Sales Tax</h1>
          ${tableContent.outerHTML}
        </body>
      </html>
    `);
    newWin.document.close();
    newWin.focus();
    newWin.print();
    newWin.close();
  };

  const downloadCalculation = () => {
    const lines = ['=== TAX CALCULATION REPORT ===\n'];
    const sections = [
      ['PRICE BREAKDOWN', [
        ['Price (VAT-Exclusive)', calculations.priceVatEx],
        ['Add: Output VAT', calculations.outputVat],
        ['Total Contract Price (ABC)', calculations.abc],
      ]],
      ['EXPENSES', [
        ['Expenses (VAT Inc)', calculations.expensesVatInc],
        ['Less: Input VAT', calculations.inputVat],
        ['Expenses (VAT Ex)', calculations.expensesVatEx],
      ]],
      ['TAXABLE INCOME', [
        ['Price', calculations.abc],
        ['Less: Expense - VATable', calculations.expensesVatEx],
        ['Less: Expense - Non-VATable', calculations.expensesNonVat],
        ['Taxable Income', calculations.taxableIncome],
      ]],
      ['VAT COMPUTATION', [
        ['Output VAT (12% of VAT Ex Price)', calculations.outputVatCalc],
        ['Less: 5% Withholding VAT', calculations.withholdingVat5],
        ['Less: Input VAT', calculations.inputVat],
        ['VAT Still Payable', calculations.vatStillPayable],
      ]],
      ['INCOME TAX', [
        ['Income Tax Due (25% of Taxable Income)', calculations.incomeTaxDue],
        ['Less: 2% Withholding IT', calculations.withholdingIt2],
        ['Income Tax Still Payable', calculations.incomeTaxStillPayable],
      ]],
      ['SUMMARY', [
        ['VAT Still Payable', calculations.vatStillPayable],
        ['Income Tax Still Payable', calculations.incomeTaxStillPayable],
        ['Total Taxes Still Payable', calculations.totalTaxesPayable],
        ['Net Income After Tax', calculations.netIncomeAfterTax],
        ['% Income', formatPercent(calculations.percentIncome)],
        ['Cheque Receivable', calculations.chequeReceivable],
      ]],
    ];

    sections.forEach(([title, rows]) => {
      lines.push(`\n=== ${title} ===`);
      rows.forEach(([label, value]) => {
        const formatted = typeof value === 'string' ? value : formatCurrency(value);
        lines.push(`${label}: ${formatted}`);
      });
    });

    if (inputs.undeclaredExpenses > 0) {
      lines.push('\n=== UNDECLARED EXPENSES ===');
      lines.push(`Undeclared Expenses: ${formatCurrency(calculations.undeclaredExpenses)}`);
      lines.push(`TPC 1: ${formatPercent(calculations.tpc1Percent)}`);
      lines.push(`Net Income After TPC 1: ${formatCurrency(calculations.netIncomeAfterTpc1)}`);
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tax_Calculation_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllHistory = () => {
    const lines = ['TAX CALCULATOR - CALCULATION HISTORY\n'];
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push(`Total Calculations: ${history.length}\n`);

    history.forEach((entry, index) => {
      lines.push(`\n=== CALCULATION ${index + 1} ===`);
      lines.push(`Date: ${entry.timestamp}`);
      lines.push(`ABC: ${formatCurrency(entry.inputs.abc)}`);
      lines.push(`Net Income: ${formatCurrency(entry.results.netIncomeAfterTax)}`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tax_History_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculator Functions
  const handleCalculatorNumber = (num) => {
    if (calcWaitingForOperand) {
      setCalcDisplay(String(num));
      setCalcExpression(calcExpression + ' ' + num);
      setCalcWaitingForOperand(false);
    } else {
      const newDisplay = calcDisplay === '0' ? String(num) : calcDisplay + num;
      setCalcDisplay(newDisplay);
      if (calcExpression && !calcWaitingForOperand) {
        // Replace last number in expression
        const parts = calcExpression.split(' ');
        parts[parts.length - 1] = newDisplay;
        setCalcExpression(parts.join(' '));
      } else if (!calcExpression) {
        setCalcExpression(newDisplay);
      }
    }
  };

  const handleCalculatorDecimal = () => {
    if (calcWaitingForOperand) {
      setCalcDisplay('0.');
      setCalcExpression(calcExpression + ' 0.');
      setCalcWaitingForOperand(false);
    } else if (calcDisplay.indexOf('.') === -1) {
      const newDisplay = calcDisplay + '.';
      setCalcDisplay(newDisplay);
      if (calcExpression) {
        const parts = calcExpression.split(' ');
        parts[parts.length - 1] = newDisplay;
        setCalcExpression(parts.join(' '));
      } else {
        setCalcExpression(newDisplay);
      }
    }
  };

  const handleCalculatorClear = () => {
    setCalcDisplay('0');
    setCalcExpression('');
    setCalcPrevValue(null);
    setCalcOperation(null);
    setCalcWaitingForOperand(false);
  };

  const performCalculation = (prev, current, operation) => {
    switch (operation) {
      case '+': return prev + current;
      case '-': return prev - current;
      case '×': return prev * current;
      case '÷': return current !== 0 ? prev / current : 0;
      case '%': return prev % current;
      default: return current;
    }
  };

  const handleCalculatorOperation = (nextOperation) => {
    const inputValue = parseFloat(calcDisplay);
    
    if (calcPrevValue === null) {
      setCalcPrevValue(inputValue);
      setCalcExpression(calcDisplay + ' ' + nextOperation);
    } else if (calcOperation) {
      const newValue = performCalculation(calcPrevValue, inputValue, calcOperation);
      setCalcDisplay(String(newValue));
      setCalcPrevValue(newValue);
      setCalcExpression(calcExpression + ' ' + nextOperation);
    }
    
    setCalcWaitingForOperand(true);
    setCalcOperation(nextOperation);
  };

  const handleCalculatorEquals = () => {
    const inputValue = parseFloat(calcDisplay);
    if (calcPrevValue !== null && calcOperation) {
      const newValue = performCalculation(calcPrevValue, inputValue, calcOperation);
      setCalcExpression(calcExpression + ' = ' + newValue);
      setCalcDisplay(String(newValue));
      setCalcPrevValue(null);
      setCalcOperation(null);
      setCalcWaitingForOperand(true);
    }
  };

  const handleCalculatorToggleSign = () => {
    const newValue = String(parseFloat(calcDisplay) * -1);
    setCalcDisplay(newValue);
    if (calcExpression) {
      const parts = calcExpression.split(' ');
      parts[parts.length - 1] = newValue;
      setCalcExpression(parts.join(' '));
    } else {
      setCalcExpression(newValue);
    }
  };

  if (currentPage === 'history') {
    return (
      <div className="app">
        <nav className="navbar">
          <h1>Tax Calculator</h1>
          <div className="nav-buttons">
            <button onClick={() => setCurrentPage('calculator')}>Tax Calculator</button>
            <button className="active">History ({history.length})</button>
            <button onClick={() => setShowCalculator(true)}>Calculator</button>
          </div>
        </nav>

        <div className="page-content">
          <div className="history-page">
            <div className="history-header">
              <h2>Calculation History</h2>
              {history.length > 0 && (
                <div className="history-actions">
                  <button className="downloadbttn" onClick={downloadAllHistory}>
                    ⬇️ Download All
                  </button>
                  <button className="btn-danger" onClick={clearHistory}>
                    Clear All History
                  </button>
                </div>
              )}
            </div>

            {history.length === 0 ? (
              <div className="empty-state">
                <p>No saved calculations yet.</p>
                <button onClick={() => setCurrentPage('calculator')}>Go to Calculator</button>
              </div>
            ) : (
              <div className="history-grid">
                {history.map(entry => (
                  <div key={entry.id} className="history-card">
                    <div className="history-card-header">
                      <span className="history-date">{entry.timestamp}</span>
                      <span className="history-badge">{formatCurrency(entry.inputs.abc)}</span>
                    </div>
                    <div className="history-card-body">
                      <div className="history-row">
                        <span>Contract Price:</span>
                        <span>{formatCurrency(entry.inputs.abc)}</span>
                      </div>
                      <div className="history-row">
                        <span>Expenses (VAT Inc):</span>
                        <span>{formatCurrency(entry.inputs.expensesVatInc)}</span>
                      </div>
                      <div className="history-row">
                        <span>Expenses (Non-VAT):</span>
                        <span>{formatCurrency(entry.inputs.expensesNonVat)}</span>
                      </div>
                      {entry.inputs.undeclaredExpenses > 0 && (
                        <div className="history-row">
                          <span>Undeclared Expenses:</span>
                          <span>{formatCurrency(entry.inputs.undeclaredExpenses)}</span>
                        </div>
                      )}
                      <div className="history-row highlight">
                        <span><strong>Net Income:</strong></span>
                        <span><strong>{formatCurrency(entry.results.netIncomeAfterTax)}</strong></span>
                      </div>
                    </div>
                    <div className="history-card-footer">
                      <button className="btn-primary" onClick={() => loadCalculation(entry)}>Load</button>
                      <button className="btn-secondary" onClick={() => deleteCalculation(entry.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {showCalculator && (
          <div className="calculator-modal-overlay" onClick={() => setShowCalculator(false)}>
            <div className="calculator-modal" onClick={(e) => e.stopPropagation()}>
              <div className="calculator-modal-header">
                <h3>Calculator</h3>
                <button className="close-btn" onClick={() => setShowCalculator(false)}>×</button>
              </div>
              <div className="calculator-body">
                <div className="calculator-display">{calcDisplay}</div>
                <div className="calculator-buttons">
                  <button className="calc-btn function" onClick={handleCalculatorClear}>C</button>
                  <button className="calc-btn function" onClick={handleCalculatorToggleSign}>+/-</button>
                  <button className="calc-btn function" onClick={() => handleCalculatorOperation('%')}>%</button>
                  <button className="calc-btn operator" onClick={() => handleCalculatorOperation('÷')}>÷</button>
                  <button className="calc-btn" onClick={() => handleCalculatorNumber(7)}>7</button>
                  <button className="calc-btn" onClick={() => handleCalculatorNumber(8)}>8</button>
                  <button className="calc-btn" onClick={() => handleCalculatorNumber(9)}>9</button>
                  <button className="calc-btn operator" onClick={() => handleCalculatorOperation('×')}>×</button>
                  <button className="calc-btn" onClick={() => handleCalculatorNumber(4)}>4</button>
                  <button className="calc-btn" onClick={() => handleCalculatorNumber(5)}>5</button>
                  <button className="calc-btn" onClick={() => handleCalculatorNumber(6)}>6</button>
                  <button className="calc-btn operator" onClick={() => handleCalculatorOperation('-')}>-</button>
                  <button className="calc-btn" onClick={() => handleCalculatorNumber(1)}>1</button>
                  <button className="calc-btn" onClick={() => handleCalculatorNumber(2)}>2</button>
                  <button className="calc-btn" onClick={() => handleCalculatorNumber(3)}>3</button>
                  <button className="calc-btn operator" onClick={() => handleCalculatorOperation('+')}>+</button>
                  <button className="calc-btn zero" onClick={() => handleCalculatorNumber(0)}>0</button>
                  <button className="calc-btn" onClick={handleCalculatorDecimal}>.</button>
                  <button className="calc-btn operator" onClick={handleCalculatorEquals}>=</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app">
      <nav className="navbar">
        <h1>Tax Calculator</h1>
        <div className="nav-buttons">
          <button className="active">Tax Calculator</button>
          <button onClick={() => setCurrentPage('history')}>History ({history.length})</button>
          <button onClick={() => setShowCalculator(true)}>Calculator</button>
        </div>
      </nav>

      <div className="page-content">
        <div className="calculator-page">
          <div className="input-section">
            <h2>Input Parameters</h2>
            <div className="input-grid">
              {[
                { label: 'Total Contract Price (ABC)', field: 'abc' },
                { label: 'Expenses (VAT Inclusive)', field: 'expensesVatInc' },
                { label: 'Expenses (Non-VATable)', field: 'expensesNonVat' },
                { label: 'Retention Percentage (%)', field: 'retentionPercent' },
                { label: 'Undeclared Expenses', field: 'undeclaredExpenses', optional: true },
              ].map(({ label, field, optional }) => (
                <div className={`input-field ${optional ? 'optional' : ''}`} key={field}>
                  <label>
                    {label} {optional && <span className="optional-tag">(Optional)</span>}
                  </label>
                  <input
                    type="number"
                    value={inputs[field] || ''}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              ))}
            </div>
            <button className="save-button" onClick={saveCalculation}>Save Calculation</button>
          </div>

          <div className="results-section">
            <div className="headerP">
              <h2>Results</h2>
              <div className="bttns">
                <button onClick={printCalculation} className="printbttn">🖨️ Print</button>
                <button onClick={downloadCalculation} className="downloadbttn">⬇️ Download</button>
              </div>
            </div>

            <table className="results-table">
              <tbody>
                {[
                  ['PRICE BREAKDOWN', [
                    ['Price (VAT-Exclusive)', calculations.priceVatEx],
                    ['Add: Output VAT', calculations.outputVat],
                    ['Total Contract Price (ABC)', calculations.abc],
                  ]],
                  ['EXPENSES', [
                    ['Expenses (VAT Inc)', calculations.expensesVatInc],
                    ['Less: Input VAT', calculations.inputVat],
                    ['Expenses (VAT Ex)', calculations.expensesVatEx],
                  ]],
                  ['TAXABLE INCOME', [
                    ['Price', calculations.abc],
                    ['Less: Expense - VATable', calculations.expensesVatEx],
                    ['Less: Expense - Non-VATable', calculations.expensesNonVat],
                    ['Taxable Income', calculations.taxableIncome],
                  ]],
                  ['VAT COMPUTATION', [
                    ['Output VAT (12% of VAT Ex Price)', calculations.outputVatCalc],
                    ['Less: 5% Withholding VAT', calculations.withholdingVat5],
                    ['Less: Input VAT', calculations.inputVat],
                    ['VAT Still Payable', calculations.vatStillPayable],
                  ]],
                  ['INCOME TAX', [
                    ['Income Tax Due (25% of Taxable Income)', calculations.incomeTaxDue],
                    ['Less: 2% Withholding IT', calculations.withholdingIt2],
                    ['Income Tax Still Payable', calculations.incomeTaxStillPayable],
                  ]],
                  ['SUMMARY', [
                    ['VAT Still Payable', calculations.vatStillPayable],
                    ['Income Tax Still Payable', calculations.incomeTaxStillPayable],
                    ['Total Taxes Still Payable', calculations.totalTaxesPayable],
                    ['Net Income After Tax', calculations.netIncomeAfterTax],
                    ['% Income', formatPercent(calculations.percentIncome)],
                    [`Cheque Receivable (minus ${inputs.retentionPercent}%)`, calculations.chequeReceivable],
                  ]],
                  ...(inputs.undeclaredExpenses > 0 ? [['UNDECLARED EXPENSES', [
                    ['Undeclared Expenses', calculations.undeclaredExpenses],
                    ['TPC 1', formatPercent(calculations.tpc1Percent)],
                    ['Net Income After TPC 1', calculations.netIncomeAfterTpc1],
                  ]]] : [])
                ].map(([section, rows], i) => (
                  <React.Fragment key={i}>
                    <tr className="section-title"><td colSpan="2">{section}</td></tr>
                    {rows.map(([label, value], j) => (
                      <tr key={j} className={label.includes('Total') || label.includes('Net') ? 'total' : ''}>
                        <td>{label}</td>
                        <td className="value">{typeof value === 'string' ? value : formatCurrency(value)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showCalculator && (
        <div className="calculator-modal-overlay" onClick={() => setShowCalculator(false)}>
          <div className="calculator-modal" onClick={(e) => e.stopPropagation()}>
            <div className="calculator-modal-header">
              <h3>Calculator</h3>
              <button className="close-btn" onClick={() => setShowCalculator(false)}>×</button>
            </div>
            <div className="calculator-body">
              <div className="calculator-display">{calcExpression || '0'}</div>
              <div className="calculator-buttons">
                <button className="calc-btn function" onClick={handleCalculatorClear}>C</button>
                <button className="calc-btn function" onClick={handleCalculatorToggleSign}>+/-</button>
                <button className="calc-btn function" onClick={() => handleCalculatorOperation('%')}>%</button>
                <button className="calc-btn operator" onClick={() => handleCalculatorOperation('÷')}>÷</button>
                <button className="calc-btn" onClick={() => handleCalculatorNumber(7)}>7</button>
                <button className="calc-btn" onClick={() => handleCalculatorNumber(8)}>8</button>
                <button className="calc-btn" onClick={() => handleCalculatorNumber(9)}>9</button>
                <button className="calc-btn operator" onClick={() => handleCalculatorOperation('×')}>×</button>
                <button className="calc-btn" onClick={() => handleCalculatorNumber(4)}>4</button>
                <button className="calc-btn" onClick={() => handleCalculatorNumber(5)}>5</button>
                <button className="calc-btn" onClick={() => handleCalculatorNumber(6)}>6</button>
                <button className="calc-btn operator" onClick={() => handleCalculatorOperation('-')}>-</button>
                <button className="calc-btn" onClick={() => handleCalculatorNumber(1)}>1</button>
                <button className="calc-btn" onClick={() => handleCalculatorNumber(2)}>2</button>
                <button className="calc-btn" onClick={() => handleCalculatorNumber(3)}>3</button>
                <button className="calc-btn operator" onClick={() => handleCalculatorOperation('+')}>+</button>
                <button className="calc-btn zero" onClick={() => handleCalculatorNumber(0)}>0</button>
                <button className="calc-btn" onClick={handleCalculatorDecimal}>.</button>
                <button className="calc-btn operator" onClick={handleCalculatorEquals}>=</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}