import React from 'react';
import ReactDOM from 'react-dom';
import SpillApp from './components/spill-app.js';

// Render when document is ready
document.addEventListener('DOMContentLoaded', function() {
  ReactDOM.render(
    <SpillApp />,
    document.getElementById('spill-app')
  );
});