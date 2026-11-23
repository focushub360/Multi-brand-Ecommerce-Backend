import { DealerLocation } from './dealerLocation.model.js';
import { Dealer } from '../dealers/dealer.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { AdminService } from '../admin/service/admin.service.js';

// Haversine distance helper (km)
const calculateHaversineKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (angle) => (angle * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

export class DealerLocationService {
  /**
   * Find Nearby Operational Dealer Hubs using MongoDB 2dsphere $nearSphere
   */
  static async findNearbyHubs({ lng, lat, maxDistanceKm = 150 }) {
    if (lng === undefined || lat === undefined) {
      throw ApiError.badRequest('Valid coordinates (lng, lat) are required.');
    }

    const hubs = await DealerLocation.find({
      status: 'Operational',
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(lng), Number(lat)]
          },
          $maxDistance: maxDistanceKm * 1000 // meters
        }
      }
    }).populate('dealer', 'businessName dealerCode status').lean();

    return hubs.map((hub) => ({
      ...hub,
      distanceKm: calculateHaversineKm(lat, lng, hub.location.coordinates[1], hub.location.coordinates[0])
    }));
  }

  /**
   * Check Serviceability for a Delivery Address/Coordinates
   */
  static async checkServiceability({ dealerId, customerPincode, customerCoordinates }) {
    const locations = await DealerLocation.find({ dealer: dealerId, status: 'Operational' });
    if (!locations.length) {
      return {
        serviceable: false,
        message: 'No active dispatch depot found for this dealer.'
      };
    }

    // 1. Direct Pincode Whitelist Match
    if (customerPincode) {
      const pincodeMatch = locations.find(
        (loc) => loc.pincode === customerPincode || (loc.activePincodes && loc.activePincodes.includes(customerPincode))
      );
      if (pincodeMatch) {
        return {
          serviceable: true,
          depotHub: pincodeMatch.hubCode,
          serviceType: 'Standard Pincode Delivery Area',
          estimatedDays: '2 - 3 Days'
        };
      }
    }

    // 2. Geospatial Proximity Match
    if (customerCoordinates?.lat && customerCoordinates?.lng) {
      for (const loc of locations) {
        const [hubLng, hubLat] = loc.location.coordinates;
        const dist = calculateHaversineKm(customerCoordinates.lat, customerCoordinates.lng, hubLat, hubLng);
        if (dist <= loc.serviceRadiusKm) {
          return {
            serviceable: true,
            depotHub: loc.hubCode,
            distanceKm: dist,
            serviceType: 'Regional Depot Express Service',
            estimatedDays: dist < 50 ? 'Next-Day Delivery' : '2 - 4 Days'
          };
        }
      }
    }

    return {
      serviceable: false,
      message: 'This delivery location is outside the merchant fulfillment service radius.'
    };
  }

  /**
   * Admin Create Dealer Location Depot
   */
  static async createLocation(data, actor) {
    const dealer = await Dealer.findById(data.dealer);
    if (!dealer) throw ApiError.notFound('Dealer not found.');

    const cleanHubCode = data.hubCode.toUpperCase().trim();
    const existing = await DealerLocation.findOne({ hubCode: cleanHubCode });
    if (existing) {
      throw ApiError.conflict(`Hub code '${cleanHubCode}' already exists.`);
    }

    const location = new DealerLocation({
      hubCode: cleanHubCode,
      dealer: dealer._id,
      dealerName: dealer.businessName,
      hubType: data.hubType || 'Regional Depot',
      city: data.city.trim(),
      state: data.state.trim(),
      pincode: data.pincode.trim(),
      address: data.address.trim(),
      contactPhone: data.contactPhone.trim(),
      capacityTons: data.capacityTons ?? 100,
      serviceRadiusKm: data.serviceRadiusKm ?? 100,
      activePincodes: data.activePincodes || [],
      location: {
        type: 'Point',
        coordinates: [data.coordinates.lng, data.coordinates.lat]
      },
      status: data.status || 'Operational'
    });

    await location.save();
    await AdminService.recordAuditLog({
      action: 'DEALER_LOCATION_CREATED', actor: actor.id, actorRole: actor.role,
      targetEntity: 'DealerLocation', targetId: location._id.toString(),
      details: `Created logistics location ${location.hubCode} for dealer ${dealer.businessName}.`,
      ipAddress: actor.ipAddress || '', userAgent: actor.userAgent || ''
    });
    return location;
  }

  /**
   * Get All Locations
   */
  static async getAllLocations() {
    return await DealerLocation.find().sort({ hubCode: 1 }).lean();
  }

  /**
   * Update Location
   */
  static async updateLocation(id, data, actor) {
    const location = await DealerLocation.findById(id);
    if (!location) throw ApiError.notFound('Location not found.');
    if (data.hubCode && data.hubCode.toUpperCase() !== location.hubCode) {
      const duplicate = await DealerLocation.findOne({ hubCode: data.hubCode.toUpperCase(), _id: { $ne: location._id } });
      if (duplicate) throw ApiError.conflict(`Hub code '${data.hubCode}' already exists.`);
      location.hubCode = data.hubCode.toUpperCase();
    }
    if (data.dealer) {
      const dealer = await Dealer.findById(data.dealer);
      if (!dealer) throw ApiError.notFound('Dealer not found.');
      location.dealer = dealer._id;
      location.dealerName = dealer.businessName;
    }
    for (const key of ['hubType', 'city', 'state', 'pincode', 'address', 'contactPhone', 'capacityTons', 'serviceRadiusKm', 'activePincodes', 'status']) {
      if (data[key] !== undefined) location[key] = data[key];
    }
    if (data.coordinates) location.location.coordinates = [data.coordinates.lng, data.coordinates.lat];
    await location.save();
    await AdminService.recordAuditLog({
      action: 'DEALER_LOCATION_UPDATED', actor: actor.id, actorRole: actor.role,
      targetEntity: 'DealerLocation', targetId: location._id.toString(),
      details: `Updated logistics location ${location.hubCode}.`,
      ipAddress: actor.ipAddress || '', userAgent: actor.userAgent || ''
    });
    return location;
  }

  /**
   * Delete Location
   */
  static async deleteLocation(id, actor) {
    const location = await DealerLocation.findByIdAndDelete(id);
    if (!location) throw ApiError.notFound('Location not found.');
    await AdminService.recordAuditLog({
      action: 'DEALER_LOCATION_DELETED', actor: actor.id, actorRole: actor.role,
      targetEntity: 'DealerLocation', targetId: location._id.toString(),
      details: `Deleted logistics location ${location.hubCode}.`,
      ipAddress: actor.ipAddress || '', userAgent: actor.userAgent || ''
    });
    return { message: `Hub '${location.hubCode}' removed successfully.` };
  }
}

