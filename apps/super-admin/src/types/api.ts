export interface SuperAdminStats {
  activeSubscribers: number;
  monthlyRevenue: number;
  growth: number;
  restaurantsGrowth: number;
  revenueGrowth: number;
  yearlyGrowth: number;
  chartData: Array<{
    name: string;
    revenue: number;
    subscribers: number;
  }>;
}

export type RestaurantStatus = 'ACTIVE' | 'EXPIRED' | string;

export interface Restaurant {
  id: string;
  name: string;
  phone: string;
  address?: string | null;
  status: RestaurantStatus;
  expiry: string | null;
}

export interface CreateRestaurantPayload {
  name: string;
  phone: string;
  password: string;
  address?: string;
  expiryDate: string;
}

export interface UpdateRestaurantPayload {
  name: string;
  phone: string;
  password?: string;
  address?: string;
  expiryDate: string;
}

