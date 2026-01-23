import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Circle, FeatureGroup, Polygon, Popup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { MapPin, Save, X, AlertCircle } from 'lucide-react';
import api from '../../utils/api';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// Fix for default Leaflet marker icons
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const ServiceAreas = () => {
    // Default Guntur location
    const DEFAULT_CENTER = [16.3090716, 80.4308257];
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [tempLayer, setTempLayer] = useState(null);
    const [zoneForm, setZoneForm] = useState({ name: '', deliveryCharge: '' });

    // Refs
    const featureGroupRef = useRef();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/admin/settings/delivery-zones');
            const generalResponse = await api.get('/admin/settings');

            if (response.data.success && generalResponse.data.success) {
                setSettings({
                    serviceAreas: response.data.data,
                    maxDeliveryDistance: generalResponse.data.data.maxDeliveryDistance || 10
                });
            }
        } catch (error) {
            console.error('Error fetching zones:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreated = (e) => {
        const layer = e.layer;
        // Don't add to map yet (wait for modal confirmation)
        // We temporarily remove it, or keep it references
        // react-leaflet-draw adds it automatically. We'll remove it if they cancel.
        setTempLayer(layer);
        setZoneForm({ name: '', deliveryCharge: '' });
        setShowModal(true);
    };

    const handleModalSave = () => {
        if (!tempLayer || !zoneForm.name || !zoneForm.deliveryCharge) return;

        // Get coordinates from layer
        // Leaflet Polygon latlngs: array of objects {lat, lng}
        // Backend expects [[lat, lng], [lat, lng]]
        const latLngs = tempLayer.getLatLngs()[0];
        const coordinates = latLngs.map(ll => [ll.lat, ll.lng]);

        const newArea = {
            name: zoneForm.name,
            deliveryCharge: parseFloat(zoneForm.deliveryCharge),
            coordinates: coordinates
        };

        setSettings(prev => ({
            ...prev,
            serviceAreas: [...(prev.serviceAreas || []), newArea]
        }));

        // Remove the drawn layer from the FeatureGroup because we will render it via React state
        if (featureGroupRef.current) {
            featureGroupRef.current.removeLayer(tempLayer);
        }

        setShowModal(false);
        setTempLayer(null);
    };

    const handleModalCancel = () => {
        // Remove the layer that was just drawn
        if (featureGroupRef.current && tempLayer) {
            featureGroupRef.current.removeLayer(tempLayer);
        }
        setShowModal(false);
        setTempLayer(null);
    };

    const handleEdited = (e) => {
        const layers = e.layers;
        layers.eachLayer(layer => {
            // Find which zone this corresponds to and update it
            // This is tricky with declarative React. 
            // EASIER STRATEGY: 
            // We use the "Draw" tools primarily for creation.
            // Editing existing ones via the toolbar is hard to sync back to state indices nicely.
            // BUT: If we rely on the Internal Leaflet ID, we don't have that in our DB.

            // WORKAROUND:
            // For now, we only support CREATING new zones and DELETING existing ones.
            // Full shape editing requires mapping Leaflet IDs to our State IDs.
            // Since we are re-rendering from state, the toolbar "Edit" button won't easily grab our React-rendered polygons unless we attach them.

            // To properly support Edit, we'd need to assume the Order matches or use a custom property.
        });

        // Actually, let's keep it simple:
        // We only allow DELETING specific zones via a button in their popup.
        // We allow ADDING new zones via the toolbar.
        // Editing shapes is disabled for V1 to ensure stability.
    };

    const handleDeleted = (e) => {
        // Same issue as Edited - syncing IDs.
        // We will implement DELETE via the Popup button instead.
    };

    const deleteZone = (index) => {
        if (window.confirm('Are you sure you want to delete this zone?')) {
            const updatedAreas = [...settings.serviceAreas];
            updatedAreas.splice(index, 1);
            setSettings({ ...settings, serviceAreas: updatedAreas });
        }
    };

    const saveAllZones = async () => {
        setSaving(true);
        try {
            const response = await api.put('/admin/settings/delivery-zones', {
                serviceAreas: settings.serviceAreas
            });
            if (response.data.success) {
                alert('Delivery zones saved successfully!');
            }
        } catch (error) {
            console.error('Error saving zones:', error);
            alert('Failed to save zones');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading map...</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto flex flex-col relative">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                    <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-green-600" />
                        Delivery Zones
                    </h2>
                    <p className="text-sm text-gray-500">
                        Draw custom zones on the map. Customers in these zones will be charged the specified amount.
                    </p>
                </div>
                <button
                    onClick={saveAllZones}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20 disabled:opacity-70"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="h-[600px] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative z-0">
                <MapContainer
                    center={DEFAULT_CENTER}
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <FeatureGroup ref={featureGroupRef}>
                        <EditControl
                            position="topright"
                            onCreated={handleCreated}
                            draw={{
                                rectangle: false,
                                circle: false,
                                circlemarker: false,
                                marker: false,
                                polyline: false,
                                polygon: {
                                    allowIntersection: false,
                                    drawError: {
                                        color: '#e1e100', // Color the shape will turn when intersects
                                        message: '<strong>Oh snap!<strong> you can\'t draw that!' // Message that will show when intersect
                                    },
                                    shapeOptions: {
                                        color: '#2563eb'
                                    }
                                }
                            }}
                            edit={{
                                edit: false, // Disable shape editing for simplicity and robustness
                                remove: false // Disable toolbar delete, use popup delete
                            }}
                        />
                    </FeatureGroup>

                    {/* Max Delivery Radius Circle */}
                    <Circle
                        center={DEFAULT_CENTER}
                        radius={(settings?.maxDeliveryDistance || 10) * 1000}
                        pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.1, dashArray: '5, 10' }}
                    />

                    {/* Render Saved Service Areas */}
                    {settings?.serviceAreas?.map((area, index) => (
                        <Polygon
                            key={index}
                            positions={area.coordinates}
                            pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }}
                        >
                            <Popup>
                                <div className="p-2 min-w-[150px]">
                                    <h3 className="font-bold text-gray-800 mb-1">{area.name}</h3>
                                    <p className="text-sm text-gray-600 mb-3">Delivery Charge: ₹{area.deliveryCharge}</p>
                                    <button
                                        onClick={() => deleteZone(index)}
                                        className="w-full flex items-center justify-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 text-xs font-medium transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                        Delete Zone
                                    </button>
                                </div>
                            </Popup>
                        </Polygon>
                    ))}
                </MapContainer>
            </div>

            {/* Zone Information Overlay */}
            <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>
                    Use the <strong>Pentagon Icon</strong> in the top-right toolbar to draw a new zone.
                    <br />
                    The <strong>Green Circle</strong> shows your standard delivery radius. Zones outside this circle allow you to serve wider areas with custom fees.
                </p>
            </div>

            {/* Creation Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 m-4 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">New Delivery Zone</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Downtown Area"
                                    value={zoneForm.name}
                                    onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Charge (₹)</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 50"
                                    value={zoneForm.deliveryCharge}
                                    onChange={(e) => setZoneForm({ ...zoneForm, deliveryCharge: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={handleModalCancel}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleModalSave}
                                disabled={!zoneForm.name || !zoneForm.deliveryCharge}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add Zone
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceAreas;
