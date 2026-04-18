import { create } from 'zustand';

export const useOrderStore = create((set, get) => ({
    orders: [],
    isLoading: false,

    // Set initial orders
    setOrders: (orders) => set({ orders }),

    // Add new order (Real-time)
    addOrder: (order) => set((state) => ({
        orders: [order, ...state.orders]
    })),

    // Update order status (Real-time)
    updateOrderStatus: (orderId, status) => set((state) => ({
        orders: state.orders.map(o =>
            o._id === orderId ? { ...o, status } : o
        )
    })),

    // Assign Rider (Real-time)
    assignRider: (orderId, riderId) => set((state) => ({
        orders: state.orders.map(o =>
            o._id === orderId ? { ...o, riderId, status: 'assigned' } : o
        )
    })),

    // Bulk select store
    selectedOrderIds: [],
    toggleSelection: (id) => set((state) => ({
        selectedOrderIds: state.selectedOrderIds.includes(id)
            ? state.selectedOrderIds.filter(oid => oid !== id)
            : [...state.selectedOrderIds, id]
    })),
    clearSelection: () => set({ selectedOrderIds: [] }),
}));

