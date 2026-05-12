/**
 * ============================================
 * LUMORA — ORDERS SERVICE
 * ============================================
 * 
 * Menangani data pesanan:
 * - Cancel pesanan
 * - Fetch orders user dari Supabase
 * - Get order detail
 */

import { state } from '../utils.js';

import {
    renderOrders
} from '../ui.js';


/* ============================================================
   CANCEL ORDER
============================================================ */

export async function cancelOrder(orderId) {

    try {

        const { error } =

            await window.supabaseClient

                .from('orders')

                .update({
                    status:
                        'cancelled'
                })

                .eq(
                    'id',
                    orderId
                );

        if (error) {

            console.error(error);

            return false;
        }

        return true;

    } catch (err) {

        console.error(
            'Cancel order error:',
            err
        );

        return false;
    }
}


/* ============================================================
   FETCH ORDERS FROM SUPABASE
============================================================ */

export async function fetchOrders() {

    try {

        const {

            data: { session }

        } =

        await window.supabaseClient
            .auth
            .getSession();

        if (!session) return [];

        const { data, error } =

            await window.supabaseClient

                .from('orders')

                .select('*, order_items(*)')

                .eq(
                    'user_id',
                    session.user.id
                )

                .order(
                    'created_at',
                    { ascending: false }
                );

        if (error) {

            console.error(error);

            return [];
        }

        return data || [];

    } catch (err) {

        console.error(
            'Fetch orders error:',
            err
        );

        return [];
    }
}


/* ============================================================
   GET ORDER DETAIL
============================================================ */

export function getOrderDetail(orderId) {

    if (!state.orders) return null;

    for (
        let i = 0;
        i < state.orders.length;
        i++
    ) {

        if (
            state.orders[i].id === orderId
        ) {

            return state.orders[i];
        }
    }

    return null;
}