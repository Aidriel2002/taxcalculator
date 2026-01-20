import { useState, useEffect } from 'react';

export function useStorage() {
  const defaultInputs = {
    abc: 0,
    expensesVatInc: 0,
    expensesNonVat: 0,
    retentionPercent: 0,
    undeclaredExpenses: 0,
    projectId: '',
    projectName: ''
  };

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

  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem('taxCalculatorProjects');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('taxCalculatorInputs', JSON.stringify(inputs));
  }, [inputs]);

  useEffect(() => {
    localStorage.setItem('taxCalculatorHistory', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('taxCalculatorProjects', JSON.stringify(projects));
  }, [projects]);

  return { inputs, setInputs, history, setHistory, projects, setProjects };
}
