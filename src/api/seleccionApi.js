import axiosClient from './axiosClient';
import { LIGA_PRINCIPAL } from '../config/ligas';

// El Relámpago Selección vive siempre en el backend de la Liga Nacional (tablas seleccion_*),
// se esté jugando la liga que se esté jugando: el link, el QR y el banner andan desde cualquiera.
const conf = (extra = {}) => ({ baseURL: LIGA_PRINCIPAL.apiUrl, ...extra });

// ── Público (mismas respuestas que showdownApi) ──────────────────────────────
export const seleccionApi = {
    getEvento: (codigo) => axiosClient.get(`/seleccion/${codigo}`, conf()).then(r => r.data),
    getMercado: (codigo) => axiosClient.get(`/seleccion/${codigo}/mercado`, conf()).then(r => r.data),
    participar: (codigo, payload) => axiosClient.post(`/seleccion/${codigo}/participar`, payload, conf()).then(r => r.data),
    verificarInscripcion: (codigo, email, uuidDispositivo) =>
        axiosClient.get(`/seleccion/${codigo}/verificar-inscripcion`, conf({ params: { email, uuidDispositivo } })),
    getRanking: (codigo, uuidDispositivo) =>
        axiosClient.get(`/seleccion/${codigo}/ranking`, conf({ params: { uuidDispositivo } })).then(r => r.data),
    getMiEquipo: (codigo, uuidDispositivo) =>
        axiosClient.get(`/seleccion/${codigo}/mi-equipo`, conf({ params: { uuidDispositivo } })).then(r => r.data),
};

// Evento con la inscripción abierta para el banner (null si no hay)
export const getSeleccionActivo = () =>
    axiosClient.get('/seleccion/activo', conf()).then(r => (r.status === 204 ? null : r.data || null));

export const linkSeleccion = (codigo) => `${window.location.origin}/seleccion/${codigo}`;

// ── Admin ────────────────────────────────────────────────────────────────────
const admin = '/admin/seleccion';

export const getEquiposSeleccion = () => axiosClient.get(`${admin}/equipos`, conf()).then(r => r.data);
export const guardarEquipoSeleccion = (equipo) => (equipo.id
    ? axiosClient.put(`${admin}/equipos/${equipo.id}`, equipo, conf())
    : axiosClient.post(`${admin}/equipos`, equipo, conf())).then(r => r.data);
export const eliminarEquipoSeleccion = (id) => axiosClient.delete(`${admin}/equipos/${id}`, conf());

export const getJugadoresSeleccion = () => axiosClient.get(`${admin}/jugadores`, conf()).then(r => r.data);
export const guardarJugadorSeleccion = (jugador) => (jugador.id
    ? axiosClient.put(`${admin}/jugadores/${jugador.id}`, jugador, conf())
    : axiosClient.post(`${admin}/jugadores`, jugador, conf())).then(r => r.data);
export const eliminarJugadorSeleccion = (id) => axiosClient.delete(`${admin}/jugadores/${id}`, conf());

export const getEventosSeleccion = () => axiosClient.get(`${admin}/eventos`, conf()).then(r => r.data);
export const crearEventoSeleccion = (evento) => axiosClient.post(`${admin}/eventos`, evento, conf()).then(r => r.data);
export const editarEventoSeleccion = (id, evento) => axiosClient.put(`${admin}/eventos/${id}`, evento, conf()).then(r => r.data);
export const eliminarEventoSeleccion = (id) => axiosClient.delete(`${admin}/eventos/${id}`, conf());
export const getParticipantesSeleccion = (id) => axiosClient.get(`${admin}/eventos/${id}/participantes`, conf()).then(r => r.data);
export const getPlanillaSeleccion = (id) => axiosClient.get(`${admin}/eventos/${id}/planilla`, conf()).then(r => r.data);
export const guardarPlanillaSeleccion = (id, planilla) =>
    axiosClient.put(`${admin}/eventos/${id}/planilla`, planilla, conf()).then(r => r.data);

export const mensajeDeError = (error, porDefecto) => error?.response?.data?.mensaje || porDefecto;
