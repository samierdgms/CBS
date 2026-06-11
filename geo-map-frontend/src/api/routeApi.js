import api from './api';

const routeApi = {
    getAllRoutes: () => api.get('/Routes'),
    getRouteById: (id) => api.get(`/Routes/${id}`),
    createRoute: (data) => api.post('/Routes', data),
    addStop: (routeId, stopData) => api.post(`/Routes/${routeId}/stops`, stopData),
    reorderStops: (routeId, stopIds) => api.put(`/Routes/${routeId}/stops/reorder`, stopIds),
    deleteRoute: (id) => api.delete(`/Routes/${id}`),
    updateRoute: (id, data) => api.put(`/Routes/${id}`, data),
    updateStop: (routeId, stopId, data) => api.put(`/Routes/${routeId}/stops/${stopId}`, data),
    deleteStop: (routeId, stopId) => api.delete(`/Routes/${routeId}/stops/${stopId}`),
    insertStop: (routeId, order, stopData) =>
        api.post(`/Routes/${routeId}/stops/insert?targetOrder=${order}`, stopData)
    
};

export default routeApi;