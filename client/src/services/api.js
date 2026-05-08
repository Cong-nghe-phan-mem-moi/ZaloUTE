const API_URL = 'http://localhost:5000/api';

export const fetchUsers = () => fetch(`${API_URL}/users`).then(r => r.json());