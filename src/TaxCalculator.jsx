import React, { useState } from 'react';
import CalculatorPage from './components/CalculatorPage';
import HistoryPage from './components/HistoryPage';
import Calculator from './components/Calculator';
import ProjectManager from './components/ProjectManager';
import { useStorage } from './hooks/useStorage';
import { saveToDatabase, importFromDatabase } from './backupService';
import './styles.css';

export default function TaxCalculator() {
  const [currentPage, setCurrentPage] = useState('calculator');
  const [showCalculator, setShowCalculator] = useState(false);
  const [showProjectManager, setShowProjectManager] = useState(false);
  
  const { inputs, setInputs, history, setHistory, projects, setProjects } = useStorage();

  const saveCalculation = (calculationInputs, calculations) => {
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      inputs: { ...calculationInputs },
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

  const addProject = (projectName) => {
    const newProject = {
      id: Date.now(),
      name: projectName,
      createdAt: new Date().toISOString()
    };
    setProjects(prev => [...prev, newProject]);
  };

  const deleteProject = (projectId) => {
    if (window.confirm('Delete this project? All associated calculations will remain but be unassigned.')) {
      setProjects(prev => prev.filter(p => p.id !== projectId));
    }
  };

  const handleSaveToDatabase = async (backupName, password) => {
    try {
      const result = await saveToDatabase(backupName, password, history, projects);
      
      if (result.success) {
        alert(result.message);
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error in handleSaveToDatabase:', error);
      alert('Error saving to database: ' + error.message);
    }
  };

  const handleImportFromDatabase = async (backupName, password) => {
    try {
      const result = await importFromDatabase(backupName, password);
      
      if (result.success) {
        const importedProjects = result.data.projects;
        const importedHistory = result.data.history;
        const existingProjectIds = new Set(projects.map(p => p.id));
        const existingCalcIds = new Set(history.map(h => h.id));
        const newProjects = importedProjects.filter(p => !existingProjectIds.has(p.id));
        const mergedProjects = [...projects, ...newProjects];
        const newHistory = importedHistory.filter(h => !existingCalcIds.has(h.id));
        const mergedHistory = [...history, ...newHistory];

        setProjects(mergedProjects);
        setHistory(mergedHistory);

        alert(
          `Data imported successfully!\n` +
          `Projects added: ${newProjects.length}\n` +
          `Calculations added: ${newHistory.length}\n` +
          `Backup: ${result.data.backupInfo.name}\n` +
          `Last updated: ${new Date(result.data.backupInfo.updatedAt).toLocaleString()}`
        );
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error in handleImportFromDatabase:', error);
      alert('Error importing from database: ' + error.message);
    }
  };

  return (
    <div className="app">
      <nav className="navbar">
        <h1>Tax Calculator</h1>
        <div className="nav-buttons">
          <button 
            className={currentPage === 'calculator' ? 'active' : ''}
            onClick={() => setCurrentPage('calculator')}
          >
            Tax Calculator
          </button>
          <button 
            className={currentPage === 'history' ? 'active' : ''}
            onClick={() => setCurrentPage('history')}
          >
            History ({history.length})
          </button>
          <button onClick={() => setShowProjectManager(true)}>
            Add Project
          </button>
          <button onClick={() => setShowCalculator(true)}>
            Calculator
          </button>
        </div>
      </nav>

      <div className="page-content">
        {currentPage === 'calculator' ? (
          <CalculatorPage
            inputs={inputs}
            setInputs={setInputs}
            projects={projects}
            onSave={saveCalculation}
          />
        ) : (
          <HistoryPage
            history={history}
            projects={projects}
            onLoad={loadCalculation}
            onDelete={deleteCalculation}
            onClear={clearHistory}
            onDeleteProject={deleteProject}
            onSaveToDatabase={handleSaveToDatabase}
            onImportFromDatabase={handleImportFromDatabase}
          />
        )}
      </div>

      {showCalculator && (
        <Calculator onClose={() => setShowCalculator(false)} />
      )}

      {showProjectManager && (
        <ProjectManager
          projects={projects}
          onAdd={addProject}
          onDelete={deleteProject}
          onClose={() => setShowProjectManager(false)}
        />
      )}
    </div>
  );
}