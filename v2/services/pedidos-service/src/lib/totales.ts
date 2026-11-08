export interface LineaParaTotal {
  precioUnitario: number;
  cantidad: number;
}

const redondear = (valor: number): number => Math.round(valor * 100) / 100;

/** Suma el pedido en el servidor; el total del cliente nunca se reutiliza. */
export const calcularTotales = (lineas: LineaParaTotal[]) => {
  const subtotal = redondear(
    lineas.reduce((suma, linea) => suma + linea.precioUnitario * linea.cantidad, 0),
  );
  return { subtotal, total: subtotal };
};
