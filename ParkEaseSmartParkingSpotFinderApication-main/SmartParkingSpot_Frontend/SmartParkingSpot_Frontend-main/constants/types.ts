export enum BookingStatus {
    ACTIVE = 'ACTIVE',
    EXITING = 'EXITING',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    NO_SHOW = 'NO_SHOW'
}

export enum SlotStatus {
    AVAILABLE = 'AVAILABLE',
    OCCUPIED = 'OCCUPIED',
    MAINTENANCE = 'MAINTENANCE',
    DISABLED = 'DISABLED'
}

export enum ComplaintStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    RESOLVED = 'RESOLVED',
    DISMISSED = 'DISMISSED'
}

export interface ProviderStats {
    summary: {
        totalRevenue: number;
        todayEarnings: number;
        monthToDateEarnings: number;
        occupancyRate: number;
        activeCars: number;
        totalSlots: number;
        rating: number;
        totalReviews: number;
    };
    revenueTrend: { label: string; value: number }[];
    recentActivity: any[];
    online: boolean;
    providerName: string;
}
