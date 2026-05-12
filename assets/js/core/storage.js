/**
 * ============================================
   LUMORA — STORAGE CORE
 * ============================================
 * 
 * Fungsi utilitas localStorage murni:
 * - safeParse → parse JSON dengan fallback
 * 
 * Level paling bawah, tanpa side effect,
 * tanpa dependensi ke state atau DOM.
 */

/* ============================================================
   SAFE PARSE
   Parse JSON dari string, return fallback jika gagal
   atau hasilnya bukan array
============================================================ */

export function safeParse(
    str,
    fallback
) {

    try {

        const parsed =
            JSON.parse(str);

        return Array.isArray(parsed)
            ? parsed
            : fallback;

    } catch {

        return fallback;
    }
}
