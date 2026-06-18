import React from 'react';

export default function App() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Meu MVP de Câmera</h1>
      <button onClick={() => alert("O código antigo foi limpo!")}>
        Capturar Momento
      </button>
    </div>
  );
}