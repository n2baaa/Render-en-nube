# Fuentes técnicas · Mecánica del motor y arranque en pendiente (3D)

1. **SAE International / Bosch Automotive Handbook (10th Edition) — *Internal Combustion Engines & Cranktrain Kinematics***
   - URL: https://www.sae.org/publications/books/content/bos10/
   - Principios verificados: Transformación del movimiento alternativo lineal del pistón en movimiento rotatorio mediante el mecanismo biela-manivela (cigüeñal). Régimen mínimo de ralentí estable (~800–900 RPM) mantenido por la inercia rotacional del volante de inercia.

2. **Budynas & Nisbett — *Shigley's Mechanical Engineering Design* (Clutches, Brakes, Couplings, and Flywheels)**
   - URL: https://www.mheducation.com/highered/product/shigley-s-mechanical-engineering-design-budynas-nisbett/M9780073398204.html
   - Principios verificados: Transmisión progresiva de par por fricción deslizante en embragues monodisco secos (automóvil) y multidisco húmedos (motocicleta): $T = \mu \cdot F_N \cdot R_m$. Durante el acoplamiento inicial existe deslizamiento controlado ($\omega_{\text{motor}} > \omega_{\text{entrada}}$), permitiendo transmitir torque a ruedas inicialmente detenidas ($\omega_{\text{rueda}} = 0$).

3. **Gillespie, T. D. — *Fundamentals of Vehicle Dynamics* (SAE International) — *Tractive Effort & Grade Resistance***
   - URL: https://www.sae.org/publications/books/content/r-114/
   - Principios verificados:
     - Resistencia gravitatoria en pendiente: $F_g = m \cdot g \cdot \sin(\theta)$.
     - Multiplicación de par en primera marcha y diferencial: $\tau_{\text{rueda}} = \tau_{\text{motor}} \cdot i_{\text{1a}} \cdot i_{\text{dif}} \cdot \eta$.
     - Fuerza de tracción en el parche de contacto del neumático: $F_{\text{tracción}} = \tau_{\text{rueda}} / r_{\text{rueda}}$. El vehículo vence la pendiente cuando $F_{\text{tracción}} > m \cdot g \cdot \sin(\theta)$.
