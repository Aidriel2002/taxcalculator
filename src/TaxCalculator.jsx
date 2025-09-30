import React, { useState, useEffect, useCallback } from 'react';
import './styles.css';

export default function TaxCalculator() {
  const defaultInputs = {
    abc: 0,
    expensesVatInc: 0,
    expensesNonVat: 0,
    retentionPercent: 0,
    undeclaredExpenses: 0
  };

  const [currentPage, setCurrentPage] = useState('calculator');

  const [inputs, setInputs] = useState(() => {
    const raw = localStorage.getItem('taxCalculatorInputs');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (err) {
        console.error('Error parsing saved inputs:', err);
      }
    }
    return defaultInputs;
  });

  const [history, setHistory] = useState(() => {
    const raw = localStorage.getItem('taxCalculatorHistory');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (err) {
        console.error('Error parsing saved history:', err);
      }
    }
    return [];
  });

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
          .section-title td {
            background-color: #e0e0e0;
            font-weight: bold;
            text-align: left;
            padding-top: 15px;
          }
          .total td {
            font-weight: bold;
            background-color: #f9f9f9;
          }
          .value {
            text-align: right;
          }
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
  const lines = [];

  const pushSection = (title, rows) => {
    lines.push(`\n=== ${title} ===`);
    rows.forEach(([label, value]) => {
      const formattedValue = typeof value === 'string' ? value : formatCurrency(value);
      lines.push(`${label}: ${formattedValue}`);
    });
  };

  const {
    priceVatEx,
    outputVat,
    abc,
    expensesVatInc,
    inputVat,
    expensesVatEx,
    expensesNonVat,
    taxableIncome,
    outputVatCalc,
    withholdingVat5,
    vatStillPayable,
    incomeTaxDue,
    withholdingIt2,
    incomeTaxStillPayable,
    totalTaxesPayable,
    totalIfNoWithholding,
    netIncomeAfterTax,
    percentIncome,
    chequeReceivable,
    undeclaredExpenses,
    tpc1Percent,
    netIncomeAfterTpc1,
  } = calculations;

  pushSection("PRICE BREAKDOWN", [
    ['Price (VAT-Exclusive)', priceVatEx],
    ['Add: Output VAT', outputVat],
    ['Total Contract Price (ABC)', abc],
  ]);

  pushSection("EXPENSES", [
    ['Expenses (VAT Inc)', expensesVatInc],
    ['Less: Input VAT', inputVat],
    ['Expenses (VAT Ex)', expensesVatEx],
  ]);

  pushSection("TAXABLE INCOME", [
    ['Price', abc],
    ['Less: Expense - VATable', expensesVatEx],
    ['Less: Expense - Non-VATable', expensesNonVat],
    ['Taxable Income', taxableIncome],
  ]);

  pushSection("VAT COMPUTATION", [
    ['Output VAT (12% of VAT Ex Price)', outputVatCalc],
    ['Less: 5% Withholding VAT', withholdingVat5],
    ['Less: Input VAT', inputVat],
    ['VAT Still Payable', vatStillPayable],
  ]);

  pushSection("INCOME TAX", [
    ['Income Tax Due (25% of Taxable Income)', incomeTaxDue],
    ['Less: 2% Withholding IT', withholdingIt2],
    ['Income Tax Still Payable', incomeTaxStillPayable],
  ]);

  pushSection("SUMMARY", [
    ['VAT Still Payable', vatStillPayable],
    ['Income Tax Still Payable', incomeTaxStillPayable],
    ['Total Taxes Still Payable (TO BE PAID TO BIR)', totalTaxesPayable],
    ['IF NO WITHHOLDING TAX (2307)', totalIfNoWithholding],
    ['Net Income After Tax', netIncomeAfterTax],
    ['% Income', formatPercent(percentIncome)],
    [`Cheque Receivable (minus retention ${inputs.retentionPercent}%)`, chequeReceivable],
  ]);

  if (undeclaredExpenses > 0) {
    pushSection("UNDECLARED EXPENSES", [
      ['Undeclared Expenses', undeclaredExpenses],
      ['TPC 1', formatPercent(tpc1Percent)],
      ['Net Income After TPC 1', netIncomeAfterTpc1],
    ]);
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Tax_Calculation_${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};


  const [calculations, setCalculations] = useState({});

  useEffect(() => {
    console.log('Saving inputs to localStorage:', inputs);
    localStorage.setItem('taxCalculatorInputs', JSON.stringify(inputs));
  }, [inputs]);

  useEffect(() => {
    console.log('Saving history to localStorage:', history);
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
      priceVatEx,
      outputVat,
      abc,
      expensesVatInc,
      inputVat,
      expensesVatEx,
      expensesNonVat,
      taxableIncome,
      outputVatCalc,
      withholdingVat5,
      vatStillPayable,
      incomeTaxDue,
      withholdingIt2,
      incomeTaxStillPayable,
      totalTaxesPayable,
      totalIfNoWithholding,
      netIncomeAfterTax,
      percentIncome,
      chequeReceivable,
      undeclaredExpenses,
      tpc1Percent,
      netIncomeAfterTpc1,
      checqueComp
    });
  }, [inputs]);

  useEffect(() => {
    calculateTaxes();
  }, [calculateTaxes]);

  const handleInputChange = (field, value) => {
    setInputs(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num || 0);
  };

  const formatPercent = (num) => {
    return `${(num * 100).toFixed(2)}%`;
  };

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

  const downloadAllHistory = () => {
    const lines = [];
    lines.push('TAX CALCULATOR - CALCULATION HISTORY');
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push(`Total Calculations: ${history.length}`);
    lines.push('='.repeat(80));

    history.forEach((entry, index) => {
      lines.push(`\n\n### CALCULATION ${index + 1} ###`);
      lines.push(`Date: ${entry.timestamp}`);
      lines.push('-'.repeat(80));

      const pushSection = (title, rows) => {
        lines.push(`\n${title}`);
        rows.forEach(([label, value]) => {
          const formattedValue = typeof value === 'string' ? value : formatCurrency(value);
          lines.push(`  ${label}: ${formattedValue}`);
        });
      };

      pushSection("INPUT PARAMETERS", [
        ['Total Contract Price (ABC)', entry.inputs.abc],
        ['Expenses (VAT Inc)', entry.inputs.expensesVatInc],
        ['Expenses (Non-VAT)', entry.inputs.expensesNonVat],
        ['Retention Percentage', `${entry.inputs.retentionPercent}%`],
        ...(entry.inputs.undeclaredExpenses > 0 ? [['Undeclared Expenses', entry.inputs.undeclaredExpenses]] : [])
      ]);

      pushSection("RESULTS", [
        ['VAT Still Payable', entry.results.vatStillPayable],
        ['Income Tax Still Payable', entry.results.incomeTaxStillPayable],
        ['Total Taxes Payable', entry.results.totalTaxesPayable],
        ['Net Income After Tax', entry.results.netIncomeAfterTax],
        ['% Income', formatPercent(entry.results.percentIncome)],
        ['Cheque Receivable', entry.results.chequeReceivable],
      ]);

      if (entry.inputs.undeclaredExpenses > 0) {
        pushSection("UNDECLARED EXPENSES", [
          ['Undeclared Expenses', entry.results.undeclaredExpenses],
          ['TPC 1', formatPercent(entry.results.tpc1Percent)],
          ['Net Income After TPC 1', entry.results.netIncomeAfterTpc1],
        ]);
      }
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tax_Calculator_History_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (currentPage === 'history') {
    return (
      <div className="app">
        <nav className="navbar">
          <h1>Tax Calculator</h1>
          <div className="nav-buttons">
            <button onClick={() => setCurrentPage('calculator')}>Calculator</button>
            <button className="active">History ({history.length})</button>
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
                <button onClick={() => setCurrentPage('calculator')}>
                  Go to Calculator
                </button>
              </div>
            ) : (
              <div className="history-grid">
                {history.map(entry => (
                  <div key={entry.id} className="history-card">
                    <div className="history-card-header">
                      <span className="history-date">{entry.timestamp}</span>
                      <span className="history-badge">
                        {formatCurrency(entry.inputs.abc)}
                      </span>
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
                      <button className="btn-primary" onClick={() => loadCalculation(entry)}>
                        Load
                      </button>
                      <button className="btn-secondary" onClick={() => deleteCalculation(entry.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <nav className="navbar">
        <h1>Tax Calculator</h1>
        <div className="nav-buttons">
          <button className="active">Calculator</button>
          <button onClick={() => setCurrentPage('history')}>
            History ({history.length})
          </button>
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
                { label: 'Undeclared Expenses (Optional)', field: 'undeclaredExpenses', optional: true },
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
                    min={field === 'retentionPercent' ? '0' : undefined}
                    max={field === 'retentionPercent' ? '100' : undefined}
                  />
                </div>
              ))}
            </div>     
            <button className="save-button" onClick={saveCalculation}>
              Save Calculation
            </button>
          </div>

          <div className="results-section">
            <div className="headerP">
              <div className="textResult">
                 <h2>Results</h2>
              </div>
              <div className="bttns">
                <button onClick={printCalculation} className='printbttn'>🖨️ Print</button>
                <button onClick={downloadCalculation} className='downloadbttn'>⬇️ Download</button>
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
                    ['Total Taxes Still Payable (TO BE PAID TO BIR)', calculations.totalTaxesPayable],
                    ['IF NO WITHHOLDING TAX (2307)', calculations.totalIfNoWithholding],
                    ['Net Income After Tax', calculations.netIncomeAfterTax],
                    ['% Income', formatPercent(calculations.percentIncome)],
                    [`Cheque Receivable (minus retention ${inputs.retentionPercent}%)`, calculations.chequeReceivable],
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
    </div>
  );
}
