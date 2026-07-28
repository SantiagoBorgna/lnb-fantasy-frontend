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
                    <p className="text-textMuted text-sm">Última actualización: Agosto 2026</p>

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
                            <li>Dirección de correo electrónico (vía inicio de sesión con Google/Microsoft).</li>
                            <li>Nombre de usuario y nombre del equipo virtual.</li>
                            <li>Datos de uso y navegación dentro de la Aplicación (estadísticas de juego).</li>
                        </ul>

                        <h2 className="text-lg font-bold text-accent mt-6">2. Uso de la Información</h2>
                        <p>
                            Su correo electrónico no será vendido ni compartido con terceros con fines publicitarios. Se utilizará exclusivamente para identificar su cuenta y mantener el progreso de su equipo.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
