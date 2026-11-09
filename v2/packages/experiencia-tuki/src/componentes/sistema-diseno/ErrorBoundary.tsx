import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Captura errores de renderizado para que un fallo en un componente
 * no deje toda la aplicación en blanco.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Deja rastro en consola para depurar sin bloquear la interfaz.
    console.error('Error de renderizado capturado:', error, info);
  }

  reiniciar = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen bg-af-ground text-af-ink flex items-center justify-center p-6 font-system">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-af-surface flex items-center justify-center text-af-danger text-3xl font-bold">
            !
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Algo salió mal</h1>
          <p className="text-sm text-af-ink-secondary leading-relaxed">
            La aplicación encontró un error inesperado. Puedes recargar la página o volver al inicio.
          </p>
          <pre className="text-xs text-left bg-af-surface rounded-xl p-4 overflow-auto max-h-40 text-af-ink-secondary">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <div className="flex gap-3 justify-center">
            <button onClick={() => this.reiniciar()} className="btn-af px-6 py-3">
              Reintentar
            </button>
            <button onClick={() => { window.location.href = '/'; }} className="btn-af-secondary px-6 py-3">
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
