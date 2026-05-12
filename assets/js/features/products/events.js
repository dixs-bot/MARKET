/**
 * ============================================
 * LUMORA — PRODUCTS EVENTS
 * ============================================
 * 
 * Menangani click events terkait produk:
 * - Open search overlay
 * - Close search overlay
 * 
 * Return true jika click ditangani di sini.
 */

function handleClick(e) {

    let el;

    /* =========================
       OPEN SEARCH
    ========================= */

    el = e.target.closest(
        "[data-act='open-search']"
    );

    if (el) {

        const pgSearch =
            document.getElementById(
                'pg-search'
            );

        if (!pgSearch)
            return true;

        pgSearch.classList.remove(
            'hidden'
        );

        const inputSearch =
            document.getElementById(
                'insearch'
            );

        if (inputSearch) {

            setTimeout(() => {

                inputSearch.focus();

            }, 100);
        }

        return true;
    }

    /* =========================
       CLOSE SEARCH
    ========================= */

    el = e.target.closest(
        "[data-act='close-search']"
    );

    if (el) {

        const pgSearch =
            document.getElementById(
                'pg-search'
            );

        if (pgSearch) {

            pgSearch.classList.add(
                'hidden'
            );
        }

        return true;
    }

    /* =========================
       TIDAK DITANGANI DI SINI
    ========================= */

    return false;
}


export {
    handleClick
};
