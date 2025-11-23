
import { Platillo } from '../tipos/modelos';

// --- API PROPIA 1: SERVICIO DE DISPONIBILIDAD HORARIA ---
export const apiHorarios = {
  validarDisponibilidad: async (apertura: string, cierre: string) => {
    // Simular latencia de red
    await new Promise(resolve => setTimeout(resolve, 200));

    const ahora = new Date();
    const horaActual = ahora.getHours();
    const minutoActual = ahora.getMinutes();
    const minutosDiaActual = horaActual * 60 + minutoActual;

    // Parsear horarios "HH:mm"
    const [hA, mA] = apertura.split(':').map(Number);
    const [hC, mC] = cierre.split(':').map(Number);
    
    const inicioMinutos = hA * 60 + mA;
    const finMinutos = hC * 60 + mC;

    let abierto = false;
    let mensaje = "Cerrado";
    let tiempoRestante = "";

    // Manejo de horario normal vs horario nocturno (cruzando medianoche)
    if (finMinutos > inicioMinutos) {
      // Caso: 09:00 a 22:00
      abierto = minutosDiaActual >= inicioMinutos && minutosDiaActual < finMinutos;
    } else {
      // Caso: 18:00 a 02:00 (finMinutos es menor porque es el día siguiente)
      abierto = minutosDiaActual >= inicioMinutos || minutosDiaActual < finMinutos;
    }

    if (abierto) {
      // Calcular tiempo restante para cerrar
      let diff = 0;
      if (minutosDiaActual < finMinutos) {
         diff = finMinutos - minutosDiaActual;
      } else {
         // Si cruza medianoche y estamos antes de medianoche
         diff = (1440 - minutosDiaActual) + finMinutos; 
      }
      
      const horasR = Math.floor(diff / 60);
      const minsR = diff % 60;
      tiempoRestante = `${horasR}h ${minsR}min para cerrar`;
      mensaje = "Abierto";
    } else {
      mensaje = `Cerrado. Abre a las ${apertura}`;
    }

    return {
      abierto,
      mensaje,
      tiempo_restante: tiempoRestante,
      timestamp: ahora.toISOString()
    };
  }
};

// --- API PROPIA 2: GENERADOR DE CÓDIGOS QR ---
export const apiQR = {
  generarCodigoQR: (urlDestino: string, colorHex: string = "000000", size: number = 400) => {
    // Limpiar el hash del color si lo trae
    const colorLimpio = colorHex.replace('#', '');
    
    // Construir URL usando servicio externo pero encapsulado como servicio propio
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(urlDestino)}&color=${colorLimpio}&bgcolor=FFFFFF&margin=10&ecc=H`;
    
    return {
      imagen_url: qrUrl,
      formato: "png",
      meta: { size, color: colorLimpio }
    };
  }
};

// --- API PROPIA 3: GENERADOR DE LINK WHATSAPP (Refactorizado) ---
export const apiWhatsApp = {
  generarLinkPedido: (
    restaurante: { nombre: string, telefono: string },
    cliente: { nombre: string, direccion: string, telefono: string },
    pedido: { items: { nombre: string, cantidad: number, precio: number }[], total: number }
  ) => {
    
    const fecha = new Date().toLocaleDateString('es-CO', { hour: '2-digit', minute: '2-digit' });
    
    const itemsStr = pedido.items.map((item, index) => 
      `${index + 1}. *${item.nombre}*%0A   └ Cantidad: ${item.cantidad} unidad${item.cantidad > 1 ? 'es' : ''}%0A   └ Precio unitario: $${item.precio.toLocaleString()}%0A   └ Subtotal: $${(item.precio * item.cantidad).toLocaleString()}`
    ).join('%0A%0A');

    const mensaje = 
      `*¡Hola ${restaurante.nombre}!* 🍽️%0A%0A` +
      `Me gustaría realizar el siguiente pedido:%0A%0A` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%0A` +
      `*📋 DETALLE DEL PEDIDO*%0A` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%0A%0A` +
      itemsStr + `%0A%0A` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%0A` +
      `💰 *TOTAL A PAGAR: $${pedido.total.toLocaleString()}*%0A` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%0A%0A` +
      `📦 *DATOS DE ENTREGA*%0A` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%0A` +
      `👤 *Cliente:* ${cliente.nombre}%0A` +
      `📱 *Teléfono:* ${cliente.telefono}%0A` +
      `📍 *Dirección:* ${cliente.direccion}%0A%0A` +
      `🕒 *Pedido realizado:* ${fecha}%0A%0A` +
      `¡Quedo atento a la confirmación! ✅`;

    const numeroLimpio = restaurante.telefono.replace(/\D/g, '');
    
    return {
      url: `https://wa.me/57${numeroLimpio}?text=${mensaje}`,
      mensaje_texto: mensaje
    };
  }
};

// --- API PROPIA 4: SERVICIO DE SALUDO DINÁMICO ---
export const apiSaludo = {
  obtenerMensajeBienvenida: async (nombreRestaurante: string) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const hora = new Date().getHours();
    let momento = "";
    let icono = "";

    if (hora >= 5 && hora < 12) { momento = "Buenos días"; icono = "☀️"; } 
    else if (hora >= 12 && hora < 19) { momento = "Buenas tardes"; icono = "🌤️"; } 
    else { momento = "Buenas noches"; icono = "🌙"; }

    return {
      mensaje: `¡${momento}! ${icono} En ${nombreRestaurante} estamos listos para atenderte.`,
      timestamp: new Date().toISOString()
    };
  }
};
