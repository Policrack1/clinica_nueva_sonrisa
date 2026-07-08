import axios from 'axios'

const api = axios.create({
  // Forzamos la URL de Render para producción si no lee la variable de entorno
  baseURL: import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api`
    : 'https://clinica-nueva-sonrisa.onrender.com/api',
  timeout: 10000,
});

// Adjuntar token automáticamente en cada request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('ns_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Si el servidor responde 401/403, limpiar sesión
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      console.error('ERROR AUTH:', err.response)
    }
    return Promise.reject(err)
  }
)

export default api