import React, { useState, useEffect, useCallback } from 'react';

export default function CalculatorPage({ inputs, setInputs, projects, onSave }) {
  const [calculations, setCalculations] = useState({});

  const calculateTaxes = useCallback(() => {
    const {
      abc,
      expensesVatInc,
      expensesNonVat,
      retentionPercent,
      undeclaredExpenses,
      withholdingVatPercent,
      incomeTaxPercent,
      withholdingItPercent
    } = inputs;

    // Use defaults if empty or undefined
    const wvPercent = withholdingVatPercent === '' || withholdingVatPercent === undefined ? 5 : withholdingVatPercent;
    const itPercent = incomeTaxPercent === '' || incomeTaxPercent === undefined ? 25 : incomeTaxPercent;
    const witPercent = withholdingItPercent === '' || withholdingItPercent === undefined ? 2 : withholdingItPercent;

    const priceVatEx = abc ? abc / 1.12 : 0;
    const outputVat = abc - priceVatEx;

    const inputVat = (expensesVatInc || 0) * (12 / 112);
    const expensesVatEx = (expensesVatInc || 0) - inputVat;

    const taxableIncome = (abc || 0) - expensesVatEx - (expensesNonVat || 0);
    const outputVatCalc = priceVatEx * 0.12;

    const withholdingVat = priceVatEx * (wvPercent / 100);
    const vatStillPayable = outputVatCalc - withholdingVat - inputVat;

    const incomeTaxDue = taxableIncome * (itPercent / 100);
    const withholdingIt = priceVatEx * (witPercent / 100);
    const incomeTaxStillPayable = incomeTaxDue - withholdingIt;

    const totalTaxesPayable = vatStillPayable + incomeTaxStillPayable;
    const totalIfNoWithholding = outputVatCalc - inputVat + incomeTaxDue;

    const netIncomeAfterTax = (abc || 0) - (expensesVatInc || 0) - (expensesNonVat || 0) - totalIfNoWithholding;

    const percentIncome = abc
      ? 1 - ((expensesVatInc || 0) + (expensesNonVat || 0) + totalIfNoWithholding) / abc
      : 0;

    const chequeComp = (abc || 0) - withholdingVat - withholdingIt;
    const chequeReceivable = chequeComp * (1 - (retentionPercent || 0) / 100);

    const tpc1Percent = (undeclaredExpenses || 0) > 0 ? (undeclaredExpenses || 0) / (abc || 1) : 0;
    const netIncomeAfterTpc1 = netIncomeAfterTax - (undeclaredExpenses || 0);

    setCalculations({
      priceVatEx,
      outputVat,
      abc: abc || 0,
      expensesVatInc: expensesVatInc || 0,
      inputVat,
      expensesVatEx,
      expensesNonVat: expensesNonVat || 0,
      taxableIncome,
      outputVatCalc,
      withholdingVat,
      withholdingVatPercent: wvPercent,
      vatStillPayable,
      incomeTaxDue,
      incomeTaxPercent: itPercent,
      withholdingIt,
      withholdingItPercent: witPercent,
      incomeTaxStillPayable,
      totalTaxesPayable,
      totalIfNoWithholding,
      netIncomeAfterTax,
      percentIncome,
      chequeReceivable,
      undeclaredExpenses: undeclaredExpenses || 0,
      tpc1Percent,
      netIncomeAfterTpc1,
      chequeComp
    });
  }, [inputs]);

  useEffect(() => {
    calculateTaxes();
  }, [calculateTaxes]);

  const handleInputChange = (field, value) => {
    setInputs(prev => ({
      ...prev,
      [field]: field === 'projectName' || field === 'projectId'
        ? value
        : value === '' ? '' : parseFloat(value)
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

  const formatPercent = (num) => `${(num * 100).toFixed(2)}%`;

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

    if (inputs.projectName) {
      lines.push(`Project Name: ${inputs.projectName}\n`);
    }

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
        [`Less: ${calculations.withholdingVatPercent}% Withholding VAT`, calculations.withholdingVat],
        ['Less: Input VAT', calculations.inputVat],
        ['VAT Still Payable', calculations.vatStillPayable],
      ]],
      ['INCOME TAX', [
        [`Income Tax Due (${calculations.incomeTaxPercent}% of Taxable Income)`, calculations.incomeTaxDue],
        [`Less: ${calculations.withholdingItPercent}% Withholding IT`, calculations.withholdingIt],
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

  return (
    <div className="calculator-page">
      <div className="input-section">
        <h2>Input Parameters</h2>
        <div className="input-grid">
          <div className="input-field">
            <label>
              Project <span className="optional-tag">(Optional)</span>
            </label>
            <select
              value={inputs.projectId || ''}
              onChange={(e) => handleInputChange('projectId', e.target.value)}
            >
              <option value="">No Project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>

          <div className="input-field">
            <label>
              Project Name <span className="optional-tag">(Optional)</span>
            </label>
            <input
              type="text"
              value={inputs.projectName || ''}
              onChange={(e) => handleInputChange('projectName', e.target.value)}
              placeholder="Enter project name"
            />
          </div>

          {[
            { label: 'Total Contract Price (ABC)', field: 'abc' },
            { label: 'Expenses (VAT Inclusive)', field: 'expensesVatInc' },
            { label: 'Expenses (Non-VATable)', field: 'expensesNonVat' },
            { label: 'Withholding VAT (%)', field: 'withholdingVatPercent', defaultValue: 5, grayBg: true },
            { label: 'Income Tax Rate (%)', field: 'incomeTaxPercent', defaultValue: 25, grayBg: true },
            { label: 'Withholding Income Tax (%)', field: 'withholdingItPercent', defaultValue: 2, grayBg: true },
            { label: 'Retention Percentage (%)', field: 'retentionPercent' },
            { label: 'Undeclared Expenses', field: 'undeclaredExpenses', optional: true },
          ].map(({ label, field, optional, defaultValue, grayBg }) => (
            <div className={`input-field ${optional ? 'optional' : ''}`} key={field}>
              <label>
                {label} {optional && <span className="optional-tag">(Optional)</span>}
              </label>
              <input
                type="number"
                className={grayBg ? 'gray-bg' : ''}
                value={inputs[field] === '' || inputs[field] === undefined ? '' : inputs[field]}
                onChange={(e) => handleInputChange(field, e.target.value)}
                step="0.01"
                placeholder={defaultValue ? defaultValue.toString() : "0.00"}
              />
            </div>
          ))}
        </div>

        <button className="save-button" onClick={() => onSave(inputs, calculations)}>
          Save Calculation
        </button>
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
                [`Less: ${calculations.withholdingVatPercent || 5}% Withholding VAT`, calculations.withholdingVat],
                ['Less: Input VAT', calculations.inputVat],
                ['VAT Still Payable', calculations.vatStillPayable],
              ]],
              ['INCOME TAX', [
                [`Income Tax Due (${calculations.incomeTaxPercent || 25}% of Taxable Income)`, calculations.incomeTaxDue],
                [`Less: ${calculations.withholdingItPercent || 2}% Withholding IT`, calculations.withholdingIt],
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
  );
}