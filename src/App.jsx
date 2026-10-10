import { useState, useEffect } from 'react';

// =========================================================================
// CUSTOM HOOK: Gestión del estado, formularios y cálculos (Según Informe)
// =========================================================================
function usePartyManager() {
  // Estado global de la aplicación persistido localmente
  const [parties, setParties] = useState(() => {
    const saved = localStorage.getItem('tarragona_parties');
    return saved ? JSON.parse(saved) : [];
  });

  // Estado del formulario
  const [formData, setFormData] = useState({
    cedula: '',
    guests: '',
    hours: ''
  });

  // Estado para los errores de validación
  const [errors, setErrors] = useState({});

  // Estado para la generación del recibo actual (Factura visible)
  const [currentResult, setCurrentResult] = useState(null);
  
  // Estado para las notificaciones (toasts)
  const [toasts, setToasts] = useState([]);
  
  // Estado para el modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Persistencia de la información de las fiestas
  useEffect(() => {
    localStorage.setItem('tarragona_parties', JSON.stringify(parties));
  }, [parties]);

  const addToast = (message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar el error cuando el usuario empieza a escribir de nuevo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Motor de Precios (Modificado para desglosar el cálculo)
  const calculateCost = (guests, hours) => {
    let costPerGuest = 0;
    // Lógica por invitados
    if (guests >= 1 && guests <= 100) costPerGuest = 8000;
    else if (guests >= 101 && guests <= 500) costPerGuest = 6000;
    else if (guests > 500) costPerGuest = 4000;

    let extraCost = 0;
    // Lógica por tiempo
    if (hours >= 1 && hours <= 3) extraCost = 100000;
    else if (hours >= 4 && hours <= 6) extraCost = 200000;
    else if (hours > 6) extraCost = 300000;

    const guestCostTotal = guests * costPerGuest;
    const totalCost = guestCostTotal + extraCost;

    return { costPerGuest, guestCostTotal, extraCost, totalCost };
  };

  const registerParty = (e) => {
    e.preventDefault();
    
    // Validación de datos personalizada para mejor UX
    const newErrors = {};
    
    if (!formData.cedula.trim()) {
      newErrors.cedula = 'Este campo es obligatorio para identificar al cliente.';
    }
    
    if (!formData.guests) {
      newErrors.guests = 'Debe indicar la cantidad de invitados.';
    } else if (parseInt(formData.guests) <= 0) {
      newErrors.guests = 'La cantidad de invitados debe ser mayor a 0.';
    }
    
    if (!formData.hours) {
      newErrors.hours = 'Debe indicar la duración del evento.';
    } else if (parseInt(formData.hours) <= 0) {
      newErrors.hours = 'El evento debe durar al menos 1 hora.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addToast('Por favor, revise los campos en rojo e intente nuevamente.');
      return;
    }

    const guests = parseInt(formData.guests);
    const hours = parseInt(formData.hours);
    const cedula = formData.cedula;

    const { costPerGuest, guestCostTotal, extraCost, totalCost } = calculateCost(guests, hours);
    
    // Generación de un número de factura único
    const invoiceId = 'FAC-' + Math.floor(10000 + Math.random() * 90000);

    const newParty = {
      id: Date.now(),
      invoiceId,
      cedula,
      guests,
      hours,
      costPerGuest,
      guestCostTotal,
      extraCost,
      totalCost,
      date: new Date().toLocaleDateString()
    };

    setParties(prev => [newParty, ...prev]);
    setCurrentResult(newParty);
    setFormData({ cedula: '', guests: '', hours: '' });
    setErrors({});
    addToast('Recepción y Factura registradas exitosamente.');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Función para visualizar cualquier factura del historial
  const viewInvoice = (id) => {
    const party = parties.find(p => p.id === id);
    if (party) {
      setCurrentResult(party);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Lógica del Modal Personalizado
  const requestClearHistory = () => {
    setShowConfirmModal(true);
  };

  const cancelClearHistory = () => {
    setShowConfirmModal(false);
  };

  const confirmClearHistory = () => {
    setParties([]);
    setCurrentResult(null);
    setShowConfirmModal(false);
    addToast('Registro histórico restablecido de forma segura.');
  };

  // Procesamiento en tiempo real de los cálculos totales
  const metrics = {
    totalGuests: parties.reduce((sum, party) => sum + party.guests, 0),
    totalHours: parties.reduce((sum, party) => sum + party.hours, 0),
    range1to3: parties.filter(p => p.hours >= 1 && p.hours <= 3).length,
    range4to6: parties.filter(p => p.hours >= 4 && p.hours <= 6).length,
    rangeOver6: parties.filter(p => p.hours > 6).length
  };

  return {
    parties,
    formData,
    errors,
    currentResult,
    toasts,
    showConfirmModal,
    metrics,
    handleInputChange,
    registerParty,
    viewInvoice,
    requestClearHistory,
    cancelClearHistory,
    confirmClearHistory
  };
}

// =========================================================================
// COMPONENTE PRINCIPAL
// =========================================================================
export default function App() {
  const {
    parties,
    formData,
    errors,
    currentResult,
    toasts,
    showConfirmModal,
    metrics,
    handleInputChange,
    registerParty,
    viewInvoice,
    requestClearHistory,
    cancelClearHistory,
    confirmClearHistory
  } = usePartyManager();

  return (
    <div className="app-container">
      <header className="header">
        <p>Salón de Eventos</p>
        <h1>Tarragona</h1>
      </header>

      <div className="dashboard">
        
        {/* Left Column: Form and Pricing Tables */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {/* Registro de Eventos */}
          <div className="luxury-panel">
            <h2 className="panel-title">Nueva Recepción</h2>

            <form onSubmit={registerParty} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="cedula">Cédula del Contratante</label>
                <input
                  type="text"
                  id="cedula"
                  name="cedula"
                  className={`form-input ${errors.cedula ? 'has-error' : ''}`}
                  placeholder="Ej. 100234567"
                  value={formData.cedula}
                  onChange={handleInputChange}
                />
                {errors.cedula && <span className="error-text">{errors.cedula}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="guests">Cantidad de Invitados</label>
                <input
                  type="number"
                  id="guests"
                  name="guests"
                  className={`form-input ${errors.guests ? 'has-error' : ''}`}
                  placeholder="Ej. 150"
                  value={formData.guests}
                  onChange={handleInputChange}
                />
                {errors.guests && <span className="error-text">{errors.guests}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="hours">Número de Horas</label>
                <input
                  type="number"
                  id="hours"
                  name="hours"
                  className={`form-input ${errors.hours ? 'has-error' : ''}`}
                  placeholder="Ej. 5"
                  value={formData.hours}
                  onChange={handleInputChange}
                />
                {errors.hours && <span className="error-text">{errors.hours}</span>}
              </div>

              <button type="submit" className="btn">
                Cotizar y Registrar
              </button>
            </form>
          </div>

          {/* Tarifas de Servicios */}
          <div className="luxury-panel" style={{ padding: '2.5rem' }}>
            <h2 className="panel-title" style={{ fontSize: '1.2rem', marginBottom: '1.5rem', border: 'none', padding: 0 }}>Tarifas de Servicios</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
              Consulte nuestros precios vigentes. El monto a cobrar por la fiesta depende de la cantidad de invitados y la duración del evento.
            </p>
            
            <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: '0.5rem', fontWeight: 600 }}>Costo por Invitado</h3>
            <table className="luxury-table" style={{ marginBottom: '2rem', marginTop: 0 }}>
              <tbody>
                <tr>
                  <td style={{ padding: '0.8rem 0' }}>Entre 1 y 100 invitados</td>
                  <td style={{ padding: '0.8rem 0', textAlign: 'right', fontWeight: 500 }}>$8.000 c/u</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.8rem 0' }}>Entre 101 y 500 invitados</td>
                  <td style={{ padding: '0.8rem 0', textAlign: 'right', fontWeight: 500 }}>$6.000 c/u</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.8rem 0' }}>Más de 500 invitados</td>
                  <td style={{ padding: '0.8rem 0', textAlign: 'right', fontWeight: 500 }}>$4.000 c/u</td>
                </tr>
              </tbody>
            </table>

            <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: '0.5rem', fontWeight: 600 }}>Cuota Adicional por Horas</h3>
            <table className="luxury-table" style={{ marginTop: 0 }}>
              <tbody>
                <tr>
                  <td style={{ padding: '0.8rem 0' }}>De 1 a 3 horas</td>
                  <td style={{ padding: '0.8rem 0', textAlign: 'right', fontWeight: 500 }}>$100.000</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.8rem 0' }}>De 4 a 6 horas</td>
                  <td style={{ padding: '0.8rem 0', textAlign: 'right', fontWeight: 500 }}>$200.000</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.8rem 0' }}>Más de 6 horas</td>
                  <td style={{ padding: '0.8rem 0', textAlign: 'right', fontWeight: 500 }}>$300.000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Results and Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          
          {/* Current Party Result */}
          {currentResult && (
            <div className="luxury-panel">
              <h2 className="panel-title">Recibo Generado</h2>
              
              <div className="stat-grid" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
                <div className="stat-item">
                  <span className="stat-label">N° de Factura</span>
                  <span className="stat-value" style={{ fontSize: '1.2rem' }}>{currentResult.invoiceId}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Cliente (Cédula)</span>
                  <span className="stat-value" style={{ fontSize: '1.2rem' }}>{currentResult.cedula}</span>
                </div>
              </div>
              
              <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 600 }}>Desglose de Facturación</h3>
              <ul className="summary-list" style={{ marginBottom: '2rem' }}>
                <li>
                  <span style={{ color: 'var(--text-muted)' }}>Costo por Invitados ({currentResult.guests} x ${currentResult.costPerGuest.toLocaleString('es-CO')})</span>
                  <span style={{ fontWeight: 500 }}>${currentResult.guestCostTotal.toLocaleString('es-CO')}</span>
                </li>
                <li>
                  <span style={{ color: 'var(--text-muted)' }}>Cuota por Duración ({currentResult.hours} horas)</span>
                  <span style={{ fontWeight: 500 }}>${currentResult.extraCost.toLocaleString('es-CO')}</span>
                </li>
              </ul>

              <div className="stat-grid" style={{ marginBottom: 0 }}>
                <div className="stat-item stat-total" style={{ borderTop: 'none', paddingTop: 0 }}>
                  <span className="stat-label" style={{ color: 'var(--accent)', fontWeight: 600 }}>Monto Total a Cancelar (COP)</span>
                  <span className="stat-value">${currentResult.totalCost.toLocaleString('es-CO')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Monthly Summary */}
          <div className="luxury-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
              <h2 className="panel-title" style={{ border: 'none', margin: 0, padding: 0 }}>Panel de Administración</h2>
              {parties.length > 0 && (
                <button onClick={requestClearHistory} className="btn btn-outline" style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.75rem' }}>
                  Restablecer
                </button>
              )}
            </div>
            
            {parties.length === 0 ? (
              <div className="empty-state">
                <p>No se han registrado eventos recientemente.</p>
              </div>
            ) : (
              <>
                <div className="stat-grid" style={{ marginBottom: '3rem' }}>
                  <div className="stat-item">
                    <span className="stat-label" style={{ color: 'var(--accent)', fontWeight: 600 }}>Total Invitados (Mes)</span>
                    <span className="stat-value">{metrics.totalGuests}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label" style={{ color: 'var(--accent)', fontWeight: 600 }}>Total Horas Efectuadas (Mes)</span>
                    <span className="stat-value">{metrics.totalHours}</span>
                  </div>
                </div>

                <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 600 }}>Total de Eventos Clasificados por Duración</h3>
                <ul className="summary-list">
                  <li>
                    <span>Eventos de 1 a 3 horas</span>
                    <span className="badge">{metrics.range1to3}</span>
                  </li>
                  <li>
                    <span>Eventos de 4 a 6 horas</span>
                    <span className="badge">{metrics.range4to6}</span>
                  </li>
                  <li>
                    <span>Eventos de más de 6 horas</span>
                    <span className="badge">{metrics.rangeOver6}</span>
                  </li>
                </ul>

                <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', margin: '3rem 0 1rem 0', fontWeight: 600 }}>
                  Registro Histórico
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="luxury-table">
                    <thead>
                      <tr>
                        <th>Factura N°</th>
                        <th>Cédula</th>
                        <th>Invitados</th>
                        <th>Horas</th>
                        <th>Cotización</th>
                        <th style={{ textAlign: 'right' }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Removido el slice(0,5) para que se vean todas y se pueda navegar el historial completo */}
                      {parties.map(p => (
                        <tr key={p.id}>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.invoiceId}</td>
                          <td>{p.cedula}</td>
                          <td>{p.guests}</td>
                          <td>{p.hours}</td>
                          <td style={{ fontWeight: 600 }}>${p.totalCost.toLocaleString('es-CO')}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              onClick={() => viewInvoice(p.id)}
                              style={{ 
                                background: 'none', 
                                border: 'none', 
                                textDecoration: 'underline', 
                                color: 'var(--accent)', 
                                cursor: 'pointer', 
                                fontFamily: 'Montserrat, sans-serif', 
                                fontSize: '0.75rem', 
                                fontWeight: 600,
                                textTransform: 'uppercase'
                              }}
                            >
                              Ver Recibo
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmación */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Restablecer Historial</h2>
            <p>¿Está seguro que desea eliminar todo el registro histórico de eventos? Esta acción no se puede deshacer.</p>
            <div className="modal-actions">
              <button className="btn btn-outline" style={{ marginTop: 0, padding: '1rem 2rem' }} onClick={cancelClearHistory}>Cancelar</button>
              <button className="btn" style={{ marginTop: 0, padding: '1rem 2rem', background: 'var(--error)', borderColor: 'var(--error)' }} onClick={confirmClearHistory}>Eliminar Datos</button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className="toast">
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
