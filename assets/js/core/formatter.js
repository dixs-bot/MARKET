/**
 * ============================================
   LUMORA — FORMATTER CORE
 * ============================================
 * 
 * Fungsi formatting tampilan murni:
 * - fmt → format angka ke Rupiah
 * 
 * Tanpa side effect, tanpa dependensi.
 * MiniMarket.fmt() adalah wrapper yang memanggil ini.
 */

/* ============================================================
   FORMAT RUPIAH
   25000 → "Rp 25.000"
============================================================ */

export function fmt(n) {

    return (
        'Rp ' +
        (n || 0).toLocaleString('id-ID')
    );
}
