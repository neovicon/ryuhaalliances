import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const fetchTiles = async () => {
  const { data } = await axios.get(`${API_URL}/maps/tiles`);
  return data.tiles;
};

export const updateTile = async (tileId, patch) => {
  const token = localStorage.getItem('token');
  const { data } = await axios.patch(`${API_URL}/maps/tiles/${tileId}`, patch, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data.tile;
};

export const resetTiles = async () => {
  const token = localStorage.getItem('token');
  const { data } = await axios.post(`${API_URL}/maps/seed`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

export const fetchKnights = async () => {
  const token = localStorage.getItem('token');
  const { data } = await axios.get(`${API_URL}/maps/knights`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data.knights;
};
