import React, { useState } from 'react';

export default function Calculator({ onClose }) {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [prevValue, setPrevValue] = useState(null);
  const [operation, setOperation] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const handleNumber = (num) => {
    if (waitingForOperand) {
      setDisplay(String(num));
      setExpression(expression + ' ' + num);
      setWaitingForOperand(false);
    } else {
      const newDisplay = display === '0' ? String(num) : display + num;
      setDisplay(newDisplay);
      if (expression && !waitingForOperand) {
        const parts = expression.split(' ');
        parts[parts.length - 1] = newDisplay;
        setExpression(parts.join(' '));
      } else if (!expression) {
        setExpression(newDisplay);
      }
    }
  };

  const handleDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setExpression(expression + ' 0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      const newDisplay = display + '.';
      setDisplay(newDisplay);
      if (expression) {
        const parts = expression.split(' ');
        parts[parts.length - 1] = newDisplay;
        setExpression(parts.join(' '));
      } else {
        setExpression(newDisplay);
      }
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setExpression('');
    setPrevValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const performCalculation = (prev, current, op) => {
    switch (op) {
      case '+': return prev + current;
      case '-': return prev - current;
      case '×': return prev * current;
      case '÷': return current !== 0 ? prev / current : 0;
      case '%': return prev % current;
      default: return current;
    }
  };

  const handleOperation = (nextOperation) => {
    const inputValue = parseFloat(display);
    
    if (prevValue === null) {
      setPrevValue(inputValue);
      setExpression(display + ' ' + nextOperation);
    } else if (operation) {
      const newValue = performCalculation(prevValue, inputValue, operation);
      setDisplay(String(newValue));
      setPrevValue(newValue);
      setExpression(expression + ' ' + nextOperation);
    }
    
    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const handleEquals = () => {
    const inputValue = parseFloat(display);
    if (prevValue !== null && operation) {
      const newValue = performCalculation(prevValue, inputValue, operation);
      setExpression(expression + ' = ' + newValue);
      setDisplay(String(newValue));
      setPrevValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const handleToggleSign = () => {
    const newValue = String(parseFloat(display) * -1);
    setDisplay(newValue);
    if (expression) {
      const parts = expression.split(' ');
      parts[parts.length - 1] = newValue;
      setExpression(parts.join(' '));
    } else {
      setExpression(newValue);
    }
  };

  return (
    <div className="calculator-modal-overlay" onClick={onClose}>
      <div className="calculator-modal" onClick={(e) => e.stopPropagation()}>
        <div className="calculator-modal-header">
          <h3>Calculator</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="calculator-body">
          <div className="calculator-display">{expression || '0'}</div>
          <div className="calculator-buttons">
            <button className="calc-btn function" onClick={handleClear}>C</button>
            <button className="calc-btn function" onClick={handleToggleSign}>+/-</button>
            <button className="calc-btn function" onClick={() => handleOperation('%')}>%</button>
            <button className="calc-btn operator" onClick={() => handleOperation('÷')}>÷</button>
            <button className="calc-btn" onClick={() => handleNumber(7)}>7</button>
            <button className="calc-btn" onClick={() => handleNumber(8)}>8</button>
            <button className="calc-btn" onClick={() => handleNumber(9)}>9</button>
            <button className="calc-btn operator" onClick={() => handleOperation('×')}>×</button>
            <button className="calc-btn" onClick={() => handleNumber(4)}>4</button>
            <button className="calc-btn" onClick={() => handleNumber(5)}>5</button>
            <button className="calc-btn" onClick={() => handleNumber(6)}>6</button>
            <button className="calc-btn operator" onClick={() => handleOperation('-')}>-</button>
            <button className="calc-btn" onClick={() => handleNumber(1)}>1</button>
            <button className="calc-btn" onClick={() => handleNumber(2)}>2</button>
            <button className="calc-btn" onClick={() => handleNumber(3)}>3</button>
            <button className="calc-btn operator" onClick={() => handleOperation('+')}>+</button>
            <button className="calc-btn zero" onClick={() => handleNumber(0)}>0</button>
            <button className="calc-btn" onClick={handleDecimal}>.</button>
            <button className="calc-btn operator" onClick={handleEquals}>=</button>
          </div>
        </div>
      </div>
    </div>
  );
}

