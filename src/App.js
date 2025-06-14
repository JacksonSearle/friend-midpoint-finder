import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

// Fix Leaflet's default icon paths
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function App() {
  const [addresses, setAddresses] = useState(['']);
  const [locations, setLocations] = useState([]);
  const [midpoint, setMidpoint] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAddressChange = (index, value) => {
    const newAddresses = [...addresses];
    newAddresses[index] = value;
    setAddresses(newAddresses);
  };

  const addAddressField = () => setAddresses([...addresses, '']);

  const geocodeAddresses = async () => {
    setLoading(true);
    try {
      const coords = [];
      for (const address of addresses) {
        const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
          params: { q: address, format: 'json', limit: 1 }
        });
        if (response.data.length > 0) {
          const { lat, lon } = response.data[0];
          coords.push({ lat: parseFloat(lat), lon: parseFloat(lon) });
        }
      }

      if (coords.length > 0) {
        const avgLat = coords.reduce((sum, c) => sum + c.lat, 0) / coords.length;
        const avgLon = coords.reduce((sum, c) => sum + c.lon, 0) / coords.length;
        setLocations(coords);
        setMidpoint({ lat: avgLat, lon: avgLon });
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold mb-4">Friend Midpoint Finder</h1>
      {addresses.map((address, index) => (
        <input
          key={index}
          value={address}
          onChange={(e) => handleAddressChange(index, e.target.value)}
          placeholder={`Friend ${index + 1} Address`}
          className="w-full p-2 border rounded mb-2"
        />
      ))}
      <button onClick={addAddressField} className="bg-blue-500 text-white px-4 py-2 rounded">
        Add Another Friend
      </button>
      <button
        onClick={geocodeAddresses}
        className="bg-green-500 text-white px-4 py-2 rounded ml-2"
        disabled={loading}
      >
        {loading ? 'Calculating...' : 'Find Midpoint'}
      </button>

      {midpoint && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Map</h2>
          <MapContainer center={[midpoint.lat, midpoint.lon]} zoom={10} style={{ height: '400px', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {locations.map((loc, index) => (
              <Marker key={index} position={[loc.lat, loc.lon]}>
                <Popup>Friend {index + 1}</Popup>
              </Marker>
            ))}
            <Marker position={[midpoint.lat, midpoint.lon]}>
              <Popup>Midpoint</Popup>
            </Marker>
          </MapContainer>
        </div>
      )}
    </div>
  );
}
