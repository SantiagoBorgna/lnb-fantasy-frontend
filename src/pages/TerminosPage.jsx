import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TerminosPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-surface p-6 overflow-y-auto">
            <div className="max-w-2xl mx-auto pb-12">
                <button
                    onClick={() => navigate(-1)}
                    className="text-textMuted text-sm mb-6 flex items-center gap-1 hover:text-textMain transition-colors mt-4"
                >
                    ← Volver
                </button>

                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-6">
                    <h1 className="text-2xl font-black text-textMain">Términos y Condiciones</h1>
                    <p className="text-textMuted text-sm">Última actualización: Septiembre 2026</p>

                    <div className="space-y-4 text-textMain text-sm leading-relaxed">
                        <p>
                            Bienvenido a <strong>Sexto Hombre Fantasy</strong> (en adelante, "la Aplicación"). Al acceder y utilizar la Aplicación, usted acepta estar sujeto a los siguientes Términos y Condiciones. Si no está de acuerdo con estos términos, por favor no utilice la Aplicación.
                        </p>

                        <h2 className="text-lg font-bold text-accent mt-6">1. Naturaleza del Servicio</h2>
                        <p>
                            La Aplicación es un juego de fantasía deportivo ("Fantasy Sports") no oficial, de carácter lúdico y de entretenimiento, basado en los rendimientos estadísticos reales de jugadores de básquet. <strong>La Aplicación NO es una plataforma de apuestas.</strong> No se exige dinero real para participar, ni se entregan premios en dinero real por parte de los desarrolladores derivados del rendimiento en el juego.
                        </p>

                        <h2 className="text-lg font-bold text-accent mt-6">2. Propiedad Intelectual y Exención de Asociación</h2>
                        <p>
                            Sexto Hombre Fantasy es un proyecto independiente. <strong>No estamos afiliados, asociados, autorizados, respaldados ni conectados oficialmente de ninguna manera con la Liga Nacional de Básquet (LNB), la Asociación de Clubes (AdC)</strong>, ni con ninguno de sus clubes miembros.
                        </p>
                        <p>
                            Los nombres de los equipos y jugadores reales se utilizan de manera nominal y descriptiva con el único fin de reflejar datos estadísticos de dominio público. Todos los nombres, marcas registradas y logos de terceros pertenecen a sus respectivos dueños.
                        </p>

                        <h2 className="text-lg font-bold text-accent mt-6">3. Registro y Cuentas de Usuario</h2>
                        <p>
                            Para utilizar la Aplicación, el usuario debe registrarse proporcionando una dirección de correo electrónico válida.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-textMuted">
                            <li>El usuario es responsable de mantener la confidencialidad de su cuenta.</li>
                            <li>Está prohibido crear múltiples cuentas por persona para obtener ventajas competitivas (multicuenta). Nos reservamos el derecho de suspender o eliminar cuentas que violen esta regla o cualquier otra norma de "juego limpio".</li>
                        </ul>

                        <h2 className="text-lg font-bold text-accent mt-6">4. Disponibilidad y Errores en Estadísticas</h2>
                        <p>
                            La Aplicación depende de fuentes externas y procesamiento de datos para actualizar las estadísticas y puntajes.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-textMuted">
                            <li>No garantizamos que la plataforma esté libre de errores, demoras o interrupciones.</li>
                            <li>Los puntajes y estadísticas proporcionados en el juego se consideran finales una vez procesados, pero nos reservamos el derecho de corregir errores estadísticos evidentes si fuera necesario, sin que esto genere derecho a reclamo por parte de los usuarios.</li>
                        </ul>
                    </div>

                    <hr className="border-border my-8" />

                    <h1 className="text-2xl font-black text-textMain">Política de Privacidad</h1>

                    <div className="space-y-4 text-textMain text-sm leading-relaxed">
                        <h2 className="text-lg font-bold text-accent mt-6">1. Datos que recopilamos</h2>
                        <p>Recopilamos únicamente la información necesaria para el funcionamiento del juego:</p>
                        <ul className="list-disc pl-5 space-y-2 text-textMuted">
                            <li>Nombre, dirección de correo electrónico e imagen de perfil, obtenidos a través del inicio de sesión con Google o Microsoft (solo accedemos a su información básica de perfil; nunca a su contraseña ni a otros datos de su cuenta de Google/Microsoft).</li>
                            <li>Nombre de usuario y nombre del equipo virtual que usted crea dentro de la Aplicación.</li>
                            <li>Datos de uso y navegación dentro de la Aplicación (estadísticas de juego, equipos armados, puntajes).</li>
                            <li>Datos de analítica de uso del sitio (páginas visitadas, dispositivo, ubicación aproximada) recolectados de forma automática a través de Google Analytics.</li>
                        </ul>

                        <h2 className="text-lg font-bold text-accent mt-6">2. Uso de la Información</h2>
                        <p>
                            Utilizamos estos datos exclusivamente para: identificar su cuenta e iniciar sesión, mantener el progreso de su equipo virtual, mostrarle sus estadísticas dentro del juego, y entender de forma agregada cómo se usa la Aplicación para poder mejorarla. Su correo electrónico no será vendido ni compartido con terceros con fines publicitarios.
                        </p>

                        <h2 className="text-lg font-bold text-accent mt-6">3. Servicios de Terceros</h2>
                        <p>
                            Para operar la Aplicación usamos los siguientes proveedores, que pueden procesar datos en nuestro nombre bajo sus propias políticas de privacidad:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-textMuted">
                            <li><strong>Google / Microsoft:</strong> para el inicio de sesión (OAuth).</li>
                            <li><strong>Google Analytics:</strong> para estadísticas de uso del sitio.</li>
                            <li><strong>Vercel y Railway:</strong> como proveedores de hosting e infraestructura donde se almacenan los datos.</li>
                        </ul>
                        <p>
                            Usted puede revocar el acceso otorgado a la Aplicación en cualquier momento desde la configuración de su cuenta de Google (<span className="break-all">myaccount.google.com/permissions</span>) o Microsoft.
                        </p>

                        <h2 className="text-lg font-bold text-accent mt-6">4. Conservación de Datos</h2>
                        <p>
                            Conservamos sus datos mientras su cuenta permanezca activa. Si desea que eliminemos su cuenta y los datos asociados, puede solicitarlo por el medio de contacto indicado más abajo; procesaremos la solicitud en un plazo razonable, salvo que debamos conservar cierta información por obligaciones legales.
                        </p>

                        <h2 className="text-lg font-bold text-accent mt-6">5. Sus Derechos</h2>
                        <p>
                            Usted puede solicitarnos en cualquier momento: acceder a los datos personales que tenemos sobre usted, corregirlos si están desactualizados, o eliminarlos junto con su cuenta.
                        </p>

                        <h2 className="text-lg font-bold text-accent mt-6">6. Seguridad</h2>
                        <p>
                            Tomamos medidas razonables para proteger su información (conexiones cifradas vía HTTPS, acceso restringido a la base de datos), aunque ningún sistema es 100% infalible.
                        </p>

                        <h2 className="text-lg font-bold text-accent mt-6">7. Contacto</h2>
                        <p>
                            Ante cualquier consulta sobre esta Política de Privacidad o para ejercer sus derechos sobre sus datos, puede escribirnos a <strong>santiborgna5@gmail.com</strong>.
                        </p>

                        <h2 className="text-lg font-bold text-accent mt-6">8. Cambios a esta Política</h2>
                        <p>
                            Podemos actualizar esta Política de Privacidad ocasionalmente. La fecha de "Última actualización" al inicio de esta página refleja la versión vigente.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
