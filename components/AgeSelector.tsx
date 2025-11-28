import React from 'react';
import { AgeRange } from '../types';

interface AgeSelectorProps {
  range: string;
  count: number;
  onIncrement: (range: string) => void;
  onDecrement: (range: string) => void;
}

export const AgeSelector: React.FC<AgeSelectorProps> = ({ range, count, onIncrement, onDecrement }) => {
  const isActive = count > 0;

  return (
    <div 
      className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
        isActive 
          ? 'bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-500' 
          : 'bg-white border-gray-200 hover:border-blue-300'
      }`}
    >
      <div className="flex items-center">
        <span className={`text-lg font-bold ${isActive ? 'text-blue-900' : 'text-gray-700'}`}>
          {range} <span className={`text-sm font-normal ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>anos</span>
        </span>
      </div>
      
      <div className="flex items-center space-x-3">
        <button
          onClick={() => onDecrement(range)}
          disabled={count === 0}
          className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
            count === 0 
              ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
              : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-100'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
          </svg>
        </button>
        
        <span className={`w-8 text-center font-bold text-xl ${isActive ? 'text-blue-800' : 'text-gray-300'}`}>
          {count}
        </span>

        <button
          onClick={() => onIncrement(range)}
          className={`w-8 h-8 flex items-center justify-center rounded-full text-white transition-colors shadow-sm ${
            isActive 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>
    </div>
  );
};