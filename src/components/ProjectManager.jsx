import React, { useState } from 'react';

export default function ProjectManager({ projects, onAdd, onDelete, onClose }) {
  const [newProjectName, setNewProjectName] = useState('');

  const handleAdd = () => {
    if (newProjectName.trim()) {
      onAdd(newProjectName.trim());
      setNewProjectName('');
    }
  };

  return (
    <div className="calculator-modal-overlay" onClick={onClose}>
      <div className="calculator-modal project-modal" onClick={(e) => e.stopPropagation()}>
        <div className="calculator-modal-header">
          <h3>Manage Projects</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="project-manager-body">
          <div className="add-project-section">
            <h4>Add New Project</h4>
            <div className="add-project-input">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="Enter project name"
              />
              <button className="btn-primary" onClick={handleAdd}>
                Add Project
              </button>
            </div>
          </div>

          <div className="projects-list-section">
            <h4>Existing Projects ({projects.length})</h4>
            {projects.length === 0 ? (
              <p className="empty-projects">No projects yet. Add one above!</p>
            ) : (
              <div className="projects-list">
                {projects.map(project => (
                  <div key={project.id} className="project-item">
                    <div className="project-info">
                      <span className="project-icon">📁</span>
                      <span className="project-name">{project.name}</span>
                    </div>
                    <button
                      className="btn-secondary"
                      onClick={() => onDelete(project.id)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}