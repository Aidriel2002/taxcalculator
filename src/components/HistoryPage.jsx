import React, { useState } from 'react';

function HistoryPage({
  history,
  projects,
  onLoad,
  onDelete,
  onClear,
  onDeleteProject,
  onSaveToDatabase,
  onImportFromDatabase
}) {
  const [expandedProjects, setExpandedProjects] = useState({});
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [saveFormData, setSaveFormData] = useState({ name: '', password: '' });
  const [importFormData, setImportFormData] = useState({ name: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num || 0);
  };

  const toggleProject = (projectId) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const handleSaveToDatabase = async () => {
    if (!saveFormData.name.trim() || !saveFormData.password.trim()) {
      alert('Please enter both name and password');
      return;
    }

    setIsLoading(true);
    try {
      await onSaveToDatabase(saveFormData.name, saveFormData.password);
      setShowSaveModal(false);
      setSaveFormData({ name: '', password: '' });
    } catch (error) {
      console.error('Error in save:', error);
      alert('Error saving to database');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportFromDatabase = async () => {
    if (!importFormData.name.trim() || !importFormData.password.trim()) {
      alert('Please enter both name and password');
      return;
    }

    setIsLoading(true);
    try {
      await onImportFromDatabase(importFormData.name, importFormData.password);
      setShowImportModal(false);
      setImportFormData({ name: '', password: '' });
    } catch (error) {
      console.error('Error in import:', error);
      alert('Error importing from database');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadAllHistory = () => {
    const lines = ['TAX CALCULATOR - CALCULATION HISTORY\n'];
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push(`Total Calculations: ${history.length}\n`);

    history.forEach((entry, index) => {
      lines.push(`\n=== CALCULATION ${index + 1} ===`);
      lines.push(`Date: ${entry.timestamp}`);
      if (entry.inputs.projectName) {
        lines.push(`Project Name: ${entry.inputs.projectName}`);
      }
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

  const groupedHistory = {};
  const unassigned = [];

  history.forEach(entry => {
    const projectId = entry.inputs.projectId;
    if (projectId) {
      if (!groupedHistory[projectId]) {
        groupedHistory[projectId] = [];
      }
      groupedHistory[projectId].push(entry);
    } else {
      unassigned.push(entry);
    }
  });

  return (
    <div className="history-page">
      <div className="history-header" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: 0 }}>Calculation History</h2>

        <div className="history-actions" style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          width: '100%'
        }}>
          <button className="downloadbttn" onClick={downloadAllHistory} style={{
            flex: '1 1 auto',
            minWidth: '140px',
            padding: '10px 15px',
            fontSize: '14px',
            whiteSpace: 'nowrap'
          }}>
            ⬇️ Download All
          </button>
          {typeof onSaveToDatabase === 'function' && (
            <button
              className="savedb-button"
              onClick={() => setShowSaveModal(true)}
              style={{
                flex: '1 1 auto',
                minWidth: '140px',
                padding: '10px 15px',
                fontSize: '14px',
                whiteSpace: 'nowrap'
              }}
            >
              💾 Save to Database
            </button>
          )}
          {typeof onImportFromDatabase === 'function' && (
            <button
              className="importdb-button"
              onClick={() => setShowImportModal(true)}
              style={{
                flex: '1 1 auto',
                minWidth: '140px',
                padding: '10px 15px',
                fontSize: '14px',
                whiteSpace: 'nowrap'
              }}
            >
              📥 Import from Database
            </button>
          )}
        </div>
      </div>

      {history.length === 0 ? (
        <div className="empty-state">
          <p>No saved calculations yet.</p>
        </div>
      ) : (
        <div className="history-table-container">
          {projects.map(project => {
            const projectCalcs = groupedHistory[project.id] || [];
            if (projectCalcs.length === 0) return null;

            const isExpanded = expandedProjects[project.id];

            return (
              <div key={project.id} className="project-table-section">
                <div
                  className="project-table-header"
                  onClick={() => toggleProject(project.id)}
                >
                  <div className="project-table-header-left">
                    <span className="collapse-icon">{isExpanded ? '▼' : '▶'}</span>
                    <span className="project-icon">📁</span>
                    <span className="project-name">{project.name}</span>
                    <span className="project-count">({projectCalcs.length} calculation{projectCalcs.length !== 1 ? 's' : ''})</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="history-table-wrapper">
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Name</th>
                          <th>Contract Price</th>
                          <th>Expenses (VAT)</th>
                          <th>Expenses (Non-VAT)</th>
                          <th>Net Income</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectCalcs.map(entry => (
                          <tr key={entry.id} className="history-table-row">
                            <td className="date-cell">{entry.timestamp}</td>
                            <td className="name-cell">{entry.inputs.projectName || '-'}</td>
                            <td className="currency-cell">{formatCurrency(entry.inputs.abc)}</td>
                            <td className="currency-cell">{formatCurrency(entry.inputs.expensesVatInc)}</td>
                            <td className="currency-cell">{formatCurrency(entry.inputs.expensesNonVat)}</td>
                            <td className="currency-cell net-income">{formatCurrency(entry.results.netIncomeAfterTax)}</td>
                            <td className="actions-cell">
                              <button
                                className="btn-table-primary"
                                onClick={() => onLoad(entry)}
                                title="Load calculation"
                              >
                                Load
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}

          {unassigned.length > 0 && (
            <div className="project-table-section">
              <div
                className="project-table-header"
                onClick={() => toggleProject('unassigned')}
              >
                <div className="project-table-header-left">
                  <span className="collapse-icon">{expandedProjects['unassigned'] ? '▼' : '▶'}</span>
                  <span className="project-icon">📄</span>
                  <span className="project-name">Unassigned</span>
                  <span className="project-count">({unassigned.length} calculation{unassigned.length !== 1 ? 's' : ''})</span>
                </div>
              </div>

              {expandedProjects['unassigned'] && (
                <div className="history-table-wrapper">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Name</th>
                        <th>Contract Price</th>
                        <th>Expenses (VAT)</th>
                        <th>Expenses (Non-VAT)</th>
                        <th>Net Income</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unassigned.map(entry => (
                        <tr key={entry.id} className="history-table-row">
                          <td className="date-cell">{entry.timestamp}</td>
                          <td className="name-cell">{entry.inputs.projectName || '-'}</td>
                          <td className="currency-cell">{formatCurrency(entry.inputs.abc)}</td>
                          <td className="currency-cell">{formatCurrency(entry.inputs.expensesVatInc)}</td>
                          <td className="currency-cell">{formatCurrency(entry.inputs.expensesNonVat)}</td>
                          <td className="currency-cell net-income">{formatCurrency(entry.results.netIncomeAfterTax)}</td>
                          <td className="actions-cell">
                            <button
                              className="btn-table-primary"
                              onClick={() => onLoad(entry)}
                              title="Load calculation"
                            >
                              Load
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            minWidth: '400px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>Save to Database</h3>
            <input
              type="text"
              placeholder="Backup Name"
              value={saveFormData.name}
              onChange={(e) => setSaveFormData({ ...saveFormData, name: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '15px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={saveFormData.password}
              onChange={(e) => setSaveFormData({ ...saveFormData, password: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '20px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowSaveModal(false)} style={{
                padding: '10px 20px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}>
                Cancel
              </button>
              <button onClick={handleSaveToDatabase} disabled={isLoading} style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#007bff',
                color: 'white',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: isLoading ? 0.6 : 1
              }}>
                {isLoading ? 'Saving...' : '💾 Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            minWidth: '400px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>Import from Database</h3>
            <input
              type="text"
              placeholder="Backup Name"
              value={importFormData.name}
              onChange={(e) => setImportFormData({ ...importFormData, name: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '15px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={importFormData.password}
              onChange={(e) => setImportFormData({ ...importFormData, password: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '20px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowImportModal(false)} style={{
                padding: '10px 20px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}>
                Cancel
              </button>
              <button onClick={handleImportFromDatabase} disabled={isLoading} style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#28a745',
                color: 'white',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: isLoading ? 0.6 : 1
              }}>
                {isLoading ? 'Importing...' : '📥 Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HistoryPage;
