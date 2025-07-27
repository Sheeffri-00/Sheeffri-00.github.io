/**
 * Interfaz que implementarán los elementos que pueden ser dibujables por canvas
 */
export interface Drawable {
    /**
     * Método que actualiza los valores de un objeto a dibujar
     */
    act: () => void;
    /**
     * Metodo que realiza el dibujado de un objeto
     */
    draw: () => void;
}