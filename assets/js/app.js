function initInputListeners() {

    /* ========================================================
       PHONE
    ======================================================== */

    if (state.d.inphone) {

        state.d.inphone
            .addEventListener(

                'input',

                function () {

                    this.value =
                        this.value.replace(
                            /[^0-9]/g,
                            ''
                        );

                    validate(false);
                }
            );
    }

    /* ========================================================
       NAME
    ======================================================== */

    if (state.d.inname) {

        state.d.inname
            .addEventListener(

                'input',

                function () {

                    validate(false);
                }
            );
    }

    /* ========================================================
       ADDRESS
    ======================================================== */

    if (state.d.inaddr) {

        state.d.inaddr
            .addEventListener(

                'input',

                function () {

                    validate(false);
                }
            );
    }

    /* ========================================================
       SEARCH
    ======================================================== */

    if (state.d.insearch) {

        state.d.insearch
            .addEventListener(

                'input',

                function () {

                    clearTimeout(
                        searchTimer
                    );

                    searchTimer =
                        setTimeout(

                            function () {

                                renderFilteredProducts(
                                    true
                                );

                            },

                            250
                        );
                }
            );
    }
}
