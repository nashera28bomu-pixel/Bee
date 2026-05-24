import React from 'react';
import './FormBadge.css';

const FormBadge = ({ form = [], size = 'md' }) => {
  return (
    <div className={`form-strip size-${size}`}>
      {form.map((result, i) => (
        <span
          key={i}
          className={`form-dot result-${result.toLowerCase()}`}
          title={result === 'W' ? 'Win' : result === 'D' ? 'Draw' : result === 'L' ? 'Loss' : 'N/A'}
        >
          {result}
        </span>
      ))}
    </div>
  );
};

export default FormBadge;
