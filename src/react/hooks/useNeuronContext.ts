import { useContext } from 'react';
import { NeuronContext } from '../context';

export function useNeuronContext() {
  const context = useContext(NeuronContext);
  if (!context) {
    throw new Error('useNeuronContext must be used within NeuronWebProvider');
  }
  return context;
}
